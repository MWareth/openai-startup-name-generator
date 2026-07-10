import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notify';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Lead response SLA. Meant to be hit every ~5 minutes by a scheduler (an
// external pinger like cron-job.org, or Vercel Cron on Pro). For each assigned,
// still-open lead that the agent hasn't actioned:
//   • 20 min  → nudge the agent (app + email), once.
//   • 40 min  → escalate to management (app + email), once.
// "Actioned" = the agent logged any activity after assignment, or the lead's
// status moved off 'new'. Secured with CRON_SECRET (?key= or Bearer header).
const ALERT_MIN = 20;
const ESCALATE_MIN = 40;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const auth = request.headers.get('authorization');
    if (key !== secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = Date.now();

  // Candidate leads: assigned to an agent, SLA clock running, not yet closed.
  const { data: leadsRaw } = await admin
    .from('leads')
    .select('id, name, status, assigned_agent_id, assigned_at, sla_alerted_at, sla_escalated_at')
    .not('assigned_agent_id', 'is', null)
    .not('assigned_at', 'is', null);
  const leads = (leadsRaw || []).filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && (!l.sla_alerted_at || !l.sla_escalated_at)
  );
  if (!leads.length) return NextResponse.json({ ok: true, alerted: 0, escalated: 0 });

  // Which of these have been actioned (any activity logged after assignment)?
  const ids = leads.map((l) => l.id);
  const { data: acts } = await admin
    .from('lead_activities')
    .select('lead_id, created_at')
    .in('lead_id', ids);
  const lastActivity = {};
  for (const a of acts || []) {
    const t = new Date(a.created_at).getTime();
    if (!lastActivity[a.lead_id] || t > lastActivity[a.lead_id]) lastActivity[a.lead_id] = t;
  }

  // Names of the assigned agents (for the escalation message) + management list.
  const agentIds = [...new Set(leads.map((l) => l.assigned_agent_id))];
  const { data: agentRows } = await admin.from('profiles').select('id, full_name').in('id', agentIds);
  const agentName = Object.fromEntries((agentRows || []).map((a) => [a.id, a.full_name || 'An agent']));
  const { data: mgrs } = await admin.from('profiles').select('id').in('role', ['admin', 'director', 'c_suite']);
  const managerIds = (mgrs || []).map((m) => m.id);

  let alerted = 0;
  let escalated = 0;

  for (const l of leads) {
    const assignedAt = new Date(l.assigned_at).getTime();
    const ageMin = (now - assignedAt) / 60000;
    const actioned = (lastActivity[l.id] && lastActivity[l.id] >= assignedAt) || l.status !== 'new';
    if (actioned || ageMin < ALERT_MIN) continue;

    // Escalate to management at 40 min (once). Also nudge the agent if they were
    // somehow never alerted.
    if (ageMin >= ESCALATE_MIN && !l.sla_escalated_at) {
      for (const mid of managerIds) {
        if (mid === l.assigned_agent_id) continue;
        await notify({
          userId: mid,
          type: 'lead_sla',
          title: `⚠️ Lead not actioned: ${l.name || 'a lead'}`,
          body: `${agentName[l.assigned_agent_id]} still hasn't actioned this lead ${Math.round(ageMin)} minutes after assignment.`,
          link: `/leads/${l.id}`,
          leadId: l.id,
          cta: 'Open the lead',
        });
      }
      await admin
        .from('leads')
        .update({ sla_escalated_at: new Date().toISOString(), sla_alerted_at: l.sla_alerted_at || new Date().toISOString() })
        .eq('id', l.id);
      escalated += 1;
      continue;
    }

    // First nudge to the agent at 20 min (once).
    if (!l.sla_alerted_at) {
      await sendPushToUser(l.assigned_agent_id, {
        title: '⏰ New lead waiting',
        body: `${l.name || 'A lead'} was assigned to you — contact them now.`,
        url: `/leads/${l.id}`,
      });
      await notify({
        userId: l.assigned_agent_id,
        type: 'lead_sla',
        title: `⏰ Contact your new lead: ${l.name || 'a lead'}`,
        body: `You were assigned this lead ${Math.round(ageMin)} minutes ago and haven't logged anything yet. Reach out and log your first activity.`,
        link: `/leads/${l.id}`,
        leadId: l.id,
        cta: 'Open the lead',
        push: false, // already pushed above
      });
      await admin.from('leads').update({ sla_alerted_at: new Date().toISOString() }).eq('id', l.id);
      alerted += 1;
    }
  }

  return NextResponse.json({ ok: true, checked: leads.length, alerted, escalated });
}

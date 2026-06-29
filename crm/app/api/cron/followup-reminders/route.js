import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/push';

// Runs each morning (Vercel Cron). Pushes each agent a summary of the follow-ups
// they have due today or overdue. Secured with CRON_SECRET when set.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  const { data: due } = await admin
    .from('lead_followups')
    .select('lead_id, due_on, lead:leads(name, status, assigned_agent_id)')
    .eq('done', false)
    .lte('due_on', today);

  const byAgent = {};
  for (const f of due || []) {
    const lead = f.lead;
    if (!lead || lead.status === 'won' || lead.status === 'lost') continue;
    if (!lead.assigned_agent_id) continue;
    (byAgent[lead.assigned_agent_id] ||= []).push(lead.name || 'a lead');
  }

  let notified = 0;
  for (const [agentId, names] of Object.entries(byAgent)) {
    const n = names.length;
    const preview = names.slice(0, 3).join(', ') + (n > 3 ? ` +${n - 3} more` : '');
    await sendPushToUser(agentId, {
      title: `⏰ ${n} follow-up${n > 1 ? 's' : ''} due today`,
      body: preview,
      url: '/dashboard',
    });
    notified += 1;
  }

  return NextResponse.json({ ok: true, agentsNotified: notified });
}

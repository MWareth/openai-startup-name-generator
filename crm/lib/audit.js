import { createAdminClient } from '@/lib/supabase/admin';
import { ACTIVITY_LABELS } from '@/lib/format';

// Labels + icons for the automatic audit actions (things not already in
// lead_activities). Used by the Activity Log and the KPI evidence panel.
export const AUDIT_LABELS = {
  status_change: 'Status change',
  qual_change: 'Qualification change',
  followup_set: 'Follow-up set',
  followup_done: 'Follow-up done',
  contact_edit: 'Contact edit',
};
export const AUDIT_ICONS = {
  status_change: '🔀',
  qual_change: '🌡️',
  followup_set: '📅',
  followup_done: '✅',
  contact_edit: '✏️',
};

// Record one audit event. Best-effort: silently no-ops before migration 0027 or
// on any error, so it can never break the action that triggered it.
export async function logEvent({ userId, action, leadId = null, detail = null }) {
  if (!userId || !action) return;
  try {
    const admin = createAdminClient();
    await admin.from('audit_events').insert({ user_id: userId, action, lead_id: leadId, detail });
  } catch (e) {
    // no-op
  }
}

// Merged, newest-first activity feed for a user (or everyone) since startIso.
// Combines the rich lead_activities (calls/meetings/viewings/notes) with the
// audit_events (status/qual/follow-up/contact). Returns normalized rows.
export async function fetchUserLog(admin, { userId = null, startIso = null, limit = 400 } = {}) {
  const actQ = admin
    .from('lead_activities')
    .select('id, type, body, created_at, agent_id, agent:profiles(full_name, avatar_url), lead:leads(id, name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) actQ.eq('agent_id', userId);
  if (startIso) actQ.gte('created_at', startIso);

  const audQ = admin
    .from('audit_events')
    .select('id, action, detail, created_at, user_id, user:profiles(full_name, avatar_url), lead:leads(id, name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) audQ.eq('user_id', userId);
  if (startIso) audQ.gte('created_at', startIso);

  const [actRes, audRes] = await Promise.all([actQ, audQ.then((r) => r, () => ({ data: [] }))]);

  const rows = [];
  for (const a of actRes.data || []) {
    rows.push({
      id: 'act_' + a.id,
      when: a.created_at,
      kind: a.type,
      label: ACTIVITY_LABELS[a.type] || a.type,
      body: a.body || '',
      agentName: a.agent?.full_name || '—',
      avatar: a.agent?.avatar_url,
      lead: a.lead || null,
    });
  }
  for (const e of (audRes && audRes.data) || []) {
    rows.push({
      id: 'aud_' + e.id,
      when: e.created_at,
      kind: e.action,
      label: AUDIT_LABELS[e.action] || e.action,
      body: e.detail || '',
      agentName: e.user?.full_name || '—',
      avatar: e.user?.avatar_url,
      lead: e.lead || null,
    });
  }
  rows.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  return rows.slice(0, limit);
}

// Auto-counted KPI evidence for one agent since startIso. Reads the real data
// (activities, follow-ups, audit events) so reviewers rate with facts in hand.
export async function computeKpiStats(admin, { agentId, startIso = null } = {}) {
  // Activities logged by this agent.
  let actQ = admin.from('lead_activities').select('type, lead_id, created_at').eq('agent_id', agentId);
  if (startIso) actQ = actQ.gte('created_at', startIso);
  // Audit events by this agent.
  let audQ = admin.from('audit_events').select('action, lead_id, created_at').eq('user_id', agentId);
  if (startIso) audQ = audQ.gte('created_at', startIso);

  const [actRes, audRes] = await Promise.all([
    actQ,
    audQ.then((r) => r, () => ({ data: [] })),
  ]);

  const acts = actRes.data || [];
  const auds = (audRes && audRes.data) || [];

  const byType = { call: 0, call_update: 0, meeting: 0, viewing: 0, note: 0 };
  const leads = new Set();
  for (const a of acts) {
    if (byType[a.type] != null) byType[a.type] += 1;
    if (a.lead_id) leads.add(a.lead_id);
  }
  const audCount = { status_change: 0, qual_change: 0, followup_set: 0, followup_done: 0, contact_edit: 0 };
  for (const e of auds) {
    if (audCount[e.action] != null) audCount[e.action] += 1;
    if (e.lead_id) leads.add(e.lead_id);
  }

  return {
    totalActivities: acts.length,
    calls: byType.call + byType.call_update,
    meetings: byType.meeting,
    viewings: byType.viewing,
    notes: byType.note,
    followupsSet: audCount.followup_set,
    followupsDone: audCount.followup_done,
    statusChanges: audCount.status_change,
    qualChanges: audCount.qual_change,
    contactEdits: audCount.contact_edit,
    leadsTouched: leads.size,
  };
}

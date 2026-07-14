// Newcomer 4-week KPI: for an agent's first month (from profiles.joined_on),
// auto-measure leads worked, follow-ups done, and response speed to new leads,
// week by week, against the editable onboarding_config targets.

export const ONBOARDING_WEEKS = 4;

// Default targets if the config row isn't there yet (pre-migration 0028).
export const DEFAULT_ONBOARDING = { weekly_leads: 10, weekly_followups: 15, target_response_min: 30 };

// The four 7-day windows from the joining date.
export function weekWindows(joinedOn) {
  const start = new Date(joinedOn + 'T00:00:00');
  const windows = [];
  for (let i = 0; i < ONBOARDING_WEEKS; i++) {
    const from = new Date(start.getTime() + i * 7 * 86400000);
    const to = new Date(start.getTime() + (i + 1) * 7 * 86400000);
    windows.push({ week: i + 1, from, to });
  }
  return windows;
}

// Which onboarding week is "now" (1..4), or 0 before start, or >4 if finished.
export function currentWeek(joinedOn, now = new Date()) {
  const start = new Date(joinedOn + 'T00:00:00').getTime();
  const days = Math.floor((now.getTime() - start) / 86400000);
  if (days < 0) return 0;
  return Math.floor(days / 7) + 1;
}

// Load the editable targets (single-row config). Falls back to defaults.
export async function getOnboardingConfig(admin) {
  try {
    const { data } = await admin.from('onboarding_config').select('*').eq('id', 1).maybeSingle();
    return data || DEFAULT_ONBOARDING;
  } catch (e) {
    return DEFAULT_ONBOARDING;
  }
}

// Per-week auto stats for a newcomer. Reads the data we already record:
// lead_activities (leads worked), audit_events (follow-ups done), and
// leads.assigned_at → first activity (response speed).
export async function computeNewcomerProgress(admin, { agentId, joinedOn, config }) {
  const windows = weekWindows(joinedOn);
  const overallFrom = windows[0].from.toISOString();
  const overallTo = windows[windows.length - 1].to.toISOString();

  // Activities logged by this agent across the whole month (one query, bucket in JS).
  const { data: acts } = await admin
    .from('lead_activities')
    .select('lead_id, created_at')
    .eq('agent_id', agentId)
    .gte('created_at', overallFrom)
    .lt('created_at', overallTo);

  // Follow-ups this agent completed (audit events). Tolerant if table missing.
  let auds = [];
  try {
    const { data } = await admin
      .from('audit_events')
      .select('action, created_at')
      .eq('user_id', agentId)
      .eq('action', 'followup_done')
      .gte('created_at', overallFrom)
      .lt('created_at', overallTo);
    auds = data || [];
  } catch (e) {
    auds = [];
  }

  // Leads assigned to this agent in the month → response time to first action.
  let assigned = [];
  try {
    const { data } = await admin
      .from('leads')
      .select('id, assigned_at')
      .eq('assigned_agent_id', agentId)
      .not('assigned_at', 'is', null)
      .gte('assigned_at', overallFrom)
      .lt('assigned_at', overallTo);
    assigned = data || [];
  } catch (e) {
    assigned = [];
  }

  // First-activity time per assigned lead (for response speed).
  const assignedIds = assigned.map((l) => l.id);
  const firstActByLead = {};
  if (assignedIds.length) {
    const { data: firstActs } = await admin
      .from('lead_activities')
      .select('lead_id, created_at')
      .in('lead_id', assignedIds)
      .eq('agent_id', agentId);
    for (const a of firstActs || []) {
      const t = new Date(a.created_at).getTime();
      if (firstActByLead[a.lead_id] == null || t < firstActByLead[a.lead_id]) firstActByLead[a.lead_id] = t;
    }
  }

  return windows.map((w) => {
    const from = w.from.getTime();
    const to = w.to.getTime();
    const inWin = (ts) => {
      const t = new Date(ts).getTime();
      return t >= from && t < to;
    };

    const leadsWorked = new Set();
    for (const a of acts || []) if (inWin(a.created_at) && a.lead_id) leadsWorked.add(a.lead_id);

    let followupsDone = 0;
    for (const e of auds) if (inWin(e.created_at)) followupsDone += 1;

    // Avg response minutes for leads assigned in this week that got a first action.
    const resp = [];
    for (const l of assigned) {
      const at = new Date(l.assigned_at).getTime();
      if (at >= from && at < to && firstActByLead[l.id] != null) {
        const mins = (firstActByLead[l.id] - at) / 60000;
        if (mins >= 0) resp.push(mins);
      }
    }
    const avgResponseMin = resp.length ? Math.round(resp.reduce((a, b) => a + b, 0) / resp.length) : null;

    return {
      week: w.week,
      from: w.from,
      to: w.to,
      leadsWorked: leadsWorked.size,
      followupsDone,
      avgResponseMin,
      leadsOk: leadsWorked.size >= config.weekly_leads,
      followupsOk: followupsDone >= config.weekly_followups,
      responseOk: avgResponseMin == null ? null : avgResponseMin <= config.target_response_min,
    };
  });
}

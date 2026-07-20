// Newcomer 4-week KPI: for an agent's first month (from profiles.joined_on),
// auto-measure leads worked, follow-ups done, and response speed to new leads,
// week by week, against the editable onboarding_config targets.

import { isRealContact } from '@/lib/contact';

export const ONBOARDING_WEEKS = 4;

// ---------------------------------------------------------------------------
// The fixed 4-week newcomer program (Marwan's "Weekly targets as part of KPI"
// sheet, verbatim). Items without `auto` are manual ticks (agent ticks, admin
// can untick). `auto` items are counted from CRM data:
//   conversations — calls logged where the client actually responded
//   meetings      — 🤝 meeting activities logged
//   eoi           — leads moved to Negotiation (EOI / booking-ready)
// ---------------------------------------------------------------------------
export const ONBOARDING_PROGRAM = [
  {
    week: 1,
    items: [
      { key: 'w1_niche', label: 'Select your Niche (Buyer Profile) — we can help you pick one' },
      { key: 'w1_dev_list', label: 'Submit list of developers and ready + under-construction communities matching your niche' },
      { key: 'w1_report', label: 'Submit report for 2 completed communities & 2 under-construction developments matching your niche' },
      { key: 'w1_proposal', label: 'Submit proposal for end user and investor within your niche' },
      { key: 'w1_list2', label: 'Call and list 2 off-plan properties in under-construction communities in your niche' },
      { key: 'w1_prospects', label: 'Find 2 prospects from the company’s existing leads pool matching your niche' },
      { key: 'w1_conv', label: 'Generate minimum 1 interest / buyer conversation from cold calls', auto: 'conversations', target: 1 },
      { key: 'w1_crm', label: 'Complete CRM onboarding — know how to add your leads and projects' },
      { key: 'w1_social', label: 'Create IG / TikTok / YT & LinkedIn accounts + 1 introductory post on each' },
    ],
  },
  {
    week: 2,
    items: [
      { key: 'w2_master', label: 'Submit report for 5 upcoming master communities in Dubai matching your niche (future launch potential)' },
      { key: 'w2_list2', label: 'Call and list 2 off-plan properties in communities matching your niche' },
      { key: 'w2_shortlist', label: 'Shortlist 2 prospects from the company’s existing leads pool matching your niche' },
      { key: 'w2_conv', label: 'Generate minimum 2 interest / buyer conversations from cold calls', auto: 'conversations', target: 2 },
      { key: 'w2_meeting', label: 'Schedule at least 1 potential client meeting', auto: 'meetings', target: 1 },
      { key: 'w2_referral', label: 'Sign at least 1 referral contract for referral leads' },
      { key: 'w2_video', label: 'Shoot 1 video — rough is fine, the goal is to nail the content flow' },
      { key: 'w2_linkedin', label: 'Create 1 LinkedIn post' },
    ],
  },
  {
    week: 3,
    items: [
      { key: 'w3_list2', label: 'Call and list 2 off-plan properties in communities matching your niche' },
      { key: 'w3_shortlist', label: 'Shortlist 2 prospects from the company’s existing leads pool matching your niche' },
      { key: 'w3_conv', label: 'Generate minimum 3 interest / buyer conversations from cold calls', auto: 'conversations', target: 3 },
      { key: 'w3_meeting', label: 'Schedule at least 1 potential new client meeting', auto: 'meetings', target: 1 },
      { key: 'w3_referral', label: 'Sign at least 1 referral contract for referral leads' },
      { key: 'w3_video', label: 'Shoot 1 video to post on social media' },
      { key: 'w3_linkedin', label: 'Create 1 LinkedIn post' },
    ],
  },
  {
    week: 4,
    items: [
      { key: 'w4_list2', label: 'Call and list 2 off-plan properties in communities matching your niche' },
      { key: 'w4_shortlist', label: 'Shortlist 2 prospects from the company’s existing leads pool matching your niche' },
      { key: 'w4_conv', label: 'Generate minimum 4 interest / buyer conversations from cold calls', auto: 'conversations', target: 4 },
      { key: 'w4_meeting', label: 'Schedule at least 2 potential new client meetings', auto: 'meetings', target: 2 },
      { key: 'w4_referral', label: 'Sign at least 1 referral contract for referral leads' },
      { key: 'w4_campaign', label: 'A whole video scripted / roughly edited — pitching new investors for a campaign within your niche' },
      { key: 'w4_post', label: 'Shoot 1 video / 1 post and publish them on social platforms' },
      { key: 'w4_linkedin', label: 'Create 1 LinkedIn post' },
      { key: 'w4_eoi', label: 'Move 2 buyers to EOI / booking-ready stage (pipeline for month 2)', auto: 'eoi', target: 2 },
    ],
  },
];

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

// Checklist progress for the fixed program: per week, manual items merged with
// their ticks and auto items counted from real CRM data.
export async function computeProgramProgress(admin, { agentId, joinedOn }) {
  const windows = weekWindows(joinedOn);
  const overallFrom = windows[0].from.toISOString();
  const overallTo = windows[windows.length - 1].to.toISOString();

  const [actsRes, audRes, ticksRes] = await Promise.all([
    // Activities are windowed by occurred_on — the date the agent says it
    // happened — so late logging ("I'll update the CRM at the start of next
    // week") still lands in the right program week.
    admin
      .from('lead_activities')
      .select('type, body, occurred_on, created_at')
      .eq('agent_id', agentId)
      .gte('occurred_on', overallFrom.slice(0, 10))
      .lt('occurred_on', overallTo.slice(0, 10)),
    admin
      .from('audit_events')
      .select('action, detail, created_at')
      .eq('user_id', agentId)
      .eq('action', 'status_change')
      .gte('created_at', overallFrom)
      .lt('created_at', overallTo)
      .then((r) => r, () => ({ data: [] })),
    admin
      .from('onboarding_ticks')
      .select('item_key, checked_at, checked_by, checker:profiles!onboarding_ticks_checked_by_fkey(full_name)')
      .eq('user_id', agentId)
      .then((r) => r, () => ({ data: [] })),
  ]);

  const acts = actsRes.data || [];
  const auds = (audRes && audRes.data) || [];
  const ticks = new Map((((ticksRes && ticksRes.data) || [])).map((t) => [t.item_key, t]));

  const countAuto = (kind, from, to) => {
    const inWin = (ts) => {
      const t = new Date(ts).getTime();
      return t >= from && t < to;
    };
    // Calls/meetings go by the activity's own date (occurred_on) — weeks stay
    // strict by that date; only the logging delay is forgiven. EOI events are
    // instant records, so they keep their real timestamp.
    const actDate = (a) => a.occurred_on || a.created_at;
    if (kind === 'conversations')
      return acts.filter((a) => (a.type === 'call' || a.type === 'call_update') && inWin(actDate(a)) && isRealContact(a.body)).length;
    if (kind === 'meetings') return acts.filter((a) => a.type === 'meeting' && inWin(actDate(a))).length;
    if (kind === 'eoi') return auds.filter((e) => inWin(e.created_at) && /→\s*Negotiation/.test(e.detail || '')).length;
    return 0;
  };

  return ONBOARDING_PROGRAM.map((wk, i) => {
    const win = windows[i];
    const from = win.from.getTime();
    const to = win.to.getTime();
    const items = wk.items.map((item) => {
      if (item.auto) {
        const count = countAuto(item.auto, from, to);
        return { ...item, count, done: count >= item.target };
      }
      const tick = ticks.get(item.key) || null;
      return { ...item, done: !!tick, tick };
    });
    const done = items.filter((it) => it.done).length;
    return { week: wk.week, from: win.from, to: win.to, items, done, total: items.length, pct: Math.round((done / items.length) * 100) };
  });
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

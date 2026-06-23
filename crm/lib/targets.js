// Computes how much of a target an agent has achieved (sum of deal value)
// within the target's period, plus tier progress.
export async function getTargetProgress(supabase, target) {
  let q = supabase.from('deals').select('deal_value, agent_commission, closed_on').eq('agent_id', target.agent_id);
  if (target.period_start) q = q.gte('closed_on', target.period_start);
  if (target.period_end) q = q.lte('closed_on', target.period_end);
  const { data: deals } = await q;

  const achieved = (deals || []).reduce((s, d) => s + Number(d.deal_value || 0), 0);
  const commission = (deals || []).reduce((s, d) => s + Number(d.agent_commission || 0), 0);
  const goal = Number(target.target_amount || 0);
  const progress = goal > 0 ? Math.min(achieved / goal, 1) : 0;
  const remaining = Math.max(goal - achieved, 0);

  const { data: tiersRaw } = await supabase
    .from('incentive_tiers')
    .select('*')
    .eq('target_id', target.id)
    .order('threshold_amount', { ascending: true });

  const tiers = (tiersRaw || []).map((t) => ({ ...t, reached: achieved >= Number(t.threshold_amount) }));
  const nextTier = tiers.find((t) => !t.reached) || null;

  return { achieved, commission, goal, progress, remaining, tiers, nextTier, dealCount: (deals || []).length };
}

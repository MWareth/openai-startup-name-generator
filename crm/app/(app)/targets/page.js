import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getTargetProgress } from '@/lib/targets';
import { aed, pct, formatDate, SENIORITY_NAMES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
  const { user, profile, supabase } = await requireUser();
  if (profile?.role === 'marketing') redirect('/leads'); // no money for Marketing

  const { data: targets } = await supabase
    .from('targets')
    .select('*')
    .eq('agent_id', user.id)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  const withProgress = [];
  for (const t of targets || []) {
    withProgress.push({ target: t, progress: await getTargetProgress(supabase, t) });
  }

  return (
    <div className="stack">
      <div>
        <h1>My targets &amp; incentives</h1>
        {profile?.role === 'agent' ? (
          <p className="muted">
            Your level: <strong>{SENIORITY_NAMES[profile?.seniority] || profile?.seniority}</strong>. Targets are measured in gross commission generated.
          </p>
        ) : (
          <p className="muted">Oversight role — you can monitor the whole team from the dashboard.</p>
        )}
      </div>

      {withProgress.length ? (
        withProgress.map(({ target, progress }) => (
          <div key={target.id} className="card">
            <div className="spread">
              <div>
                <h3>{target.name} {target.is_active ? null : <span className="badge role">archived</span>}</h3>
                {target.period_start || target.period_end ? (
                  <p className="small muted">{formatDate(target.period_start)} → {formatDate(target.period_end)}</p>
                ) : null}
              </div>
              <div className="right">
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{pct(progress.progress)}</div>
                <div className="small muted">of {aed(progress.goal)}</div>
              </div>
            </div>

            <div className="progress" style={{ marginTop: 6 }}><div style={{ width: pct(progress.progress) }} /></div>
            <div className="row small muted" style={{ marginTop: 8, justifyContent: 'space-between' }}>
              <span>{aed(progress.achieved)} achieved · {progress.dealCount} deal(s)</span>
              <span>{aed(progress.remaining)} to target</span>
            </div>

            {progress.tiers.length ? (
              <>
                <hr className="divider" />
                <h3>Incentives</h3>
                {progress.nextTier ? (
                  <p className="small">
                    Next up: <strong>{progress.nextTier.reward_label}</strong>
                    {Number(progress.nextTier.reward_amount) > 0 ? ` (${aed(progress.nextTier.reward_amount)})` : ''} —{' '}
                    {aed(Math.max(Number(progress.nextTier.threshold_amount) - progress.achieved, 0))} away. Keep going! 🚀
                  </p>
                ) : (
                  <p className="small" style={{ color: 'var(--green)' }}>All incentives unlocked — outstanding work! 🎉</p>
                )}
                <div>
                  {progress.tiers.map((tier) => (
                    <div key={tier.id} className={`tier ${tier.reached ? 'reached' : ''}`}>
                      <span className="dot" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{tier.reward_label}</div>
                        <div className="small muted">at {aed(tier.threshold_amount)}{Number(tier.reward_amount) > 0 ? ` · reward ${aed(tier.reward_amount)}` : ''}</div>
                      </div>
                      {tier.reached ? <span className="badge won">Unlocked</span> : <span className="small muted">{pct(progress.goal ? Number(tier.threshold_amount) / progress.goal : 0)}</span>}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))
      ) : (
        <div className="card muted">No targets assigned yet. Your admin will set one up for you.</div>
      )}
    </div>
  );
}

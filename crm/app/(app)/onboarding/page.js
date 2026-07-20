import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeProgramProgress, currentWeek } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

import OnboardingChecklist from '@/components/OnboardingChecklist';

export default async function MyProgramPage({ searchParams }) {
  const { user, profile } = await requireUser();
  const error = searchParams?.error;

  if (!profile?.joined_on) {
    return (
      <div className="stack" style={{ maxWidth: 720 }}>
        <h1>🌱 My 4-week program</h1>
        <p className="muted">Your start date isn’t set yet — ask your admin to set your joining date, and your program will appear here.</p>
      </div>
    );
  }

  const week = currentWeek(profile.joined_on);
  const admin = createAdminClient();
  const weeks = await computeProgramProgress(admin, { agentId: user.id, joinedOn: profile.joined_on });
  const totalDone = weeks.reduce((a, w) => a + w.done, 0);
  const totalItems = weeks.reduce((a, w) => a + w.total, 0);

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div>
        <h1>🌱 My 4-week program</h1>
        <p className="muted">
          {week > 4
            ? `First month complete — ${totalDone}/${totalItems} targets done. 🎉`
            : `Week ${week} of 4 · ${totalDone}/${totalItems} targets done overall. Tick items as you complete them — the ⚙️ ones count themselves from your CRM activity.`}
        </p>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      <OnboardingChecklist weeks={weeks} userId={user.id} back="/onboarding" canToggle currentWeek={week} />
    </div>
  );
}

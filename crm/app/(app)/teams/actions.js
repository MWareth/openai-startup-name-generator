'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notify';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

// Assign the current active training test to a member and notify them.
export async function assignTest(formData) {
  const { user } = await requireStaff();
  const memberId = String(formData.get('member_id'));
  const admin = createAdminClient();

  const { data: quiz } = await admin
    .from('quizzes')
    .select('id, title')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!quiz) redirect('/teams?error=' + encodeURIComponent('No test set up yet — run the training SQL first.'));

  await admin
    .from('quiz_assignments')
    .upsert({ quiz_id: quiz.id, user_id: memberId, assigned_by: user.id }, { onConflict: 'quiz_id,user_id' });

  await notify({
    userId: memberId,
    type: 'test_assigned',
    title: `Training test assigned: ${quiz.title}`,
    body: 'Open the Training tab and take your test.',
    link: '/training',
  });

  revalidatePath('/teams');
  redirect('/teams?ok=' + encodeURIComponent('Test assigned — the member was notified.'));
}

// Assign a user to a team. Allowed for staff only (admin + support + oversight);
// regular agents cannot reach this action or the Teams page.
export async function setUserTeam(formData) {
  await requireStaff();
  const id = String(formData.get('agent_id'));
  let team = String(formData.get('team') || '').trim();
  if (!TEAMS.includes(team)) team = 'Offplan';

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ team }).eq('id', id);
  if (error) redirect('/teams?error=' + encodeURIComponent(error.message));

  revalidatePath('/teams');
  revalidatePath('/profile');
  redirect('/teams?ok=1');
}

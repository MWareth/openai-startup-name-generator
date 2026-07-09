'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Lets the signed-in user set their own password. Used both by the forced
// first-login screen and the voluntary "Change password" form on the profile.
// `back` is where to return on error; `next` is where to go on success.
export async function changeMyPassword(formData) {
  const { user, supabase } = await requireUser();
  const password = String(formData.get('password') || '');
  const back = String(formData.get('back') || '/set-password');
  const next = String(formData.get('next') || '/dashboard');

  if (password.length < 6) {
    redirect(back + '?error=' + encodeURIComponent('Password must be at least 6 characters.'));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(back + '?error=' + encodeURIComponent(error.message));

  // Clear the forced-change flag (profiles writes are admin-only, so service role).
  const admin = createAdminClient();
  await admin.from('profiles').update({ must_change_password: false }).eq('id', user.id);

  revalidatePath('/profile');
  redirect(next);
}

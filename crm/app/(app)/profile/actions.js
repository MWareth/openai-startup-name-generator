'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Lets a signed-in user set ONLY their own photo. Uses the service-role client
// but the action is hard-scoped to avatar_url for the current user's id, so
// there's no way for an agent to change their role/seniority here.
export async function updateMyAvatar(formData) {
  const { user } = await requireUser();
  const url = String(formData.get('avatar_url') || '').trim() || null;

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ avatar_url: url }).eq('id', user.id);
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message));

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
  redirect('/profile?ok=1');
}

// Lets a signed-in user edit ONLY their own profile fields (photo, phone, team,
// and the two "dream" goals). Hard-scoped to the current user's id; email, role
// and seniority are never touched here, so they stay admin-controlled.
export async function updateMyProfile(formData) {
  const { user } = await requireUser();
  const patch = {
    avatar_url: String(formData.get('avatar_url') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    team: String(formData.get('team') || '').trim() || 'Offplan team',
    dream_week: String(formData.get('dream_week') || '').trim() || null,
    dream_car: String(formData.get('dream_car') || '').trim() || null,
  };

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message));

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
  redirect('/profile?ok=1');
}

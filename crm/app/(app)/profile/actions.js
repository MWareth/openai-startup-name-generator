'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushDiag } from '@/lib/push';

// Self-test: push a notification to the current user's own devices and report
// exactly what happened, so we can tell where push breaks on each phone.
export async function sendTestPush() {
  const { user } = await requireUser();
  const res = await sendPushDiag(user.id, {
    title: '🔔 Test from Bullish CRM',
    body: 'If you can see this, push works on this device.',
    url: '/notifications',
  });
  if (!res.configured) {
    return { error: 'Push isn’t set up on the server yet — the VAPID keys are missing in Vercel.' };
  }
  if (res.noSubs) {
    return { error: 'This device isn’t subscribed yet. Tap “Enable notifications on this device” above first, then test.' };
  }
  if (res.sent > 0) {
    return {
      ok: `Sent to ${res.sent} device${res.sent === 1 ? '' : 's'}. If nothing appears in a few seconds, the phone’s OS is blocking it (see the checklist).`,
    };
  }
  return { error: res.errors[0] || 'Could not send to any device — try Enable again.' };
}

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
  // Note: team is intentionally NOT here — only admin/support set a user's team.
  const patch = {
    avatar_url: String(formData.get('avatar_url') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
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

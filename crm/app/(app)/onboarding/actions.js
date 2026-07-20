'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, hasStaffAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ONBOARDING_PROGRAM } from '@/lib/onboarding';

const ALL_ITEMS = new Map(ONBOARDING_PROGRAM.flatMap((w) => w.items).map((i) => [i.key, i]));
const enc = encodeURIComponent;

// Tick/untick a manual program item. Agents manage their own list; staff can
// toggle anyone's (that's the "admin can untick" control). Auto items refuse.
export async function toggleOnboardingItem(formData) {
  const { user, profile } = await requireUser();
  const itemKey = String(formData.get('item_key') || '');
  const targetUser = String(formData.get('user_id') || user.id);
  const back = String(formData.get('back') || '/onboarding');

  const item = ALL_ITEMS.get(itemKey);
  if (!item) redirect(`${back}?error=` + enc('Unknown checklist item.'));
  if (item.auto) redirect(`${back}?error=` + enc('This item is counted automatically from your CRM activity.'));
  if (targetUser !== user.id && !hasStaffAccess(profile)) redirect(`${back}?error=` + enc('Not allowed.'));

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('onboarding_ticks')
    .select('item_key')
    .eq('user_id', targetUser)
    .eq('item_key', itemKey)
    .maybeSingle();

  if (existing) {
    await admin.from('onboarding_ticks').delete().eq('user_id', targetUser).eq('item_key', itemKey);
  } else {
    const { error } = await admin.from('onboarding_ticks').insert({ user_id: targetUser, item_key: itemKey, checked_by: user.id });
    if (error) {
      const msg = /onboarding_ticks|schema cache|does not exist/i.test(error.message)
        ? 'Run migration 0034 in Supabase first.'
        : error.message;
      redirect(`${back}?error=` + enc(msg));
    }
  }

  revalidatePath('/onboarding');
  revalidatePath(`/reviews/${targetUser}`);
  redirect(back);
}

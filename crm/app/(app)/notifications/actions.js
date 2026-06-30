'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export async function markAllRead() {
  const { user, supabase } = await requireUser();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  redirect('/notifications?ok=' + encodeURIComponent('All caught up.'));
}

export async function clearRead() {
  const { user, supabase } = await requireUser();
  await supabase.from('notifications').delete().eq('user_id', user.id).not('read_at', 'is', null);
  revalidatePath('/notifications');
  redirect('/notifications?ok=' + encodeURIComponent('Cleared read notifications.'));
}

// Mark one read, then go to its link (used by the "Open" button on each item).
export async function openNotification(formData) {
  const { user, supabase } = await requireUser();
  const id = String(formData.get('id'));
  const link = String(formData.get('link') || '/notifications');
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
  revalidatePath('/dashboard');
  redirect(link || '/notifications');
}

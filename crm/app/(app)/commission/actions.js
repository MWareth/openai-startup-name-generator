'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Support / admin updates a deal's commission-collection status.
export async function updateCommissionStatus(formData) {
  await requireStaff();
  const dealId = String(formData.get('deal_id'));
  const status = String(formData.get('commission_status') || 'pending');
  const admin = createAdminClient();
  const { error } = await admin.from('deals').update({ commission_status: status }).eq('id', dealId);
  if (error) redirect('/commission?error=' + encodeURIComponent(error.message));
  revalidatePath('/commission');
  redirect('/commission?ok=' + encodeURIComponent('Status updated.'));
}

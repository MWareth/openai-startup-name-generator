'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

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

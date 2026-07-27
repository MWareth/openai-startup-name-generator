'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/audit';

// Rename a set of project-name variants on leads to one agreed master name.
// Nothing is guessed: the variants and the master both come from the form the
// user just reviewed, so a merge only ever does what was on screen.
export async function mergeProjectNames(formData) {
  const { user } = await requireStaff();
  const master = String(formData.get('master') || '').trim();
  const variants = formData.getAll('variant').map(String).map((s) => s.trim()).filter(Boolean);
  if (!master) redirect('/admin/projects?error=' + encodeURIComponent('Type the correct project name first.'));

  const targets = variants.filter((v) => v !== master);
  if (!targets.length) {
    redirect('/admin/projects?ok=' + encodeURIComponent('Nothing to change — those leads already use that name.'));
  }

  const admin = createAdminClient();
  const { data: affected } = await admin
    .from('leads')
    .select('id')
    .in('property_interest', targets);

  const { error } = await admin
    .from('leads')
    .update({ property_interest: master })
    .in('property_interest', targets);
  if (error) redirect('/admin/projects?error=' + encodeURIComponent(error.message));

  const n = (affected || []).length;
  try {
    await admin.from('audit_events').insert(
      (affected || []).map((l) => ({
        user_id: user.id,
        action: 'contact_edit',
        lead_id: l.id,
        detail: `Project renamed to “${master}” (name cleanup)`,
      }))
    );
  } catch (e) {
    // no-op — the rename itself already succeeded
  }

  revalidatePath('/admin/projects');
  revalidatePath('/leads');
  redirect('/admin/projects?ok=' + encodeURIComponent(
    `${n} lead${n === 1 ? '' : 's'} renamed to “${master}”.`
  ));
}

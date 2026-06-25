'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncProjectsFromSheet } from '@/lib/projectsSync';

// Anyone signed in can refresh the directory from the Google Sheet.
export async function refreshProjects() {
  await requireUser();
  const admin = createAdminClient();
  let msg;
  let ok;
  try {
    const n = await syncProjectsFromSheet(admin);
    msg = `Refreshed — ${n} projects loaded.`;
    ok = true;
  } catch (e) {
    msg = 'Refresh failed: ' + e.message;
    ok = false;
  }
  revalidatePath('/projects');
  revalidatePath('/proposal');
  redirect(`/projects?${ok ? 'ok' : 'error'}=` + encodeURIComponent(msg));
}

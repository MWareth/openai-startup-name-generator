'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff, canCarryLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/lib/notify';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

// Save an agent's lead-routing rule (budget range + property types + on/off).
export async function saveRouting(formData) {
  await requireStaff();
  const memberId = String(formData.get('member_id'));
  const num = (k) => {
    const n = parseInt(String(formData.get(k) || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const types = formData.getAll('route_types').map(String).filter(Boolean).join(',') || null;
  const patch = {
    route_enabled: !!formData.get('route_enabled'),
    route_min_budget: num('route_min'),
    route_max_budget: num('route_max'),
    route_types: types,
  };
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(patch).eq('id', memberId);
  if (error) {
    const msg = /route_enabled|route_min|route_max|route_types|schema cache/.test(error.message)
      ? 'Run migration 0033 in Supabase first, then save again.'
      : error.message;
    redirect('/teams?error=' + encodeURIComponent(msg));
  }
  revalidatePath('/teams');
  redirect('/teams?ok=' + encodeURIComponent('Routing rule saved.'));
}

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

// Clear a member's test attempt so they can take it again (e.g. after a fail).
// Deletes their attempt for the active quiz and notifies them to retake.
export async function resetTest(formData) {
  await requireStaff();
  const memberId = String(formData.get('member_id'));
  const admin = createAdminClient();

  const { data: quiz } = await admin
    .from('quizzes')
    .select('id, title')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!quiz) redirect('/teams?error=' + encodeURIComponent('No active test found.'));

  const { error } = await admin
    .from('quiz_attempts')
    .delete()
    .eq('quiz_id', quiz.id)
    .eq('user_id', memberId);
  if (error) redirect('/teams?error=' + encodeURIComponent(error.message));

  await notify({
    userId: memberId,
    type: 'test_assigned',
    title: `Your test was reset: ${quiz.title}`,
    body: 'You can take the training test again. Open the Training tab.',
    link: '/training',
  });

  revalidatePath('/teams');
  revalidatePath('/training');
  redirect('/teams?ok=' + encodeURIComponent('Test reset — the member can retake it and was notified.'));
}

// Nudge a member to update their leads (notes, status, next step). Bell + email.
export async function remindUpdateLeads(formData) {
  await requireStaff();
  const memberId = String(formData.get('member_id'));
  await notify({
    userId: memberId,
    type: 'update_leads',
    title: 'Please update your leads',
    body: 'A manager is asking you to update your leads — add the latest notes, status and next step for each.',
    link: '/leads',
    cta: 'Update my leads',
  });
  revalidatePath('/teams');
  redirect('/teams?ok=' + encodeURIComponent('Reminder sent — the member was notified by app and email.'));
}

// Move EVERY lead from one member's book to another's (offboarding/rebalance).
// Writes a "reassigned" audit entry on each lead so its timeline shows the
// hand-over, and notifies the receiver (informational — clears on view).
export async function transferLeads(formData) {
  const { user, profile } = await requireStaff();
  const fromId = String(formData.get('from_id') || '');
  const toId = String(formData.get('to_id') || '');
  if (!fromId || !toId) redirect('/teams?error=' + encodeURIComponent('Pick both members.'));
  if (fromId === toId) redirect('/teams?error=' + encodeURIComponent('Pick two different members.'));

  const admin = createAdminClient();
  const { data: people } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .in('id', [fromId, toId]);
  const fromP = (people || []).find((p) => p.id === fromId);
  const toP = (people || []).find((p) => p.id === toId);
  if (!fromP || !toP) redirect('/teams?error=' + encodeURIComponent('Member not found.'));
  if (!canCarryLeads(toP)) {
    redirect('/teams?error=' + encodeURIComponent(`${toP.full_name || 'That member'} can't carry leads.`));
  }

  const { data: leads } = await admin.from('leads').select('id').eq('assigned_agent_id', fromId);
  if (!leads || !leads.length) {
    redirect('/teams?ok=' + encodeURIComponent(`${fromP.full_name || 'That member'} has no leads to transfer.`));
  }

  const { error } = await admin
    .from('leads')
    .update({ assigned_agent_id: toId })
    .eq('assigned_agent_id', fromId);
  if (error) redirect('/teams?error=' + encodeURIComponent(error.message));

  // One audit row per lead — shows as 🔁 on each lead's timeline. Tolerated if
  // the audit table isn't migrated yet (0027); the transfer itself already ran.
  const detail = `${fromP.full_name || fromP.email} → ${toP.full_name || toP.email} (book transfer)`;
  try {
    await admin
      .from('audit_events')
      .insert(leads.map((l) => ({ user_id: user.id, action: 'reassigned', lead_id: l.id, detail })));
  } catch (e) {
    // no-op
  }

  if (toId !== user.id) {
    await notify({
      userId: toId,
      type: 'book_transfer',
      title: `${leads.length} lead${leads.length > 1 ? 's' : ''} transferred to you`,
      body: `${profile?.full_name || 'A manager'} moved ${fromP.full_name || 'a member'}’s lead book (${leads.length}) into yours.`,
      link: '/leads',
      cta: 'See my leads',
    });
  }

  revalidatePath('/teams');
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  redirect('/teams?ok=' + encodeURIComponent(
    `Transferred ${leads.length} lead${leads.length > 1 ? 's' : ''} from ${fromP.full_name || 'member'} to ${toP.full_name || 'member'}. ✅`
  ));
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

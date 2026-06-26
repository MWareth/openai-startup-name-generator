'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeCommission } from '@/lib/commission';

// Edit an existing deal. Admin can edit any deal; an agent can edit their own
// (matching the row-level security policy). The commission split is recomputed
// from the deal's agent seniority whenever the amounts change.
export async function updateDeal(formData) {
  const { supabase } = await requireUser();
  const dealId = String(formData.get('deal_id'));

  const { data: deal } = await supabase
    .from('deals')
    .select('id, agent_id, lead_id')
    .eq('id', dealId)
    .single();

  if (!deal) redirect('/leads');

  const { data: agent } = await supabase
    .from('profiles')
    .select('seniority')
    .eq('id', deal.agent_id)
    .single();

  const dealValue = Number(formData.get('deal_value') || 0);
  const gross = Number(formData.get('gross_commission') || 0);
  const referral = Number(formData.get('referral_amount') || 0);
  const split = computeCommission({
    grossCommission: gross,
    referralAmount: referral,
    seniority: agent?.seniority || 'junior',
  });

  const errorTo = `/deals/${dealId}/edit?error=`;
  const { error } = await supabase
    .from('deals')
    .update({
      property: emptyToNull(formData.get('property')),
      property_type: emptyToNull(formData.get('property_type')),
      deal_value: dealValue,
      commission_rate: formData.get('commission_rate') ? Number(formData.get('commission_rate')) : null,
      gross_commission: gross,
      referral_party: emptyToNull(formData.get('referral_party')),
      referral_amount: referral,
      agent_split_pct: split.agentSplitPct,
      agent_commission: split.agentCommission,
      company_commission: split.companyCommission,
      closed_on: String(formData.get('closed_on') || new Date().toISOString().slice(0, 10)),
    })
    .eq('id', dealId);

  if (error) redirect(errorTo + encodeURIComponent(error.message));

  revalidatePath('/targets');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
  if (deal.lead_id) {
    revalidatePath(`/leads/${deal.lead_id}`);
    redirect(`/leads/${deal.lead_id}?ok=` + encodeURIComponent('Deal updated.'));
  }
  redirect('/leads?ok=' + encodeURIComponent('Deal updated.'));
}

export async function deleteDeal(formData) {
  const { supabase } = await requireUser();
  const dealId = String(formData.get('deal_id'));

  const { data: deal } = await supabase
    .from('deals')
    .select('lead_id')
    .eq('id', dealId)
    .single();

  const { error } = await supabase.from('deals').delete().eq('id', dealId);
  if (error) redirect(`/deals/${dealId}/edit?error=` + encodeURIComponent(error.message));

  revalidatePath('/targets');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
  if (deal?.lead_id) {
    revalidatePath(`/leads/${deal.lead_id}`);
    redirect(`/leads/${deal.lead_id}?ok=` + encodeURIComponent('Deal deleted.'));
  }
  redirect('/leads?ok=' + encodeURIComponent('Deal deleted.'));
}

// Upload a document (proof of payment, SPA, passport, Emirates ID) to a deal.
// File goes to private Supabase Storage; a row is recorded in deal_documents.
export async function uploadDealDoc(formData) {
  const { user, supabase } = await requireUser();
  const dealId = String(formData.get('deal_id'));
  const kind = String(formData.get('kind') || 'other');
  const file = formData.get('file');
  const back = `/deals/${dealId}/edit`;

  if (!file || typeof file === 'string' || file.size === 0) {
    redirect(`${back}?error=` + encodeURIComponent('Please choose a file to upload.'));
  }
  // Confirm the user is allowed to see this deal (RLS) before storing.
  const { data: deal } = await supabase.from('deals').select('id').eq('id', dealId).single();
  if (!deal) redirect('/leads');

  const admin = createAdminClient();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${dealId}/${kind}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from('deal-docs')
    .upload(path, bytes, { contentType: file.type || 'application/octet-stream' });
  if (upErr) redirect(`${back}?error=` + encodeURIComponent(upErr.message));

  const { error } = await admin.from('deal_documents').insert({
    deal_id: dealId,
    kind,
    file_path: path,
    file_name: file.name,
    uploaded_by: user.id,
  });
  if (error) redirect(`${back}?error=` + encodeURIComponent(error.message));

  revalidatePath(back);
  redirect(`${back}?ok=` + encodeURIComponent('Document uploaded.'));
}

export async function deleteDealDoc(formData) {
  await requireUser();
  const dealId = String(formData.get('deal_id'));
  const docId = String(formData.get('doc_id'));
  const admin = createAdminClient();
  const { data: doc } = await admin.from('deal_documents').select('file_path').eq('id', docId).single();
  if (doc?.file_path) await admin.storage.from('deal-docs').remove([doc.file_path]);
  await admin.from('deal_documents').delete().eq('id', docId);
  revalidatePath(`/deals/${dealId}/edit`);
  redirect(`/deals/${dealId}/edit?ok=` + encodeURIComponent('Document removed.'));
}

// Add a note specific to this deal (separate from the lead's activity timeline).
export async function addDealNote(formData) {
  const { user, supabase } = await requireUser();
  const dealId = String(formData.get('deal_id'));
  const body = String(formData.get('body') || '').trim();
  const back = `/deals/${dealId}/edit`;
  if (!body) redirect(`${back}?error=` + encodeURIComponent('Write a note first.'));
  const { error } = await supabase.from('deal_notes').insert({ deal_id: dealId, author_id: user.id, body });
  if (error) redirect(`${back}?error=` + encodeURIComponent(error.message));
  revalidatePath(back);
  redirect(`${back}?ok=` + encodeURIComponent('Note added.'));
}

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

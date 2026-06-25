'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
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

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

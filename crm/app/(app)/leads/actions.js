'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { computeCommission } from '@/lib/commission';

export async function createLead(formData) {
  const { user, supabase } = await requireUser();

  const name = String(formData.get('name') || '').trim();
  if (!name) redirect('/leads/new?error=' + encodeURIComponent('Name is required'));

  const phone = emptyToNull(formData.get('phone'));
  const email = emptyToNull(formData.get('email'));

  // Reject duplicates. Checks ALL leads (even those owned by other agents) via
  // a security-definer function, and reports who the existing one belongs to.
  if (phone || email) {
    const { data: dupes } = await supabase.rpc('find_duplicate_lead', {
      p_phone: phone,
      p_email: email,
    });
    const dup = Array.isArray(dupes) ? dupes[0] : dupes;
    if (dup) {
      const who = dup.assigned_to || 'Unassigned';
      redirect(
        '/leads/new?error=' +
          encodeURIComponent(
            `Duplicate: this ${dup.match_on} already belongs to lead "${dup.lead_name}", assigned to ${who}. Lead not added.`
          )
      );
    }
  }

  const budgetRaw = String(formData.get('budget') || '').trim();

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      phone,
      email,
      source: emptyToNull(formData.get('source')),
      property_interest: emptyToNull(formData.get('property_interest')),
      budget: budgetRaw ? Number(budgetRaw) : null,
      qualification: String(formData.get('qualification') || 'warm'),
      status: String(formData.get('status') || 'new'),
      assigned_agent_id: user.id,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) redirect('/leads/new?error=' + encodeURIComponent(error.message));

  revalidatePath('/leads');
  redirect('/leads/' + data.id);
}

export async function addActivity(formData) {
  const { user, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: user.id,
    type: String(formData.get('type') || 'note'),
    occurred_on: String(formData.get('occurred_on') || new Date().toISOString().slice(0, 10)),
    body: String(formData.get('body') || '').trim(),
  });

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Optionally set the next follow-up date on the lead from the same form.
  const nextFollowUp = emptyToNull(formData.get('next_follow_up'));
  if (nextFollowUp) {
    await supabase.from('leads').update({ next_follow_up: nextFollowUp }).eq('id', leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
}

export async function setFollowUp(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const { error } = await supabase
    .from('leads')
    .update({ next_follow_up: emptyToNull(formData.get('next_follow_up')) })
    .eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
}

export async function updateLead(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  const patch = {};
  if (formData.get('qualification')) patch.qualification = String(formData.get('qualification'));
  if (formData.get('status')) patch.status = String(formData.get('status'));

  const { error } = await supabase.from('leads').update(patch).eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
}

export async function suggestReassign(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const suggested = emptyToNull(formData.get('suggested_agent_id'));

  // Agents can only set the *suggestion*; the DB trigger blocks them from
  // changing assigned_agent_id. Admin reassigns from the Admin page.
  const { error } = await supabase
    .from('leads')
    .update({ suggested_agent_id: suggested })
    .eq('id', leadId);

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
}

export async function logDeal(formData) {
  const { user, profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  // The deal is credited to the lead's assigned agent (fallback: current user).
  const { data: lead } = await supabase
    .from('leads')
    .select('assigned_agent_id')
    .eq('id', leadId)
    .single();

  const agentId = lead?.assigned_agent_id || user.id;

  // Look up that agent's seniority to pick the split.
  let seniority = profile?.seniority || 'junior';
  if (agentId !== user.id) {
    const { data: agent } = await supabase
      .from('profiles')
      .select('seniority')
      .eq('id', agentId)
      .single();
    if (agent?.seniority) seniority = agent.seniority;
  }

  const dealValue = Number(formData.get('deal_value') || 0);
  const gross = Number(formData.get('gross_commission') || 0);
  const referral = Number(formData.get('referral_amount') || 0);
  const split = computeCommission({ grossCommission: gross, referralAmount: referral, seniority });

  const { error } = await supabase.from('deals').insert({
    lead_id: leadId,
    agent_id: agentId,
    property: emptyToNull(formData.get('property')),
    deal_value: dealValue,
    gross_commission: gross,
    referral_party: emptyToNull(formData.get('referral_party')),
    referral_amount: referral,
    agent_split_pct: split.agentSplitPct,
    agent_commission: split.agentCommission,
    company_commission: split.companyCommission,
    closed_on: String(formData.get('closed_on') || new Date().toISOString().slice(0, 10)),
    created_by: user.id,
  });

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Mark the lead won.
  await supabase.from('leads').update({ status: 'won' }).eq('id', leadId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/targets');
  revalidatePath('/dashboard');
}

// On-demand translation of a note to English (uses Claude — cheap + fast).
// Returns { text } on success or { error } if not configured / failed.
export async function translateToEnglish(text) {
  await requireUser();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: 'Translation isn’t set up yet (missing ANTHROPIC_API_KEY).' };
  const clean = String(text || '').trim();
  if (!clean) return { text: '' };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content:
              'Translate this real-estate CRM note to English. If it is already English, return it unchanged. Reply with ONLY the translation — no preamble, no quotes.\n\n---\n' +
              clean,
          },
        ],
      }),
    });
    if (!res.ok) return { error: `Translation failed (${res.status}).` };
    const data = await res.json();
    const out = data?.content?.[0]?.text?.trim();
    return { text: out || '(no translation returned)' };
  } catch (e) {
    return { error: 'Translation request failed.' };
  }
}

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

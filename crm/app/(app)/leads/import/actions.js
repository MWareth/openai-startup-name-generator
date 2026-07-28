'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff, canCarryLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseLeadTable, normalisePhone } from '@/lib/importLeads';
import { notify } from '@/lib/notify';

// Preview: parse the pasted table and mark which rows are new, duplicates of a
// lead already in the CRM, or duplicates inside the paste itself. Reads only —
// nothing is written until the user confirms.
export async function previewImport(prevState, formData) {
  await requireStaff();
  const text = String(formData.get('data') || '');
  const parsed = parseLeadTable(text);
  if (parsed.error) return { error: parsed.error };
  if (!parsed.rows.length) return { error: 'No leads found — check the header row is included.' };

  const admin = createAdminClient();
  const phones = parsed.rows.map((r) => r.phone).filter(Boolean);
  const emails = parsed.rows.map((r) => r.email).filter(Boolean);

  const existingPhones = new Set();
  const existingEmails = new Set();
  if (phones.length || emails.length) {
    const { data: existing } = await admin.from('leads').select('phone, email');
    for (const l of existing || []) {
      if (l.phone) existingPhones.add(normalisePhone(l.phone));
      if (l.email) existingEmails.add(String(l.email).toLowerCase());
    }
  }

  const seenPhone = new Set();
  const seenEmail = new Set();
  const rows = parsed.rows.map((r) => {
    let dupe = null;
    if (r.phone && existingPhones.has(r.phone)) dupe = 'phone already in the CRM';
    else if (r.email && existingEmails.has(r.email)) dupe = 'email already in the CRM';
    else if (r.phone && seenPhone.has(r.phone)) dupe = 'repeated in this paste';
    else if (r.email && seenEmail.has(r.email)) dupe = 'repeated in this paste';
    if (r.phone) seenPhone.add(r.phone);
    if (r.email) seenEmail.add(r.email);
    return { ...r, dupe };
  });

  return {
    ok: true,
    rows,
    unmapped: parsed.unmapped,
    text,
    newCount: rows.filter((r) => !r.dupe).length,
    dupeCount: rows.filter((r) => r.dupe).length,
  };
}

// Create the leads. Only rows the preview marked as new are inserted, and the
// whole batch goes to the chosen agent.
export async function runImport(prevState, formData) {
  const { user, profile } = await requireStaff();
  const text = String(formData.get('data') || '');
  const agentId = String(formData.get('agent_id') || '');
  const overrideSource = String(formData.get('source') || '').trim();
  const overrideProject = String(formData.get('project') || '').trim();
  if (!agentId) return { error: 'Choose the agent who gets these leads.' };

  const admin = createAdminClient();
  const { data: agent } = await admin.from('profiles').select('id, full_name, email, role').eq('id', agentId).single();
  if (!agent) return { error: 'Agent not found.' };
  if (!canCarryLeads(agent)) return { error: `${agent.full_name || 'That member'} can’t carry leads.` };

  const preview = await previewImport(null, formData);
  if (preview.error) return preview;

  const fresh = preview.rows.filter((r) => !r.dupe);
  if (!fresh.length) return { error: 'Every row is already in the CRM — nothing to import.' };

  const now = new Date().toISOString();
  const payload = fresh.map((r) => {
    const row = {
      name: r.name,
      phone: r.phone || null,
      email: r.email || null,
      source: overrideSource || r.source || null,
      property_interest: overrideProject || r.property_interest || null,
      budget: r.budget,
      qualification: 'warm',
      status: 'new',
      assigned_agent_id: agentId,
      assigned_at: now,
      created_by: user.id,
    };
    if (r.property_type) row.property_type = r.property_type;
    if (r.bedrooms) row.bedrooms = r.bedrooms;
    if (r.community) row.community = r.community;
    return row;
  });

  // Insert tolerantly: if the database is missing an optional column, drop it
  // from every row and retry rather than failing the whole import.
  let attempt = payload;
  let res = await admin.from('leads').insert(attempt).select('id');
  let guard = 0;
  while (res.error && guard < 5) {
    const m = /'([\w]+)' column|column "([\w]+)"/i.exec(res.error.message || '');
    const col = m && (m[1] || m[2]);
    if (!col) break;
    attempt = attempt.map((r) => {
      const c = { ...r };
      delete c[col];
      return c;
    });
    res = await admin.from('leads').insert(attempt).select('id');
    guard += 1;
  }
  if (res.error) return { error: res.error.message };

  const created = (res.data || []).length;

  // Carry each row's stage/notes across as the lead's first note.
  const notes = fresh
    .map((r, i) => ({ r, id: res.data?.[i]?.id }))
    .filter((x) => x.id && x.r.note)
    .map((x) => ({
      lead_id: x.id,
      agent_id: user.id,
      type: 'note',
      occurred_on: now.slice(0, 10),
      body: `Imported — ${x.r.note}`,
    }));
  if (notes.length) {
    try { await admin.from('lead_activities').insert(notes); } catch (e) { /* no-op */ }
  }

  if (agentId !== user.id) {
    await notify({
      userId: agentId,
      type: 'lead_assigned',
      title: `${created} new lead${created === 1 ? '' : 's'} assigned to you`,
      body: `${profile?.full_name || 'A manager'} imported ${created} lead${created === 1 ? '' : 's'} into your book.`,
      link: '/leads',
      cta: 'Open my leads',
    });
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return {
    done: true,
    created,
    skipped: preview.dupeCount,
    agent: agent.full_name || agent.email,
  };
}

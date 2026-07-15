import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeTolerant } from '@/lib/db';
import { notify } from '@/lib/notify';
import { pickAgentForLead, detectPropertyType } from '@/lib/routing';

export const dynamic = 'force-dynamic';

// Secure lead-intake webhook. Any source (website form, Meta lead ads via
// Zapier/Make, forwarded portal/PropSpace emails via an email parser) POSTs a
// lead here and it's created in the CRM. Deduped by phone/email so the same
// person isn't added twice — a repeat just appends its message as a note.
//
// Auth: POST with ?key=<LEAD_INTAKE_TOKEN> (or Authorization: Bearer <token>).
// Body: JSON or form-encoded. Recognised fields (many aliases accepted):
//   name, phone, email, source, message/note, budget, community,
//   property_interest/project, agent_email (optional direct assignment).

const val = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
};

export async function POST(request) {
  const token = process.env.LEAD_INTAKE_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Lead intake is not turned on (set LEAD_INTAKE_TOKEN in Vercel).' }, { status: 503 });
  }
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (key !== token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // Accept JSON or form-encoded payloads.
  let body = {};
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) body = await request.json();
    else {
      const fd = await request.formData();
      fd.forEach((v, k) => { body[k] = v; });
    }
  } catch {
    body = {};
  }

  const name = val(body, ['name', 'full_name', 'fullName', 'Name', 'lead_name']);
  const phone = val(body, ['phone', 'phone_number', 'phoneNumber', 'mobile', 'Phone', 'contact']);
  const email = val(body, ['email', 'Email', 'email_address', 'emailAddress']);
  const source = val(body, ['source', 'Source', 'platform', 'channel']) || 'Website';
  const message = val(body, ['message', 'note', 'notes', 'comments', 'Message', 'enquiry']);
  const budgetRaw = val(body, ['budget', 'Budget']);
  const community = val(body, ['community', 'area', 'Community', 'location']);
  const property = val(body, ['property_interest', 'project', 'building', 'Property', 'unit']);
  const agentEmail = val(body, ['agent_email', 'assigned_agent_email', 'agent']);

  if (!name && !phone && !email) {
    return NextResponse.json({ ok: false, error: 'Need at least a name, phone, or email.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const noteBody = message ? `📥 ${source}: ${message}` : null;

  // Dedupe (matches email, or phone on the last 9 digits) — append note instead.
  let existingId = null;
  try {
    const { data: dup } = await admin.rpc('find_duplicate_lead', { p_phone: phone, p_email: email });
    if (dup && dup.length) existingId = dup[0].lead_id;
  } catch { /* function may be absent — treat as no duplicate */ }

  if (existingId) {
    if (noteBody) {
      await admin.from('lead_activities').insert({ lead_id: existingId, type: 'note', occurred_on: today, body: noteBody });
    }
    return NextResponse.json({ ok: true, matched: true, lead_id: existingId });
  }

  // Assignment order: explicit agent email → routing rules (budget/type with
  // fair rotation, set on the Teams page) → the pool.
  let assignedTo = null;
  if (agentEmail) {
    const { data: a } = await admin.from('profiles').select('id').ilike('email', agentEmail).limit(1);
    assignedTo = a?.[0]?.id || null;
  }

  let budgetNum = null;
  if (budgetRaw) {
    const n = Number(budgetRaw.replace(/[^\d.]/g, ''));
    if (n > 0) budgetNum = n;
  }
  const typeRaw = val(body, ['property_type', 'propertyType', 'type', 'unit_type', 'unitType']);
  const propertyType = typeRaw || detectPropertyType(typeRaw, property, community, message);

  if (!assignedTo) {
    const routed = await pickAgentForLead(admin, { budget: budgetNum, propertyType });
    assignedTo = routed?.id || null;
  }

  const insert = { name: name || 'New enquiry', phone, email, source };
  if (budgetNum) insert.budget = budgetNum;
  if (propertyType) insert.property_type = propertyType; // writeTolerant drops pre-0005
  if (community) insert.community = community;
  if (property) insert.property_interest = property;
  if (assignedTo) {
    insert.assigned_agent_id = assignedTo;
    insert.created_by = assignedTo;
    insert.assigned_at = new Date().toISOString();
  }

  const { data: lead, error } = await writeTolerant(
    (p) => admin.from('leads').insert(p).select('id').single(),
    insert
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  if (noteBody) {
    await admin.from('lead_activities').insert({ lead_id: lead.id, type: 'note', occurred_on: today, body: noteBody });
  }

  // Notify the assigned agent (if any) + management that a new lead arrived.
  const preview = [phone || email, message].filter(Boolean).join(' — ') || 'A new lead just came in.';
  if (assignedTo) {
    await notify({ userId: assignedTo, type: 'lead_assigned', title: `New ${source} lead: ${insert.name}`, body: preview, link: `/leads/${lead.id}`, leadId: lead.id, cta: 'Open the lead' });
  }
  const { data: mgrs } = await admin.from('profiles').select('id').in('role', ['admin', 'director', 'c_suite']);
  for (const m of mgrs || []) {
    if (m.id === assignedTo) continue;
    await notify({ userId: m.id, type: 'lead_new', title: `New ${source} lead: ${insert.name}`, body: preview, link: `/leads/${lead.id}`, leadId: lead.id, cta: 'Open the lead' });
  }

  return NextResponse.json({ ok: true, created: true, lead_id: lead.id });
}

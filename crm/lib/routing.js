// Lead routing: pick the right agent for a lead by budget range + property
// type, rotating fairly (the matching agent who was routed to least recently
// wins). Rules are set per agent on the Teams page. Returns null when nobody
// matches — the lead then falls to the pool as before.

export async function pickAgentForLead(admin, { budget = null, propertyType = null } = {}) {
  try {
    const { data: agents, error } = await admin
      .from('profiles')
      .select('id, full_name, route_enabled, route_min_budget, route_max_budget, route_types, last_routed_at')
      .eq('route_enabled', true)
      .in('role', ['agent', 'admin']);
    if (error || !agents?.length) return null;

    const b = budget == null || budget === '' ? null : Number(budget);
    const t = propertyType ? String(propertyType).trim().toLowerCase() : null;

    const matches = agents.filter((a) => {
      // Budget criterion: unknown budget passes; known budget must sit inside
      // the agent's range (open ends pass).
      if (b != null && Number.isFinite(b)) {
        if (a.route_min_budget != null && b < Number(a.route_min_budget)) return false;
        if (a.route_max_budget != null && b > Number(a.route_max_budget)) return false;
      }
      // Type criterion: agent with no types takes anything; otherwise the
      // lead's type (when known) must be one of them.
      const types = String(a.route_types || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (t && types.length && !types.includes(t)) return false;
      return true;
    });
    if (!matches.length) return null;

    // Fair rotation: least recently routed first (never-routed wins outright).
    matches.sort((x, y) => new Date(x.last_routed_at || 0).getTime() - new Date(y.last_routed_at || 0).getTime());
    const chosen = matches[0];
    await admin.from('profiles').update({ last_routed_at: new Date().toISOString() }).eq('id', chosen.id);
    return chosen;
  } catch (e) {
    return null; // routing must never break lead creation (e.g. pre-migration 0033)
  }
}

// Best-effort property-type detection from free text (campaign payloads often
// say "2BR apartment in JVC" rather than sending a clean field).
export function detectPropertyType(...texts) {
  const hay = texts.filter(Boolean).join(' ').toLowerCase();
  if (!hay) return null;
  if (/\bvillas?\b/.test(hay)) return 'Villa';
  if (/\btown\s?house|townhouses?\b/.test(hay)) return 'Townhouse';
  if (/\bpenthouses?\b/.test(hay)) return 'Penthouse';
  if (/\bplots?\b|\bland\b/.test(hay)) return 'Plot / Land';
  if (/\boffices?\b|commercial|retail/.test(hay)) return 'Office / Commercial';
  if (/\bapartments?\b|\bapt\b|\bflat\b|\bstudio\b|\b\d\s?(br|bed)/.test(hay)) return 'Apartment';
  return null;
}

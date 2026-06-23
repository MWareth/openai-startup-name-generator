import { createClient } from '@supabase/supabase-js';

// Service-role client. Bypasses Row Level Security — use ONLY on the server,
// inside admin-gated actions (e.g. creating agent accounts). Never import this
// into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

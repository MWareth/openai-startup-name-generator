import { createBrowserClient } from '@supabase/ssr';

// Supabase client for use in Client Components (browser). Used for direct
// file uploads to Storage, which bypass Vercel's ~4.5MB request body limit.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

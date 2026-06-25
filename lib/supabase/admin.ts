import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. For contexts with no Supabase
// session at all (the Telegram webhook) and other system-level operations.
// Never import this from anything reachable by a request that carries a
// user's own session — use lib/supabase/server.ts for that.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

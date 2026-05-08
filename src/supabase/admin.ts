import { createClient } from "@supabase/supabase-js";
import { unknown_toNonEmptyString_orUndefined_afterTrim } from "@/utils/non-empty-string-trimmed";
import { getSupabaseUrl } from "./env";

// Admin key, make sure to NEVER expose this key to the client (browser), it has admin access to bypass RLS!
export const createAdminClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAdminKey =
    unknown_toNonEmptyString_orUndefined_afterTrim(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ) ??
    (() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not present");
    })();

  return createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

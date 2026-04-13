import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdminKey() {
  const adminKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!adminKey) {
    throw new Error(
      "Missing Supabase admin key. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (adminKey.startsWith("sb_publishable_")) {
    throw new Error(
      "Supabase admin key is using a publishable key. Use the project secret/service-role key instead."
    );
  }

  return adminKey;
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAdminKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

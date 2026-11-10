import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class MissingSupabaseConfigError extends Error {
  constructor() {
    super(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local.",
    );
    this.name = "MissingSupabaseConfigError";
  }
}

let adminClient: SupabaseClient | undefined;

/**
 * Cliente com a service role key. Só pode ser importado no servidor: ele ignora
 * as políticas de RLS e nunca deve chegar ao bundle do navegador.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new MissingSupabaseConfigError();
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

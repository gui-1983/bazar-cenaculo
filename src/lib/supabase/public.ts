import { createClient } from "@supabase/supabase-js";

// Cliente público (anon). Usado em Server Components para ler o catálogo.
export function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

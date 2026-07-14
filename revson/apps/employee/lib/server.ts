import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Profile } from "@revson/shared";

/** Cookie-bound client for reading the caller's session inside route handlers. */
export function serverSupabase() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => store.get(name)?.value,
        set() {},
        remove() {}
      }
    }
  );
}

/** Service-role client. Server only. Bypasses RLS — guard every call site. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** Returns { user, profile } or null. Pass a role to require it (super_admin always passes). */
export async function requireRole(role?: "super_admin" | "owner" | "employee") {
  const sb = serverSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  const p = profile as Profile;
  if (role && p.role !== role && p.role !== "super_admin") return null;
  return { user, profile: p };
}

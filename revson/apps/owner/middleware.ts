import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PORTALS: Record<string, string> = {
  super_admin: process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001",
  employee: process.env.NEXT_PUBLIC_EMPLOYEE_URL || "http://localhost:3003"
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) return NextResponse.next();

  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: "", ...options })
      }
    }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!profile) return NextResponse.redirect(new URL("/login", req.url));
  // Owners and super admins (impersonation) may enter; employees get bounced home.
  if (profile.role === "employee") return NextResponse.redirect(PORTALS.employee);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

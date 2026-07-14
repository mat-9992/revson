import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

export async function POST() {
  const auth = await requireRole("super_admin");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = supabaseAdmin();

  // 1) Remove every non-super-admin auth user (profiles cascade with them).
  const { data: profiles } = await admin.from("profiles").select("id, role");
  for (const p of profiles ?? []) {
    if (p.role !== "super_admin") await admin.auth.admin.deleteUser(p.id);
  }

  // 2) Businesses cascade: employees, documents, pay_periods, shifts, job_posts, reviews, tasks.
  const { error: bizErr } = await admin.from("businesses").delete().not("id", "is", null);
  if (bizErr) return NextResponse.json({ error: bizErr.message }, { status: 500 });

  // 3) Waitlist.
  await admin.from("waitlist").delete().not("id", "is", null);

  return NextResponse.json({ ok: true });
}

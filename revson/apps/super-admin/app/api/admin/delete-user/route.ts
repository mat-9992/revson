import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  const auth = await requireRole("super_admin");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required." }, { status: 400 });
  if (userId === auth.user.id) return NextResponse.json({ error: "You cannot delete yourself." }, { status: 400 });

  const admin = supabaseAdmin();
  // Detach employee link, then remove auth user (profile cascades).
  await admin.from("employees").update({ user_id: null }).eq("user_id", userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  const auth = await requireRole("super_admin");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, type, address, phone, email, owner_name, owner_email, brand_color, subscription } = body;
  if (!name || !owner_email) return NextResponse.json({ error: "Name and owner email are required." }, { status: 400 });

  const admin = supabaseAdmin();
  const tempPassword = `revson-${crypto.randomUUID().slice(0, 8)}`;

  // 1) Owner auth user
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: owner_email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: owner_name ?? null }
  });
  if (userErr || !created.user) {
    return NextResponse.json({ error: userErr?.message ?? "Could not create owner user." }, { status: 400 });
  }

  // 2) Business
  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .insert({
      name, type, address: address || null, phone: phone || null, email: email || null,
      owner_name: owner_name || null, owner_user_id: created.user.id,
      brand_color: brand_color || "#4F46E5", subscription: subscription || "trial"
    })
    .select()
    .single();
  if (bizErr || !biz) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: bizErr?.message ?? "Could not create business." }, { status: 400 });
  }

  // 3) Owner profile
  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id, email: owner_email, name: owner_name || null, role: "owner", business_id: biz.id
  });
  if (profErr) {
    await admin.from("businesses").delete().eq("id", biz.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profErr.message }, { status: 400 });
  }

  return NextResponse.json({ business: biz, tempPassword });
}

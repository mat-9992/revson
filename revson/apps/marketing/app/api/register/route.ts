import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { businessName, ownerName, email, password, type, phone } = await req.json();
    if (!businessName || !email || !password || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    const admin = supabaseAdmin();

    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (userErr || !created.user) {
      return NextResponse.json({ error: userErr?.message ?? "Could not create account." }, { status: 400 });
    }
    const userId = created.user.id;

    const { data: business, error: bizErr } = await admin
      .from("businesses")
      .insert({
        name: businessName,
        type,
        phone: phone || null,
        email,
        owner_name: ownerName || null,
        owner_user_id: userId,
        subscription: "trial"
      })
      .select()
      .single();
    if (bizErr || !business) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: bizErr?.message ?? "Could not create business." }, { status: 400 });
    }

    const { error: profErr } = await admin.from("profiles").insert({
      id: userId,
      email,
      name: ownerName || null,
      role: "owner",
      business_id: business.id
    });
    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Registration failed." }, { status: 500 });
  }
}

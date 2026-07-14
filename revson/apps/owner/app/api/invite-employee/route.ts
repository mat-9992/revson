import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

/** Owner-guarded: verifies the caller owns the target business (super_admin passes). */
async function assertOwnsBusiness(userId: string, role: string, businessId: string) {
  if (role === "super_admin") return true;
  const admin = supabaseAdmin();
  const { data } = await admin.from("businesses").select("id").eq("id", businessId).eq("owner_user_id", userId).single();
  return !!data;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 24) || "member";
}

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const admin = supabaseAdmin();

  // Resend: generate a recovery link for an existing employee login.
  if (body.resend) {
    if (!(await assertOwnsBusiness(auth.user.id, auth.profile.role, body.businessId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data: emp } = await admin.from("employees").select("user_id").eq("id", body.employeeId).single();
    if (!emp?.user_id) return NextResponse.json({ error: "No login on this employee." }, { status: 400 });
    const { data: prof } = await admin.from("profiles").select("email").eq("id", emp.user_id).single();
    if (!prof?.email) return NextResponse.json({ error: "No email on file." }, { status: 400 });
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: prof.email });
    if (error || !data.properties?.action_link) return NextResponse.json({ error: "Link failed." }, { status: 400 });
    return NextResponse.json({ link: data.properties.action_link });
  }

  const { businessId, name, role, rate, phone, email } = body;
  if (!businessId || !name) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (!(await assertOwnsBusiness(auth.user.id, auth.profile.role, businessId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const loginEmail = (email && email.trim()) || `${slugify(name)}@team.revson.services`;
  const tempPassword = `revson-${crypto.randomUUID().slice(0, 8)}`;

  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: loginEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name }
  });
  if (userErr || !created.user) {
    return NextResponse.json({ error: userErr?.message ?? "Could not create login." }, { status: 400 });
  }

  const { data: emp, error: empErr } = await admin.from("employees").insert({
    business_id: businessId, user_id: created.user.id, name, role: role || null,
    rate: rate ?? 0, phone: phone || null, status: "invited"
  }).select().single();
  if (empErr || !emp) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: empErr?.message ?? "Could not create employee." }, { status: 400 });
  }

  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id, email: loginEmail, name, role: "employee", business_id: businessId, employee_id: emp.id
  });
  if (profErr) {
    await admin.from("employees").delete().eq("id", emp.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profErr.message }, { status: 400 });
  }

  return NextResponse.json({ employee: emp, credentials: { email: loginEmail, password: tempPassword } });
}

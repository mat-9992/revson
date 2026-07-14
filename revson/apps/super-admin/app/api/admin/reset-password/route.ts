import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  const auth = await requireRole("super_admin");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Could not generate link." }, { status: 400 });
  }
  return NextResponse.json({ link: data.properties.action_link });
}

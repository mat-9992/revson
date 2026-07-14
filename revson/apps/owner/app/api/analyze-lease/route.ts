import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server";
import { claudeJSON } from "@/lib/claude";

const SYSTEM =
  "You are a contract analyst for small businesses. Extract key info and risks. " +
  "Return ONLY JSON with this exact shape: " +
  '{"riskScore":0-100,"summary":"3 sentences plain English","money":{"base":"","fees":"","deposit":"","firstYear":""},' +
  '"traps":[{"clause":"","where":"","why":"","severity":"high|medium|low"}],' +
  '"dates":{"start":"","end":"","renewal":"","deadline":""}}. ' +
  "No legal advice disclaimer in the JSON. Be concise, 8th grade level. If missing data use \"Not stated\".";

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { base64, fileName } = await req.json();
  if (!base64) return NextResponse.json({ error: "Missing file." }, { status: 400 });

  try {
    const result = await claudeJSON({
      system: SYSTEM,
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
        { type: "text", text: `Analyze this document (${fileName ?? "lease"}) and return the JSON described.` }
      ],
      maxTokens: 2000
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed." }, { status: 500 });
  }
}

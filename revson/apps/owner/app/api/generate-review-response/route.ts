import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server";
import { claudeJSON } from "@/lib/claude";

const SYSTEM =
  "You are a reputation manager for a small business. Write a public response that acknowledges the specific " +
  "complaint, apologizes without admitting fault, offers an offline fix, and invites the customer back. Never argue. " +
  "Keep it under 4 sentences. Also give a short_response under 280 characters and an internal_note on what the owner " +
  "should fix. Return ONLY JSON: {\"response_text\":\"\",\"short_response\":\"\",\"internal_note\":\"\"}.";

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessName, review, stars, customerName, tone } = await req.json();
  const prompt = `Business: ${businessName}
Reviewer: ${customerName ?? "Not stated"}
Stars: ${stars ?? "Not stated"}
Tone to use: ${tone ?? "Professional"}
Review text:
"""${review}"""`;

  try {
    const result = await claudeJSON({
      system: SYSTEM,
      content: [{ type: "text", text: prompt }],
      maxTokens: 800
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 500 });
  }
}

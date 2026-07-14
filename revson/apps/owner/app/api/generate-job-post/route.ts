import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server";
import { claudeJSON } from "@/lib/claude";

const SYSTEM =
  "You are an Indeed job post writer for small businesses. No discriminatory language. " +
  "Write in a human, friendly tone at an 8th grade level. " +
  "Return ONLY JSON: {\"content\":\"full formatted post with sections About Us, The Role, What You'll Do, " +
  "What We're Looking For, Pay & Benefits, Schedule, How to Apply, plus a final EEO line\"," +
  "\"interview_questions\":[5 specific questions],\"offer_blurb\":\"2 sentence offer text\"}. " +
  "Keep the post under 400 words.";

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json();
  const prompt = `Business: ${b.businessName}
Address: ${b.address ?? "Not stated"}
Title: ${b.title}
Pay: ${b.payRange ?? "Not stated"}
Type: ${b.type ?? "Full-time"}
Responsibilities: ${b.responsibilities ?? "Not stated"}
Requirements: ${b.requirements ?? "Not stated"}
Benefits: ${b.benefits ?? "Not stated"}
Vibe: ${b.vibe ?? "friendly, local"}`;

  try {
    const result = await claudeJSON({
      system: SYSTEM,
      content: [{ type: "text", text: prompt }],
      maxTokens: 1500
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Generation failed." }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Cue, a habit formation assistant. The user just checked in on their implementation intention and wants to briefly reflect.

Analyze their recent pattern and give a short, actionable observation (2-3 sentences max). If the trigger or action seems misaligned with their life, suggest a specific adjustment. Be direct. No filler.

If you suggest modifying the intention, output it in this format at the end:
SUGGESTION:
WHEN: [new trigger]
THEN: [new action]`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intention, recentEvents, userMessage } = await request.json();

  const eventSummary = recentEvents
    .slice(-7)
    .map((e: { date: string; result: string }) => `${e.date}: ${e.result}`)
    .join("\n");

  const prompt = `Intention: When ${intention.when_trigger}, then ${intention.then_action}
Why: ${intention.why_rationale}

Last 7 check-ins:
${eventSummary || "No check-ins yet"}

User says: "${userMessage}"

Give a brief, actionable reflection.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse for suggestion
  let suggestedEdit = null;
  if (text.includes("SUGGESTION:")) {
    const whenMatch = text.match(/WHEN:\s*(.+)/);
    const thenMatch = text.match(/THEN:\s*(.+)/);
    if (whenMatch && thenMatch) {
      suggestedEdit = {
        when_trigger: whenMatch[1].trim(),
        then_action: thenMatch[1].trim(),
      };
    }
  }

  return NextResponse.json({
    reflection: text.split("SUGGESTION:")[0].trim(),
    suggestedEdit,
  });
}

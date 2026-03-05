import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Cue, a precision instrument for crafting implementation intentions (When-Then-Why formulas).

Your job is to help the user create ONE surgically precise behavior trigger in 2-3 exchanges. You are not a chatbot. You are not a coach. You are a precision tool.

RULES:
1. TRIGGERS must be concrete, external, observable, and recurring. Reject internal states ("when I feel motivated"). Ask: "What's the last physical thing that happens before the window for this behavior opens?"
2. ACTIONS must be the first physical movement, under 30 seconds. Shrink everything. "Exercise more" becomes "Stand up and put on running shoes." Hold this line even if the user resists.
3. The WHY explains the behavioral science — why this specific trigger-action link works. Keep it to 1-2 sentences.
4. Guide the conversation to extract: what they want to change, when the window exists in their day, what physical cue precedes it.
5. When you have enough information, output the intention in this EXACT format (and nothing else after it):

INTENTION:
WHEN: [concrete external trigger]
THEN: [first physical movement, under 30 seconds]
WHY: [1-2 sentence rationale linking trigger to action]

6. Be direct. No filler. No cheerleading. Short responses. You're a scalpel, not a therapist.
7. Maximum 3 exchanges before producing the intention. Don't over-discuss.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await request.json();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Check if the response contains a completed intention
  let intention = null;
  if (text.includes("INTENTION:")) {
    const whenMatch = text.match(/WHEN:\s*(.+)/);
    const thenMatch = text.match(/THEN:\s*(.+)/);
    const whyMatch = text.match(/WHY:\s*(.+)/);

    if (whenMatch && thenMatch && whyMatch) {
      intention = {
        when_trigger: whenMatch[1].trim(),
        then_action: thenMatch[1].trim(),
        why_rationale: whyMatch[1].trim(),
      };
    }
  }

  return NextResponse.json({ text, intention });
}

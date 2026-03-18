import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are Cue, a habit formation assistant. Generate a single sentence morning nudge (under 20 words). Reference the user's specific trigger situation. No generic motivation. No cheerleading. Be specific and grounded.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intention, recentResults, currentStreak } = await request.json();

  const dayOfWeek = new Date().toLocaleDateString("en", { weekday: "long" });

  const prompt = `Intention: When ${intention.when_trigger}, then ${intention.then_action}
Recent check-ins (last 3 days): ${recentResults.length > 0 ? recentResults.join(", ") : "none yet"}
Current streak: ${currentStreak} days
Today: ${dayOfWeek}

Generate one short nudge sentence.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 80,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const nudge =
    response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({ nudge: nudge.trim() });
}

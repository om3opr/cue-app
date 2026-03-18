import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get all active intentions
  const { data: intentions } = await supabase
    .from("intentions")
    .select("*")
    .eq("status", "active");

  if (!intentions || intentions.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  let generated = 0;

  for (const intention of intentions) {
    // Get last 7 events
    const { data: events } = await supabase
      .from("events")
      .select("date, result")
      .eq("intention_id", intention.id)
      .order("date", { ascending: false })
      .limit(7);

    if (!events || events.length < 3) continue; // Not enough data

    const eventSummary = events
      .reverse()
      .map((e) => `${e.date}: ${e.result}`)
      .join(", ");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 80,
      system:
        "Generate a single-sentence pattern insight about this user's habit data. Be specific to their pattern. No generic advice.",
      messages: [
        {
          role: "user",
          content: `Intention: When ${intention.when_trigger}, then ${intention.then_action}\nRecent check-ins: ${eventSummary}\n\nOne sentence insight:`,
        },
      ],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (content) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      await supabase.from("insights").insert({
        user_id: intention.user_id,
        intention_id: intention.id,
        content: content.trim(),
        week_start: weekStart.toISOString().split("T")[0],
      });

      generated++;
    }
  }

  return NextResponse.json({ generated });
}

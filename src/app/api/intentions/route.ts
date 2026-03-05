import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: intention } = await supabase
    .from("intentions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!intention) {
    return NextResponse.json({ intention: null });
  }

  // Get ALL events for this intention
  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .eq("intention_id", intention.id)
    .order("date", { ascending: true });

  // Get events for last 7 days (for display)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentEvents =
    allEvents?.filter(
      (e) => e.date >= sevenDaysAgo.toISOString().split("T")[0]
    ) ?? [];

  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const todayEvent = recentEvents.find((e) => e.date === today);

  // Calculate fire rate (last 7 days)
  const fired = recentEvents.filter((e) => e.result === "fired").length;
  const total = recentEvents.filter(
    (e) => e.result !== "not_encountered"
  ).length;
  const fireRate = total > 0 ? Math.round((fired / total) * 100) : null;

  // Check graduation: 80%+ fire rate over all events, at least 7 check-ins
  const allFired =
    allEvents?.filter((e) => e.result === "fired").length ?? 0;
  const allTotal =
    allEvents?.filter((e) => e.result !== "not_encountered").length ?? 0;
  const overallFireRate =
    allTotal > 0 ? Math.round((allFired / allTotal) * 100) : 0;
  const totalDays =
    allEvents && allEvents.length > 0
      ? Math.ceil(
          (Date.now() - new Date(allEvents[0].date).getTime()) / 86400000
        ) + 1
      : 0;
  const canGraduate = overallFireRate >= 80 && allTotal >= 7 && totalDays >= 7;

  return NextResponse.json({
    intention,
    events: recentEvents,
    fireRate,
    overallFireRate,
    totalCheckins: allTotal,
    totalDays,
    checkedInToday: !!todayEvent,
    todayResult: todayEvent?.result ?? null,
    canGraduate,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { when_trigger, then_action, why_rationale } = await request.json();

  const { data, error } = await supabase
    .from("intentions")
    .insert({
      user_id: user.id,
      when_trigger,
      then_action,
      why_rationale,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ intention: data });
}

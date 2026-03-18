import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getStreakDisplay } from "@/lib/streaks";

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

  // Get events for last 14 days (for display)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentEvents =
    allEvents?.filter(
      (e) => e.date >= fourteenDaysAgo.toISOString().split("T")[0]
    ) ?? [];

  // Check if already checked in today
  const today = new Date().toISOString().split("T")[0];
  const todayEvent = recentEvents.find((e) => e.date === today);

  // Calculate fire rate (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7Events = recentEvents.filter(
    (e) => e.date >= sevenDaysAgo.toISOString().split("T")[0]
  );
  const fired = last7Events.filter((e) => e.result === "fired").length;
  const total = last7Events.filter(
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

  // Get streak data
  let { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stats) {
    const { data: newStats } = await supabase
      .from("user_stats")
      .insert({ user_id: user.id })
      .select()
      .single();
    stats = newStats;
  }

  const streak = getStreakDisplay(
    stats
      ? {
          current_streak: stats.current_streak,
          longest_streak: stats.longest_streak,
          last_checkin_date: stats.last_checkin_date,
          streak_freeze_available: stats.streak_freeze_available,
          streak_freeze_used_date: stats.streak_freeze_used_date,
        }
      : null,
    today
  );

  // Compute progress toward graduation
  const daysCompleted = totalDays;
  const fireRateCurrent = overallFireRate;

  // Trend: compare last 3 days fire rate to prior 3 days
  let trend: "up" | "down" | "stable" = "stable";
  if (allEvents && allEvents.length >= 4) {
    const recent3 = allEvents.slice(-3);
    const prior3 = allEvents.slice(-6, -3);
    const r3fired = recent3.filter((e) => e.result === "fired").length;
    const r3total = recent3.filter((e) => e.result !== "not_encountered").length;
    const p3fired = prior3.filter((e) => e.result === "fired").length;
    const p3total = prior3.filter((e) => e.result !== "not_encountered").length;
    const r3rate = r3total > 0 ? r3fired / r3total : 0;
    const p3rate = p3total > 0 ? p3fired / p3total : 0;
    if (r3rate > p3rate + 0.1) trend = "up";
    else if (r3rate < p3rate - 0.1) trend = "down";
  }

  // Get latest insight
  const { data: latestInsight } = await supabase
    .from("insights")
    .select("content, week_start")
    .eq("intention_id", intention.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Determine if reflection should be offered
  // Offer when: 3+ consecutive misses, or first fired after misses, or weekly
  const lastEvents = allEvents?.slice(-3) ?? [];
  const consecutiveMisses = lastEvents.filter(
    (e) => e.result === "missed"
  ).length;
  const shouldOfferReflection = consecutiveMisses >= 3 || (
    allEvents && allEvents.length > 0 &&
    allEvents.length % 7 === 0
  );

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
    streak,
    progress: {
      daysCompleted,
      daysRequired: 7,
      fireRateCurrent,
      fireRateRequired: 80,
      trend,
    },
    insight: latestInsight?.content ?? null,
    shouldOfferReflection: shouldOfferReflection ?? false,
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

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await request.json();
  const allowed = ["when_trigger", "then_action", "why_rationale"];
  const filtered: Record<string, string> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("intentions")
    .update(filtered)
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ intention: data });
}

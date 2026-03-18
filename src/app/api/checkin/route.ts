import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateStreakAfterCheckin } from "@/lib/streaks";
import { getRandomCelebration } from "@/lib/celebrations";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { intention_id, result, localDate } = await request.json();
  // Use client's local date to avoid UTC timezone mismatch
  const todayStr = localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)
    ? localDate
    : new Date().toISOString().split("T")[0];

  // Insert the event
  const { data, error } = await supabase
    .from("events")
    .insert({
      intention_id,
      user_id: user.id,
      date: todayStr,
      result,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Fetch or create user_stats
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

  // Update streak
  const streakUpdate = updateStreakAfterCheckin(
    {
      current_streak: stats?.current_streak ?? 0,
      longest_streak: stats?.longest_streak ?? 0,
      last_checkin_date: stats?.last_checkin_date ?? null,
      streak_freeze_available: stats?.streak_freeze_available ?? true,
      streak_freeze_used_date: stats?.streak_freeze_used_date ?? null,
    },
    todayStr
  );

  // Update counters
  const counterUpdate: Record<string, number> = {};
  if (result === "fired") counterUpdate.total_fired = (stats?.total_fired ?? 0) + 1;
  if (result === "missed") counterUpdate.total_missed = (stats?.total_missed ?? 0) + 1;
  if (result === "not_encountered")
    counterUpdate.total_not_encountered = (stats?.total_not_encountered ?? 0) + 1;

  // Remove justHitMilestone — it's not a DB column
  const { justHitMilestone, ...streakDbFields } = streakUpdate;

  await supabase
    .from("user_stats")
    .update({
      ...streakDbFields,
      ...counterUpdate,
    })
    .eq("user_id", user.id);

  // Generate celebration
  const celebration = getRandomCelebration(
    result,
    streakUpdate.current_streak,
    justHitMilestone
  );

  return NextResponse.json({
    event: data,
    streak: {
      current: streakUpdate.current_streak,
      longest: streakUpdate.longest_streak,
      justHitMilestone: streakUpdate.justHitMilestone,
    },
    celebration,
  });
}

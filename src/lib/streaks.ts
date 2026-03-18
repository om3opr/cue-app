type EventData = {
  date: string;
  result: "fired" | "missed" | "not_encountered";
};

type UserStats = {
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  streak_freeze_available: boolean;
  streak_freeze_used_date: string | null;
};

export type StreakState = {
  current: number;
  longest: number;
  freezeAvailable: boolean;
  freezeUsedToday: boolean;
  milestone: number | null;
  nextMilestone: number;
};

const MILESTONES = [3, 7, 14, 21, 30, 60, 90];

function getMondayOfWeek(dateStr: string): string {
  // Parse YYYY-MM-DD without timezone conversion
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay
  );
}

/**
 * Calculate streak state after a new check-in.
 * Called from the check-in API after inserting the event.
 */
export function updateStreakAfterCheckin(
  stats: UserStats,
  todayStr: string
): {
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string;
  streak_freeze_available: boolean;
  streak_freeze_used_date: string | null;
  justHitMilestone: number | null;
} {
  const { last_checkin_date, streak_freeze_available, streak_freeze_used_date } =
    stats;

  let newStreak = stats.current_streak;
  let freezeAvailable = streak_freeze_available;
  let freezeUsedDate = streak_freeze_used_date;

  if (!last_checkin_date) {
    // First ever check-in
    newStreak = 1;
  } else if (last_checkin_date === todayStr) {
    // Already checked in today, no change
  } else {
    const gap = daysBetween(last_checkin_date, todayStr);

    if (gap === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (gap === 2 && freezeAvailable) {
      // Missed exactly 1 day, use freeze
      newStreak += 1; // Continue streak (freeze covers the gap)
      freezeAvailable = false;
      freezeUsedDate = todayStr;
    } else {
      // Gap too large or no freeze available — reset
      newStreak = 1;
    }
  }

  // Reset freeze on Monday
  const currentMonday = getMondayOfWeek(todayStr);
  if (freezeUsedDate) {
    const freezeMonday = getMondayOfWeek(freezeUsedDate);
    if (currentMonday !== freezeMonday) {
      freezeAvailable = true;
      freezeUsedDate = null;
    }
  } else {
    freezeAvailable = true;
  }

  const newLongest = Math.max(stats.longest_streak, newStreak);

  // Check milestone
  const justHitMilestone = MILESTONES.includes(newStreak) ? newStreak : null;

  return {
    current_streak: newStreak,
    longest_streak: newLongest,
    last_checkin_date: todayStr,
    streak_freeze_available: freezeAvailable,
    streak_freeze_used_date: freezeUsedDate,
    justHitMilestone,
  };
}

/**
 * Get the current streak display state from stored stats.
 * Called from the intentions GET API.
 */
export function getStreakDisplay(
  stats: UserStats | null,
  todayStr: string
): StreakState {
  if (!stats || !stats.last_checkin_date) {
    return {
      current: 0,
      longest: 0,
      freezeAvailable: true,
      freezeUsedToday: false,
      milestone: null,
      nextMilestone: MILESTONES[0],
    };
  }

  let displayStreak = stats.current_streak;
  const gap = daysBetween(stats.last_checkin_date, todayStr);

  // If more than 1 day since last check-in and no freeze, streak is broken
  if (gap > 2) {
    displayStreak = 0;
  } else if (gap === 2 && !stats.streak_freeze_available) {
    displayStreak = 0;
  }
  // gap === 0 or gap === 1: streak is still valid
  // gap === 2 with freeze available: streak alive (freeze will be used on next check-in)

  const freezeUsedToday = stats.streak_freeze_used_date === todayStr;

  const nextMilestone =
    MILESTONES.find((m) => m > displayStreak) ?? MILESTONES[MILESTONES.length - 1];

  return {
    current: displayStreak,
    longest: stats.longest_streak,
    freezeAvailable: stats.streak_freeze_available,
    freezeUsedToday,
    milestone: null,
    nextMilestone,
  };
}

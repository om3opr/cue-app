"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileMenu } from "../profile-menu";

type Intention = {
  id: string;
  when_trigger: string;
  then_action: string;
  why_rationale: string;
  status: string;
  created_at: string;
};

type EventData = {
  id: string;
  date: string;
  result: "fired" | "missed" | "not_encountered";
};

type StreakData = {
  current: number;
  longest: number;
  freezeAvailable: boolean;
  freezeUsedToday: boolean;
  milestone: number | null;
  nextMilestone: number;
};

type ProgressData = {
  daysCompleted: number;
  daysRequired: number;
  fireRateCurrent: number;
  fireRateRequired: number;
  trend: "up" | "down" | "stable";
};

type CelebrationData = {
  message: string;
  showConfetti: boolean;
  streak: { current: number; longest: number; justHitMilestone: number | null };
};

// Generate confetti dots with randomized properties
function ConfettiEffect() {
  const dots = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.6}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        rotation: `${180 + Math.random() * 540}deg`,
        color:
          i % 4 === 0
            ? "var(--foreground)"
            : i % 4 === 1
              ? "var(--muted)"
              : i % 4 === 2
                ? "var(--foreground)"
                : "var(--border)",
      })),
    []
  );

  return (
    <>
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="confetti-dot"
          style={
            {
              "--confetti-x": dot.x,
              "--confetti-delay": dot.delay,
              "--confetti-duration": dot.duration,
              "--confetti-rotation": dot.rotation,
              "--confetti-color": dot.color,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export function CardScreen({
  intention,
  events,
  fireRate,
  overallFireRate,
  totalDays,
  checkedInToday,
  todayResult,
  canGraduate,
  streak,
  progress,
  insight,
  shouldOfferReflection,
  avatar,
  onCheckIn,
}: {
  intention: Intention;
  events: EventData[];
  fireRate: number | null;
  overallFireRate: number;
  totalCheckins: number;
  totalDays: number;
  checkedInToday: boolean;
  todayResult: string | null;
  canGraduate: boolean;
  streak: StreakData;
  progress: ProgressData;
  insight: string | null;
  shouldOfferReflection: boolean;
  avatar: string | null;
  onCheckIn: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);

  // Morning nudge
  const [nudge, setNudge] = useState<string | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);

  // Reflection
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionInput, setReflectionInput] = useState("");
  const [reflectionResponse, setReflectionResponse] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  // Edit intention
  const [showEdit, setShowEdit] = useState(false);
  const [editWhen, setEditWhen] = useState(intention.when_trigger);
  const [editThen, setEditThen] = useState(intention.then_action);
  const [editWhy, setEditWhy] = useState(intention.why_rationale);
  const [editSaving, setEditSaving] = useState(false);

  const handleSaveEdit = async () => {
    setEditSaving(true);
    await fetch("/api/intentions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        when_trigger: editWhen,
        then_action: editThen,
        why_rationale: editWhy,
      }),
    });
    setShowEdit(false);
    setEditSaving(false);
    onCheckIn(); // Refresh data
  };

  const handleStartOver = async () => {
    if (!confirm("Archive this intention and start fresh?")) return;
    await fetch("/api/intentions/graduate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention_id: intention.id }),
    });
    onCheckIn();
  };

  // Fetch morning nudge when not checked in
  useEffect(() => {
    if (checkedInToday || nudge !== null || nudgeLoading) return;

    // Check sessionStorage cache
    const cached = sessionStorage.getItem(`cue_nudge_${intention.id}`);
    if (cached) {
      setNudge(cached);
      return;
    }

    setNudgeLoading(true);
    const recentResults = events
      .slice(-3)
      .map((e) => e.result);

    fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intention,
        recentResults,
        currentStreak: streak.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.nudge) {
          setNudge(data.nudge);
          sessionStorage.setItem(`cue_nudge_${intention.id}`, data.nudge);
        }
      })
      .finally(() => setNudgeLoading(false));
  }, [checkedInToday, intention, events, streak.current, nudge, nudgeLoading]);

  const handleReflect = async () => {
    if (!reflectionInput.trim()) return;
    setReflectionLoading(true);
    const res = await fetch("/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intention,
        recentEvents: events.slice(-7),
        userMessage: reflectionInput,
      }),
    });
    const data = await res.json();
    setReflectionResponse(data.reflection);
    setReflectionLoading(false);
  };

  const handleCheckIn = async (
    result: "fired" | "missed" | "not_encountered"
  ) => {
    setSubmitting(result);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention_id: intention.id, result }),
    });
    const data = await res.json();

    setCelebration({
      message: data.celebration?.message ?? (result === "fired" ? "Fired." : result === "missed" ? "Missed." : "Noted."),
      showConfetti: data.celebration?.showConfetti ?? false,
      streak: data.streak ?? { current: streak.current, longest: streak.longest, justHitMilestone: null },
    });

    // Show milestone overlay if applicable
    if (data.streak?.justHitMilestone) {
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 2500);
    }

    setTimeout(() => onCheckIn(), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/share/${intention.id}`;
    if (navigator.share) {
      await navigator.share({
        title: "Cue Card",
        text: `When ${intention.when_trigger}, then ${intention.then_action}. ${overallFireRate}% fire rate.`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const [graduating, setGraduating] = useState(false);

  const handleStartNew = async () => {
    setGraduating(true);
    await fetch("/api/intentions/graduate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention_id: intention.id }),
    });
    onCheckIn();
  };

  // Scroll to top when graduated view mounts
  useEffect(() => {
    if (canGraduate) {
      window.scrollTo(0, 0);
    }
  }, [canGraduate]);

  // Graduated view
  if (canGraduate) {
    return (
      <div className="min-h-svh flex flex-col">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold tracking-tighter text-foreground">
              Cue
            </span>
            <ProfileMenu avatar={avatar} onStartOver={handleStartNew} />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm space-y-8"
          >
            {/* Celebration header */}
            <div className="text-center space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium">
                Installed
              </p>
              <p className="text-5xl font-bold tracking-tighter text-foreground tabular-nums">
                {overallFireRate}%
              </p>
              <p className="text-xs text-muted">
                fire rate over {totalDays} days &middot; {streak.current} day streak
              </p>
            </div>

            {/* The Cue Card */}
            <div className="rounded-2xl border border-foreground/15 bg-surface p-6 space-y-5 shadow-lg">
              <div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                  When
                </span>
                <p className="text-base mt-1.5 leading-snug text-foreground font-medium">
                  {intention.when_trigger}
                </p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                  Then
                </span>
                <p className="text-base mt-1.5 leading-snug text-foreground font-medium">
                  {intention.then_action}
                </p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                  Why
                </span>
                <p className="text-sm mt-1.5 leading-relaxed text-muted">
                  {intention.why_rationale}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="relative w-full rounded-xl bg-foreground text-background px-5 py-4 text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer overflow-hidden"
              >
                <span className="relative z-10">Share Cue Card</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
              </motion.button>
              <button
                onClick={handleStartNew}
                disabled={graduating}
                className="block w-full text-center text-sm text-muted hover:text-foreground transition-colors py-2 cursor-pointer disabled:opacity-40"
              >
                {graduating ? "..." : "Start a new intention"}
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Active tracking view
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(intention.created_at).getTime()) / 86400000
  );

  const progressPercent = Math.min(
    100,
    (progress.daysCompleted / progress.daysRequired) * 100
  );
  const fireRatePercent = Math.min(
    100,
    (progress.fireRateCurrent / progress.fireRateRequired) * 100
  );

  // Progress message
  let progressMessage = "";
  if (progress.daysCompleted < progress.daysRequired) {
    const remaining = progress.daysRequired - progress.daysCompleted;
    progressMessage = `${remaining} more day${remaining !== 1 ? "s" : ""} to qualify`;
  } else if (progress.fireRateCurrent < progress.fireRateRequired) {
    const gap = progress.fireRateRequired - progress.fireRateCurrent;
    progressMessage = `${gap}% more fire rate needed`;
  } else {
    progressMessage = "Ready to graduate";
  }

  const trendArrow =
    progress.trend === "up" ? " ↑" : progress.trend === "down" ? " ↓" : "";

  return (
    <div className="min-h-svh flex flex-col">
      {/* Milestone overlay */}
      <AnimatePresence>
        {showMilestone && celebration?.streak.justHitMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center space-y-3 px-8"
            >
              <p className="text-6xl font-bold tracking-tighter text-foreground tabular-nums">
                {celebration.streak.justHitMilestone}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium">
                day streak
              </p>
              <p className="text-sm text-muted/80 mt-4 max-w-xs">
                {celebration.message}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      {celebration?.showConfetti && <ConfettiEffect />}

      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <span className="text-sm font-semibold tracking-tighter text-foreground">
            Cue
          </span>
          <ProfileMenu
            avatar={avatar}
            onEditIntention={() => setShowEdit(true)}
            onStartOver={handleStartOver}
          />
        </div>
      </header>

      {/* Edit bottom sheet */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-6 space-y-4 max-w-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-foreground">Edit intention</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    When
                  </label>
                  <input
                    value={editWhen}
                    onChange={(e) => setEditWhen(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    Then
                  </label>
                  <input
                    value={editThen}
                    onChange={(e) => setEditThen(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    Why
                  </label>
                  <input
                    value={editWhy}
                    onChange={(e) => setEditWhy(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEdit(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted cursor-pointer hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 rounded-xl bg-foreground text-background px-4 py-3 text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {editSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Stats header — streak + fire rate */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <motion.p
                  key={streak.current}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl font-bold tracking-tighter text-foreground tabular-nums"
                >
                  {streak.current}
                </motion.p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                  day streak
                </span>
              </div>
              <p className="text-[10px] text-muted/60 mt-0.5">
                best: {streak.longest}
              </p>
            </div>
            {fireRate !== null && (
              <div className="text-right">
                <motion.p
                  key={fireRate}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl font-bold tracking-tighter text-foreground tabular-nums"
                >
                  {fireRate}
                  <span className="text-lg text-muted">%</span>
                </motion.p>
                <p className="text-[10px] text-muted/60">
                  fire rate / 7d{trendArrow}
                </p>
              </div>
            )}
          </div>

          {/* Intention card */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-sm">
            <div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                When
              </span>
              <p className="text-base mt-1.5 leading-snug text-foreground font-medium">
                {intention.when_trigger}
              </p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                Then
              </span>
              <p className="text-base mt-1.5 leading-snug text-foreground font-medium">
                {intention.then_action}
              </p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                Why
              </span>
              <p className="text-sm mt-1.5 leading-relaxed text-muted">
                {intention.why_rationale}
              </p>
            </div>
          </div>

          {/* 14-day visualization */}
          <div>
            <div className="flex items-center justify-between px-1">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                const dateStr = date.toISOString().split("T")[0];
                const event = events.find((e) => e.date === dateStr);
                const isToday = i === 13;

                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: event?.result === "fired" ? 1 : 0.65,
                        opacity: event ? 1 : 0.12,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`h-2.5 w-2.5 rounded-full ${
                        !event
                          ? "bg-foreground"
                          : event.result === "fired"
                            ? "bg-foreground"
                            : event.result === "missed"
                              ? "bg-foreground/30"
                              : "bg-foreground/10"
                      }`}
                    />
                    {(i === 0 || i === 7 || i === 13) && (
                      <span
                        className={`text-[8px] tabular-nums ${
                          isToday ? "text-foreground font-medium" : "text-muted/30"
                        }`}
                      >
                        {isToday
                          ? "today"
                          : date.toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress toward graduation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                Progress
              </p>
              <p className="text-[10px] text-muted/60">
                {progressMessage}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(progressPercent, fireRatePercent)}%`,
                }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full rounded-full bg-foreground/70"
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted/40">
              <span>{progress.daysCompleted}/{progress.daysRequired} days</span>
              <span>{progress.fireRateCurrent}%/{progress.fireRateRequired}% fire rate</span>
            </div>
          </div>

          {/* Weekly insight */}
          {insight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border/50 bg-surface/50 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted/60 font-medium mb-1">
                Weekly insight
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {insight}
              </p>
            </motion.div>
          )}

          {/* Check-in area */}
          <AnimatePresence mode="wait">
            {!checkedInToday && !celebration ? (
              <motion.div
                key="checkin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-2"
              >
                {/* Morning nudge */}
                {nudge && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted/70 text-center italic leading-relaxed px-4"
                  >
                    {nudge}
                  </motion.p>
                )}

                <p className="text-sm text-foreground text-center font-medium">
                  Did it fire today?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCheckIn("fired")}
                    disabled={submitting !== null}
                    className="rounded-xl bg-foreground text-background px-4 py-4 text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 hover:opacity-90"
                  >
                    {submitting === "fired" ? "..." : "Yes"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCheckIn("missed")}
                    disabled={submitting !== null}
                    className="rounded-xl border border-border text-foreground/70 px-4 py-4 text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 hover:bg-foreground/5"
                  >
                    {submitting === "missed" ? "..." : "No"}
                  </motion.button>
                </div>
                <button
                  onClick={() => handleCheckIn("not_encountered")}
                  disabled={submitting !== null}
                  className="w-full text-[11px] text-muted/40 hover:text-muted transition-colors py-1 cursor-pointer disabled:opacity-40"
                >
                  {submitting === "not_encountered"
                    ? "..."
                    : "Trigger didn't come up today"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-3 pt-2"
              >
                {/* Updated streak with bounce */}
                {celebration && (
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-2xl font-bold tracking-tighter text-foreground tabular-nums"
                  >
                    {celebration.streak.current} day streak
                  </motion.p>
                )}

                {/* Celebration message */}
                <p className="text-sm text-foreground/70 leading-relaxed max-w-xs mx-auto">
                  {celebration?.message ??
                    ((todayResult ?? submitting) === "fired"
                      ? "Fired."
                      : (todayResult ?? submitting) === "missed"
                        ? "Missed."
                        : "Noted.")}
                </p>

                {/* Streak freeze notification */}
                {streak.freezeUsedToday && (
                  <p className="text-[11px] text-muted/60">
                    Streak freeze activated — you&apos;re still going
                  </p>
                )}

                {/* Reflection prompt */}
                {shouldOfferReflection && !showReflection && !reflectionResponse && (
                  <button
                    onClick={() => setShowReflection(true)}
                    className="text-[11px] text-muted/50 hover:text-muted transition-colors cursor-pointer underline underline-offset-2"
                  >
                    Want to reflect on this?
                  </button>
                )}

                {showReflection && !reflectionResponse && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-2"
                  >
                    <input
                      type="text"
                      value={reflectionInput}
                      onChange={(e) => setReflectionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReflect()}
                      placeholder="What's getting in the way?"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      autoFocus
                    />
                    <button
                      onClick={handleReflect}
                      disabled={reflectionLoading || !reflectionInput.trim()}
                      className="text-[11px] text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {reflectionLoading ? "Thinking..." : "Reflect"}
                    </button>
                  </motion.div>
                )}

                {reflectionResponse && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted/70 leading-relaxed max-w-xs mx-auto pt-1"
                  >
                    {reflectionResponse}
                  </motion.p>
                )}

                <p className="text-[11px] text-muted/40 pt-1">
                  See you tomorrow.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

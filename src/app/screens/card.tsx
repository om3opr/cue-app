"use client";

import { useState, useEffect } from "react";
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

export function CardScreen({
  intention,
  events,
  fireRate,
  overallFireRate,
  totalDays,
  checkedInToday,
  todayResult,
  canGraduate,
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
  avatar: string | null;
  onCheckIn: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const handleCheckIn = async (
    result: "fired" | "missed" | "not_encountered"
  ) => {
    setSubmitting(result);
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intention_id: intention.id, result }),
    });
    setJustCheckedIn(true);
    setTimeout(() => onCheckIn(), 800);
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

  // Graduated view — totally different screen
  if (canGraduate) {
    return (
      <div className="min-h-svh flex flex-col">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold tracking-tighter text-foreground">
              Cue
            </span>
            <ProfileMenu avatar={avatar} />
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
                fire rate over {totalDays} days
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
  const daysTracked = events.length;
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(intention.created_at).getTime()) / 86400000
  );

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <span className="text-sm font-semibold tracking-tighter text-foreground">
            Cue
          </span>
          <ProfileMenu avatar={avatar} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Fire rate */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                Day {daysSinceCreated + 1}
              </p>
              <p className="text-[10px] text-muted/60 mt-0.5">
                {daysTracked} check-in{daysTracked !== 1 ? "s" : ""} recorded
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
                <p className="text-[10px] text-muted/60">fire rate / 7d</p>
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

          {/* 7-day visualization */}
          <div className="flex items-center justify-between px-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = date.toISOString().split("T")[0];
              const event = events.find((e) => e.date === dateStr);
              const isToday = i === 6;

              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: event?.result === "fired" ? 1 : 0.75,
                      opacity: event ? 1 : 0.15,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`h-3 w-3 rounded-full ${
                      !event
                        ? "bg-foreground"
                        : event.result === "fired"
                          ? "bg-foreground"
                          : event.result === "missed"
                            ? "bg-foreground/30"
                            : "bg-foreground/10"
                    }`}
                  />
                  <span
                    className={`text-[9px] tabular-nums ${
                      isToday ? "text-foreground font-medium" : "text-muted/40"
                    }`}
                  >
                    {date.toLocaleDateString("en", { weekday: "narrow" })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Check-in area */}
          <AnimatePresence mode="wait">
            {!checkedInToday && !justCheckedIn ? (
              <motion.div
                key="checkin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-2"
              >
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
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1 pt-2"
              >
                <p className="text-sm text-foreground/60">
                  {(todayResult ?? submitting) === "fired"
                    ? "Fired."
                    : (todayResult ?? submitting) === "missed"
                      ? "Missed."
                      : "Noted."}
                </p>
                <p className="text-[11px] text-muted/40">See you tomorrow.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

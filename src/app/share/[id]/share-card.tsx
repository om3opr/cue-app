"use client";

import { motion } from "framer-motion";

type Intention = {
  id: string;
  when_trigger: string;
  then_action: string;
  why_rationale: string;
};

export function ShareCard({
  intention,
  fireRate,
  totalDays,
}: {
  intention: Intention;
  fireRate: number;
  totalDays: number;
}) {
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const shareText = `When ${intention.when_trigger}, then ${intention.then_action}. ${fireRate}% fire rate over ${totalDays} days.`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Cue Card",
        text: shareText,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleAdopt = () => {
    window.location.href = "/?adopt=" + intention.id;
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 py-12">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <a href="/" className="text-sm font-semibold tracking-tighter text-foreground">
            Cue
          </a>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Header */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
              Cue Card
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tighter text-foreground tabular-nums">
              {fireRate}
              <span className="text-base text-muted">%</span>
            </p>
            <p className="text-[10px] text-muted/60">
              fire rate / {totalDays} days
            </p>
          </div>
        </div>

        {/* The card */}
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

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleAdopt}
            className="w-full rounded-xl bg-foreground text-background px-5 py-3.5 text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            Adopt this intention
          </button>
          <button
            onClick={handleShare}
            className="w-full rounded-xl border border-border text-foreground/70 px-5 py-3.5 text-sm font-medium transition-all duration-200 hover:bg-foreground/5 active:scale-[0.98] cursor-pointer"
          >
            Copy link
          </button>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-muted/40 text-center">
          Cue — one behavior trigger, one daily tap.
        </p>
      </motion.div>
    </div>
  );
}

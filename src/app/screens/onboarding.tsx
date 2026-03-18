"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const screens = [
  {
    title: "One habit at a time",
    body: "Cue uses implementation intentions — the most evidence-backed behavior change technique in psychology. You'll craft a precise When-Then-Why formula that rewires how your brain responds to everyday triggers.",
  },
  {
    title: "When → Then → Why",
    body: "When I sit down at my desk after morning coffee → Then I open my journal and write one sentence → Why: Anchoring to an existing routine makes the new behavior automatic, not effortful.",
    isExample: true,
  },
  {
    title: "7 days. 80%. Graduated.",
    body: "Check in daily. Hit 80% fire rate over 7+ days and your intention graduates to \"installed\" — meaning the behavior has shifted from deliberate to automatic. Then start a new one.",
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step === screens.length - 1) {
      localStorage.setItem("cue_onboarded", "true");
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const screen = screens[step];

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">
              {screen.title}
            </h1>
            {screen.isExample ? (
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    When
                  </span>
                  <p className="text-sm mt-1 leading-snug text-foreground">
                    I sit down at my desk after morning coffee
                  </p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    Then
                  </span>
                  <p className="text-sm mt-1 leading-snug text-foreground">
                    Open my journal and write one sentence
                  </p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                    Why
                  </span>
                  <p className="text-xs mt-1 leading-relaxed text-muted">
                    Anchoring to an existing routine makes the new behavior automatic, not effortful.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted leading-relaxed">
                {screen.body}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="space-y-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="w-full rounded-xl bg-foreground text-background px-5 py-4 text-sm font-medium transition-all duration-200 cursor-pointer hover:opacity-90"
          >
            {step === screens.length - 1 ? "Get started" : "Next"}
          </motion.button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2">
            {screens.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CraftScreen } from "./screens/craft";
import { CardScreen } from "./screens/card";
import { OnboardingScreen } from "./screens/onboarding";

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

type IntentionData = {
  intention: Intention | null;
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
};

export function App({ user }: { user: { id: string; name: string; avatar: string | null } }) {
  const [data, setData] = useState<IntentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cue_onboarded") === "true";
  });

  const fetchData = useCallback(async () => {
    const localDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz
    const res = await fetch("/api/intentions", {
      headers: { "x-local-date": localDate },
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium tracking-tighter text-foreground"
        >
          Cue
        </motion.div>
      </div>
    );
  }

  // Show onboarding for new users without an intention
  if (!onboarded && !data?.intention) {
    return (
      <div className="min-h-svh bg-background">
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <AnimatePresence mode="wait">
        {!data?.intention ? (
          <motion.div
            key="craft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CraftScreen userName={user.name} avatar={user.avatar} onComplete={fetchData} />
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardScreen
              intention={data.intention}
              events={data.events}
              fireRate={data.fireRate}
              overallFireRate={data.overallFireRate}
              totalCheckins={data.totalCheckins}
              totalDays={data.totalDays}
              checkedInToday={data.checkedInToday}
              todayResult={data.todayResult}
              canGraduate={data.canGraduate}
              streak={data.streak}
              progress={data.progress}
              insight={data.insight}
              shouldOfferReflection={data.shouldOfferReflection}
              avatar={user.avatar}
              onCheckIn={fetchData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

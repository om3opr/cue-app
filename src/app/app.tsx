"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CraftScreen } from "./screens/craft";
import { CardScreen } from "./screens/card";

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
};

export function App({ user }: { user: { id: string; name: string } }) {
  const [data, setData] = useState<IntentionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/intentions");
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
            <CraftScreen userName={user.name} onComplete={fetchData} />
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
              onCheckIn={fetchData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

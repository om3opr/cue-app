"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

function CheckInContent() {
  const searchParams = useSearchParams();
  const result = searchParams.get("r");
  const token = searchParams.get("t");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!result || !token) {
      setStatus("error");
      return;
    }

    fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result, token, localDate: new Date().toLocaleDateString("en-CA") }),
    })
      .then((res) => {
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [result, token]);

  const resultText =
    result === "fired"
      ? "Fired."
      : result === "missed"
        ? "Missed."
        : "Trigger didn't occur.";

  return (
    <div className="min-h-svh flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-3"
      >
        {status === "loading" && (
          <p className="text-sm text-muted">Recording...</p>
        )}
        {status === "success" && (
          <>
            <p className="text-5xl font-bold tracking-tighter text-foreground">
              Cue
            </p>
            <p className="text-base text-foreground/70">{resultText}</p>
            <p className="text-sm text-muted/50 pt-2">See you tomorrow.</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-5xl font-bold tracking-tighter text-foreground">
              Cue
            </p>
            <p className="text-sm text-muted">
              Link expired or already used today.
            </p>
            <a
              href="/"
              className="inline-block mt-4 text-sm text-foreground underline underline-offset-4"
            >
              Open Cue
            </a>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function CheckPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-background">
          <p className="text-sm text-muted">Loading...</p>
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}

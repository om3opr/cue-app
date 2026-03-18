"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ProfileMenu({
  avatar,
  onEditIntention,
  onStartOver,
}: {
  avatar: string | null;
  onEditIntention?: () => void;
  onStartOver?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-7 w-7 rounded-full overflow-hidden border border-border/50 cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full bg-foreground/10 flex items-center justify-center">
            <span className="text-[10px] text-muted font-medium">?</span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-40 rounded-xl border border-border bg-surface shadow-lg overflow-hidden z-50">
          {onEditIntention && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onEditIntention();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-foreground/70 hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                Edit intention
              </button>
              <div className="h-px bg-border" />
            </>
          )}
          {onStartOver && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onStartOver();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-foreground/70 hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                Start over
              </button>
              <div className="h-px bg-border" />
            </>
          )}
          <a
            href="/about"
            className="block px-4 py-2.5 text-xs text-foreground/70 hover:bg-foreground/5 transition-colors"
          >
            About Cue
          </a>
          <div className="h-px bg-border" />
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-xs text-foreground/70 hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

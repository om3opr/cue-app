"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Intention = {
  when_trigger: string;
  then_action: string;
  why_rationale: string;
};

export function CraftScreen({
  userName,
  onComplete,
}: {
  userName: string;
  onComplete: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [intention, setIntention] = useState<Intention | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const [multiline, setMultiline] = useState(false);

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const oneLineH = 24; // single line height
    const maxH = 168;
    setMultiline(el.scrollHeight > oneLineH + 4);
    if (el.scrollHeight > maxH) {
      el.style.height = maxH + "px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = el.scrollHeight + "px";
      el.style.overflowY = "hidden";
    }
  };

  // Auto-scroll to bottom whenever messages, intention, or sending state changes
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, sending, intention]);

  const send = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMultiline(false);
    setSending(true);

    const res = await fetch("/api/craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.text }]);

    if (data.intention) {
      setIntention(data.intention);
    }

    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const tryAgain = () => {
    setIntention(null);
    // Show the input again so user can say what to change,
    // and have the AI ask what they want different
    const assistantMsg: Message = {
      role: "assistant",
      content:
        "What would you like to change — the trigger, the action, or both? Or tell me what felt off and I'll recraft it.",
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveIntention = async () => {
    if (!intention || saving) return;
    setSaving(true);

    await fetch("/api/intentions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intention),
    });

    onComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-svh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <span className="text-sm font-semibold tracking-tighter text-foreground">
            Cue
          </span>
          <span className="text-xs text-muted">New intention</span>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8 pb-40">
          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-3 pt-12"
            >
              <h2 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
                {firstName ? `${firstName}, what's` : "What's"} one thing you
                keep meaning to do?
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                I&apos;ll craft a precise trigger in 2-3 exchanges.
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`mt-5 ${msg.role === "user" ? "flex justify-end" : ""}`}
              >
                {msg.role === "user" ? (
                  <div className="inline-block max-w-[80%] bg-foreground text-background rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed">
                    {msg.content}
                  </div>
                ) : msg.content.includes("INTENTION:") ? (
                  <IntentionCard text={msg.content} />
                ) : (
                  <div className="max-w-[85%] text-[15px] leading-relaxed text-foreground/80">
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-muted"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Action buttons when intention is ready */}
          {intention && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 space-y-3"
            >
              <button
                onClick={saveIntention}
                disabled={saving}
                className="w-full rounded-xl bg-foreground text-background px-5 py-3.5 text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "Start tracking"}
              </button>
              <button
                onClick={tryAgain}
                disabled={sending}
                className="w-full text-sm text-muted hover:text-foreground transition-colors duration-200 py-2 cursor-pointer"
              >
                Try a different one
              </button>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — clean single-line */}
      {!intention && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-[env(safe-area-inset-bottom,12px)]">
          <div className="max-w-lg mx-auto px-5 pb-4">
            <div className={`flex items-center gap-3 border border-border bg-surface px-5 py-2.5 transition-all duration-200 focus-within:border-foreground/20 ${multiline ? "rounded-2xl" : "rounded-full"}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  messages.length === 0
                    ? "I want to exercise more..."
                    : "Reply..."
                }
                rows={1}
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted/40 outline-none resize-none overflow-hidden leading-[1.5]"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-foreground text-background disabled:opacity-15 transition-all duration-150 hover:opacity-80 active:scale-90 cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IntentionCard({ text }: { text: string }) {
  const before = text.split("INTENTION:")[0].trim();
  const whenMatch = text.match(/WHEN:\s*(.+)/);
  const thenMatch = text.match(/THEN:\s*(.+)/);
  const whyMatch = text.match(/WHY:\s*(.+)/);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      {before && (
        <p className="text-[15px] leading-relaxed text-foreground/80">
          {before}
        </p>
      )}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            When
          </span>
          <p className="text-[15px] mt-1 leading-snug text-foreground font-medium">
            {whenMatch?.[1]}
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            Then
          </span>
          <p className="text-[15px] mt-1 leading-snug text-foreground font-medium">
            {thenMatch?.[1]}
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            Why
          </span>
          <p className="text-sm mt-1 leading-relaxed text-muted">
            {whyMatch?.[1]}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

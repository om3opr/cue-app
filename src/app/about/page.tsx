import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Cue",
  description:
    "How implementation intentions reprogram automatic behavior. Based on 94+ studies and brain imaging research.",
};

export default function AboutPage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <a
            href="/"
            className="text-sm font-semibold tracking-tighter text-foreground"
          >
            Cue
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-12 space-y-12">
        {/* Hero */}
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-medium">
            The Science
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
            The When-Then-Why Formula
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Implementation intentions shift behavior from effortful deliberation
            to automatic execution. One of the most replicated findings in
            behavior change research.
          </p>
          <div className="flex gap-6 pt-2">
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                94+
              </p>
              <p className="text-[10px] text-muted/60">studies</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">
                d = 0.65
              </p>
              <p className="text-[10px] text-muted/60">effect size</p>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                25yr
              </p>
              <p className="text-[10px] text-muted/60">evidence base</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Neuroscience */}
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            The Neuroscience
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Why a sentence can change your behavior
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            When you decide to change something, you rely on deliberation — the
            slow, effortful process in the lateral prefrontal cortex. You hold
            the goal in working memory, monitor the situation, notice the right
            moment, then execute. Every step costs cognitive resources.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            That works when you&apos;re rested. It falls apart when you&apos;re
            tired, stressed, or distracted — exactly when you most need it.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            When you pair a specific situation with a specific response —{" "}
            <span className="text-foreground font-medium">
              &quot;When X happens, I will do Y&quot;
            </span>{" "}
            — brain imaging shows control transfers from the lateral prefrontal
            cortex to medial-frontal and subcortical pathways. The same circuits
            that handle automatic, habitual behavior.
          </p>
          <div className="border-l-2 border-foreground/15 pl-4 py-1">
            <p className="text-sm text-foreground/70 italic leading-relaxed">
              &quot;Implementation intentions delegate the control of
              goal-directed responses to anticipated situational cues.&quot;
            </p>
            <p className="text-[10px] text-muted/50 mt-2">
              Gollwitzer, 1999 — American Psychologist
            </p>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* The Three Components */}
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
              The Formula
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Three components, precisely defined
            </h2>
          </div>

          {/* WHEN */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
              When — The Trigger
            </span>
            <p className="text-sm text-muted leading-relaxed">
              A concrete, external situation you encounter in your day. Not a
              feeling. Not a vague time frame. A specific moment you can point
              to.
            </p>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-foreground/70">
                <span className="text-foreground font-medium">Good:</span>{" "}
                &quot;When I sit down at my desk after my morning coffee&quot;
              </p>
              <p className="text-xs text-foreground/70">
                <span className="text-foreground font-medium">Good:</span>{" "}
                &quot;When I put my phone on the nightstand&quot;
              </p>
              <p className="text-xs text-muted/50">
                <span className="text-muted font-medium">Weak:</span> &quot;When
                I feel motivated&quot; — can&apos;t control when this happens
              </p>
              <p className="text-xs text-muted/50">
                <span className="text-muted font-medium">Weak:</span> &quot;In
                the morning&quot; — too vague, no clear boundary
              </p>
            </div>
          </div>

          {/* THEN */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
              Then — The Response
            </span>
            <p className="text-sm text-muted leading-relaxed">
              The very first physical action — not the outcome you hope for.
              Hands, feet, mouth. If you can&apos;t mime it, it&apos;s too
              abstract. Under thirty seconds.
            </p>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-muted/50">
                <span className="text-muted font-medium">Goal:</span>{" "}
                &quot;Exercise more&quot;
              </p>
              <p className="text-xs text-foreground/70">
                <span className="text-foreground font-medium">Action:</span>{" "}
                &quot;Put on my running shoes and walk to the front door&quot;
              </p>
            </div>
          </div>

          {/* WHY */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
              Why — The Rationale
            </span>
            <p className="text-sm text-muted leading-relaxed">
              Not a motivational affirmation. A one-line reminder of why this
              pairing matters — what pattern you&apos;re routing around, what
              failure mode it addresses.
            </p>
            <p className="text-xs text-foreground/70 pt-1">
              <span className="text-foreground font-medium">Example:</span>{" "}
              &quot;Because the barrier was never knowledge — it was the gap
              between intending and initiating.&quot;
            </p>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* How Cue Works */}
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            How Cue Works
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            One behavior, one daily tap
          </h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-xs text-muted/30 font-medium tabular-nums mt-0.5">
                01
              </span>
              <p className="text-sm text-muted leading-relaxed">
                <span className="text-foreground font-medium">Craft</span> — AI
                helps you design a precise When-Then-Why intention in 2-3
                exchanges. Concrete triggers, first physical actions, honest
                rationale.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-xs text-muted/30 font-medium tabular-nums mt-0.5">
                02
              </span>
              <p className="text-sm text-muted leading-relaxed">
                <span className="text-foreground font-medium">Track</span> — One
                tap each day: did the trigger fire? Your fire rate shows how
                consistently the behavior is activating.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-xs text-muted/30 font-medium tabular-nums mt-0.5">
                03
              </span>
              <p className="text-sm text-muted leading-relaxed">
                <span className="text-foreground font-medium">Install</span> —
                At 80%+ fire rate over 7+ days, the intention graduates to
                &quot;installed.&quot; The behavior has shifted from deliberation
                to automation. Share your Cue Card, start a new one.
              </p>
            </div>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Key Sources */}
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
            Key Sources
          </p>
          <div className="space-y-2">
            <p className="text-xs text-muted/60 leading-relaxed">
              Gollwitzer, P.M. (1999). Implementation intentions: Strong effects
              of simple plans. <em>American Psychologist</em>, 54(7), 493-503
            </p>
            <p className="text-xs text-muted/60 leading-relaxed">
              Gollwitzer, P.M. & Sheeran, P. (2006). Implementation intentions
              and goal achievement: A meta-analysis.{" "}
              <em>Advances in Experimental Social Psychology</em>, 38, 69-119
            </p>
            <p className="text-xs text-muted/60 leading-relaxed">
              Gilbert, S.J., et al. (2009). Separable brain systems supporting
              cued versus self-initiated realization of delayed intentions.{" "}
              <em>J. Exp. Psych: Learning, Memory, and Cognition</em>, 35(4)
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 pb-8">
          <p className="text-[11px] text-muted/30 text-center">
            Cue — strategic automaticity for behavior change.
          </p>
        </div>
      </main>
    </div>
  );
}

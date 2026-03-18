const firedMessages = [
  "Your brain just wired that a little deeper.",
  "Trigger hit, action taken. That's the formula.",
  "Another rep for the neural pathway.",
  "That's how automatic behaviors are built.",
  "One more data point for your new default.",
  "The circuit strengthens.",
  "From intention to action. Clean execution.",
  "Your future self just got a little stronger.",
  "That's a vote for the person you're becoming.",
  "Consistency compounds. You're compounding.",
  "The trigger fired. You responded. That's the whole game.",
  "Another day the intention held.",
  "Automatic is built one rep at a time.",
];

const missedMessages = [
  "Tomorrow is a new trigger. One miss doesn't break the chain.",
  "The fact that you checked in means the loop is still active.",
  "Never miss twice. Tomorrow matters most.",
  "Misses are data, not failure. What got in the way?",
  "Even the best-designed intentions miss sometimes. Show up tomorrow.",
  "A miss with awareness beats an unconscious skip.",
  "The intention is still installed. Tomorrow it fires.",
  "One miss in a streak of hits is just noise.",
];

const notEncounteredMessages = [
  "Not every day has the trigger. That's normal.",
  "No trigger, no miss. The intention is still loaded.",
  "Some days the situation just doesn't arise.",
  "Your intention is waiting for the right moment.",
  "Trigger didn't show up — your streak is safe.",
];

const milestoneMessages: Record<number, string> = {
  3: "3 days in. The hardest part is behind you.",
  7: "One full week. You're building real evidence.",
  14: "Two weeks of showing up. This is becoming yours.",
  21: "21 days. The old myth said this was enough. You know better — keep going.",
  30: "30 days. A full month of intentional action.",
  60: "60 days. This behavior is deep in the circuitry now.",
  90: "90 days. This isn't a habit anymore. It's who you are.",
};

export type CelebrationData = {
  message: string;
  showConfetti: boolean;
};

export function getRandomCelebration(
  type: "fired" | "missed" | "not_encountered",
  currentStreak: number,
  justHitMilestone: number | null
): CelebrationData {
  // Milestone celebrations take priority
  if (justHitMilestone && milestoneMessages[justHitMilestone]) {
    return {
      message: milestoneMessages[justHitMilestone],
      showConfetti: true,
    };
  }

  const pool =
    type === "fired"
      ? firedMessages
      : type === "missed"
        ? missedMessages
        : notEncounteredMessages;

  const message = pool[Math.floor(Math.random() * pool.length)];

  return {
    message,
    showConfetti: type === "fired" && currentStreak >= 3,
  };
}

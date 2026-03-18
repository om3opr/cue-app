import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createCheckinToken } from "@/lib/checkin-token";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY ?? ""
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const subjectTemplates = [
  (streak: number, trigger: string) =>
    streak > 0 ? `Day ${streak + 1} — keep it going` : `Your trigger is waiting`,
  (_streak: number, trigger: string) =>
    `When ${trigger.slice(0, 30)}${trigger.length > 30 ? "..." : ""}`,
  (streak: number) =>
    streak > 2
      ? `${streak} days strong. Make it ${streak + 1}.`
      : "Did it fire today?",
  () => "Quick check-in",
];

const missedSubjects = [
  "Never miss twice. Today matters most.",
  "Yesterday was a miss. Today is a fresh trigger.",
  "One miss is noise. Two is a pattern. Show up today.",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: intentions } = await supabase
    .from("intentions")
    .select("id, user_id, when_trigger, then_action")
    .eq("status", "active");

  if (!intentions?.length || !resend) {
    return NextResponse.json({ sent: 0 });
  }

  const { data: todayEvents } = await supabase
    .from("events")
    .select("intention_id")
    .eq("date", today);

  const checkedInIntentions = new Set(
    todayEvents?.map((e) => e.intention_id) ?? []
  );

  const needsReminder = intentions.filter(
    (i) => !checkedInIntentions.has(i.id)
  );

  let sent = 0;

  for (const intention of needsReminder) {
    const { data: userData } = await supabase.auth.admin.getUserById(
      intention.user_id
    );

    const email = userData?.user?.email;
    if (!email) continue;

    // Get streak and yesterday's result for personalization
    const { data: stats } = await supabase
      .from("user_stats")
      .select("current_streak, last_checkin_date")
      .eq("user_id", intention.user_id)
      .single();

    const currentStreak = stats?.current_streak ?? 0;

    // Check yesterday's result
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const { data: yesterdayEvent } = await supabase
      .from("events")
      .select("result")
      .eq("intention_id", intention.id)
      .eq("date", yesterdayStr)
      .single();

    const missedYesterday = yesterdayEvent?.result === "missed";

    // Pick subject
    let subject: string;
    if (missedYesterday) {
      subject = missedSubjects[Math.floor(Math.random() * missedSubjects.length)];
    } else {
      const template = subjectTemplates[Math.floor(Math.random() * subjectTemplates.length)];
      subject = template(currentStreak, intention.when_trigger);
    }

    const token = await createCheckinToken(intention.id, intention.user_id);

    const firedUrl = `${appUrl}/check?r=fired&t=${token}`;
    const missedUrl = `${appUrl}/check?r=missed&t=${token}`;
    const skipUrl = `${appUrl}/check?r=not_encountered&t=${token}`;

    // Streak line for email body
    const streakLine =
      currentStreak > 0
        ? `<p style="font-size: 13px; color: #737373; margin: 0 0 20px 0;">🔥 ${currentStreak} day streak</p>`
        : "";

    // Never-miss-twice line
    const missLine = missedYesterday
      ? `<p style="font-size: 13px; color: #737373; margin: 0 0 16px 0; font-style: italic;">Yesterday was a miss. Today is what matters.</p>`
      : "";

    try {
      await resend.emails.send({
        from: "Cue <reminder@cue.app>",
        to: email,
        subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
            <p style="font-size: 13px; color: #737373; margin: 0 0 24px 0; letter-spacing: 0.05em; text-transform: uppercase;">Cue</p>

            ${streakLine}
            ${missLine}

            <p style="font-size: 15px; color: #0a0a0a; margin: 0 0 4px 0; font-weight: 600;">When ${intention.when_trigger}</p>
            <p style="font-size: 15px; color: #0a0a0a; margin: 0 0 24px 0; font-weight: 600;">Then ${intention.then_action}</p>

            <p style="font-size: 18px; color: #0a0a0a; margin: 0 0 20px 0; font-weight: 600;">Did it fire?</p>

            <div style="display: flex; gap: 8px;">
              <a href="${firedUrl}" style="display: inline-block; padding: 12px 24px; background: #0a0a0a; color: #fafafa; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 500;">Yes</a>
              <a href="${missedUrl}" style="display: inline-block; padding: 12px 24px; background: #f5f5f5; color: #0a0a0a; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 500; border: 1px solid #e5e5e5;">No</a>
              <a href="${skipUrl}" style="display: inline-block; padding: 12px 24px; background: #f5f5f5; color: #737373; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 500; border: 1px solid #e5e5e5;">Didn't happen</a>
            </div>
          </div>
        `,
      });
      sent++;
    } catch {
      // Skip failed sends
    }
  }

  return NextResponse.json({ sent, total: needsReminder.length });
}

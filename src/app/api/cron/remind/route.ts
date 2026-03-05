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

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Get all active intentions where user hasn't checked in today
  const { data: intentions } = await supabase
    .from("intentions")
    .select("id, user_id, when_trigger, then_action")
    .eq("status", "active");

  if (!intentions?.length || !resend) {
    return NextResponse.json({ sent: 0 });
  }

  // Get today's events to filter out users who already checked in
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
    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(
      intention.user_id
    );

    const email = userData?.user?.email;
    if (!email) continue;

    const token = await createCheckinToken(intention.id, intention.user_id);

    const firedUrl = `${appUrl}/check?r=fired&t=${token}`;
    const missedUrl = `${appUrl}/check?r=missed&t=${token}`;
    const skipUrl = `${appUrl}/check?r=not_encountered&t=${token}`;

    try {
      await resend.emails.send({
        from: "Cue <reminder@cue.app>",
        to: email,
        subject: "Did it fire?",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
            <p style="font-size: 13px; color: #737373; margin: 0 0 24px 0; letter-spacing: 0.05em; text-transform: uppercase;">Cue</p>

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

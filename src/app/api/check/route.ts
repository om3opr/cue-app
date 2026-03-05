import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCheckinToken } from "@/lib/checkin-token";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY ?? ""
);

export async function POST(request: Request) {
  const { result, token } = await request.json();

  if (!["fired", "missed", "not_encountered"].includes(result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const payload = await verifyCheckinToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      intention_id: payload.intentionId,
      user_id: payload.userId,
      date: new Date().toISOString().split("T")[0],
      result,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ event: data });
}

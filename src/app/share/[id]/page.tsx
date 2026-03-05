import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareCard } from "./share-card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY ?? ""
);

type Props = {
  params: Promise<{ id: string }>;
};

async function getIntention(id: string) {
  const { data: intention } = await supabase
    .from("intentions")
    .select("*")
    .eq("id", id)
    .single();

  if (!intention) return null;

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("intention_id", id);

  const fired = events?.filter((e) => e.result === "fired").length ?? 0;
  const total =
    events?.filter((e) => e.result !== "not_encountered").length ?? 0;
  const fireRate = total > 0 ? Math.round((fired / total) * 100) : 0;

  const totalDays =
    events && events.length > 0
      ? Math.ceil(
          (Date.now() - new Date(events[0].date).getTime()) / 86400000
        ) + 1
      : 0;

  return { intention, fireRate, totalDays };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getIntention(id);
  if (!data) return { title: "Cue" };

  return {
    title: `Cue Card: ${data.intention.then_action}`,
    description: `When ${data.intention.when_trigger}, then ${data.intention.then_action}. ${data.fireRate}% fire rate.`,
    openGraph: {
      title: `Cue Card: ${data.intention.then_action}`,
      description: `When ${data.intention.when_trigger}, then ${data.intention.then_action}. ${data.fireRate}% fire rate over ${data.totalDays} days.`,
      type: "website",
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const data = await getIntention(id);
  if (!data) notFound();

  return (
    <ShareCard
      intention={data.intention}
      fireRate={data.fireRate}
      totalDays={data.totalDays}
    />
  );
}

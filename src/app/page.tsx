import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { App } from "./app";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <App user={{ id: user.id, name: user.user_metadata?.full_name ?? user.email ?? "", avatar: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null }} />;
}

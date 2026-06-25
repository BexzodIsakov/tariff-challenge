"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function applyForGift(formData: FormData) {
  const user = await requireAuth();
  const tariffId = formData.get("tariffId");
  if (typeof tariffId !== "string") return;

  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("gift_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) redirect("/dashboard?notice=already-pending");

  const { data: access } = await supabase
    .from("user_access")
    .select("id")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (access) redirect("/dashboard?notice=already-have-access");

  // The unique partial index on gift_applications (one pending per user) is
  // the safety net if this check ever races with itself.
  await supabase
    .from("gift_applications")
    .insert({ user_id: user.id, tariff_id: tariffId, status: "pending" });

  // TODO: send Telegram message to admin + log to notification_logs (step 7)

  redirect("/dashboard?notice=applied");
}

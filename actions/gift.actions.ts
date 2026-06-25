"use server";

import { redirect } from "next/navigation";
import { generateActivationCode } from "@/lib/code";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendGiftApplicationNotification } from "@/lib/telegram";

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
  const { data: application, error: insertError } = await supabase
    .from("gift_applications")
    .insert({ user_id: user.id, tariff_id: tariffId, status: "pending" })
    .select<string, { id: string; tariffs: { name: string; price: number } | null }>(
      "id, tariffs(name, price)"
    )
    .single();

  if (insertError || !application) redirect("/dashboard?notice=already-pending");

  const notification = await sendGiftApplicationNotification(
    application.id,
    user.email ?? "unknown",
    application.tariffs?.name ?? "Unknown",
    application.tariffs?.price ?? 0
  );

  // notification_logs has no insert policy for regular user sessions (see
  // 008_rls.sql) — writes go through the service-role client by design.
  const adminSupabase = createAdminClient();
  await adminSupabase.from("notification_logs").insert({
    application_id: application.id,
    type: "telegram",
    status: notification.success ? "sent" : "failed",
    error_message: notification.success ? null : notification.error,
  });

  redirect("/dashboard?notice=applied");
}

export async function approveGift(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: application } = await supabase
    .from("gift_applications")
    .select<string, { id: string; tariffs: { period_months: number } | null }>(
      "id, tariffs(period_months)"
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (!application?.tariffs) {
    return { success: false, error: "Application or tariff not found." };
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + application.tariffs.period_months);

  const { error } = await supabase
    .from("gift_applications")
    .update({
      status: "approved",
      activation_code: generateActivationCode(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", applicationId);

  if (error) return { success: false, error: error.message };

  // TODO: send the activation code email to the user (step 8)

  return { success: true };
}

export async function rejectGift(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("gift_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

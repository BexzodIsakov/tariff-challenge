"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateActivationCode } from "@/lib/code";
import { sendActivationCodeEmail } from "@/lib/email";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendGiftApplicationNotification } from "@/lib/telegram";

export async function applyForGift(formData: FormData) {
  const user = await requireAuth();
  const tariffId = formData.get("tariffId");
  if (typeof tariffId !== "string") return;

  const adminSupabase = createAdminClient();

  const { data: pending } = await adminSupabase
    .from("gift_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) redirect("/dashboard?notice=already-pending");

  await adminSupabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? "", role: "user" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  // The unique partial index on gift_applications (one pending per user) is
  // the safety net if this check ever races with itself.
  const { data: application, error: insertError } = await adminSupabase
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
    .select<
      string,
      {
        id: string;
        tariffs: { period_months: number } | null;
        profiles: { email: string } | null;
      }
    >("id, tariffs(period_months), profiles(email)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application?.tariffs) {
    return { success: false, error: "Application or tariff not found." };
  }

  const activationCode = generateActivationCode();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + application.tariffs.period_months);

  const { error } = await supabase
    .from("gift_applications")
    .update({
      status: "approved",
      activation_code: activationCode,
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", applicationId);

  if (error) return { success: false, error: error.message };

  const email = await sendActivationCodeEmail(
    application.profiles?.email ?? "",
    activationCode
  );

  await supabase.from("notification_logs").insert({
    application_id: applicationId,
    type: "email",
    status: email.success ? "sent" : "failed",
    error_message: email.success ? null : email.error,
  });

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

// Admin-panel entry points for the same approve/reject logic the Telegram
// webhook uses. The webhook authorizes via chat_id verification (it has no
// session); this path authorizes via requireAdmin() instead, since it's
// triggered by an admin's own authenticated click in /admin/gifts.
export async function approveGiftFromPanel(formData: FormData) {
  await requireAdmin();
  const applicationId = formData.get("applicationId");
  if (typeof applicationId !== "string") return;

  await approveGift(applicationId);
  revalidatePath("/admin/gifts");
}

export async function rejectGiftFromPanel(formData: FormData) {
  await requireAdmin();
  const applicationId = formData.get("applicationId");
  if (typeof applicationId !== "string") return;

  await rejectGift(applicationId);
  revalidatePath("/admin/gifts");
}

export type ActivateGiftState = { error?: string } | undefined;

export async function activateGift(
  _prevState: ActivateGiftState,
  formData: FormData
): Promise<ActivateGiftState> {
  const user = await requireAuth();
  const code = formData.get("code");
  if (typeof code !== "string" || code.trim() === "") {
    return { error: "Activation code is required." };
  }

  const supabase = await createClient();

  // RLS (gift_applications_select_own_or_admin) already scopes this lookup
  // to the current user's own rows, but we still check ownership explicitly
  // below for a correct, specific error message rather than relying on RLS
  // silently returning nothing.
  const { data: application } = await supabase
    .from("gift_applications")
    .select("id, user_id, tariff_id, code_used, expires_at")
    .eq("activation_code", code.trim().toUpperCase())
    .maybeSingle();

  if (!application || application.user_id !== user.id) {
    return { error: "Invalid activation code." };
  }
  if (application.code_used) {
    return { error: "This code has already been used." };
  }

  const { data: giftAccess } = await supabase
    .from("user_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("source", "gift")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (giftAccess) {
    return { error: "You already have an active gift." };
  }

  const admin = createAdminClient();

  await admin
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? "", role: "user" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  await admin
    .from("gift_applications")
    .update({ code_used: true })
    .eq("id", application.id);

  const { error } = await admin.from("user_access").insert({
    user_id: user.id,
    tariff_id: application.tariff_id,
    source: "gift",
    expires_at: application.expires_at,
  });

  if (error) return { error: "Failed to activate access. Please try again." };

  redirect("/success");
}

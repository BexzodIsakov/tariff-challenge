"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function grantAccess(formData: FormData) {
  const user = await requireAuth();
  const tariffId = formData.get("tariffId");
  if (typeof tariffId !== "string") return;

  const supabase = await createClient();
  const { data: tariff } = await supabase
    .from("tariffs")
    .select("period_months")
    .eq("id", tariffId)
    .single();

  if (!tariff) return;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + tariff.period_months);

  const admin = createAdminClient();

  // Ensure profile row exists — the DB trigger fires on first signup but may
  // have been missed for users who signed in before the trigger was created.
  await admin
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? "", role: "user" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  const { error } = await admin.from("user_access").insert({
    user_id: user.id,
    tariff_id: tariffId,
    source: "payment",
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);

  redirect("/success");
}

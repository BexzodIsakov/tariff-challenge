"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CreateTariffState = { error?: string } | undefined;

export async function createTariff(
  _prevState: CreateTariffState,
  formData: FormData
): Promise<CreateTariffState> {
  await requireAdmin();

  const name = formData.get("name");
  const price = Number(formData.get("price"));
  const periodMonths = Number(formData.get("period_months"));

  if (typeof name !== "string" || name.trim() === "") {
    return { error: "Name is required." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Price must be a positive number." };
  }
  if (!Number.isInteger(periodMonths) || periodMonths < 1 || periodMonths > 12) {
    return { error: "Period must be a whole number of months between 1 and 12." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tariffs")
    .insert({ name: name.trim(), price, period_months: periodMonths });

  if (error) return { error: "Failed to create tariff." };

  revalidatePath("/admin/tariffs");
  revalidatePath("/");
}

export async function toggleTariff(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");
  const isActive = formData.get("isActive") === "true";

  if (typeof id !== "string") return;

  const supabase = await createClient();
  await supabase.from("tariffs").update({ is_active: !isActive }).eq("id", id);

  revalidatePath("/admin/tariffs");
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setWebhook } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

export type SaveBotTokenState = { error?: string } | undefined;

export async function saveBotToken(
  _prevState: SaveBotTokenState,
  formData: FormData
): Promise<SaveBotTokenState> {
  await requireAdmin();

  const botToken = formData.get("bot_token");
  if (typeof botToken !== "string" || botToken.trim() === "") {
    return { error: "Bot token is required." };
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
  try {
    await setWebhook(botToken.trim(), webhookUrl);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Failed to register webhook: ${error.message}`
          : "Failed to register webhook.",
    };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("telegram_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("telegram_config")
      .update({ bot_token: botToken.trim() })
      .eq("id", existing.id);
  } else {
    await supabase.from("telegram_config").insert({ bot_token: botToken.trim() });
  }

  revalidatePath("/admin/telegram");
}

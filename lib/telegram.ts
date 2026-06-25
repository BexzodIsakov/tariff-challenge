import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type TelegramConfig = {
  bot_token: string;
  approver_chat_id: number | null;
};

async function getTelegramConfig(): Promise<TelegramConfig | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("telegram_config")
    .select("bot_token, approver_chat_id")
    .limit(1)
    .maybeSingle();
  return data;
}

async function callTelegramApi(botToken: string, method: string, body: object) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json();
  if (!result.ok) throw new Error(result.description ?? "Telegram API error");
  return result;
}

export async function setWebhook(botToken: string, webhookUrl: string) {
  return callTelegramApi(botToken, "setWebhook", { url: webhookUrl });
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string
) {
  return callTelegramApi(botToken, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
  });
}

export async function sendGiftApplicationNotification(
  applicationId: string,
  userEmail: string,
  tariffName: string,
  tariffPrice: number
): Promise<{ success: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config?.approver_chat_id) {
    return { success: false, error: "Telegram bot is not connected." };
  }

  try {
    await callTelegramApi(config.bot_token, "sendMessage", {
      chat_id: config.approver_chat_id,
      text: `New gift application\n\nUser: ${userEmail}\nPlan: ${tariffName} ($${tariffPrice})\nApplication ID: ${applicationId}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `approve:${applicationId}` },
            { text: "❌ Reject", callback_data: `reject:${applicationId}` },
          ],
        ],
      },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

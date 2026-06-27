import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { approveGift, rejectGift } from "@/actions/gift.actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerCallbackQuery, sendMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createAdminClient();

  // Setup: admin pressed Start on the bot.
  if (body.message?.text === "/start") {
    const chatId = body.message.chat.id;
    const { data: config } = await supabase
      .from("telegram_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (config) {
      await supabase
        .from("telegram_config")
        .update({ approver_chat_id: chatId, is_active: true })
        .eq("id", config.id);
      revalidatePath("/admin/telegram");
    }

    return NextResponse.json({ ok: true });
  }

  // Approve/Reject button tap.
  if (body.callback_query) {
    const callbackQuery = body.callback_query;
    const { data: config } = await supabase
      .from("telegram_config")
      .select("bot_token, approver_chat_id")
      .limit(1)
      .maybeSingle();

    // Only the verified approver's chat_id may trigger approve/reject —
    // Telegram doesn't authenticate webhook requests, so this check is the
    // only thing standing between this endpoint and anyone who finds the URL.
    if (!config || callbackQuery.from.id !== config.approver_chat_id) {
      return NextResponse.json({ ok: true });
    }

    const [action, applicationId] = (callbackQuery.data as string).split(":");

    const result =
      action === "approve"
        ? await approveGift(applicationId)
        : await rejectGift(applicationId);

    await supabase.from("notification_logs").insert({
      application_id: applicationId,
      type: "telegram",
      status: result.success ? "sent" : "failed",
      error_message: result.success ? null : result.error,
    });

    revalidatePath("/admin/gifts");
    revalidatePath("/dashboard");

    // Don't let transient Telegram API failures surface as 500s and trigger
    // webhook retries that would re-process an already-handled action.
    try {
      await answerCallbackQuery(config.bot_token, callbackQuery.id);
      const label = action === "approve" ? "✅ Approved" : "❌ Rejected";
      const detail = result.success
        ? action === "approve"
          ? " — activation code sent to user."
          : " — user can apply again."
        : ` — failed: ${result.error}`;
      await sendMessage(config.bot_token, config.approver_chat_id, label + detail);
    } catch {
      // Confirmation message failed; the action itself is already done.
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

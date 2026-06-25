import { AdminBackLink } from "@/components/admin-back-link";
import { SaveBotTokenForm } from "@/components/save-bot-token-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminTelegramPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("telegram_config")
    .select("is_active")
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <AdminBackLink />
      <h1 className="text-2xl font-semibold">Telegram bot</h1>
      <p className="text-sm">
        {config?.is_active ? (
          <span className="text-green-600">Bot connected ✓</span>
        ) : (
          "Save a bot token, then open your bot on Telegram and press Start."
        )}
      </p>
      <SaveBotTokenForm />
    </div>
  );
}

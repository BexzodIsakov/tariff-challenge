import { TariffCard } from "@/components/tariff-card";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const [user, supabase] = await Promise.all([getSession(), createClient()]);
  const { data: tariffs } = await supabase
    .from("tariffs")
    .select("id, name, price, period_months")
    .eq("is_active", true);

  const activeAccessByTariff = new Map<string, string>();
  const pendingTariffIds = new Set<string>();
  const approvedUnusedTariffIds = new Set<string>();

  let hasActiveGift = false;

  if (user) {
    const [{ data: access }, { data: applications }] = await Promise.all([
      supabase
        .from("user_access")
        .select("tariff_id, expires_at, source")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString()),
      supabase
        .from("gift_applications")
        .select("tariff_id, status, code_used")
        .eq("user_id", user.id),
    ]);

    for (const row of access ?? []) {
      activeAccessByTariff.set(row.tariff_id, row.expires_at);
      if (row.source === "gift") hasActiveGift = true;
    }
    for (const application of applications ?? []) {
      if (application.status === "pending") {
        pendingTariffIds.add(application.tariff_id);
      } else if (application.status === "approved" && !application.code_used) {
        approvedUnusedTariffIds.add(application.tariff_id);
      }
    }
  }

  const hasAnyPending = pendingTariffIds.size > 0;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold">Choose a plan</h1>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {tariffs?.map((tariff) => {
          let giftStatus: "pending" | "approved-unused" | "blocked" | undefined;
          if (pendingTariffIds.has(tariff.id)) giftStatus = "pending";
          else if (approvedUnusedTariffIds.has(tariff.id))
            giftStatus = "approved-unused";
          else if (hasAnyPending || hasActiveGift) giftStatus = "blocked";

          return (
            <TariffCard
              key={tariff.id}
              tariff={tariff}
              isAuthenticated={!!user}
              activeUntil={activeAccessByTariff.get(tariff.id)}
              giftStatus={giftStatus}
            />
          );
        })}
      </div>
    </div>
  );
}

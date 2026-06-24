import { TariffCard } from "@/components/tariff-card";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const [user, supabase] = await Promise.all([getSession(), createClient()]);
  const { data: tariffs } = await supabase
    .from("tariffs")
    .select("id, name, price, period_months")
    .eq("is_active", true);

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold">Choose a plan</h1>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {tariffs?.map((tariff) => (
          <TariffCard
            key={tariff.id}
            tariff={tariff}
            isAuthenticated={!!user}
          />
        ))}
      </div>
    </div>
  );
}

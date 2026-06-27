import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AccessRow = {
  source: string;
  expires_at: string;
  tariffs: { name: string; period_months: number } | null;
};

export default async function SuccessPage() {
  const [user, supabase] = await Promise.all([requireAuth(), createClient()]);

  const { data: access } = await supabase
    .from("user_access")
    .select<string, AccessRow>("source, expires_at, tariffs(name, period_months)")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!access) redirect("/");

  const label = access.source === "gift" ? "Gift" : "Purchase";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">You&apos;re all set!</h1>
        <p className="text-muted-foreground">
          {label}: <strong>{access.tariffs?.name}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Active until {new Date(access.expires_at).toLocaleDateString()}
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />} variant="outline">
        Back to plans
      </Button>
    </div>
  );
}

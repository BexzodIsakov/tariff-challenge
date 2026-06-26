import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SuccessPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: access } = await supabase
    .from("user_access")
    .select("id")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!access) redirect("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">You&apos;re all set!</h1>
      <p className="text-muted-foreground">You have active access.</p>
    </div>
  );
}

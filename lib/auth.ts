import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// cache() memoizes this per render pass so multiple calls (e.g. a Server
// Action's own check plus the page re-render it triggers) hit Supabase once.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export const requireAdmin = cache(async () => {
  const user = await getSession();
  if (!user) redirect("/admin/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin/login");
  return user;
});

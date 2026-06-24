import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  const user = await getSession();

  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") redirect("/admin");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <AdminLoginForm />
    </div>
  );
}

import Link from "next/link";
import { signOut } from "@/actions/auth.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const [user, supabase] = await Promise.all([getSession(), createClient()]);

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  const displayName = user?.user_metadata?.full_name ?? user?.email;

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        Tariff Challenge
      </Link>
      <nav className="flex items-center gap-4">
        {user ? (
          <>
            <span className="flex items-center gap-2 text-sm">
              {displayName}
              {isAdmin && <Badge>Admin</Badge>}
            </span>
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="text-sm underline"
            >
              {isAdmin ? "Admin panel" : "Dashboard"}
            </Link>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <Link href="/login" className="text-sm underline">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

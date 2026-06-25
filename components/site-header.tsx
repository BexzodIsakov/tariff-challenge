import Link from "next/link";
import { signOut } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getSession();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        Tariff Challenge
      </Link>
      <nav className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm underline">
              Dashboard
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

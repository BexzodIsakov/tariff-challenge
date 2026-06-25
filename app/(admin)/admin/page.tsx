import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHomePage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <nav className="flex flex-col gap-2 text-center">
        <Link href="/admin/tariffs" className="underline">
          Tariffs
        </Link>
        <Link href="/admin/gifts" className="underline">
          Gift applications
        </Link>
        <Link href="/admin/telegram" className="underline">
          Telegram bot
        </Link>
      </nav>
    </div>
  );
}

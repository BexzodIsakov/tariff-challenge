import Link from "next/link";

export function AdminBackLink() {
  return (
    <Link href="/admin" className="text-sm text-muted-foreground underline">
      ← Back to admin
    </Link>
  );
}

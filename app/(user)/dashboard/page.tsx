import { Badge } from "@/components/ui/badge";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// See app/(admin)/admin/gifts/page.tsx for why this embed is typed explicitly.
type AccessRow = { expires_at: string; tariffs: { name: string } | null };
type ApplicationRow = {
  status: string;
  applied_at: string;
  tariffs: { name: string } | null;
};

const NOTICES: Record<string, string> = {
  "already-pending": "You already have a pending gift application.",
  "already-have-access": "You already have active access, so a gift application isn't needed.",
  applied: "Your gift application has been submitted.",
};

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const notice =
    typeof searchParams.notice === "string"
      ? NOTICES[searchParams.notice]
      : undefined;

  const user = await requireAuth();
  const supabase = await createClient();

  const { data: access } = await supabase
    .from("user_access")
    .select<string, AccessRow>("expires_at, tariffs(name)")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: application } = await supabase
    .from("gift_applications")
    .select<string, ApplicationRow>("status, applied_at, tariffs(name)")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Your account</h1>
      {notice && (
        <p className="rounded-md bg-muted px-4 py-2 text-sm">{notice}</p>
      )}
      {access ? (
        <p>
          Active access to <strong>{access.tariffs?.name}</strong> until{" "}
          {new Date(access.expires_at).toLocaleDateString()}
        </p>
      ) : application ? (
        <div className="flex items-center gap-2">
          <span>{application.tariffs?.name} gift application:</span>
          <Badge
            variant={
              application.status === "approved"
                ? "default"
                : application.status === "rejected"
                  ? "destructive"
                  : "secondary"
            }
          >
            {application.status}
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      )}
    </div>
  );
}

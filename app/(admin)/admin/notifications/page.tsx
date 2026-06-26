import { AdminBackLink } from "@/components/admin-back-link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NotificationLogRow = {
  id: string;
  type: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  gift_applications: {
    profiles: { email: string } | null;
  } | null;
};

export default async function AdminNotificationsPage() {
  const [, supabase] = await Promise.all([requireAdmin(), createClient()]);

  const { data: logs } = await supabase
    .from("notification_logs")
    .select<string, NotificationLogRow>(
      "id, type, status, error_message, sent_at, gift_applications(profiles(email))"
    )
    .order("sent_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <AdminBackLink />
      <h1 className="text-2xl font-semibold">Notification logs</h1>
      {logs?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Sent at</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="capitalize">{log.type}</TableCell>
                <TableCell>
                  <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.gift_applications?.profiles?.email ?? "—"}
                </TableCell>
                <TableCell>
                  {new Date(log.sent_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.error_message ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No notification logs yet.</p>
      )}
    </div>
  );
}

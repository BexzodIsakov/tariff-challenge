import { approveGiftFromPanel, rejectGiftFromPanel } from "@/actions/gift.actions";
import { AdminBackLink } from "@/components/admin-back-link";
import { AutoRefresh } from "@/components/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
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

// Without generated Database types, the client can't tell these are
// many-to-one embeds (each application has exactly one profile/tariff) and
// conservatively infers arrays. Verified against the actual API response.
type GiftApplicationRow = {
  id: string;
  status: string;
  applied_at: string;
  profiles: { email: string } | null;
  tariffs: { name: string } | null;
};

export default async function AdminGiftsPage() {
  const [, supabase] = await Promise.all([requireAdmin(), createClient()]);

  const { data: applications } = await supabase
    .from("gift_applications")
    .select<string, GiftApplicationRow>(
      "id, status, applied_at, profiles(email), tariffs(name)"
    )
    .order("applied_at", { ascending: false });

  const hasPending = applications?.some((a) => a.status === "pending") ?? false;

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <AutoRefresh enabled={hasPending} />
      <AdminBackLink />
      <h1 className="text-2xl font-semibold">Gift applications</h1>
      {applications?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Tariff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>{application.profiles?.email}</TableCell>
                <TableCell>{application.tariffs?.name}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  {new Date(application.applied_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {application.status === "pending" && (
                    <div className="flex gap-2">
                      <form action={approveGiftFromPanel}>
                        <input
                          type="hidden"
                          name="applicationId"
                          value={application.id}
                        />
                        <SubmitButton size="sm">Approve</SubmitButton>
                      </form>
                      <form action={rejectGiftFromPanel}>
                        <input
                          type="hidden"
                          name="applicationId"
                          value={application.id}
                        />
                        <SubmitButton variant="outline" size="sm">Reject</SubmitButton>
                      </form>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No gift applications yet.
        </p>
      )}
    </div>
  );
}

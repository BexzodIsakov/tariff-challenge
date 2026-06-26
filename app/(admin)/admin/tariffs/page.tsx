import { toggleTariff } from "@/actions/tariff.actions";
import { AdminBackLink } from "@/components/admin-back-link";
import { Badge } from "@/components/ui/badge";
import { CreateTariffForm } from "@/components/create-tariff-form";
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

export default async function AdminTariffsPage() {
  const [, supabase] = await Promise.all([requireAdmin(), createClient()]);

  const { data: tariffs } = await supabase
    .from("tariffs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <AdminBackLink />
      <h1 className="text-2xl font-semibold">Tariffs</h1>
      <CreateTariffForm />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tariffs?.map((tariff) => (
            <TableRow key={tariff.id}>
              <TableCell>{tariff.name}</TableCell>
              <TableCell>${tariff.price}</TableCell>
              <TableCell>{tariff.period_months} mo</TableCell>
              <TableCell>
                <Badge variant={tariff.is_active ? "default" : "secondary"}>
                  {tariff.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <form action={toggleTariff}>
                  <input type="hidden" name="id" value={tariff.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={String(tariff.is_active)}
                  />
                  <SubmitButton variant="outline" size="sm">
                    {tariff.is_active ? "Deactivate" : "Activate"}
                  </SubmitButton>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

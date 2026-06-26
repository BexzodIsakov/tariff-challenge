import Link from "next/link";
import { grantAccess } from "@/actions/access.actions";
import { applyForGift } from "@/actions/gift.actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Tariff = {
  id: string;
  name: string;
  price: number;
  period_months: number;
};

export function TariffCard({
  tariff,
  isAuthenticated,
  activeUntil,
  giftStatus,
}: {
  tariff: Tariff;
  isAuthenticated: boolean;
  activeUntil?: string;
  giftStatus?: "pending" | "approved-unused" | "blocked";
}) {
  const period = tariff.period_months === 1 ? "month" : "months";
  const monthlyRate = tariff.price / tariff.period_months;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{tariff.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-2xl font-semibold">${tariff.price}</p>
        <p className="text-sm text-muted-foreground">
          per {tariff.period_months} {period} (${monthlyRate.toFixed(2)}/mo)
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        {!isAuthenticated ? (
          <>
            <Button nativeButton={false} render={<Link href="/login" />}>
              Buy
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Apply for gift
            </Button>
          </>
        ) : activeUntil ? (
          <p className="flex h-8 items-center text-sm">
            Active until {new Date(activeUntil).toLocaleDateString()}
          </p>
        ) : (
          <>
            <form action={grantAccess}>
              <input type="hidden" name="tariffId" value={tariff.id} />
              <Button type="submit">Buy</Button>
            </form>
            {giftStatus === "pending" ? (
              <Badge variant="secondary">Application pending</Badge>
            ) : giftStatus === "approved-unused" ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/activate" />}
              >
                Activate now
              </Button>
            ) : giftStatus === "blocked" ? null : (
              <form action={applyForGift}>
                <input type="hidden" name="tariffId" value={tariff.id} />
                <Button variant="outline" type="submit">
                  Apply for gift
                </Button>
              </form>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

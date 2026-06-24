"use client";

import { useActionState } from "react";
import { createTariff } from "@/actions/tariff.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTariffForm() {
  const [state, action, pending] = useActionState(createTariff, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price">Price</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="period_months">Period (months)</Label>
        <Input
          id="period_months"
          name="period_months"
          type="number"
          min="1"
          max="12"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        Create
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}

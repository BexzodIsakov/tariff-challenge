"use client";

import { useActionState } from "react";
import { activateGift } from "@/actions/gift.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActivateForm() {
  const [state, action, pending] = useActionState(activateGift, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Activation code</Label>
        <Input id="code" name="code" required />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        Activate
      </Button>
    </form>
  );
}

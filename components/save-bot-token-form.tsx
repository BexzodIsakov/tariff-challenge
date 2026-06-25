"use client";

import { useActionState } from "react";
import { saveBotToken } from "@/actions/telegram.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveBotTokenForm() {
  const [state, action, pending] = useActionState(saveBotToken, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bot_token">Bot token</Label>
        <Input id="bot_token" name="bot_token" required />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        Save
      </Button>
    </form>
  );
}

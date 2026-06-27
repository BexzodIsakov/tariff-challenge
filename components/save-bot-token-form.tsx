"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
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
      {state?.success && (
        <p className="text-sm text-green-600">Token saved. Now open your bot in Telegram and press Start.</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}

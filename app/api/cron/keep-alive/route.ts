import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Pinged by Vercel Cron (see vercel.json) to keep the Supabase free-tier
// project from auto-pausing after 7 days of inactivity.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  await supabase.from("tariffs").select("id").limit(1);

  return NextResponse.json({ ok: true });
}

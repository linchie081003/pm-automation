import { NextResponse } from "next/server";
import { runScheduledClickUpSync, runWeeklyReportCutoff } from "@/lib/jobs/weekly-report";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get("job") ?? "all";

  const results: Record<string, unknown> = {};
  if (job === "clickup" || job === "all") {
    results.clickup = await runScheduledClickUpSync();
  }
  if (job === "weekly" || job === "all") {
    results.weekly = await runWeeklyReportCutoff();
  }

  return NextResponse.json({ ok: true, results });
}

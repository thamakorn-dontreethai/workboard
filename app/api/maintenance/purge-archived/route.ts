import { NextResponse } from "next/server";
import { purgeArchived } from "@/lib/server/db";

// Empties the bin: permanently removes boards and tasks that have been
// archived for longer than the retention window. This is the one endpoint in
// the app that destroys data irreversibly, so unlike the other periodic jobs
// (check-reminders et al., which any client may call) it is gated on a shared
// secret and is never reachable from the browser.
//
// Wire it to a scheduler that sends `Authorization: Bearer $CRON_SECRET`;
// Vercel Cron does this automatically when CRON_SECRET is set (see
// vercel.json). Without CRON_SECRET configured the route refuses outright
// rather than defaulting to open — an unauthenticated purge endpoint is far
// worse than a job that doesn't run.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function parseOptions(url: URL) {
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Number(daysParam) : undefined;
  return {
    retentionDays:
      days !== undefined && Number.isFinite(days) && days >= 0 ? days : undefined,
    // Reports what would go without touching anything.
    dryRun: url.searchParams.get("dryRun") === "true",
  };
}

// GET only ever reports; it cannot delete. Handy for checking what the next
// run would clear.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { retentionDays } = parseOptions(new URL(request.url));
    const result = await purgeArchived({ retentionDays, dryRun: true });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { retentionDays, dryRun } = parseOptions(new URL(request.url));
    const result = await purgeArchived({ retentionDays, dryRun });
    if (!result.dryRun && (result.tasks > 0 || result.boards > 0)) {
      console.log(
        `[purge-archived] removed ${result.boards} board(s) and ${result.tasks} task(s) ` +
          `archived before ${result.cutoff.toISOString()} (${result.retentionDays}-day retention)`
      );
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const runtime = "nodejs";

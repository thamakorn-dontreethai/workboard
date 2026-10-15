import { NextResponse } from "next/server";
import {
  checkAndSendTaskDueSoonReminders,
  checkAndSendTaskDueRemindersForAllWorkspaces,
} from "@/lib/server/db";

// GET is the daily Vercel Cron run (00:00 UTC = 07:00 Bangkok, see
// vercel.json): every workspace, so reminders reach LINE even when nobody
// has the app open. Vercel sends `Authorization: Bearer $CRON_SECRET`.
// POST stays as the open app's 30-second nudge for its own workspace.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await checkAndSendTaskDueRemindersForAllWorkspaces();
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }
    const result = await checkAndSendTaskDueSoonReminders(body.workspaceId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

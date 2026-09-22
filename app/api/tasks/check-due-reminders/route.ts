import { NextResponse } from "next/server";
import { checkAndSendTaskDueSoonReminders } from "@/lib/server/db";

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

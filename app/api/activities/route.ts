import { NextResponse } from "next/server";
import { getActivities } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId") || undefined;
    const boardId = searchParams.get("boardId") || undefined;

    const activities = await getActivities(taskId, boardId);
    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

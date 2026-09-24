import { NextResponse } from "next/server";
import { getActivities } from "@/lib/server/db";

const DEFAULT_ACTIVITY_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId") || undefined;
    const boardId = searchParams.get("boardId") || undefined;
    const limitParam = Number(searchParams.get("limit"));

    // The client hydrates this list wholesale on every poll, and the only
    // view that reads all of it renders the newest few. Left uncapped it was
    // the largest response the app downloads, by a wide margin. Asking for
    // one task's history (taskId) still returns all of it.
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? limitParam
      : taskId
        ? undefined
        : DEFAULT_ACTIVITY_LIMIT;

    const activities = await getActivities(taskId, boardId, limit);
    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSubtasks } from "@/lib/server/db";

// Bulk read of every subtask across all tasks — used for hydrating the
// client on load. Per-task create/toggle still goes through
// /api/tasks/[id]/subtasks.
export async function GET() {
  try {
    const subtasks = await getSubtasks();
    return NextResponse.json({ success: true, data: subtasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

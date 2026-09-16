import { NextResponse } from "next/server";
import { getComments } from "@/lib/server/db";

// Bulk read of every comment across all tasks — used for hydrating the
// client on load. Per-task create/read still goes through
// /api/tasks/[id]/comments.
export async function GET() {
  try {
    const comments = await getComments();
    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

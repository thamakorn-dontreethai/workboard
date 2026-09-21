import { NextResponse } from "next/server";
import { assignTask } from "@/lib/server/db";
import { authorizeTask } from "@/lib/server/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const assigneeIds = Array.isArray(body.assigneeIds)
      ? body.assigneeIds
      : body.assigneeId
        ? [body.assigneeId]
        : [];
    const auth = await authorizeTask(request, id, "manage");
    if (!auth.ok) return auth.response;

    const updated = await assignTask(id, assigneeIds, auth.userId);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

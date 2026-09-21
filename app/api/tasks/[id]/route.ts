import { NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/server/db";
import { authorizeTask, taskUpdateAction } from "@/lib/server/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Leaders may change anything; a member may only change the status of an
    // item assigned to them (see lib/server/permissions.ts).
    const auth = await authorizeTask(request, id, taskUpdateAction(body));
    if (!auth.ok) return auth.response;

    const updates: any = { ...body };
    if (body.dueDate !== undefined) {
      updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    const updated = await updateTask(id, updates, auth.userId);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeTask(request, id, "manage");
    if (!auth.ok) return auth.response;

    const deleted = await deleteTask(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSubtasks, addSubtask, toggleSubtask } from "@/lib/server/db";
import { authorizeTask, authorizeSubtask } from "@/lib/server/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subtasks = await getSubtasks(id);
    return NextResponse.json({ success: true, data: subtasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Subtask title is required" },
        { status: 400 }
      );
    }

    const auth = await authorizeTask(request, id, "write");
    if (!auth.ok) return auth.response;

    const subtask = await addSubtask({
      taskId: id,
      title: body.title,
    });

    return NextResponse.json({ success: true, data: subtask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.subtaskId) {
      return NextResponse.json(
        { success: false, error: "subtaskId is required" },
        { status: 400 }
      );
    }

    const auth = await authorizeSubtask(request, body.subtaskId, "write");
    if (!auth.ok) return auth.response;

    const updated = await toggleSubtask(body.subtaskId);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Subtask not found" },
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

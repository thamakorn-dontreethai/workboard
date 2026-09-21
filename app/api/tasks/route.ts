import { NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/server/db";
import { authorizeBoard } from "@/lib/server/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId") || undefined;
    const groupId = searchParams.get("groupId") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const tasks = await getTasks({ boardId, groupId, assigneeId, status });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.boardId || !body.groupId) {
      return NextResponse.json(
        { success: false, error: "title, boardId, and groupId are required" },
        { status: 400 }
      );
    }

    const auth = await authorizeBoard(request, body.boardId, "manage");
    if (!auth.ok) return auth.response;

    const newTask = await createTask({
      title: body.title,
      description: body.description,
      boardId: body.boardId,
      groupId: body.groupId,
      assigneeIds: Array.isArray(body.assigneeIds)
        ? body.assigneeIds
        : body.assigneeId
          ? [body.assigneeId]
          : undefined,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      category: body.category,
      reporterId: auth.userId,
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

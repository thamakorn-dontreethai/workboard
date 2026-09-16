import { NextResponse } from "next/server";
import { updatePersonalTodo, deletePersonalTodo } from "@/lib/server/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.reminderMinutesBefore !== undefined) updates.reminderMinutesBefore = body.reminderMinutesBefore;
    if (body.isCompleted !== undefined) updates.isCompleted = body.isCompleted;
    if (body.reminderSentAt !== undefined) updates.reminderSentAt = body.reminderSentAt ? new Date(body.reminderSentAt) : null;

    const todo = await updatePersonalTodo(id, updates as any);
    if (!todo) {
      return NextResponse.json(
        { success: false, error: "To-do not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: todo });
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
    const ok = await deletePersonalTodo(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "To-do not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

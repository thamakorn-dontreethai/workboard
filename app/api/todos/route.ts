import { NextResponse } from "next/server";
import { getPersonalTodos, createPersonalTodo } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }
    const todos = await getPersonalTodos(userId);
    return NextResponse.json({ success: true, data: todos });
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
    if (!body.userId || !body.title) {
      return NextResponse.json(
        { success: false, error: "userId and title are required" },
        { status: 400 }
      );
    }
    const todo = await createPersonalTodo({
      userId: body.userId,
      title: body.title,
      notes: body.notes,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      reminderMinutesBefore: body.reminderMinutesBefore,
    });
    return NextResponse.json({ success: true, data: todo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

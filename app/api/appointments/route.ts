import { NextResponse } from "next/server";
import { getAppointments, createAppointment } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }
    const appointments = await getAppointments(workspaceId);
    return NextResponse.json({ success: true, data: appointments });
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
    if (!body.workspaceId || !body.createdById || !body.title || !body.startAt) {
      return NextResponse.json(
        { success: false, error: "workspaceId, createdById, title and startAt are required" },
        { status: 400 }
      );
    }
    const appointment = await createAppointment({
      workspaceId: body.workspaceId,
      boardId: body.boardId || null,
      createdById: body.createdById,
      title: body.title,
      notes: body.notes || "",
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      attendeeIds: Array.isArray(body.attendeeIds) ? body.attendeeIds : [],
      reminderMinutesBefore: body.reminderMinutesBefore,
    });
    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

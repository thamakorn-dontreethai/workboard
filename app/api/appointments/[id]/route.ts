import { NextResponse } from "next/server";
import { updateAppointment, deleteAppointment } from "@/lib/server/db";

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
    if (body.startAt !== undefined) updates.startAt = new Date(body.startAt);
    // null clears the end time; a value sets it.
    if (body.endAt !== undefined) updates.endAt = body.endAt ? new Date(body.endAt) : null;
    if (body.attendeeIds !== undefined) updates.attendeeIds = body.attendeeIds;
    if (body.reminderMinutesBefore !== undefined)
      updates.reminderMinutesBefore = body.reminderMinutesBefore;
    if (body.isCompleted !== undefined) updates.isCompleted = body.isCompleted;

    const appointment = await updateAppointment(id, updates as any);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: appointment });
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
    const ok = await deleteAppointment(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
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

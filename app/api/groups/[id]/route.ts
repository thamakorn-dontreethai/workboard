import { NextResponse } from "next/server";
import { updateGroup, deleteGroup } from "@/lib/server/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateGroup(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
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
    const deleted = await deleteGroup(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

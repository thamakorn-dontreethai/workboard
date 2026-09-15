import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  togglePinWorkspace,
} from "@/lib/server/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ws = await getWorkspaceById(id);
    if (!ws) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: ws });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "togglePin") {
      const updated = await togglePinWorkspace(id);
      return NextResponse.json({ success: true, data: updated });
    }

    const updated = await updateWorkspace(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteWorkspace(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

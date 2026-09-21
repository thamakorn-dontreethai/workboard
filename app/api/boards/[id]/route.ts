import { NextResponse } from "next/server";
import { getBoardById, updateBoard, deleteBoard } from "@/lib/server/db";
import { authorizeBoard } from "@/lib/server/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const board = await getBoardById(id);
    if (!board) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: board });
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
    const auth = await authorizeBoard(request, id, "manage");
    if (!auth.ok) return auth.response;

    const updated = await updateBoard(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
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
    const auth = await authorizeBoard(request, id, "manage");
    if (!auth.ok) return auth.response;

    const deleted = await deleteBoard(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Board deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

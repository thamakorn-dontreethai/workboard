import { NextResponse } from "next/server";
import { updateFolder, deleteFolder, emptyFolder } from "@/lib/server/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "empty") {
      await emptyFolder(id);
      return NextResponse.json({ success: true });
    }

    const updated = await updateFolder(id, {
      name: body.name,
      color: body.color,
      isCollapsed: body.isCollapsed,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
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
    const ok = await deleteFolder(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Folder not found" },
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

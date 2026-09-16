import { NextResponse } from "next/server";
import { deleteFile } from "@/lib/server/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteFile(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "File not found" },
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

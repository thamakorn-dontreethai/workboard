import { NextResponse } from "next/server";
import { getFiles, uploadFile } from "@/lib/server/db";

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
    const files = await getFiles(workspaceId);
    return NextResponse.json({ success: true, data: files });
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
    if (!body.workspaceId || !body.name || !body.dataUrl || !body.uploadedById) {
      return NextResponse.json(
        { success: false, error: "workspaceId, name, dataUrl and uploadedById are required" },
        { status: 400 }
      );
    }
    const file = await uploadFile({
      workspaceId: body.workspaceId,
      name: body.name,
      caption: body.caption || "",
      mimeType: body.mimeType || "application/octet-stream",
      size: body.size || 0,
      dataUrl: body.dataUrl,
      uploadedById: body.uploadedById,
    });
    return NextResponse.json({ success: true, data: file }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getFolders, createFolder } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const folders = await getFolders(workspaceId);
    return NextResponse.json({ success: true, data: folders });
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
    if (!body.workspaceId || !body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "workspaceId and name are required" },
        { status: 400 }
      );
    }
    const folder = await createFolder({
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      color: body.color,
    });
    return NextResponse.json({ success: true, data: folder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

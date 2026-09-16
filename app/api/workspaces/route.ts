import { NextRequest, NextResponse } from "next/server";
import { getWorkspaces, getWorkspace, createWorkspace } from "@/lib/server/db";

export async function GET() {
  try {
    const workspaces = await getWorkspaces();
    const activeWorkspace = await getWorkspace();
    return NextResponse.json({
      success: true,
      data: activeWorkspace,
      workspaces: workspaces,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const newWorkspace = await createWorkspace({
      name: body.name.trim(),
      description: body.description?.trim(),
      privacy: body.privacy || "open",
      avatarColor: body.avatarColor || "bg-indigo-600",
      icon: body.icon,
      coverColor: body.coverColor,
      creatorId: body.creatorId,
    });

    return NextResponse.json({ success: true, data: newWorkspace });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

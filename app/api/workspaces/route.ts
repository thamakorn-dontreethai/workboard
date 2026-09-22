import { NextResponse } from "next/server";
import { getWorkspaces, createWorkspace } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const workspaces = await getWorkspaces(userId);
    return NextResponse.json({
      success: true,
      data: workspaces[0],
      workspaces: workspaces,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = requireSession(req);
    if (!session.ok) return session.response;

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
      // The creator (who becomes owner) is the signed-in user, not a body field.
      creatorId: session.userId,
    });

    return NextResponse.json({ success: true, data: newWorkspace });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

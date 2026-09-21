import { NextResponse } from "next/server";
import { getBoards, createBoard } from "@/lib/server/db";
import { authorizeWorkspaceManage } from "@/lib/server/permissions";

export async function GET() {
  try {
    const boards = await getBoards();
    return NextResponse.json({ success: true, data: boards });
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Board name is required" },
        { status: 400 }
      );
    }

    const auth = await authorizeWorkspaceManage(request, body.workspaceId);
    if (!auth.ok) return auth.response;

    const newBoard = await createBoard({
      name: body.name,
      description: body.description,
      type: body.type,
      color: body.color,
      ownerId: auth.userId,
      workspaceId: body.workspaceId,
      privacy: body.privacy,
    });

    return NextResponse.json({ success: true, data: newBoard }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

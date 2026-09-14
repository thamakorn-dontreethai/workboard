import { NextResponse } from "next/server";
import { getGroups, createGroup } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId") || undefined;
    const groups = await getGroups(boardId);
    return NextResponse.json({ success: true, data: groups });
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
    if (!body.boardId || !body.name) {
      return NextResponse.json(
        { success: false, error: "boardId and name are required" },
        { status: 400 }
      );
    }

    const newGroup = await createGroup({
      boardId: body.boardId,
      name: body.name,
      color: body.color,
    });

    return NextResponse.json({ success: true, data: newGroup }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

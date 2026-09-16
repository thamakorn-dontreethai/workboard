import { NextResponse } from "next/server";
import { getPosts, createPost } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const viewerId = searchParams.get("viewerId") || undefined;
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "workspaceId is required" },
        { status: 400 }
      );
    }
    const posts = await getPosts(workspaceId, viewerId);
    return NextResponse.json({ success: true, data: posts });
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
    if (!body.workspaceId || !body.authorId || !body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "workspaceId, authorId and content are required" },
        { status: 400 }
      );
    }
    const post = await createPost({
      workspaceId: body.workspaceId,
      authorId: body.authorId,
      content: body.content.trim(),
      imageUrl: body.imageUrl || null,
    });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Failed to create post" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

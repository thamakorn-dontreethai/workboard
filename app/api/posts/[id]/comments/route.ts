import { NextResponse } from "next/server";
import { addPostComment } from "@/lib/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.authorId || !body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "authorId and content are required" },
        { status: 400 }
      );
    }
    const post = await addPostComment({
      postId: id,
      authorId: body.authorId,
      content: body.content.trim(),
      imageUrl: body.imageUrl || null,
    });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Failed to add comment" },
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

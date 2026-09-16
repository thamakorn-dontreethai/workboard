import { NextResponse } from "next/server";
import { setPostReaction } from "@/lib/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.userId || (body.type !== "like" && body.type !== "dislike")) {
      return NextResponse.json(
        { success: false, error: "userId and type ('like' | 'dislike') are required" },
        { status: 400 }
      );
    }
    const post = await setPostReaction(id, body.userId, body.type);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Failed to set reaction" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

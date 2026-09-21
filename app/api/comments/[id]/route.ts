import { NextResponse } from "next/server";
import { updateComment, deleteComment } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

// Edit / delete a single comment. Only the author may do either — the
// caller is identified by the signed session cookie, not by anything in the
// request body.

function failure(reason: "not_found" | "forbidden" | "empty") {
  if (reason === "not_found") {
    return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
  }
  if (reason === "empty") {
    return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
  }
  return NextResponse.json(
    { success: false, error: "You can only modify your own comments" },
    { status: 403 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    if (!session.ok) return session.response;

    const { id } = await params;
    const body = await request.json();
    if (typeof body.content !== "string") {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    const result = await updateComment(id, session.userId, body.content);
    if (!result.ok) return failure(result.reason);
    return NextResponse.json({ success: true, data: result.comment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    if (!session.ok) return session.response;

    const { id } = await params;
    const result = await deleteComment(id, session.userId);
    if (!result.ok) return failure(result.reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

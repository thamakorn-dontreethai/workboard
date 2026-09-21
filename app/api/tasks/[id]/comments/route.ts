import { NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/server/db";
import { validateAttachments } from "@/lib/utils/commentAttachments";
import { authorizeTask } from "@/lib/server/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await getComments(id);
    return NextResponse.json({ success: true, data: comments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeTask(request, id, "write");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    // An update can be text, files, or both — but not neither.
    const content: string = typeof body.content === "string" ? body.content : "";
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!content.trim() && attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    const invalid = attachments.find(
      (a: any) =>
        !a ||
        typeof a.name !== "string" ||
        typeof a.url !== "string" ||
        !a.url.startsWith("data:") ||
        typeof a.size !== "number"
    );
    if (invalid) {
      return NextResponse.json(
        { success: false, error: "Each attachment needs name, size and a data URL" },
        { status: 400 }
      );
    }
    const limitError = validateAttachments(attachments);
    if (limitError) {
      return NextResponse.json({ success: false, error: limitError }, { status: 413 });
    }

    const comment = await addComment({
      taskId: id,
      authorId: auth.userId,
      content,
      attachments: attachments.map((a: any) => ({
        name: a.name,
        size: a.size,
        mimeType: typeof a.mimeType === "string" && a.mimeType ? a.mimeType : "application/octet-stream",
        url: a.url,
      })),
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

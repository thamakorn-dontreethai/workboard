import { NextResponse } from "next/server";
import { getCommentAttachment } from "@/lib/server/db";
import { INLINE_IMAGE_TYPES } from "@/lib/utils/commentAttachments";
import { requireSession } from "@/lib/server/permissions";

// Serves one file attached to a comment. Stored as a base64 data URL, so
// decode it back to bytes here.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attId: string }> }
) {
  try {
    // Files are only for signed-in users (the browser sends the session
    // cookie automatically when loading an <img> or following a link).
    const session = requireSession(request);
    if (!session.ok) return session.response;

    const { id, attId } = await params;
    const attachment = await getCommentAttachment(id, attId);
    const match = attachment && /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(attachment.url);
    if (!attachment || !match) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      );
    }

    const bytes = match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]));
    const inline = INLINE_IMAGE_TYPES.includes(attachment.mimeType);

    return new Response(new Uint8Array(bytes), {
      headers: {
        // Never trust a user-supplied type for anything but the safe image
        // list — SVG/HTML served inline from our origin could run script.
        "Content-Type": inline ? attachment.mimeType : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(
          attachment.name
        )}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

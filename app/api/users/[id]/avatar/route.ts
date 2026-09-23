import { NextResponse } from "next/server";
import { getUserAvatarDataUrl } from "@/lib/server/db";

// Serves a user's uploaded profile photo. The image is stored as a base64
// data URL on the User row; keeping it out of the user payloads and behind
// this route means a list of people costs a few hundred bytes each instead of
// however many megabytes their photos happen to weigh.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dataUrl = await getUserAvatarDataUrl(id);
    if (!dataUrl) {
      return NextResponse.json(
        { success: false, error: "No profile photo" },
        { status: 404 }
      );
    }

    const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl);
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Stored photo is not a base64 image" },
        { status: 422 }
      );
    }
    const [, mimeType, base64] = match;

    return new NextResponse(Buffer.from(base64, "base64"), {
      headers: {
        "Content-Type": mimeType,
        // Callers link to this with ?v=<updatedAt>, so a given URL always
        // refers to one specific photo and can be cached hard.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

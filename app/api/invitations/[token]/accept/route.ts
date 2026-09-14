import { NextResponse } from "next/server";
import { acceptBoardInvitation } from "@/lib/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await acceptBoardInvitation(token, body.userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to accept invitation" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You have joined the project team successfully!",
      data: { board: result.board, user: result.user },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

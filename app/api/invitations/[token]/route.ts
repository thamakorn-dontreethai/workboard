import { NextResponse } from "next/server";
import { getInvitationByToken, getBoardById, getUserById } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    const board = await getBoardById(invitation.boardId);
    const inviter = await getUserById(invitation.invitedById);

    return NextResponse.json({
      success: true,
      data: {
        invitation,
        board: board
          ? {
              id: board.id,
              name: board.name,
              description: board.description,
              color: board.color,
            }
          : null,
        inviter: inviter
          ? {
              name: inviter.name,
              email: inviter.email,
              avatarInitials: inviter.avatarInitials,
              avatarColor: inviter.avatarColor,
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

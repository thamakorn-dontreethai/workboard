import { NextResponse } from "next/server";
import { createBoardInvitation, getBoardById, getUsers } from "@/lib/server/db";
import { sendBoardInvitationEmail } from "@/lib/server/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const board = await getBoardById(boardId);
    if (!board) {
      return NextResponse.json(
        { success: false, error: "Board not found" },
        { status: 404 }
      );
    }

    const allUsers = await getUsers();
    const inviter = allUsers.find(
      (u) => u.id === (body.invitedById || board.ownerId)
    );

    const invitation = await createBoardInvitation({
      boardId,
      email: body.email,
      role: body.role || "Member",
      invitedById: body.invitedById || board.ownerId,
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const inviteLink = `${origin}/invite/${invitation.token}`;

    // Send real email to recipient's inbox
    const emailResult = await sendBoardInvitationEmail({
      to: body.email.trim().toLowerCase(),
      inviterName: inviter?.name || "Somchai (Team Lead)",
      boardName: board.name,
      role: body.role || "Member",
      inviteUrl: inviteLink,
    });

    return NextResponse.json(
      {
        success: true,
        message: emailResult.success
          ? `Invitation email successfully dispatched to ${body.email}`
          : `Invitation created for ${body.email}`,
        data: {
          invitation,
          inviteLink,
          emailDelivery: emailResult,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

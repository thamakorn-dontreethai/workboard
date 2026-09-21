import { NextResponse } from "next/server";
import { createBoardInvitation, getBoardById, getUsers, getBoards, createBoard } from "@/lib/server/db";
import { sendBoardInvitationEmail } from "@/lib/server/email";
import { authorizeBoard } from "@/lib/server/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const auth = await authorizeBoard(request, boardId, "manage");
    if (!auth.ok) return auth.response;
    const invitedById = auth.userId;

    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    let board = await getBoardById(boardId);
    if (!board) {
      const allBoards = await getBoards();
      if (allBoards.length > 0) {
        board = allBoards[0];
      } else {
        board = await createBoard({
          name: "Projects & Deliverables",
          description: "Main team project board",
          ownerId: invitedById,
        });
      }
    }

    if (!board) {
      return NextResponse.json(
        { success: false, error: "Unable to find or create a board for invitation" },
        { status: 400 }
      );
    }

    const allUsers = await getUsers();
    const inviter = allUsers.find(
      (u) => u.id === (invitedById || board!.ownerId)
    );

    const invitation = await createBoardInvitation({
      boardId,
      email: body.email,
      role: body.role || "Member",
      invitedById: invitedById || board.ownerId,
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

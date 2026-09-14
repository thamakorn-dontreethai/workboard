import { describe, it, expect, beforeEach } from "vitest";
import {
  createBoardInvitation,
  getInvitationByToken,
  acceptBoardInvitation,
  getBoardMembers,
  getBoards,
  getUsers,
  createBoard,
  resetDb,
} from "../lib/server/db";

describe("Board Team Member Isolation & Email Invitation Flow", () => {
  beforeEach(() => {
    resetDb();
  });
  it("should create a pending invitation with a unique token", async () => {
    const invite = await createBoardInvitation(
      "board-1",
      "test.developer@example.com",
      "Member",
      "user-somchai"
    );

    expect(invite).toBeDefined();
    expect(invite.token).toBeDefined();
    expect(invite.token.length).toBeGreaterThan(10);
    expect(invite.boardId).toBe("board-1");
    expect(invite.email).toBe("test.developer@example.com");
    expect(invite.role).toBe("Member");
    expect(invite.status).toBe("pending");
  });

  it("should fetch invitation details by token", async () => {
    const invite = await createBoardInvitation(
      "board-1",
      "designer@example.com",
      "Project Lead",
      "user-somchai"
    );

    const fetched = await getInvitationByToken(invite.token);
    expect(fetched).toBeDefined();
    expect(fetched?.email).toBe("designer@example.com");
    expect(fetched?.role).toBe("Project Lead");
    expect(fetched?.status).toBe("pending");
  });

  it("should isolate board members so different boards have different teams", async () => {
    // Board 1 initial members
    const board1Members = await getBoardMembers("board-1");
    expect(board1Members.length).toBeGreaterThanOrEqual(1);

    // Create a new independent board with owner 'user-somchai'
    const newBoard = await createBoard("Mobile App Redesign", "user-somchai");
    const newBoardMembers = await getBoardMembers(newBoard.id);

    // The new board should only have its owner (user-somchai) initially
    expect(newBoardMembers.length).toBe(1);
    expect(newBoardMembers[0].id).toBe("user-somchai");
  });

  it("should add member to the board ONLY after the invite is accepted", async () => {
    const newBoard = await createBoard("Marketing Q4 Sprint", "user-somchai");
    const initialMembers = await getBoardMembers(newBoard.id);
    expect(initialMembers.length).toBe(1);

    // Send invite to teammate@company.com
    const invite = await createBoardInvitation(
      newBoard.id,
      "teammate@company.com",
      "Member",
      "user-somchai"
    );

    // Before accepting, the user is NOT in the board team
    const membersBefore = await getBoardMembers(newBoard.id);
    expect(membersBefore.length).toBe(1);

    // Accept the invitation
    const accepted = await acceptBoardInvitation(invite.token);
    expect(accepted.success).toBe(true);
    expect(accepted.board).toBeDefined();
    expect(accepted.user).toBeDefined();
    expect(accepted.user?.email).toBe("teammate@company.com");

    // After accepting, the user IS now in the board team
    const membersAfter = await getBoardMembers(newBoard.id);
    expect(membersAfter.length).toBe(2);
    expect(membersAfter.some((u) => u.email === "teammate@company.com")).toBe(true);

    // Other boards (e.g. board-1) should NOT be affected
    const board1Members = await getBoardMembers("board-1");
    expect(board1Members.some((u) => u.email === "teammate@company.com")).toBe(false);
  });

  it("should not allow accepting the same invitation multiple times", async () => {
    const invite = await createBoardInvitation(
      "board-1",
      "duplicate.test@example.com",
      "Member",
      "user-somchai"
    );

    const firstAccept = await acceptBoardInvitation(invite.token);
    expect(firstAccept.success).toBe(true);

    // Attempting to accept again should return failure
    const secondAccept = await acceptBoardInvitation(invite.token);
    expect(secondAccept.success).toBe(false);
  });
});

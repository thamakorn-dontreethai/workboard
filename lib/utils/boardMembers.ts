import type { Board, Workspace } from "@/types";

// A board's team is everyone in the workspace it belongs to, plus anyone
// explicitly added to the board and its owner. Workspace members are
// included automatically so a new member can be assigned / @mentioned on
// any board without a separate per-board invite.
export function getBoardMemberIds(board: Board, workspaces: Workspace[]): string[] {
  const workspace = workspaces.find((w) => w.id === board.workspaceId);
  return Array.from(
    new Set([
      board.ownerId,
      ...(board.memberIds ?? []),
      ...(workspace?.members ?? []).map((m) => m.userId),
    ])
  );
}

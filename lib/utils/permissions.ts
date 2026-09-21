import type { Board, Task, Workspace } from "@/types";

// The one rule set for "who may do what". Used by the API routes (to enforce
// it) and by the UI (to hide or disable what a person can't do anyway).
//
//   leader  = workspace owner/admin, or the board's own owner
//   member  = ordinary workspace member (or added to the board)
//   viewer  = read-only workspace member
//
//   manage  (leader only): create/delete items, assign people, priority, due
//           date, title/description, groups, boards, invitations
//   write   (leader, member): comment, attach files, use the checklist
//   status  (leader, or a member on an item assigned to them): change status
//   view    (anyone on the board, incl. viewers): harmless per-user tweaks
//           such as collapsing a group
export type BoardRole = "leader" | "member" | "viewer";
export type BoardAction = "manage" | "write" | "status" | "view";

export function resolveBoardRole(
  userId: string,
  board: Pick<Board, "ownerId" | "memberIds">,
  workspace: Pick<Workspace, "members"> | undefined | null
): BoardRole | null {
  if (board.ownerId === userId) return "leader";
  const membership = workspace?.members.find((m) => m.userId === userId);
  if (membership) {
    if (membership.role === "owner" || membership.role === "admin") return "leader";
    if (membership.role === "viewer") return "viewer";
    return "member";
  }
  if (board.memberIds?.includes(userId)) return "member";
  return null;
}

export function roleCan(
  role: BoardRole | null,
  action: BoardAction,
  task?: Pick<Task, "assigneeIds">,
  userId?: string
): boolean {
  if (role === "leader") return true;
  if (action === "view") return role !== null;
  if (role === "member") {
    if (action === "write") return true;
    if (action === "status") return Boolean(task && userId && task.assigneeIds?.includes(userId));
  }
  return false;
}

// What permission a task PATCH needs. Changing status also moves the card to
// the matching group, so the client sends `groupId` together with `status` —
// that combination is a "status" change; anything else needs "manage".
export function taskUpdateAction(body: Record<string, unknown>): "status" | "manage" {
  const keys = Object.keys(body).filter((k) => k !== "actorId");
  const allowed = keys.includes("status") ? ["status", "groupId"] : [];
  return keys.length > 0 && keys.every((k) => allowed.includes(k)) ? "status" : "manage";
}

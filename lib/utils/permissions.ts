import type { Board, Task, Workspace } from "@/types";

// The one rule set for "who may do what". Used by the API routes (to enforce
// it) and by the UI (to hide or disable what a person can't do anyway).
//
//   leader  = workspace owner/admin, or the board's own owner
//   member  = ordinary workspace member (or added to the board)
//   viewer  = read-only workspace member
//
//   manage  (leader only): delete items, priority, title/description,
//           groups, boards, invitations
//   create  (leader, member): add new items (choosing who works on them)
//   assign  (leader, member): set who works on an item
//   schedule (leader, member): set an item's order date / due date
//   write   (leader, member): comment, attach files, use the checklist
//   status  (leader, or a member on an item assigned to them): change status
//   view    (anyone on the board, incl. viewers): harmless per-user tweaks
//           such as collapsing a group
export type BoardRole = "leader" | "member" | "viewer";
export type BoardAction = "manage" | "create" | "assign" | "schedule" | "write" | "status" | "view";

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
    if (action === "write" || action === "create" || action === "assign" || action === "schedule") return true;
    if (action === "status") return Boolean(task && userId && task.assigneeIds?.includes(userId));
  }
  return false;
}

// What permission a task PATCH needs. Changing status or the due date can
// also move the card to the matching group, so the client sends `groupId`
// along with them — those combinations are a "status" / "schedule" change;
// anything else needs "manage".
export function taskUpdateAction(body: Record<string, unknown>): "status" | "schedule" | "manage" {
  const keys = Object.keys(body).filter((k) => k !== "actorId");
  const only = (allowed: string[]) => keys.length > 0 && keys.every((k) => allowed.includes(k));
  if (keys.includes("status") && only(["status", "groupId"])) return "status";
  if ((keys.includes("dueDate") || keys.includes("orderDate")) && only(["dueDate", "orderDate", "groupId"])) {
    return "schedule";
  }
  return "manage";
}

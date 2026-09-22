import { NextResponse } from "next/server";
import type { Board, Task } from "@/types";
import { getSessionUserId } from "./session";
import {
  getBoardById,
  getWorkspaceById,
  getTaskById,
  getGroups,
  getSubtasks,
} from "./db";

import {
  resolveBoardRole,
  roleCan,
  taskUpdateAction,
  type BoardAction,
  type BoardRole,
} from "@/lib/utils/permissions";

// Rules live in lib/utils/permissions.ts (shared with the UI). This file is
// the server side: identify the caller from the session cookie, load the
// board/workspace, and answer with 401/403/404.
export { taskUpdateAction, type BoardAction, type BoardRole };

export async function getBoardRole(userId: string, board: Board): Promise<BoardRole | null> {
  const workspace = await getWorkspaceById(board.workspaceId);
  return resolveBoardRole(userId, board, workspace);
}

const deny = (status: 401 | 403 | 404, error: string) =>
  ({ ok: false as const, response: NextResponse.json({ success: false, error }, { status }) });

export type AuthResult =
  | { ok: true; userId: string; role: BoardRole | null; board?: Board }
  | { ok: false; response: NextResponse };

// Just requires a signed-in user.
export function requireSession(request: Request): { ok: true; userId: string } | { ok: false; response: NextResponse } {
  const userId = getSessionUserId(request);
  return userId ? { ok: true, userId } : deny(401, "Please sign in");
}

export async function authorizeBoard(
  request: Request,
  boardId: string,
  action: BoardAction,
  task?: Pick<Task, "assigneeIds">
): Promise<AuthResult> {
  const session = requireSession(request);
  if (!session.ok) return session;

  const board = await getBoardById(boardId);
  if (!board) return deny(404, "Board not found");

  const role = await getBoardRole(session.userId, board);
  if (!roleCan(role, action, task, session.userId)) {
    return deny(
      403,
      action === "manage"
        ? "Only workspace owners and admins can do this"
        : action === "status"
        ? "You can only update the status of items assigned to you"
        : "You don't have permission to do this"
    );
  }
  return { ok: true, userId: session.userId, role, board };
}

// Workspace-level check (e.g. creating a board): owner/admin only.
export async function authorizeWorkspaceManage(request: Request, workspaceId: string | undefined): Promise<AuthResult> {
  const session = requireSession(request);
  if (!session.ok) return session;
  if (!workspaceId) return { ok: true, userId: session.userId, role: null };

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) return deny(404, "Workspace not found");
  const m = workspace.members.find((x) => x.userId === session.userId);
  if (!m || (m.role !== "owner" && m.role !== "admin")) {
    return deny(403, "Only workspace owners and admins can do this");
  }
  return { ok: true, userId: session.userId, role: "leader" };
}

// ─── Look-ups so routes that only get a child id can find their board ────────

export async function authorizeTask(request: Request, taskId: string, action: BoardAction): Promise<AuthResult & { task?: Task }> {
  const task = await getTaskById(taskId);
  if (!task) {
    const session = requireSession(request);
    return session.ok ? deny(404, "Task not found") : session;
  }
  const auth = await authorizeBoard(request, task.boardId, action, task);
  return auth.ok ? { ...auth, task } : auth;
}

export async function authorizeGroup(request: Request, groupId: string, action: BoardAction): Promise<AuthResult> {
  const group = (await getGroups()).find((g) => g.id === groupId);
  if (!group) {
    const session = requireSession(request);
    return session.ok ? deny(404, "Group not found") : session;
  }
  return authorizeBoard(request, group.boardId, action);
}

export async function authorizeSubtask(request: Request, subtaskId: string, action: BoardAction): Promise<AuthResult> {
  const subtask = (await getSubtasks()).find((s) => s.id === subtaskId);
  if (!subtask) {
    const session = requireSession(request);
    return session.ok ? deny(404, "Subtask not found") : session;
  }
  return authorizeTask(request, subtask.taskId, action);
}

// Workspace-level access. "view" = any member (e.g. recording last-viewed),
// "manage" = owner/admin (rename, colours, cover, privacy, members),
// "owner" = the workspace owner only (deleting it).
export async function authorizeWorkspace(
  request: Request,
  workspaceId: string,
  level: "view" | "manage" | "owner"
): Promise<AuthResult> {
  const session = requireSession(request);
  if (!session.ok) return session;

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) return deny(404, "Workspace not found");

  const role = workspace.members.find((m) => m.userId === session.userId)?.role;
  if (!role) return deny(403, "You are not a member of this workspace");
  if (level === "owner" && role !== "owner") {
    return deny(403, "Only the workspace owner can do this");
  }
  if (level === "manage" && role !== "owner" && role !== "admin") {
    return deny(403, "Only workspace owners and admins can do this");
  }
  return { ok: true, userId: session.userId, role: null };
}

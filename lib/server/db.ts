import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { sendAppointmentReminderEmail } from "./email";
import { hashPassword, verifyPassword } from "./auth";
import {
  generateLineLinkCode,
  LINE_LINK_CODE_TTL_MS,
  sendLineTaskNotification,
  sendLineMemberJoinedNotification,
  sendLineAppointmentReminder,
  buildTaskLink,
} from "./line";
import type { CommentAttachment } from "@/types";
import {
  Workspace,
  User,
  Board,
  Group,
  Task,
  Subtask,
  Comment,
  Activity,
  Notification,
  PersonalTodo,
  Post,
  Folder,
  WorkspaceFile,
  WorkspaceAppointment,
  Dashboard,
  DashboardWidgetId,
  TaskStatus,
  TaskPriority,
  BoardInvitation,
} from "@/types";
import {
  MOCK_WORKSPACE,
  MOCK_WORKSPACES,
  MOCK_USERS,
  MOCK_BOARDS,
  MOCK_GROUPS,
  MOCK_TASKS,
  MOCK_SUBTASKS,
  MOCK_COMMENTS,
  MOCK_ACTIVITIES,
  MOCK_NOTIFICATIONS,
  MOCK_PERSONAL_TODOS,
  MOCK_FOLDERS,
} from "@/lib/mock/data";

export interface DatabaseSchema {
  workspace: Workspace;
  workspaces?: Workspace[];
  users: User[];
  boards: Board[];
  groups: Group[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  activities: Activity[];
  notifications: Notification[];
  personalTodos?: PersonalTodo[];
  folders?: Folder[];
  invitations?: BoardInvitation[];
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", ".data")
  : path.join(process.cwd(), ".data");
const DB_FILE = process.env.VITEST
  ? path.join(DATA_DIR, "workboard.test.json")
  : path.join(DATA_DIR, "workboard.json");

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore in read-only environment
  }
}

function getInitialData(): DatabaseSchema {
  return {
    workspace: MOCK_WORKSPACE,
    workspaces: MOCK_WORKSPACES,
    users: MOCK_USERS,
    boards: MOCK_BOARDS,
    groups: MOCK_GROUPS,
    tasks: MOCK_TASKS,
    subtasks: MOCK_SUBTASKS,
    comments: MOCK_COMMENTS,
    activities: MOCK_ACTIVITIES,
    notifications: MOCK_NOTIFICATIONS,
    personalTodos: MOCK_PERSONAL_TODOS,
    folders: MOCK_FOLDERS,
    invitations: [],
  };
}

export function readDb(): DatabaseSchema {
  ensureDirectoryExists();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    writeDb(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    const workspacesList = data.workspaces && data.workspaces.length > 0
      ? data.workspaces
      : (data.workspace ? [data.workspace] : MOCK_WORKSPACES);

    return {
      workspace: data.workspace || workspacesList[0] || MOCK_WORKSPACE,
      workspaces: workspacesList,
      users: data.users || MOCK_USERS,
      boards: data.boards || MOCK_BOARDS,
      groups: data.groups || MOCK_GROUPS,
      tasks: (data.tasks || []).map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })),
      subtasks: (data.subtasks || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      })),
      comments: (data.comments || []).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      activities: (data.activities || []).map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
      })),
      notifications: (data.notifications || []).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      })),
      personalTodos: (data.personalTodos || []).map((t: any) => ({
        ...t,
        dueAt: t.dueAt ? new Date(t.dueAt) : null,
        reminderSentAt: t.reminderSentAt ? new Date(t.reminderSentAt) : null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })),
      folders: (data.folders || []).map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      })),
      invitations: (data.invitations || []).map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
        acceptedAt: i.acceptedAt ? new Date(i.acceptedAt) : undefined,
      })),
    };
  } catch {
    const initial = getInitialData();
    writeDb(initial);
    return initial;
  }
}

export function writeDb(data: DatabaseSchema): void {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // In serverless environments (Vercel), log warning and continue
    console.warn("writeDb to local filesystem failed (expected on serverless):", err);
  }
}

export function resetDb(): DatabaseSchema {
  const initial = getInitialData();
  writeDb(initial);
  return initial;
}

const isPrismaEnabled = Boolean(process.env.DATABASE_URL && !process.env.VITEST);

// ─── Workspace Operations ───────────────────────────────────────────────────
// Prisma-backed (Postgres) is the source of truth; the local JSON file is
// only a fallback for when the database is unreachable or in test mode.

function mapWorkspaceRow(row: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  plan: string;
  privacy: string;
  avatarColor: string;
  coverColor: string | null;
  isPinned: boolean;
  members: unknown;
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt: Date;
}): Workspace {
  const rawMembers = Array.isArray(row.members) ? row.members : [];
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    icon: row.icon || undefined,
    plan: (row.plan as Workspace["plan"]) || "Pro",
    privacy: (row.privacy as Workspace["privacy"]) || "open",
    avatarColor: row.avatarColor,
    coverColor: row.coverColor || undefined,
    isPinned: row.isPinned,
    members: rawMembers.map((m: any) => ({
      ...m,
      joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastViewedAt: row.lastViewedAt,
  };
}

// `userId`, when given, restricts the result to workspaces that user is
// actually a member of — omitting it returns every workspace, which is
// only appropriate for admin/internal use, never for populating a signed-in
// user's own workspace switcher (that was the bug: a brand-new user could
// see and act inside every pre-existing workspace in the database).
export async function getWorkspaces(userId?: string): Promise<Workspace[]> {
  let list: Workspace[];
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.workspace.findMany({ orderBy: { createdAt: "asc" } });
      // Return here unconditionally — an empty array is a legitimate,
      // correct answer (no workspaces exist yet), not a signal to fall
      // back to the stale local JSON file. Only a thrown error should.
      list = rows.map(mapWorkspaceRow);
    } catch (e) {
      console.warn("Prisma getWorkspaces fallback:", e);
      const db = readDb();
      list = db.workspaces || [db.workspace];
    }
  } else {
    const db = readDb();
    list = db.workspaces || [db.workspace];
  }

  if (!userId) return list;
  return list.filter((w) => w.members.some((m) => m.userId === userId));
}

export async function getWorkspace(userId?: string): Promise<Workspace | undefined> {
  const list = await getWorkspaces(userId);
  return list[0];
}

export async function getWorkspaceById(id: string): Promise<Workspace | undefined> {
  if (isPrismaEnabled) {
    try {
      const row = await prisma.workspace.findUnique({ where: { id } });
      if (row) return mapWorkspaceRow(row);
    } catch (e) {
      console.warn("Prisma getWorkspaceById fallback:", e);
    }
  }
  const db = readDb();
  const list = db.workspaces || [db.workspace];
  return list.find((w) => w.id === id);
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
  privacy?: "open" | "closed";
  avatarColor?: string;
  icon?: string;
  coverColor?: string;
  creatorId?: string;
}): Promise<Workspace> {
  const id = `ws-${Date.now()}`;
  const ownerId = data.creatorId || (await getUsers())[0]?.id || "user-somchai";
  const members = [
    { userId: ownerId, workspaceId: id, role: "owner" as const, joinedAt: new Date() },
  ];

  if (isPrismaEnabled) {
    try {
      const row = await prisma.workspace.create({
        data: {
          id,
          name: data.name,
          description: data.description || "",
          privacy: data.privacy || "open",
          avatarColor: data.avatarColor || "bg-indigo-600",
          icon: data.icon,
          coverColor: data.coverColor,
          members: members as any,
        },
      });
      return mapWorkspaceRow(row);
    } catch (e) {
      console.warn("Prisma createWorkspace fallback:", e);
    }
  }

  const db = readDb();
  const newWorkspace: Workspace = {
    id,
    name: data.name,
    description: data.description || "",
    plan: "Pro",
    privacy: data.privacy || "open",
    avatarColor: data.avatarColor || "bg-indigo-600",
    icon: data.icon,
    coverColor: data.coverColor,
    isPinned: false,
    members,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastViewedAt: new Date(),
  };
  db.workspaces = [...(db.workspaces || [db.workspace]), newWorkspace];
  db.workspace = newWorkspace;
  writeDb(db);
  return newWorkspace;
}

export async function updateWorkspace(
  id: string,
  updates: Partial<Workspace>
): Promise<Workspace> {
  // Defense in depth alongside the client-side check: a `members` update
  // that would drop whoever currently holds "owner" is refused outright —
  // there's no ownership-transfer flow yet, so that would leave the
  // workspace ownerless. This guards the API directly, not just the UI.
  if (updates.members) {
    const current = await getWorkspaceById(id);
    if (current) {
      const currentOwnerIds = current.members
        .filter((m) => m.role === "owner")
        .map((m) => m.userId);
      const nextIds = new Set(updates.members.map((m) => m.userId));
      if (currentOwnerIds.some((oid) => !nextIds.has(oid))) {
        throw new Error("Cannot remove the workspace owner.");
      }
    }
  }

  if (isPrismaEnabled) {
    try {
      const row = await prisma.workspace.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.privacy !== undefined && { privacy: updates.privacy }),
          ...(updates.avatarColor !== undefined && { avatarColor: updates.avatarColor }),
          ...(updates.icon !== undefined && { icon: updates.icon }),
          ...(updates.coverColor !== undefined && { coverColor: updates.coverColor }),
          ...(updates.isPinned !== undefined && { isPinned: updates.isPinned }),
          ...(updates.members !== undefined && { members: updates.members as any }),
          ...(updates.lastViewedAt !== undefined && { lastViewedAt: updates.lastViewedAt }),
        },
      });
      return mapWorkspaceRow(row);
    } catch (e) {
      console.warn("Prisma updateWorkspace fallback:", e);
    }
  }

  const db = readDb();
  const list = db.workspaces || [db.workspace];
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error("Workspace not found");
  const updated: Workspace = { ...list[idx], ...updates, updatedAt: new Date() };
  list[idx] = updated;
  db.workspaces = list;
  if (db.workspace.id === id) db.workspace = updated;
  writeDb(db);
  return updated;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  // No system-wide "keep at least one workspace" guard — that counted
  // every workspace across every user, which was never the right check
  // (and blocked users from deleting their own sole workspace even though
  // plenty of other workspaces existed system-wide, just none of them
  // theirs).
  if (isPrismaEnabled) {
    try {
      await prisma.workspace.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn("Prisma deleteWorkspace fallback:", e);
    }
  }

  const db = readDb();
  const list = db.workspaces || [db.workspace];
  db.workspaces = list.filter((w) => w.id !== id);
  if (db.workspace.id === id) db.workspace = db.workspaces[0];
  writeDb(db);
  return true;
}

export async function togglePinWorkspace(id: string): Promise<Workspace> {
  const target = await getWorkspaceById(id);
  if (!target) throw new Error("Workspace not found");
  return updateWorkspace(id, { isPinned: !target.isPinned });
}

// ─── Users Operations ────────────────────────────────────────────────────────

// Row shape shared by the user reads below. The uploaded photo lives in
// `User.avatarUrl` as a base64 data URL, which is far too big to ship inside
// every payload that happens to mention a person — a single one can dwarf the
// rest of the response. So it is never selected here: the queries ask only
// whether a photo exists, and callers get a link to the route that serves it
// (the same trick comment attachments use).
type UserRow = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  hasAvatar: boolean;
  role: string;
  isActive: boolean;
  notifyPostLikes: boolean;
  notifyPostComments: boolean;
  notifyNewPosts: boolean;
  updatedAt: Date;
};

const USER_COLUMNS = Prisma.sql`
  u.id, u.name, u.email, u."avatarInitials", u."avatarColor", u.role, u."isActive",
  u."notifyPostLikes", u."notifyPostComments", u."notifyNewPosts", u."updatedAt",
  (u."avatarUrl" IS NOT NULL) AS "hasAvatar"
`;

function mapUserRow(u: UserRow): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarInitials: u.avatarInitials,
    avatarColor: u.avatarColor,
    // Versioned by updatedAt so a newly uploaded photo isn't masked by the
    // previous one sitting in the browser cache.
    avatarUrl: u.hasAvatar
      ? `/api/users/${u.id}/avatar?v=${new Date(u.updatedAt).getTime()}`
      : null,
    role: u.role,
    isActive: u.isActive,
    notifyPostLikes: u.notifyPostLikes,
    notifyPostComments: u.notifyPostComments,
    notifyNewPosts: u.notifyNewPosts,
  };
}

export async function getUsers(): Promise<User[]> {
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.$queryRaw<UserRow[]>`
        SELECT ${USER_COLUMNS} FROM "User" u WHERE u."isActive" = true
      `;
      // An empty array is a legitimate answer, not a signal to fall back.
      return rows.map(mapUserRow);
    } catch (e) {
      console.warn("Prisma getUsers fallback:", e);
    }
  }
  return readDb().users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.$queryRaw<UserRow[]>`
        SELECT ${USER_COLUMNS} FROM "User" u WHERE u.id = ${id}
      `;
      if (rows[0]) return mapUserRow(rows[0]);
    } catch (e) {
      console.warn("Prisma getUserById fallback:", e);
    }
  }
  return readDb().users.find((u) => u.id === id);
}

// Server-side only: the stored data URL for the avatar route to decode.
export async function getUserAvatarDataUrl(id: string): Promise<string | null> {
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.$queryRaw<{ avatarUrl: string | null }[]>`
        SELECT u."avatarUrl" FROM "User" u WHERE u.id = ${id}
      `;
      return rows[0]?.avatarUrl ?? null;
    } catch (e) {
      console.warn("Prisma getUserAvatarDataUrl failed:", e);
      return null;
    }
  }
  return readDb().users.find((u) => u.id === id)?.avatarUrl ?? null;
}

export async function createUser(userData: {
  name: string;
  email: string;
  role: string;
}): Promise<User> {
  const colors = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-blue-600",
    "bg-purple-600",
    "bg-amber-600",
    "bg-rose-600",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const initials = userData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    avatarInitials: initials || "U",
    avatarColor: color,
    role: userData.role || "Member",
    isActive: true,
  };

  if (isPrismaEnabled) {
    try {
      await prisma.user.create({
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarInitials: newUser.avatarInitials,
          avatarColor: newUser.avatarColor,
          role: newUser.role,
          isActive: true,
        },
      });
    } catch (e) {
      console.warn("Prisma createUser fallback:", e);
    }
  }

  const db = readDb();
  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

// ─── Boards Operations ───────────────────────────────────────────────────────

export async function getBoards(): Promise<Board[]> {
  if (isPrismaEnabled) {
    try {
      const boards = await prisma.board.findMany({
        where: { isArchived: false },
        include: { groups: true },
        orderBy: { createdAt: "asc" },
      });
      // An empty array is a legitimate answer, not a signal to fall back.
      return boards.map((b) => {
        const rawMemberIds = (b as any).memberIds;
        const memberIds =
          Array.isArray(rawMemberIds) && rawMemberIds.length > 0
            ? rawMemberIds
            : [b.ownerId];
        return {
          id: b.id,
          workspaceId: b.workspaceId,
          folderId: (b as any).folderId || undefined,
          name: b.name,
          description: b.description || "",
          type: (b.type as any) || "general",
          color: b.color,
          privacy: (b as any).privacy || "main",
          ownerId: b.ownerId,
          memberIds,
          groupIds: b.groups.map((g) => g.id),
          isArchived: b.isArchived,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          lastViewedAt: b.lastViewedAt,
        };
      });
    } catch (e) {
      console.warn("Prisma getBoards fallback:", e);
    }
  }
  return readDb().boards.filter((b) => !b.isArchived);
}

export async function getBoardById(id: string): Promise<Board | undefined> {
  if (isPrismaEnabled) {
    try {
      const b = await prisma.board.findUnique({
        where: { id },
        include: { groups: true },
      });
      if (b && !b.isArchived) {
        const rawMemberIds = (b as any).memberIds;
        const memberIds =
          Array.isArray(rawMemberIds) && rawMemberIds.length > 0
            ? rawMemberIds
            : [b.ownerId];
        return {
          id: b.id,
          workspaceId: b.workspaceId,
          folderId: (b as any).folderId || undefined,
          name: b.name,
          description: b.description || "",
          type: (b.type as any) || "general",
          color: b.color,
          ownerId: b.ownerId,
          memberIds,
          groupIds: b.groups.map((g) => g.id),
          isArchived: b.isArchived,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          lastViewedAt: b.lastViewedAt,
        };
      }
    } catch (e) {
      console.warn("Prisma getBoardById fallback:", e);
    }
  }
  return readDb().boards.find((b) => b.id === id);
}

export async function createBoard(
  dataOrName:
    | {
        name: string;
        description?: string;
        type?: Board["type"];
        color?: string;
        ownerId?: string;
        workspaceId?: string;
        privacy?: Board["privacy"];
      }
    | string,
  ownerId?: string
): Promise<Board> {
  const data =
    typeof dataOrName === "string"
      ? { name: dataOrName, ownerId }
      : dataOrName;

  const db = readDb();
  const owner = data.ownerId || db.users[0]?.id || "user-somchai";
  // Bug fixed: this used to silently ignore the caller's workspaceId and
  // always attach the board to whatever workspace happened to be in the
  // local JSON fallback file — meaning a board created for workspace B
  // could end up filed under workspace A instead.
  const workspaceId = data.workspaceId || db.workspace.id;
  const newBoard: Board = {
    id: `board-${Date.now()}`,
    workspaceId,
    name: data.name,
    description: data.description || "",
    type: data.type || "general",
    color: data.color || "bg-blue-500",
    privacy: data.privacy || "main",
    ownerId: owner,
    memberIds: [owner],
    groupIds: [],
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastViewedAt: new Date(),
  };

  const initialGroup: Group = {
    id: `group-${Date.now()}`,
    boardId: newBoard.id,
    name: "Active Items",
    color: "#0073ea",
    order: 0,
    isCollapsed: false,
    taskIds: [],
    createdAt: new Date(),
  };

  newBoard.groupIds = [initialGroup.id];

  if (isPrismaEnabled) {
    try {
      await prisma.board.create({
        data: {
          id: newBoard.id,
          workspaceId: newBoard.workspaceId,
          name: newBoard.name,
          description: newBoard.description,
          type: newBoard.type,
          color: newBoard.color,
          privacy: newBoard.privacy,
          ownerId: newBoard.ownerId,
          isArchived: false,
          groups: {
            create: {
              id: initialGroup.id,
              name: initialGroup.name,
              color: initialGroup.color,
              order: 0,
              isCollapsed: false,
            },
          },
        },
      });
    } catch (e) {
      console.warn("Prisma createBoard fallback:", e);
    }
  }

  db.boards.push(newBoard);
  db.groups.push(initialGroup);
  writeDb(db);
  return newBoard;
}

export async function updateBoard(
  id: string,
  updates: Partial<Pick<Board, "name" | "description" | "color" | "isArchived" | "folderId">>
): Promise<Board | null> {
  if (isPrismaEnabled) {
    try {
      const updated = await prisma.board.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && {
            description: updates.description,
          }),
          ...(updates.color && { color: updates.color }),
          ...(updates.isArchived !== undefined && {
            isArchived: updates.isArchived,
          }),
          ...(updates.folderId !== undefined && {
            folderId: updates.folderId || null,
          }),
        },
        include: { groups: true },
      });
      return {
        id: updated.id,
        workspaceId: updated.workspaceId,
        folderId: (updated as any).folderId || undefined,
        name: updated.name,
        description: updated.description || "",
        type: (updated.type as any) || "general",
        color: updated.color,
        ownerId: updated.ownerId,
        memberIds: [],
        groupIds: updated.groups.map((g) => g.id),
        isArchived: updated.isArchived,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        lastViewedAt: updated.lastViewedAt,
      };
    } catch (e) {
      console.warn("Prisma updateBoard fallback:", e);
    }
  }

  const db = readDb();
  const idx = db.boards.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  db.boards[idx] = {
    ...db.boards[idx],
    ...updates,
    updatedAt: new Date(),
  };
  writeDb(db);
  return db.boards[idx];
}

export async function deleteBoard(id: string): Promise<boolean> {
  let prismaSuccess = false;
  if (isPrismaEnabled) {
    try {
      await prisma.board.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date() },
      });
      prismaSuccess = true;
    } catch (e) {
      console.warn("Prisma deleteBoard fallback:", e);
    }
  }

  const db = readDb();
  const idx = db.boards.findIndex((b) => b.id === id);
  if (idx !== -1) {
    db.boards[idx].isArchived = true;
    writeDb(db);
    return true;
  }
  return prismaSuccess;
}

// ─── Folder Operations (organize boards within a workspace) ────────────────

export async function getFolders(workspaceId?: string): Promise<Folder[]> {
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.folder.findMany({
        where: workspaceId ? { workspaceId } : undefined,
        orderBy: { createdAt: "asc" },
      });
      return rows.map((f) => ({
        id: f.id,
        workspaceId: f.workspaceId,
        name: f.name,
        color: f.color,
        isCollapsed: f.isCollapsed,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }));
    } catch (e) {
      console.warn("Prisma getFolders fallback:", e);
    }
  }

  const db = readDb();
  const list = db.folders || [];
  return workspaceId ? list.filter((f) => f.workspaceId === workspaceId) : list;
}

export async function createFolder(data: {
  workspaceId: string;
  name: string;
  color?: string;
}): Promise<Folder> {
  const id = `folder-${Date.now()}`;
  const now = new Date();
  const newFolder: Folder = {
    id,
    workspaceId: data.workspaceId,
    name: data.name,
    color: data.color || "text-amber-400",
    isCollapsed: false,
    createdAt: now,
    updatedAt: now,
  };

  if (isPrismaEnabled) {
    try {
      const row = await prisma.folder.create({
        data: {
          id,
          workspaceId: newFolder.workspaceId,
          name: newFolder.name,
          color: newFolder.color,
        },
      });
      return {
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        color: row.color,
        isCollapsed: row.isCollapsed,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (e) {
      console.warn("Prisma createFolder fallback:", e);
    }
  }

  const db = readDb();
  db.folders = [...(db.folders || []), newFolder];
  writeDb(db);
  return newFolder;
}

export async function updateFolder(
  id: string,
  updates: Partial<Pick<Folder, "name" | "color" | "isCollapsed">>
): Promise<Folder | null> {
  if (isPrismaEnabled) {
    try {
      const row = await prisma.folder.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.color !== undefined && { color: updates.color }),
          ...(updates.isCollapsed !== undefined && { isCollapsed: updates.isCollapsed }),
        },
      });
      return {
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        color: row.color,
        isCollapsed: row.isCollapsed,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (e) {
      console.warn("Prisma updateFolder fallback:", e);
    }
  }

  const db = readDb();
  const folder = (db.folders || []).find((f) => f.id === id);
  if (!folder) return null;
  Object.assign(folder, updates, { updatedAt: new Date() });
  writeDb(db);
  return folder;
}

// Moves every board out of a folder (sets folderId to null) without
// deleting the folder itself — the "empty this folder" action.
export async function emptyFolder(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.board.updateMany({
        where: { folderId: id },
        data: { folderId: null },
      });
    } catch (e) {
      console.warn("Prisma emptyFolder fallback:", e);
    }
  }

  const db = readDb();
  db.boards.forEach((b) => {
    if (b.folderId === id) b.folderId = undefined;
  });
  writeDb(db);
  return true;
}

export async function deleteFolder(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      // onDelete: SetNull on Board.folderId means Postgres automatically
      // moves every board in this folder back out, rather than deleting
      // them — a folder is just organization, not ownership.
      await prisma.folder.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn("Prisma deleteFolder fallback:", e);
    }
  }

  const db = readDb();
  db.boards.forEach((b) => {
    if (b.folderId === id) b.folderId = undefined;
  });
  const before = (db.folders || []).length;
  db.folders = (db.folders || []).filter((f) => f.id !== id);
  writeDb(db);
  return (db.folders || []).length < before;
}

// ─── Groups Operations ───────────────────────────────────────────────────────

export async function getGroups(boardId?: string): Promise<Group[]> {
  if (isPrismaEnabled) {
    try {
      const groups = await prisma.group.findMany({
        where: boardId ? { boardId } : undefined,
        // taskIds below needs the ids, not the whole task rows.
        include: { tasks: { where: { isArchived: false }, select: { id: true } } },
        orderBy: { order: "asc" },
      });
      return groups.map((g) => ({
        id: g.id,
        boardId: g.boardId,
        name: g.name,
        color: g.color,
        order: g.order,
        isCollapsed: g.isCollapsed,
        taskIds: g.tasks.map((t) => t.id),
        createdAt: g.createdAt,
      }));
    } catch (e) {
      console.warn("Prisma getGroups fallback:", e);
    }
  }

  const db = readDb();
  if (boardId) {
    return db.groups.filter((g) => g.boardId === boardId);
  }
  return db.groups;
}

export async function createGroup(data: {
  boardId: string;
  name: string;
  color?: string;
}): Promise<Group> {
  const db = readDb();
  const boardGroups = db.groups.filter((g) => g.boardId === data.boardId);

  const newGroup: Group = {
    id: `group-${Date.now()}`,
    boardId: data.boardId,
    name: data.name,
    color: data.color || "#0073ea",
    order: boardGroups.length,
    isCollapsed: false,
    taskIds: [],
    createdAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await prisma.group.create({
        data: {
          id: newGroup.id,
          boardId: newGroup.boardId,
          name: newGroup.name,
          color: newGroup.color,
          order: newGroup.order,
          isCollapsed: false,
        },
      });
    } catch (e) {
      console.warn("Prisma createGroup fallback:", e);
    }
  }

  db.groups.push(newGroup);
  const board = db.boards.find((b) => b.id === data.boardId);
  if (board) {
    board.groupIds.push(newGroup.id);
  }

  writeDb(db);
  return newGroup;
}

export async function updateGroup(
  id: string,
  updates: Partial<Pick<Group, "name" | "color" | "isCollapsed" | "order">>
): Promise<Group | null> {
  if (isPrismaEnabled) {
    try {
      const g = await prisma.group.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.color && { color: updates.color }),
          ...(updates.isCollapsed !== undefined && {
            isCollapsed: updates.isCollapsed,
          }),
          ...(updates.order !== undefined && { order: updates.order }),
        },
        include: { tasks: { where: { isArchived: false } } },
      });
      return {
        id: g.id,
        boardId: g.boardId,
        name: g.name,
        color: g.color,
        order: g.order,
        isCollapsed: g.isCollapsed,
        taskIds: g.tasks.map((t) => t.id),
        createdAt: g.createdAt,
      };
    } catch (e) {
      console.warn("Prisma updateGroup fallback:", e);
    }
  }

  const db = readDb();
  const idx = db.groups.findIndex((g) => g.id === id);
  if (idx === -1) return null;

  db.groups[idx] = { ...db.groups[idx], ...updates };
  writeDb(db);
  return db.groups[idx];
}

export async function deleteGroup(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.group.delete({ where: { id } });
    } catch (e) {
      console.warn("Prisma deleteGroup fallback:", e);
    }
  }

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) return false;

  db.groups = db.groups.filter((g) => g.id !== id);
  db.tasks = db.tasks.filter((t) => t.groupId !== id);

  const board = db.boards.find((b) => b.id === group.boardId);
  if (board) {
    board.groupIds = board.groupIds.filter((gid) => gid !== id);
  }

  writeDb(db);
  return true;
}

// ─── Tasks Operations ────────────────────────────────────────────────────────

export async function getTasks(filter?: {
  boardId?: string;
  groupId?: string;
  assigneeId?: string; // matches tasks where this person is one of the assignees
  status?: TaskStatus;
}): Promise<Task[]> {
  if (isPrismaEnabled) {
    try {
      const where = {
        isArchived: false,
        ...(filter?.boardId && { boardId: filter.boardId }),
        ...(filter?.groupId && { groupId: filter.groupId }),
        ...(filter?.assigneeId && { assigneeIds: { has: filter.assigneeId } }),
        ...(filter?.status && { status: filter.status }),
      };

      // Only the *ids* of the related rows are ever used below, so fetch them
      // as flat id/taskId pairs in parallel instead of `include`-ing whole
      // rows. Including them pulled every comment's base64 attachments along
      // for the ride, which is what made this list take the better part of a
      // minute; the four parallel queries land in a couple of seconds.
      const [tasks, subtaskRefs, commentRefs, activityRefs] = await Promise.all([
        prisma.task.findMany({ where, orderBy: { order: "asc" } }),
        prisma.subtask.findMany({ select: { id: true, taskId: true } }),
        prisma.comment.findMany({ select: { id: true, taskId: true } }),
        prisma.activity.findMany({ select: { id: true, taskId: true } }),
      ]);

      const groupByTask = (refs: { id: string; taskId: string | null }[]) => {
        const map = new Map<string, string[]>();
        for (const r of refs) {
          if (!r.taskId) continue;
          const list = map.get(r.taskId);
          if (list) list.push(r.id);
          else map.set(r.taskId, [r.id]);
        }
        return map;
      };
      const subtasksByTask = groupByTask(subtaskRefs);
      const commentsByTask = groupByTask(commentRefs);
      const activitiesByTask = groupByTask(activityRefs);

      return tasks.map((t) => ({
        id: t.id,
        itemCode: t.itemCode,
        boardId: t.boardId,
        groupId: t.groupId,
        title: t.title,
        description: t.description || "",
        status: (t.status as any) || "todo",
        priority: (t.priority as any) || "medium",
        assigneeIds: t.assigneeIds,
        reporterId: t.reporterId,
        dueDate: t.dueDate,
        category: t.category,
        tags: [],
        subtaskIds: subtasksByTask.get(t.id) ?? [],
        commentIds: commentsByTask.get(t.id) ?? [],
        attachmentIds: [],
        activityIds: activitiesByTask.get(t.id) ?? [],
        order: t.order,
        isArchived: t.isArchived,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch (e) {
      console.warn("Prisma getTasks fallback:", e);
    }
  }

  const db = readDb();
  let result = db.tasks.filter((t) => !t.isArchived);

  if (filter?.boardId) {
    result = result.filter((t) => t.boardId === filter.boardId);
  }
  if (filter?.groupId) {
    result = result.filter((t) => t.groupId === filter.groupId);
  }
  if (filter?.assigneeId) {
    result = result.filter((t) => (t.assigneeIds || []).includes(filter.assigneeId!));
  }
  if (filter?.status) {
    result = result.filter((t) => t.status === filter.status);
  }

  return result.sort((a, b) => a.order - b.order);
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  if (isPrismaEnabled) {
    try {
      const t = await prisma.task.findUnique({
        where: { id },
        // Only the relation ids are read below — selecting whole rows drags
        // each comment's base64 attachments along with them.
        include: {
          subtasks: { select: { id: true } },
          comments: { select: { id: true } },
          activities: { select: { id: true } },
        },
      });
      if (t && !t.isArchived) {
        return {
          id: t.id,
          itemCode: t.itemCode,
          boardId: t.boardId,
          groupId: t.groupId,
          title: t.title,
          description: t.description || "",
          status: (t.status as any) || "todo",
          priority: (t.priority as any) || "medium",
          assigneeIds: t.assigneeIds,
          reporterId: t.reporterId,
          dueDate: t.dueDate,
          category: t.category,
          tags: [],
          subtaskIds: t.subtasks.map((s) => s.id),
          commentIds: t.comments.map((c) => c.id),
          attachmentIds: [],
          activityIds: t.activities.map((a) => a.id),
          order: t.order,
          isArchived: t.isArchived,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      }
    } catch (e) {
      console.warn("Prisma getTaskById fallback:", e);
    }
  }

  return readDb().tasks.find((t) => t.id === id && !t.isArchived);
}

export async function createTask(data: {
  title: string;
  description?: string;
  boardId: string;
  groupId: string;
  assigneeIds?: string[];
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date | null;
  category?: string;
  reporterId?: string;
}): Promise<Task> {
  const db = readDb();

  const prefix =
    data.boardId === "board-requests"
      ? "REQ"
      : data.boardId === "board-marketing"
      ? "MKT"
      : data.boardId === "board-roadmap"
      ? "OKR"
      : "WB";

  const num = Math.floor(Math.random() * 900) + 100;
  const groupTasks = db.tasks.filter((t) => t.groupId === data.groupId);

  const newTask: Task = {
    id: `task-${Date.now()}`,
    itemCode: `${prefix}-${num}`,
    boardId: data.boardId,
    groupId: data.groupId,
    title: data.title.trim(),
    description: data.description || "",
    status: data.status || "todo",
    priority: data.priority || "medium",
    assigneeIds: data.assigneeIds || [],
    reporterId: data.reporterId || db.users[0]?.id || "user-somchai",
    dueDate: data.dueDate || null,
    category: data.category || "General",
    tags: [],
    subtaskIds: [],
    commentIds: [],
    attachmentIds: [],
    activityIds: [],
    order: groupTasks.length,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const activityId = `act-${Date.now()}`;
  const activity: Activity = {
    id: activityId,
    taskId: newTask.id,
    boardId: newTask.boardId,
    actorId: newTask.reporterId,
    type: "task_created",
    description: `created item "${newTask.title}"`,
    createdAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await prisma.task.create({
        data: {
          id: newTask.id,
          itemCode: newTask.itemCode || `WB-${num}`,
          boardId: newTask.boardId,
          groupId: newTask.groupId,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          assigneeIds: newTask.assigneeIds,
          reporterId: newTask.reporterId,
          dueDate: newTask.dueDate,
          category: newTask.category,
          order: newTask.order,
          isArchived: false,
          activities: {
            create: {
              id: activity.id,
              boardId: activity.boardId,
              actorId: activity.actorId,
              type: activity.type,
              description: activity.description,
            },
          },
        },
      });
    } catch (e) {
      console.warn("Prisma createTask fallback:", e);
    }
  }

  db.tasks.unshift(newTask);
  const group = db.groups.find((g) => g.id === data.groupId);
  if (group) {
    group.taskIds.push(newTask.id);
  }

  db.activities.unshift(activity);
  newTask.activityIds.push(activity.id);

  writeDb(db);
  return newTask;
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "status"
      | "priority"
      | "dueDate"
      | "category"
      | "groupId"
      | "order"
    >
  >,
  actorId?: string
): Promise<Task | null> {
  const db = readDb();
  const effectiveActorId = actorId || db.users[0]?.id || "user-somchai";

  if (isPrismaEnabled) {
    try {
      const updated = await prisma.task.update({
        where: { id },
        data: {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && {
            description: updates.description,
          }),
          ...(updates.status && { status: updates.status }),
          ...(updates.priority && { priority: updates.priority }),
          ...(updates.dueDate !== undefined && {
            dueDate: updates.dueDate,
            dueSoonReminderSentAt: null,
            overdueReminderSentAt: null,
          } as any),
          ...(updates.category && { category: updates.category }),
          ...(updates.groupId && { groupId: updates.groupId }),
          ...(updates.order !== undefined && { order: updates.order }),
        },
        // Only the relation ids are read below — selecting whole rows drags
        // each comment's base64 attachments along with them.
        include: {
          subtasks: { select: { id: true } },
          comments: { select: { id: true } },
          activities: { select: { id: true } },
        },
      });

      if (updates.status) {
        await prisma.activity.create({
          data: {
            id: `act-${Date.now()}`,
            taskId: id,
            boardId: updated.boardId,
            actorId: effectiveActorId,
            type: "status_changed",
            description: `changed status to ${updates.status}`,
          },
        }).catch(() => {});
      }

      return {
        id: updated.id,
        itemCode: updated.itemCode,
        boardId: updated.boardId,
        groupId: updated.groupId,
        title: updated.title,
        description: updated.description || "",
        status: (updated.status as any) || "todo",
        priority: (updated.priority as any) || "medium",
        assigneeIds: updated.assigneeIds,
        reporterId: updated.reporterId,
        dueDate: updated.dueDate,
        category: updated.category,
        tags: [],
        subtaskIds: updated.subtasks.map((s) => s.id),
        commentIds: updated.comments.map((c) => c.id),
        attachmentIds: [],
        activityIds: updated.activities.map((a) => a.id),
        order: updated.order,
        isArchived: updated.isArchived,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (e) {
      console.warn("Prisma updateTask fallback:", e);
    }
  }

  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const oldTask = db.tasks[idx];

  // Check if status changed
  if (updates.status && updates.status !== oldTask.status) {
    const act: Activity = {
      id: `act-${Date.now()}`,
      taskId: id,
      boardId: oldTask.boardId,
      actorId: effectiveActorId,
      type: "status_changed",
      description: `changed status from ${oldTask.status} to ${updates.status}`,
      createdAt: new Date(),
    };
    db.activities.unshift(act);
    oldTask.activityIds.push(act.id);
  }

  db.tasks[idx] = {
    ...oldTask,
    ...updates,
    updatedAt: new Date(),
  };

  writeDb(db);
  return db.tasks[idx];
}

export async function assignTask(
  taskId: string,
  newAssigneeIds: string[],
  actorId?: string
): Promise<Task | null> {
  if (isPrismaEnabled) {
    try {
      const before = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assigneeIds: true },
      });
      const previousIds = before?.assigneeIds || [];

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { assigneeIds: newAssigneeIds },
        include: {
          subtasks: { select: { id: true } },
          comments: { select: { id: true } },
          activities: { select: { id: true } },
          board: { select: { name: true } },
        },
      });

      const effectiveActorId = actorId || updated.reporterId;
      const addedIds = newAssigneeIds.filter((id) => !previousIds.includes(id));
      const removedIds = previousIds.filter((id) => !newAssigneeIds.includes(id));

      if (addedIds.length > 0 || removedIds.length > 0) {
        const [addedUsers, removedUsers] = await Promise.all([
          addedIds.length > 0
            ? prisma.user.findMany({ where: { id: { in: addedIds } } })
            : Promise.resolve([]),
          removedIds.length > 0
            ? prisma.user.findMany({ where: { id: { in: removedIds } } })
            : Promise.resolve([]),
        ]);
        const parts: string[] = [];
        if (addedUsers.length) parts.push(`assigned to ${addedUsers.map((u) => u.name).join(", ")}`);
        if (removedUsers.length) parts.push(`removed ${removedUsers.map((u) => u.name).join(", ")}`);

        await prisma.activity.create({
          data: {
            id: `act-${Date.now()}`,
            taskId,
            boardId: updated.boardId,
            actorId: effectiveActorId,
            type: "assignee_changed",
            description: parts.join("; ") || "updated assignees",
          },
        }).catch(() => {});

        // Only the newly added people get notified — not everyone who
        // stays on the task, and never the person making the change.
        await Promise.all(
          addedIds
            .filter((id) => id !== effectiveActorId)
            .map((id) =>
              prisma.notification.create({
                data: {
                  id: `notif-${Date.now()}-${id}`,
                  userId: id,
                  type: "assignment",
                  title: "New Task Assigned",
                  body: `You were assigned to "${updated.title}"`,
                  taskId: updated.id,
                  boardId: updated.boardId,
                },
              }).catch(() => {})
            )
        );

        // Same event, LINE channel — only for people who linked their
        // account (see lib/server/line.ts); silently skipped otherwise.
        await Promise.all(
          addedUsers
            .filter((u) => u.id !== effectiveActorId && (u as any).lineUserId)
            .map((u) =>
              sendLineTaskNotification((u as any).lineUserId, {
                headerColor: "#0073EA",
                headerLabel: "งานใหม่ที่ได้รับมอบหมาย",
                emoji: "📋",
                taskTitle: updated.title,
                boardName: (updated as any).board?.name,
                dueLabel: updated.dueDate ? bangkokDateLabel(updated.dueDate) : undefined,
                link: buildTaskLink(updated.id),
                altText: `งานใหม่ที่ได้รับมอบหมาย: ${updated.title}`,
              }).catch(() => {})
            )
        );
      }

      return {
        id: updated.id,
        itemCode: updated.itemCode,
        boardId: updated.boardId,
        groupId: updated.groupId,
        title: updated.title,
        description: updated.description || "",
        status: (updated.status as any) || "todo",
        priority: (updated.priority as any) || "medium",
        assigneeIds: updated.assigneeIds,
        reporterId: updated.reporterId,
        dueDate: updated.dueDate,
        category: updated.category,
        tags: [],
        subtaskIds: updated.subtasks.map((s) => s.id),
        commentIds: updated.comments.map((c) => c.id),
        attachmentIds: [],
        activityIds: updated.activities.map((a) => a.id),
        order: updated.order,
        isArchived: updated.isArchived,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (e) {
      console.warn("Prisma assignTask fallback:", e);
    }
  }

  const db = readDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const effectiveActorId = actorId || db.users[0]?.id || "user-somchai";
  const previousIds = task.assigneeIds || [];
  const addedIds = newAssigneeIds.filter((id) => !previousIds.includes(id));
  const removedIds = previousIds.filter((id) => !newAssigneeIds.includes(id));
  const addedUsers = db.users.filter((u) => addedIds.includes(u.id));
  const removedUsers = db.users.filter((u) => removedIds.includes(u.id));

  task.assigneeIds = newAssigneeIds;
  task.updatedAt = new Date();

  if (addedIds.length > 0 || removedIds.length > 0) {
    const parts: string[] = [];
    if (addedUsers.length) parts.push(`assigned to ${addedUsers.map((u) => u.name).join(", ")}`);
    if (removedUsers.length) parts.push(`removed ${removedUsers.map((u) => u.name).join(", ")}`);

    const act: Activity = {
      id: `act-${Date.now()}`,
      taskId,
      boardId: task.boardId,
      actorId: effectiveActorId,
      type: "assignee_changed",
      description: parts.join("; ") || "updated assignees",
      createdAt: new Date(),
    };
    db.activities.unshift(act);
    task.activityIds.push(act.id);

    addedIds
      .filter((id) => id !== effectiveActorId)
      .forEach((id) => {
        const notif: Notification = {
          id: `notif-${Date.now()}-${id}`,
          userId: id,
          type: "assignment",
          title: "New Task Assigned",
          body: `You were assigned to "${task.title}"`,
          taskId: task.id,
          boardId: task.boardId,
          isRead: false,
          createdAt: new Date(),
        };
        db.notifications.unshift(notif);
      });
  }

  writeDb(db);
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.task.update({
        where: { id },
        data: { isArchived: true, archivedAt: new Date() },
      });
    } catch (e) {
      console.warn("Prisma deleteTask fallback:", e);
    }
  }

  const db = readDb();
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  db.tasks[idx].isArchived = true;
  writeDb(db);
  return true;
}

// ─── Retention: permanently clear the bin ───────────────────────────────────
// "Delete" in this app archives rather than removes (see deleteTask /
// deleteBoard), which is what makes an undo possible but also means nothing
// ever leaves the tables. This drops the rows that have sat archived past
// the retention window for good.
//
// It is a real delete, and the schema cascades: removing a task takes its
// subtasks, comments and activities with it; removing a board takes its
// groups, tasks and everything under those. That is the intent — but it is
// why the job only ever touches rows whose archivedAt is genuinely older
// than the cutoff, and never rows that are merely archived.
export const ARCHIVE_RETENTION_DAYS = Number(process.env.ARCHIVE_RETENTION_DAYS || 30);

export interface PurgeResult {
  cutoff: Date;
  retentionDays: number;
  tasks: number;
  boards: number;
  dryRun: boolean;
}

export async function purgeArchived(options?: {
  retentionDays?: number;
  dryRun?: boolean;
}): Promise<PurgeResult> {
  const retentionDays = options?.retentionDays ?? ARCHIVE_RETENTION_DAYS;
  const dryRun = options?.dryRun ?? false;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  if (!isPrismaEnabled) {
    return { cutoff, retentionDays, tasks: 0, boards: 0, dryRun };
  }

  // archivedAt is null on anything archived before that column existed. Those
  // rows fall back to updatedAt, which for an archived row is the moment it
  // was archived — nothing touches a row again once it's out of every query.
  const expired = {
    isArchived: true,
    OR: [
      { archivedAt: { lt: cutoff } },
      { AND: [{ archivedAt: null }, { updatedAt: { lt: cutoff } }] },
    ],
  };

  if (dryRun) {
    const [tasks, boards] = await Promise.all([
      prisma.task.count({ where: expired }),
      prisma.board.count({ where: expired }),
    ]);
    return { cutoff, retentionDays, tasks, boards, dryRun };
  }

  // Boards first: a board takes its tasks with it, so counting tasks after
  // that would double-count the ones that went along for the ride.
  const boards = await prisma.board.deleteMany({ where: expired });
  const tasks = await prisma.task.deleteMany({ where: expired });

  return {
    cutoff,
    retentionDays,
    tasks: tasks.count,
    boards: boards.count,
    dryRun,
  };
}

// ─── Comments Operations ────────────────────────────────────────────────────

function mapCommentRow(c: {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Json column — typed loosely so this compiles before/after `prisma generate`.
  attachments?: unknown;
}): Comment {
  return {
    id: c.id,
    taskId: c.taskId,
    authorId: c.authorId,
    content: c.content,
    attachments: Array.isArray(c.attachments) ? (c.attachments as CommentAttachment[]) : [],
    isEdited: c.isEdited,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// What the API returns: the stored base64 data URL is swapped for a download
// URL, so list responses stay small no matter how many files are attached.
function toPublicComment(c: Comment): Comment {
  return {
    ...c,
    attachments: (c.attachments ?? []).map((a) => ({
      ...a,
      url: `/api/comments/${c.id}/attachments/${a.id}`,
    })),
  };
}

// Server-side use only: the stored attachment (url = data URL) for download.
export async function getCommentAttachment(
  commentId: string,
  attachmentId: string
): Promise<CommentAttachment | null> {
  const db = readDb();
  const comment = await findComment(commentId, db);
  return comment?.attachments?.find((a) => a.id === attachmentId) ?? null;
}

// Ids of people @mentioned in `content`. Names contain spaces
// ("Sarah Chen"), so this matches "@<full name>" rather than tokenising.
function findMentionedUserIds(
  content: string,
  people: { id: string; name: string }[]
): string[] {
  const text = content.toLowerCase();
  return people
    .filter((p) => p.name && text.includes(`@${p.name.toLowerCase()}`))
    .map((p) => p.id);
}

// Notifies people about a comment: @mentioned users get a "mention", and the
// task's assignees/reporter get a "comment". Never the author. On an edit
// (`previousContent` given) only *newly* mentioned users are notified, so
// fixing a typo doesn't re-ping everyone. Mutates `db.notifications` for the
// JSON fallback — the caller is responsible for writeDb().
async function notifyCommentRecipients(
  comment: Comment,
  db: DatabaseSchema,
  previousContent?: string
): Promise<void> {
  try {
    const task = isPrismaEnabled
      ? await prisma.task.findUnique({ where: { id: comment.taskId } })
      : db.tasks.find((t) => t.id === comment.taskId);
    if (!task) return;

    const people: { id: string; name: string }[] = isPrismaEnabled
      ? await prisma.user.findMany({ select: { id: true, name: true } })
      : db.users;
    const author = people.find((p) => p.id === comment.authorId);

    const mentioned = new Set(findMentionedUserIds(comment.content, people));
    if (previousContent !== undefined) {
      findMentionedUserIds(previousContent, people).forEach((id) => mentioned.delete(id));
    }
    mentioned.delete(comment.authorId);

    const involved = new Set<string>();
    if (previousContent === undefined) {
      [...task.assigneeIds, task.reporterId].forEach((id) => involved.add(id));
      involved.delete(comment.authorId);
      mentioned.forEach((id) => involved.delete(id));
    }

    const snippet = !comment.content
      ? "sent an attachment"
      : comment.content.length > 80
      ? `${comment.content.slice(0, 80)}…`
      : comment.content;
    const who = author?.name || "Someone";
    const rows = [
      ...[...mentioned].map((userId) => ({
        userId,
        type: "mention" as const,
        title: "You were mentioned",
        body: `${who} mentioned you on "${task.title}": ${snippet}`,
      })),
      ...[...involved].map((userId) => ({
        userId,
        type: "comment" as const,
        title: "New comment",
        body: `${who} commented on "${task.title}": ${snippet}`,
      })),
    ];

    for (const row of rows) {
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...row,
        taskId: task.id,
        boardId: task.boardId,
      };
      if (isPrismaEnabled) {
        await prisma.notification.create({ data: notif }).catch(() => {});
      } else {
        db.notifications.unshift({ ...notif, isRead: false, createdAt: new Date() });
      }
    }
  } catch (e) {
    console.warn("Failed to send comment notifications:", e);
  }
}

export async function getComments(taskId?: string): Promise<Comment[]> {
  if (isPrismaEnabled) {
    try {
      // `attachments` holds base64 data URLs, and a single PDF can be hundreds
      // of kilobytes. toPublicComment() throws those `url`s away anyway, so
      // strip them inside Postgres (`e - 'url'`) rather than hauling every
      // blob across the wire just to drop it — that alone took this list from
      // ~40s to well under a second.
      const rows = await prisma.$queryRaw<
        {
          id: string;
          taskId: string;
          authorId: string;
          content: string;
          isEdited: boolean;
          createdAt: Date;
          updatedAt: Date;
          attachments: unknown;
        }[]
      >`
        SELECT c.id, c."taskId", c."authorId", c.content, c."isEdited",
               c."createdAt", c."updatedAt",
               COALESCE(
                 (SELECT jsonb_agg(e - 'url') FROM jsonb_array_elements(c.attachments) e),
                 '[]'::jsonb
               ) AS attachments
        FROM "Comment" c
        ${taskId ? Prisma.sql`WHERE c."taskId" = ${taskId}` : Prisma.empty}
        ORDER BY c."createdAt" DESC
      `;
      // An empty array is a legitimate answer, not a signal to fall back.
      return rows.map((c) => toPublicComment(mapCommentRow(c)));
    } catch (e) {
      console.warn("Prisma getComments fallback:", e);
    }
  }

  const db = readDb();
  if (taskId) {
    return db.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(toPublicComment);
  }
  return db.comments.map(toPublicComment);
}

export async function addComment(data: {
  taskId: string;
  authorId: string;
  content: string;
  attachments?: { name: string; size: number; mimeType: string; url: string }[];
}): Promise<Comment> {
  const db = readDb();
  const task = db.tasks.find((t) => t.id === data.taskId);
  const id = `comment-${Date.now()}`;

  const newComment: Comment = {
    id,
    taskId: data.taskId,
    authorId: data.authorId,
    content: data.content.trim(),
    attachments: (data.attachments ?? []).map((a, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: a.name,
      size: a.size,
      mimeType: a.mimeType,
      url: a.url,
    })),
    isEdited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await prisma.comment.create({
        data: {
          id: newComment.id,
          taskId: newComment.taskId,
          authorId: newComment.authorId,
          content: newComment.content,
          // Only sent when there are files, so plain comments keep working
          // even before the `attachments` column has been pushed to the DB.
          ...(newComment.attachments!.length > 0 && {
            attachments: newComment.attachments as any,
          }),
          isEdited: false,
        },
      });
    } catch (e) {
      console.warn("Prisma addComment fallback:", e);
      // Files only ever live in Postgres — falling back to the JSON file
      // would report success and then lose them on reload. Fail loudly so
      // the UI shows an error instead.
      if (newComment.attachments!.length > 0) {
        throw new Error(
          "Could not save attachments. Run `npx prisma generate` and `npm run db:push`, then restart the dev server."
        );
      }
    }
  }

  // With Postgres as the source of truth, don't duplicate the base64 blobs
  // into the JSON fallback file.
  db.comments.unshift(
    isPrismaEnabled ? { ...newComment, attachments: [] } : newComment
  );
  if (task) {
    task.commentIds.push(newComment.id);
  }

  await notifyCommentRecipients(newComment, db);
  writeDb(db);
  return toPublicComment(newComment);
}

export type CommentMutationResult =
  | { ok: true; comment: Comment }
  | { ok: false; reason: "not_found" | "forbidden" | "empty" };

async function findComment(id: string, db: DatabaseSchema): Promise<Comment | null> {
  if (isPrismaEnabled) {
    try {
      const row = await prisma.comment.findUnique({ where: { id } });
      if (row) return mapCommentRow(row);
    } catch (e) {
      console.warn("Prisma findComment fallback:", e);
    }
  }
  return db.comments.find((c) => c.id === id) ?? null;
}

// Only the author may edit their own comment.
export async function updateComment(
  id: string,
  actorId: string,
  content: string
): Promise<CommentMutationResult> {
  const db = readDb();
  const existing = await findComment(id, db);
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.authorId !== actorId) return { ok: false, reason: "forbidden" };
  // A comment may be text-only, files-only or both — but never neither.
  if (!content.trim() && !(existing.attachments?.length)) {
    return { ok: false, reason: "empty" };
  }

  // `existing` may be the very object stored in db.comments (JSON fallback),
  // which Object.assign below mutates — so keep the old text now.
  const previousContent = existing.content;
  const updated: Comment = {
    ...existing,
    content: content.trim(),
    isEdited: true,
    updatedAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await prisma.comment.update({
        where: { id },
        data: { content: updated.content, isEdited: true },
      });
    } catch (e) {
      console.warn("Prisma updateComment fallback:", e);
    }
  }

  // Attachments never change on edit, so leave the local copy's as-is (in
  // Postgres mode it deliberately holds none — see addComment).
  const local = db.comments.find((c) => c.id === id);
  if (local) {
    const { attachments: _unchanged, ...changes } = updated;
    Object.assign(local, changes);
  }

  await notifyCommentRecipients(updated, db, previousContent);
  writeDb(db);
  return { ok: true, comment: toPublicComment(updated) };
}

// Only the author may delete their own comment.
export async function deleteComment(
  id: string,
  actorId: string
): Promise<CommentMutationResult> {
  const db = readDb();
  const existing = await findComment(id, db);
  if (!existing) return { ok: false, reason: "not_found" };
  if (existing.authorId !== actorId) return { ok: false, reason: "forbidden" };

  if (isPrismaEnabled) {
    try {
      await prisma.comment.delete({ where: { id } });
    } catch (e) {
      console.warn("Prisma deleteComment fallback:", e);
    }
  }

  db.comments = db.comments.filter((c) => c.id !== id);
  const task = db.tasks.find((t) => t.id === existing.taskId);
  if (task) task.commentIds = task.commentIds.filter((cid) => cid !== id);

  writeDb(db);
  return { ok: true, comment: toPublicComment(existing) };
}

// ─── Subtasks Operations ────────────────────────────────────────────────────

export async function getSubtasks(taskId?: string): Promise<Subtask[]> {
  if (isPrismaEnabled) {
    try {
      const subs = await prisma.subtask.findMany({
        where: taskId ? { taskId } : undefined,
        orderBy: { createdAt: "asc" },
      });
      // An empty array is a legitimate answer, not a signal to fall back.
      return subs.map((s) => ({
        id: s.id,
        taskId: s.taskId,
        title: s.title,
        isCompleted: s.isCompleted,
        assigneeId: s.assigneeId,
        dueDate: s.dueDate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    } catch (e) {
      console.warn("Prisma getSubtasks fallback:", e);
    }
  }

  const db = readDb();
  if (taskId) {
    return db.subtasks.filter((s) => s.taskId === taskId);
  }
  return db.subtasks;
}

export async function addSubtask(data: {
  taskId: string;
  title: string;
}): Promise<Subtask> {
  const db = readDb();
  const task = db.tasks.find((t) => t.id === data.taskId);

  const newSubtask: Subtask = {
    id: `sub-${Date.now()}`,
    taskId: data.taskId,
    title: data.title.trim(),
    isCompleted: false,
    assigneeId: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await prisma.subtask.create({
        data: {
          id: newSubtask.id,
          taskId: newSubtask.taskId,
          title: newSubtask.title,
          isCompleted: false,
        },
      });
    } catch (e) {
      console.warn("Prisma addSubtask fallback:", e);
    }
  }

  db.subtasks.push(newSubtask);
  if (task) {
    task.subtaskIds.push(newSubtask.id);
  }

  writeDb(db);
  return newSubtask;
}

export async function toggleSubtask(id: string): Promise<Subtask | null> {
  const db = readDb();
  const sub = db.subtasks.find((s) => s.id === id);
  if (!sub) return null;

  sub.isCompleted = !sub.isCompleted;
  sub.updatedAt = new Date();

  if (isPrismaEnabled) {
    try {
      await prisma.subtask.update({
        where: { id },
        data: { isCompleted: sub.isCompleted },
      });
    } catch (e) {
      console.warn("Prisma toggleSubtask fallback:", e);
    }
  }

  writeDb(db);
  return sub;
}

// ─── Activities & Notifications ─────────────────────────────────────────────

export async function getActivities(
  taskId?: string,
  boardId?: string
): Promise<Activity[]> {
  if (isPrismaEnabled) {
    try {
      const acts = await prisma.activity.findMany({
        where: {
          ...(taskId && { taskId }),
          ...(boardId && { boardId }),
        },
        orderBy: { createdAt: "desc" },
      });
      // An empty array is a legitimate answer, not a signal to fall back.
      return acts.map((a) => ({
        id: a.id,
        taskId: a.taskId || "task-1",
        boardId: a.boardId || "board-1",
        actorId: a.actorId,
        type: a.type as any,
        description: a.description,
        createdAt: a.createdAt,
      }));
    } catch (e) {
      console.warn("Prisma getActivities fallback:", e);
    }
  }

  const db = readDb();
  let list = db.activities;
  if (taskId) {
    list = list.filter((a) => a.taskId === taskId);
  } else if (boardId) {
    list = list.filter((a) => a.boardId === boardId);
  }
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getNotifications(
  userId?: string
): Promise<Notification[]> {
  if (isPrismaEnabled) {
    try {
      const notifs = await prisma.notification.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
      });
      // An empty array is a legitimate answer, not a signal to fall back.
      return notifs.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type as any,
        title: n.title,
        body: n.body,
        taskId: n.taskId,
        boardId: n.boardId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }));
    } catch (e) {
      console.warn("Prisma getNotifications fallback:", e);
    }
  }

  const db = readDb();
  if (userId) {
    return db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.notifications;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (e) {
      console.warn("Prisma markNotificationRead fallback:", e);
    }
  }

  const db = readDb();
  const notif = db.notifications.find((n) => n.id === id);
  if (!notif) return false;
  notif.isRead = true;
  writeDb(db);
  return true;
}

export async function markAllNotificationsRead(
  userId: string
): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
    } catch (e) {
      console.warn("Prisma markAllNotificationsRead fallback:", e);
    }
  }

  const db = readDb();
  db.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  writeDb(db);
  return true;
}

// ─── Personal To-Do Operations (private, per-user, not board/workspace-scoped) ─

function mapPersonalTodoRow(row: {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  dueAt: Date | null;
  reminderMinutesBefore: number;
  isCompleted: boolean;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PersonalTodo {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    notes: row.notes || "",
    dueAt: row.dueAt,
    reminderMinutesBefore: row.reminderMinutesBefore,
    isCompleted: row.isCompleted,
    reminderSentAt: row.reminderSentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPersonalTodos(userId: string): Promise<PersonalTodo[]> {
  if (isPrismaEnabled) {
    try {
      const rows = await prisma.personalTodo.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      return rows.map(mapPersonalTodoRow);
    } catch (e) {
      console.warn("Prisma getPersonalTodos fallback:", e);
    }
  }
  const db = readDb();
  return (db.personalTodos || []).filter((t) => t.userId === userId);
}

export async function createPersonalTodo(data: {
  userId: string;
  title: string;
  notes?: string;
  dueAt?: Date | null;
  reminderMinutesBefore?: number;
}): Promise<PersonalTodo> {
  const id = `todo-${Date.now()}`;
  const now = new Date();
  const newTodo: PersonalTodo = {
    id,
    userId: data.userId,
    title: data.title,
    notes: data.notes || "",
    dueAt: data.dueAt || null,
    reminderMinutesBefore: data.reminderMinutesBefore ?? 10,
    isCompleted: false,
    reminderSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isPrismaEnabled) {
    try {
      const row = await prisma.personalTodo.create({
        data: {
          id,
          userId: newTodo.userId,
          title: newTodo.title,
          notes: newTodo.notes,
          dueAt: newTodo.dueAt,
          reminderMinutesBefore: newTodo.reminderMinutesBefore,
        },
      });
      return mapPersonalTodoRow(row);
    } catch (e) {
      console.warn("Prisma createPersonalTodo fallback:", e);
    }
  }

  const db = readDb();
  db.personalTodos = [...(db.personalTodos || []), newTodo];
  writeDb(db);
  return newTodo;
}

export async function updatePersonalTodo(
  id: string,
  updates: Partial<
    Pick<
      PersonalTodo,
      "title" | "notes" | "dueAt" | "reminderMinutesBefore" | "isCompleted" | "reminderSentAt"
    >
  >
): Promise<PersonalTodo | null> {
  if (isPrismaEnabled) {
    try {
      const row = await prisma.personalTodo.update({
        where: { id },
        data: updates,
      });
      return mapPersonalTodoRow(row);
    } catch (e) {
      console.warn("Prisma updatePersonalTodo fallback:", e);
    }
  }

  const db = readDb();
  const todo = (db.personalTodos || []).find((t) => t.id === id);
  if (!todo) return null;
  Object.assign(todo, updates, { updatedAt: new Date() });
  writeDb(db);
  return todo;
}

export async function deletePersonalTodo(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.personalTodo.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn("Prisma deletePersonalTodo fallback:", e);
    }
  }

  const db = readDb();
  const before = (db.personalTodos || []).length;
  db.personalTodos = (db.personalTodos || []).filter((t) => t.id !== id);
  writeDb(db);
  return (db.personalTodos || []).length < before;
}

// ─── Workspace Posts (a simple social feed scoped to one workspace) ────────
// DB-only — this is a brand-new feature with no local-JSON fallback data,
// and that fallback is unreliable on serverless anyway (see notes above on
// the other entities). If Prisma is unavailable, these are a no-op.

function mapPostRow(
  row: {
    id: string;
    workspaceId: string;
    authorId: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    comments: {
      id: string;
      postId: string;
      authorId: string;
      content: string;
      imageUrl: string | null;
      createdAt: Date;
    }[];
    reactions: { userId: string; type: string }[];
  },
  viewerId?: string
): Post {
  const likeCount = row.reactions.filter((r) => r.type === "like").length;
  const dislikeCount = row.reactions.filter((r) => r.type === "dislike").length;
  const mine = viewerId ? row.reactions.find((r) => r.userId === viewerId) : undefined;
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    authorId: row.authorId,
    content: row.content,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    comments: row.comments
      .map((c) => ({
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        content: c.content,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt,
      }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    likeCount,
    dislikeCount,
    myReaction: (mine?.type as "like" | "dislike" | undefined) || null,
  };
}

export async function getPosts(workspaceId: string, viewerId?: string): Promise<Post[]> {
  if (!isPrismaEnabled) return [];
  try {
    const rows = await prisma.post.findMany({
      where: { workspaceId },
      include: { comments: true, reactions: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => mapPostRow(r, viewerId));
  } catch (e) {
    console.warn("Prisma getPosts failed:", e);
    return [];
  }
}

// Creates a Notification for `recipientId` iff they haven't muted that
// notification type and aren't the one who triggered it (no self-notifying).
async function createNotificationIfEnabled(params: {
  recipientId: string;
  actorId: string;
  preferenceField: "notifyPostLikes" | "notifyPostComments" | "notifyNewPosts";
  type: string;
  title: string;
  body: string;
  boardId?: string | null;
}): Promise<void> {
  if (params.recipientId === params.actorId) return;
  try {
    const recipient = await prisma.user.findUnique({ where: { id: params.recipientId } });
    if (!recipient || recipient[params.preferenceField] === false) return;
    await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: params.recipientId,
        type: params.type,
        title: params.title,
        body: params.body,
        boardId: params.boardId,
      },
    });
  } catch (e) {
    console.warn("Failed to create post notification:", e);
  }
}

export async function createPost(data: {
  workspaceId: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
}): Promise<Post | null> {
  if (!isPrismaEnabled) return null;
  try {
    const row = await prisma.post.create({
      data: {
        workspaceId: data.workspaceId,
        authorId: data.authorId,
        content: data.content,
        imageUrl: data.imageUrl || null,
      },
      include: { comments: true, reactions: true },
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: data.workspaceId } });
    if (workspace) {
      const actor = await prisma.user.findUnique({ where: { id: data.authorId } });
      const memberIds: string[] = (workspace.members as any[]).map((m) => m.userId);
      await Promise.all(
        memberIds
          .filter((id) => id !== data.authorId)
          .map((id) =>
            createNotificationIfEnabled({
              recipientId: id,
              actorId: data.authorId,
              preferenceField: "notifyNewPosts",
              type: "new_post",
              title: `New post in ${workspace.name}`,
              body: `${actor?.name || "Someone"}: "${data.content.slice(0, 80)}"`,
            })
          )
      );
    }

    return mapPostRow(row, data.authorId);
  } catch (e) {
    console.warn("Prisma createPost failed:", e);
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  if (!isPrismaEnabled) return false;
  try {
    await prisma.post.delete({ where: { id } });
    return true;
  } catch (e) {
    console.warn("Prisma deletePost failed:", e);
    return false;
  }
}

export async function addPostComment(data: {
  postId: string;
  authorId: string;
  content: string;
  imageUrl?: string | null;
}): Promise<Post | null> {
  if (!isPrismaEnabled) return null;
  try {
    await prisma.postComment.create({
      data: {
        postId: data.postId,
        authorId: data.authorId,
        content: data.content,
        imageUrl: data.imageUrl || null,
      },
    });
    const row = await prisma.post.findUnique({
      where: { id: data.postId },
      include: { comments: true, reactions: true },
    });

    if (row) {
      const actor = await prisma.user.findUnique({ where: { id: data.authorId } });
      await createNotificationIfEnabled({
        recipientId: row.authorId,
        actorId: data.authorId,
        preferenceField: "notifyPostComments",
        type: "post_comment",
        title: "New comment on your post",
        body: `${actor?.name || "Someone"}: "${data.content.slice(0, 80)}"`,
      });
    }

    return row ? mapPostRow(row, data.authorId) : null;
  } catch (e) {
    console.warn("Prisma addPostComment failed:", e);
    return null;
  }
}

export async function setPostReaction(
  postId: string,
  userId: string,
  type: "like" | "dislike"
): Promise<Post | null> {
  if (!isPrismaEnabled) return null;
  try {
    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    // Only a freshly-set "like" notifies — never dislikes, and never the
    // toggle-off click (clicking the same reaction again removes it).
    let shouldNotifyLike = false;
    if (existing && existing.type === type) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.postReaction.update({ where: { id: existing.id }, data: { type } });
      shouldNotifyLike = type === "like";
    } else {
      await prisma.postReaction.create({ data: { postId, userId, type } });
      shouldNotifyLike = type === "like";
    }

    const row = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: true, reactions: true },
    });

    if (shouldNotifyLike && row) {
      const actor = await prisma.user.findUnique({ where: { id: userId } });
      await createNotificationIfEnabled({
        recipientId: row.authorId,
        actorId: userId,
        preferenceField: "notifyPostLikes",
        type: "post_like",
        title: "New like on your post",
        body: `${actor?.name || "Someone"} liked your post`,
      });
    }

    return row ? mapPostRow(row, userId) : null;
  } catch (e) {
    console.warn("Prisma setPostReaction failed:", e);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<Pick<User, "notifyPostLikes" | "notifyPostComments" | "notifyNewPosts">>
): Promise<User | null> {
  if (!isPrismaEnabled) return null;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.notifyPostLikes !== undefined && { notifyPostLikes: updates.notifyPostLikes }),
        ...(updates.notifyPostComments !== undefined && {
          notifyPostComments: updates.notifyPostComments,
        }),
        ...(updates.notifyNewPosts !== undefined && { notifyNewPosts: updates.notifyNewPosts }),
      },
      select: { id: true },
    });
    // Re-read rather than returning the updated row: that row carries the
    // avatar blob, and this shape is what the client stores as currentUser.
    return (await getUserById(userId)) ?? null;
  } catch (e) {
    console.warn("Prisma updateNotificationPreferences failed:", e);
    return null;
  }
}

function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  );
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatarColor?: string; avatarUrl?: string | null }
): Promise<User | null> {
  const name = updates.name?.trim();
  const avatarColor = updates.avatarColor?.trim();
  // avatarUrl is allowed to be explicitly null (remove photo) or undefined
  // (leave untouched), so it's checked separately from the trimmed strings.
  const avatarUrlProvided = "avatarUrl" in updates;
  const avatarUrl = updates.avatarUrl ? updates.avatarUrl.trim() || null : updates.avatarUrl;

  if (isPrismaEnabled) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name, avatarInitials: initialsFromName(name) }),
          ...(avatarColor && { avatarColor }),
          ...(avatarUrlProvided && { avatarUrl }),
        },
        select: { id: true },
      });
      // Hand back the link-to-the-route form, not the data URL that was just
      // uploaded — the client has no use for the blob it already holds.
      return (await getUserById(userId)) ?? null;
    } catch (e) {
      console.warn("Prisma updateUserProfile failed:", e);
      return null;
    }
  }

  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  db.users[idx] = {
    ...db.users[idx],
    ...(name && { name, avatarInitials: initialsFromName(name) }),
    ...(avatarColor && { avatarColor }),
    ...(avatarUrlProvided && { avatarUrl }),
  };
  writeDb(db);
  const { password: _pw, ...safeUser } = db.users[idx];
  return safeUser as User;
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (isPrismaEnabled) {
    try {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (!u) return { success: false, error: "User not found" };
      if (!u.password || !verifyPassword(currentPassword, u.password)) {
        return { success: false, error: "Current password is incorrect" };
      }
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashPassword(newPassword) },
      });
      return { success: true };
    } catch (e) {
      console.warn("Prisma changeUserPassword failed:", e);
      return { success: false, error: "Failed to update password" };
    }
  }

  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return { success: false, error: "User not found" };
  const stored = db.users[idx].password;
  if (!stored || !verifyPassword(currentPassword, stored)) {
    return { success: false, error: "Current password is incorrect" };
  }
  db.users[idx].password = hashPassword(newPassword);
  writeDb(db);
  return { success: true };
}

// ─── LINE Messaging API linkage ──────────────────────────────────────────────
// DB-only (no local-JSON fallback) — like Posts/Files, this is a new feature
// and the fallback store is unreliable on serverless anyway. Requires
// LINE_CHANNEL_ACCESS_TOKEN / LINE_CHANNEL_SECRET to actually send anything;
// see lib/server/line.ts.

export async function createLineLinkCode(userId: string): Promise<string | null> {
  if (!isPrismaEnabled) return null;
  const code = generateLineLinkCode();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lineLinkCode: code,
        lineLinkCodeExpiresAt: new Date(Date.now() + LINE_LINK_CODE_TTL_MS),
      } as any,
    });
    return code;
  } catch (e) {
    console.warn("Prisma createLineLinkCode failed:", e);
    return null;
  }
}

export async function getLineLinkStatus(userId: string): Promise<{ linked: boolean }> {
  if (!isPrismaEnabled) return { linked: false };
  try {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    return { linked: Boolean((u as any)?.lineUserId) };
  } catch (e) {
    console.warn("Prisma getLineLinkStatus failed:", e);
    return { linked: false };
  }
}

export async function unlinkLineAccount(userId: string): Promise<boolean> {
  if (!isPrismaEnabled) return false;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lineUserId: null, lineLinkCode: null, lineLinkCodeExpiresAt: null } as any,
    });
    return true;
  } catch (e) {
    console.warn("Prisma unlinkLineAccount failed:", e);
    return false;
  }
}

// Called from the LINE webhook when someone messages the bot a 6-digit
// code — matches it to whoever generated it in Settings (within its TTL)
// and links that account. Returns the matched user's name for the bot's
// confirmation reply, or null if the code is wrong/expired.
export async function linkLineAccountByCode(
  code: string,
  lineUserId: string
): Promise<{ name: string } | null> {
  if (!isPrismaEnabled) return null;
  try {
    const user = await prisma.user.findFirst({
      where: {
        lineLinkCode: code,
        lineLinkCodeExpiresAt: { gt: new Date() },
      } as any,
    });
    if (!user) return null;
    await prisma.user.update({
      where: { id: user.id },
      data: { lineUserId, lineLinkCode: null, lineLinkCodeExpiresAt: null } as any,
    });
    return { name: user.name };
  } catch (e) {
    console.warn("Prisma linkLineAccountByCode failed:", e);
    return null;
  }
}

// ─── Workspace Files (document library) ─────────────────────────────────────
// DB-only, same reasoning as Posts — a new feature, no local-JSON fallback
// (and that fallback is unreliable on serverless anyway).

// The file itself is stored inline as base64 (same approach already used
// for workspace cover images), so a hard size cap keeps Postgres rows from
// growing unbounded — this is a document library, not object storage for
// large media.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

function mapFileRow(row: {
  id: string;
  workspaceId: string;
  name: string;
  caption: string | null;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedById: string;
  createdAt: Date;
}): WorkspaceFile {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    caption: row.caption || "",
    mimeType: row.mimeType,
    size: row.size,
    dataUrl: row.dataUrl,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt,
  };
}

export async function getFiles(workspaceId: string): Promise<WorkspaceFile[]> {
  if (!isPrismaEnabled) return [];
  try {
    const rows = await prisma.fileItem.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapFileRow);
  } catch (e) {
    console.warn("Prisma getFiles failed:", e);
    return [];
  }
}

export async function uploadFile(data: {
  workspaceId: string;
  name: string;
  caption?: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedById: string;
}): Promise<WorkspaceFile> {
  if (data.size > MAX_FILE_BYTES) {
    throw new Error(
      `File is too large — the limit is ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.`
    );
  }
  if (!isPrismaEnabled) {
    throw new Error("File storage is unavailable right now.");
  }
  const row = await prisma.fileItem.create({
    data: {
      workspaceId: data.workspaceId,
      name: data.name,
      caption: data.caption || "",
      mimeType: data.mimeType,
      size: data.size,
      dataUrl: data.dataUrl,
      uploadedById: data.uploadedById,
    },
  });
  return mapFileRow(row);
}

export async function updateFileCaption(
  id: string,
  caption: string
): Promise<WorkspaceFile | null> {
  if (!isPrismaEnabled) return null;
  try {
    const row = await prisma.fileItem.update({
      where: { id },
      data: { caption },
    });
    return mapFileRow(row);
  } catch (e) {
    console.warn("Prisma updateFileCaption failed:", e);
    return null;
  }
}

export async function deleteFile(id: string): Promise<boolean> {
  if (!isPrismaEnabled) return false;
  try {
    await prisma.fileItem.delete({ where: { id } });
    return true;
  } catch (e) {
    console.warn("Prisma deleteFile failed:", e);
    return false;
  }
}

// ─── Workspace Appointments (shared meetings, unlike private PersonalTodo) ────

function mapAppointmentRow(row: {
  id: string;
  workspaceId: string;
  boardId: string | null;
  createdById: string;
  title: string;
  notes: string | null;
  startAt: Date;
  endAt?: Date | null;
  attendeeIds: string[];
  reminderMinutesBefore: number;
  isCompleted: boolean;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceAppointment {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    boardId: row.boardId,
    createdById: row.createdById,
    title: row.title,
    notes: row.notes || "",
    startAt: row.startAt,
    endAt: row.endAt ?? null,
    attendeeIds: row.attendeeIds || [],
    reminderMinutesBefore: row.reminderMinutesBefore,
    isCompleted: row.isCompleted,
    reminderSentAt: row.reminderSentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAppointments(workspaceId: string): Promise<WorkspaceAppointment[]> {
  if (!isPrismaEnabled) return [];
  try {
    const rows = await prisma.appointment.findMany({
      where: { workspaceId },
      orderBy: { startAt: "asc" },
    });
    return rows.map(mapAppointmentRow);
  } catch (e) {
    console.warn("Prisma getAppointments failed:", e);
    return [];
  }
}

export async function createAppointment(data: {
  workspaceId: string;
  boardId?: string | null;
  createdById: string;
  title: string;
  notes?: string;
  startAt: Date;
  endAt?: Date | null;
  attendeeIds?: string[];
  reminderMinutesBefore?: number;
}): Promise<WorkspaceAppointment> {
  if (!isPrismaEnabled) {
    throw new Error("Appointments are unavailable right now.");
  }
  const row = await prisma.appointment.create({
    data: {
      workspaceId: data.workspaceId,
      boardId: data.boardId || null,
      createdById: data.createdById,
      title: data.title,
      notes: data.notes || "",
      startAt: data.startAt,
      endAt: data.endAt ?? null,
      attendeeIds: data.attendeeIds || [],
      reminderMinutesBefore: data.reminderMinutesBefore ?? 30,
    },
  });
  return mapAppointmentRow(row);
}

export async function updateAppointment(
  id: string,
  updates: Partial<
    Pick<
      WorkspaceAppointment,
      | "title"
      | "notes"
      | "startAt"
      | "endAt"
      | "attendeeIds"
      | "reminderMinutesBefore"
      | "isCompleted"
    >
  >
): Promise<WorkspaceAppointment | null> {
  if (!isPrismaEnabled) return null;
  try {
    const data: Record<string, unknown> = { ...updates };
    // Editing the time or reminder window re-arms the reminder so it fires again.
    if (updates.startAt !== undefined || updates.reminderMinutesBefore !== undefined) {
      data.reminderSentAt = null;
    }
    const row = await prisma.appointment.update({ where: { id }, data });
    return mapAppointmentRow(row);
  } catch (e) {
    console.warn("Prisma updateAppointment failed:", e);
    return null;
  }
}

export async function deleteAppointment(id: string): Promise<boolean> {
  if (!isPrismaEnabled) return false;
  try {
    await prisma.appointment.delete({ where: { id } });
    return true;
  } catch (e) {
    console.warn("Prisma deleteAppointment failed:", e);
    return false;
  }
}

// Finds appointments in this workspace whose reminder window has arrived,
// fires an in-app Notification + email to every attendee, and marks each
// one sent so it isn't repeated. There's no cron in this app, so this runs
// whenever a client with this workspace open polls for it; the reminderSentAt
// claim (via updateMany) keeps two clients polling at once from double-sending.
export async function checkAndSendAppointmentReminders(
  workspaceId: string
): Promise<{ remindedAppointments: WorkspaceAppointment[]; notifications: Notification[] }> {
  if (!isPrismaEnabled) return { remindedAppointments: [], notifications: [] };

  const [dueCandidates, workspaceRow] = await Promise.all([
    prisma.appointment.findMany({
      where: { workspaceId, isCompleted: false, reminderSentAt: null },
    }),
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
  ]);
  if (!workspaceRow || dueCandidates.length === 0) {
    return { remindedAppointments: [], notifications: [] };
  }

  const now = Date.now();
  const due = dueCandidates.filter((a) => {
    const startTime = a.startAt.getTime();
    const reminderTime = startTime - a.reminderMinutesBefore * 60000;
    // Window stays open a few minutes past start in case nobody had a
    // client open at the exact reminder moment.
    return now >= reminderTime && now <= startTime + 5 * 60000;
  });
  if (due.length === 0) return { remindedAppointments: [], notifications: [] };

  const memberIds: string[] = (workspaceRow.members as any[]).map((m) => m.userId);
  const allUsers = await prisma.user.findMany({ where: { id: { in: memberIds } } });
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const remindedAppointments: WorkspaceAppointment[] = [];
  const createdNotifications: Notification[] = [];

  for (const appt of due) {
    // Atomically claim this appointment so a second client polling at the
    // same moment doesn't also send the notifications/emails below.
    const claim = await prisma.appointment.updateMany({
      where: { id: appt.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (claim.count === 0) continue;

    const attendeeIds = appt.attendeeIds.length > 0 ? appt.attendeeIds : memberIds;
    // Formatted in Asia/Bangkok — this runs on Vercel, whose clock is UTC,
    // so the old zone-less toLocaleTimeString printed the time 7 hours off.
    const timeRangeLabel = bangkokTimeRangeLabel(appt.startAt, appt.endAt);
    const dateLabel = bangkokDateLabel(appt.startAt);

    for (const attendeeId of attendeeIds) {
      const user = usersById.get(attendeeId);
      if (!user) continue;

      try {
        const notif = await prisma.notification.create({
          data: {
            id: `notif-appt-${appt.id}-${attendeeId}`,
            userId: attendeeId,
            type: "appointment_reminder",
            title: `Upcoming: ${appt.title}`,
            body: `${dateLabel} ${timeRangeLabel}`,
            taskId: null,
            boardId: appt.boardId,
          },
        });
        createdNotifications.push({
          id: notif.id,
          userId: notif.userId,
          type: notif.type as any,
          title: notif.title,
          body: notif.body,
          taskId: notif.taskId,
          boardId: notif.boardId,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        });
      } catch (e) {
        console.warn("Failed to create appointment notification:", e);
      }

      sendAppointmentReminderEmail({
        to: user.email,
        recipientName: user.name,
        workspaceName: workspaceRow.name,
        title: appt.title,
        notes: appt.notes || undefined,
        startAt: appt.startAt,
      }).catch((e) => console.warn("Failed to send appointment reminder email:", e));

      // Same reminder over LINE, for attendees who linked their account.
      // Skipped silently for everyone else, exactly like the task reminders.
      const lineUserId = (user as any).lineUserId as string | null;
      if (lineUserId) {
        sendLineAppointmentReminder(lineUserId, {
          title: appt.title,
          dateLabel,
          timeRangeLabel,
          workspaceName: workspaceRow.name,
          notes: appt.notes || undefined,
        }).catch((e) => console.warn("Failed to send appointment LINE reminder:", e));
      }
    }

    const updated = await prisma.appointment.findUnique({ where: { id: appt.id } });
    if (updated) remindedAppointments.push(mapAppointmentRow(updated));
  }

  return { remindedAppointments, notifications: createdNotifications };
}

// Two independent one-time nudges per task — in-app + LINE for whoever has
// it linked:
//   1. "Due today"  — fires once the CALENDAR DATE the task is due arrives
//      (compared in Asia/Bangkok, not a rolling N-hours-before countdown —
//      that's what people actually mean by "due the 23rd").
//   2. "Missed deadline" — fires once the calendar date has moved past the
//      due date without the task being done. Separate gate field from
//      due-today, so getting that nudge earlier doesn't suppress this one.
// Both gates are cleared whenever dueDate changes (see updateTask), and
// each is claimed atomically so two clients polling at once can't double-send.
//
// Why Asia/Bangkok specifically: dates picked in the UI are constructed as
// local midnight (new Date(year, month, day) in the browser, which for a
// Thai user is UTC+7) and stored as that instant. The reminder checker runs
// server-side on Vercel, whose runtime clock is UTC — formatting or
// day-comparing that instant without an explicit timeZone used the server's
// UTC day instead of the user's, which is why a task due "the 23rd" showed
// up labeled "the 22nd" and could fire its reminder a day early.
const BANGKOK_TZ = "Asia/Bangkok";

function bangkokDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function bangkokTimeLabel(date: Date): string {
  return date.toLocaleTimeString("th-TH", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "14:00 - 15:30 น.", or just "14:00 น." when no end time was given.
// Formatted in Asia/Bangkok on purpose: this runs server-side on Vercel,
// whose clock is UTC, so leaving the zone out printed times seven hours off
// — the same trap the task reminders above document.
export function bangkokTimeRangeLabel(startAt: Date, endAt?: Date | null): string {
  const start = bangkokTimeLabel(startAt);
  if (!endAt) return `${start} น.`;
  return `${start} - ${bangkokTimeLabel(endAt)} น.`;
}

function bangkokDateLabel(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    timeZone: BANGKOK_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function runTaskReminderPass(
  boardIds: string[],
  now: Date,
  todayKey: string,
  opts: {
    gateField: "dueSoonReminderSentAt" | "overdueReminderSentAt";
    matchesDay: (dueDateKey: string, todayKey: string) => boolean;
    buildTitle: (title: string) => string;
    buildBody: (dueLabel: string) => string;
    headerColor: string;
    headerLabel: string;
    emoji: string;
    statusNote?: string;
  }
): Promise<{ remindedTaskIds: string[]; notifications: Notification[] }> {
  // Loose SQL prefilter (anything due up through "end of today, Bangkok
  // time") — the precise same-day/before-today split happens in JS below
  // via bangkokDateKey, since Prisma can't compare calendar days in a
  // specific timezone directly.
  const startOfTomorrowBangkokUTC = new Date(
    new Date(`${todayKey}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000
  );

  const allCandidates = await prisma.task.findMany({
    where: {
      boardId: { in: boardIds },
      isArchived: false,
      status: { notIn: ["done", "cancelled"] },
      dueDate: { not: null, lt: startOfTomorrowBangkokUTC },
      ...({ [opts.gateField]: null } as any),
    },
    include: { board: { select: { name: true } } },
  });
  const candidates = allCandidates.filter((t) =>
    opts.matchesDay(bangkokDateKey(t.dueDate!), todayKey)
  );
  if (candidates.length === 0) return { remindedTaskIds: [], notifications: [] };

  const assigneeIds = Array.from(new Set(candidates.flatMap((t) => t.assigneeIds)));
  const users = await prisma.user.findMany({ where: { id: { in: assigneeIds } } });
  const usersById = new Map(users.map((u) => [u.id, u]));

  const remindedTaskIds: string[] = [];
  const createdNotifications: Notification[] = [];

  for (const task of candidates) {
    const claim = await prisma.task.updateMany({
      where: { id: task.id, ...({ [opts.gateField]: null } as any) },
      data: { [opts.gateField]: now } as any,
    });
    if (claim.count === 0) continue;

    const dueLabel = bangkokDateLabel(task.dueDate!);

    for (const assigneeId of task.assigneeIds) {
      const user = usersById.get(assigneeId);
      if (!user) continue;

      try {
        const notif = await prisma.notification.create({
          data: {
            id: `notif-${opts.gateField}-${task.id}-${assigneeId}`,
            userId: assigneeId,
            type: "due_date",
            title: opts.buildTitle(task.title),
            body: opts.buildBody(dueLabel),
            taskId: task.id,
            boardId: task.boardId,
          },
        });
        createdNotifications.push({
          id: notif.id,
          userId: notif.userId,
          type: notif.type as any,
          title: notif.title,
          body: notif.body,
          taskId: notif.taskId,
          boardId: notif.boardId,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
        });
      } catch (e) {
        console.warn("Failed to create due-date notification:", e);
      }

      const lineUserId = (user as any).lineUserId;
      if (lineUserId) {
        sendLineTaskNotification(lineUserId, {
          headerColor: opts.headerColor,
          headerLabel: opts.headerLabel,
          emoji: opts.emoji,
          taskTitle: task.title,
          boardName: (task as any).board?.name,
          dueLabel,
          statusNote: opts.statusNote,
          link: buildTaskLink(task.id),
          altText: `${opts.headerLabel}: ${task.title}`,
        }).catch(() => {});
      }
    }

    remindedTaskIds.push(task.id);
  }

  return { remindedTaskIds, notifications: createdNotifications };
}

export async function checkAndSendTaskDueSoonReminders(
  workspaceId: string
): Promise<{ remindedTaskIds: string[]; notifications: Notification[] }> {
  if (!isPrismaEnabled) return { remindedTaskIds: [], notifications: [] };

  const boards = await prisma.board.findMany({
    where: { workspaceId, isArchived: false },
    select: { id: true },
  });
  const boardIds = boards.map((b) => b.id);
  if (boardIds.length === 0) return { remindedTaskIds: [], notifications: [] };

  const now = new Date();
  const todayKey = bangkokDateKey(now);

  const [dueSoon, overdue] = await Promise.all([
    runTaskReminderPass(boardIds, now, todayKey, {
      gateField: "dueSoonReminderSentAt",
      matchesDay: (dueKey, today) => dueKey === today,
      buildTitle: (title) => `Due today: ${title}`,
      buildBody: (dueLabel) => `Due ${dueLabel}`,
      headerColor: "#F59E0B",
      headerLabel: "ถึงกำหนดส่งวันนี้",
      emoji: "⏰",
    }),
    runTaskReminderPass(boardIds, now, todayKey, {
      gateField: "overdueReminderSentAt",
      matchesDay: (dueKey, today) => dueKey < today,
      buildTitle: (title) => `Missed deadline: ${title}`,
      buildBody: (dueLabel) => `Was due ${dueLabel} — not marked done`,
      headerColor: "#E11D48",
      headerLabel: "งานเลยกำหนดส่ง",
      emoji: "❌",
      statusNote: "ยังไม่เสร็จสิ้น",
    }),
  ]);

  return {
    remindedTaskIds: [...dueSoon.remindedTaskIds, ...overdue.remindedTaskIds],
    notifications: [...dueSoon.notifications, ...overdue.notifications],
  };
}

// ─── Dashboards (saved analytics report views over a workspace) ───────────

function mapDashboardRow(row: {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  widgets: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): Dashboard {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description || "",
    widgets: (row.widgets || []) as DashboardWidgetId[],
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getDashboards(workspaceId?: string): Promise<Dashboard[]> {
  if (!isPrismaEnabled) return [];
  try {
    const rows = await prisma.dashboard.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapDashboardRow);
  } catch (e) {
    console.warn("Prisma getDashboards failed:", e);
    return [];
  }
}

export async function createDashboard(data: {
  workspaceId: string;
  name: string;
  description?: string;
  widgets?: DashboardWidgetId[];
  createdById: string;
}): Promise<Dashboard> {
  if (!isPrismaEnabled) {
    throw new Error("Dashboards are unavailable right now.");
  }
  const row = await prisma.dashboard.create({
    data: {
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description || "",
      widgets: data.widgets && data.widgets.length > 0
        ? data.widgets
        : ["kpis", "distribution", "workload", "trend"],
      createdById: data.createdById,
    },
  });
  return mapDashboardRow(row);
}

export async function deleteDashboard(id: string): Promise<boolean> {
  if (!isPrismaEnabled) return false;
  try {
    await prisma.dashboard.delete({ where: { id } });
    return true;
  } catch (e) {
    console.warn("Prisma deleteDashboard failed:", e);
    return false;
  }
}

// ─── Board Members & Invitations Operations ──────────────────────────────────

export async function getBoardMembers(boardId: string): Promise<User[]> {
  const board = await getBoardById(boardId);
  const allUsers = await getUsers();
  if (!board) return allUsers;

  const memberIds =
    board.memberIds && board.memberIds.length > 0
      ? board.memberIds
      : [board.ownerId];
  return allUsers.filter((u) => memberIds.includes(u.id));
}

export async function addMemberToBoard(
  boardId: string,
  userId: string
): Promise<Board | null> {
  const db = readDb();
  const board = db.boards.find((b) => b.id === boardId);
  if (!board) return null;

  if (!board.memberIds) board.memberIds = [board.ownerId];
  if (!board.memberIds.includes(userId)) {
    board.memberIds.push(userId);
    board.updatedAt = new Date();
  }

  if (isPrismaEnabled) {
    try {
      await prisma.board.update({
        where: { id: boardId },
        data: { memberIds: board.memberIds },
      });
    } catch (e) {
      console.warn("Prisma addMemberToBoard fallback:", e);
    }
  }

  writeDb(db);
  return board;
}

export async function createBoardInvitation(
  dataOrBoardId:
    | {
        boardId: string;
        email: string;
        role?: string;
        invitedById: string;
      }
    | string,
  email?: string,
  role?: string,
  invitedById?: string
): Promise<BoardInvitation> {
  const data =
    typeof dataOrBoardId === "string"
      ? {
          boardId: dataOrBoardId,
          email: email!,
          role: role || "Member",
          invitedById: invitedById || "user-somchai",
        }
      : dataOrBoardId;

  const db = readDb();
  if (!db.invitations) db.invitations = [];

  const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const invitation: BoardInvitation = {
    id: `inv-${Date.now()}`,
    token,
    boardId: data.boardId,
    email: (data.email || "").trim().toLowerCase(),
    role: data.role || "Member",
    status: "pending",
    invitedById: data.invitedById,
    createdAt: new Date(),
  };

  if (isPrismaEnabled) {
    try {
      await (prisma as any).boardInvitation?.create({
        data: {
          id: invitation.id,
          token: invitation.token,
          boardId: invitation.boardId,
          email: invitation.email,
          role: invitation.role,
          status: "pending",
          invitedById: invitation.invitedById,
        },
      });
    } catch (e) {
      console.warn("Prisma createBoardInvitation fallback:", e);
    }
  }

  db.invitations.unshift(invitation);
  writeDb(db);
  return invitation;
}

export async function getInvitationByToken(
  token: string
): Promise<BoardInvitation | undefined> {
  if (isPrismaEnabled) {
    try {
      const inv = await (prisma as any).boardInvitation?.findUnique({
        where: { token },
      });
      if (inv) {
        return {
          id: inv.id,
          token: inv.token,
          boardId: inv.boardId,
          email: inv.email,
          role: inv.role,
          status: inv.status as any,
          invitedById: inv.invitedById,
          createdAt: inv.createdAt,
          acceptedAt: inv.acceptedAt || undefined,
        };
      }
    } catch (e) {
      console.warn("Prisma getInvitationByToken fallback:", e);
    }
  }

  const db = readDb();
  if (!db.invitations) db.invitations = [];
  return db.invitations.find((i) => i.token === token);
}

export async function acceptBoardInvitation(
  token: string,
  _acceptingUserId?: string
): Promise<{ success: boolean; board?: Board; user?: User; error?: string }> {
  const db = readDb();
  if (!db.invitations) db.invitations = [];

  let inv = db.invitations.find((i) => i.token === token);

  if (!inv && isPrismaEnabled) {
    try {
      const pInv = await (prisma as any).boardInvitation?.findUnique({
        where: { token },
      });
      if (pInv) {
        inv = {
          id: pInv.id,
          token: pInv.token,
          boardId: pInv.boardId,
          email: pInv.email,
          role: pInv.role,
          status: pInv.status as any,
          invitedById: pInv.invitedById,
          createdAt: pInv.createdAt,
          acceptedAt: pInv.acceptedAt || undefined,
        };
      }
    } catch (e) {
      console.warn("Prisma find invitation fallback:", e);
    }
  }

  if (!inv) {
    return { success: false, error: "Invitation link is invalid or expired" };
  }

  let board = db.boards.find((b) => b.id === inv.boardId);
  if (!board && isPrismaEnabled) {
    board = await getBoardById(inv.boardId);
  }
  if (!board) return { success: false, error: "Project board not found" };

  if (inv.status === "accepted") {
    return { success: false, error: "Invitation has already been accepted" };
  }

  const cleanEmail = inv.email.trim().toLowerCase();
  let targetUser: User | undefined;

  if (isPrismaEnabled) {
    try {
      const pUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (pUser) {
        targetUser = {
          id: pUser.id,
          name: pUser.name,
          email: pUser.email,
          avatarInitials: pUser.avatarInitials,
          avatarColor: pUser.avatarColor,
          role: pUser.role,
          isActive: pUser.isActive,
        };
      }
    } catch (e) {
      console.warn("Prisma find user fallback:", e);
    }
  }

  if (!targetUser) {
    targetUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  }

  if (!targetUser) {
    // Create new user profile for recipient
    const namePart = cleanEmail.split("@")[0];
    const initials = namePart.slice(0, 2).toUpperCase() || "U";
    targetUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      email: cleanEmail,
      avatarInitials: initials,
      avatarColor: "bg-teal-600",
      role: inv.role || "Member",
      isActive: true,
    };

    if (isPrismaEnabled) {
      try {
        await prisma.user.create({
          data: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            avatarInitials: targetUser.avatarInitials,
            avatarColor: targetUser.avatarColor,
            role: targetUser.role,
            isActive: true,
          },
        });
      } catch (e) {
        console.warn("Prisma user create fallback:", e);
      }
    }

    db.users.push(targetUser);
  }

  // Ensure targetUser is in board.memberIds
  if (!board.memberIds) board.memberIds = [board.ownerId];
  if (!board.memberIds.includes(targetUser.id)) {
    board.memberIds.push(targetUser.id);
    board.updatedAt = new Date();
  }

  // Also ensure targetUser is a member of the WORKSPACE THIS BOARD ACTUALLY
  // BELONGS TO (board.workspaceId) — this used to mutate `db.workspace`,
  // the local JSON fallback's single "current" workspace, which is neither
  // guaranteed to be the right one nor ever persisted to Postgres. That
  // meant an accepted invite silently failed to grant real workspace
  // access; only the board's memberIds actually got updated.
  let newMemberEntry: { userId: string; workspaceId: string; role: "member"; joinedAt: Date } | null = null;
  const targetWorkspace = await getWorkspaceById(board.workspaceId);
  if (targetWorkspace && !targetWorkspace.members.some((m) => m.userId === targetUser!.id)) {
    newMemberEntry = {
      userId: targetUser.id,
      workspaceId: targetWorkspace.id,
      role: "member",
      joinedAt: new Date(),
    };
    const updatedMembers = [...targetWorkspace.members, newMemberEntry];

    if (isPrismaEnabled) {
      try {
        await prisma.workspace.update({
          where: { id: targetWorkspace.id },
          data: { members: updatedMembers as any },
        });
      } catch (e) {
        console.warn("Prisma add workspace member fallback:", e);
      }
    }

    const dbWorkspace = (db.workspaces || []).find((w) => w.id === targetWorkspace.id);
    if (dbWorkspace) {
      dbWorkspace.members = updatedMembers;
    } else if (db.workspace?.id === targetWorkspace.id) {
      db.workspace.members = updatedMembers;
    }
  }

  if (isPrismaEnabled) {
    try {
      await prisma.board.update({
        where: { id: board.id },
        data: { memberIds: board.memberIds },
      });
      await (prisma as any).boardInvitation?.updateMany({
        where: { token },
        data: { status: "accepted", acceptedAt: new Date() },
      });
    } catch (e) {
      console.warn("Prisma invitation accept fallback:", e);
    }
  }

  inv.status = "accepted";
  inv.acceptedAt = inv.acceptedAt || new Date();
  writeDb(db);

  // Tell whoever sent the invitation that it was taken up. An invite goes
  // out as email and then goes quiet, so without this the inviter — usually
  // the person who needs to know, e.g. a lead adding someone to their team
  // — has no signal that the person actually joined. Runs once: an
  // already-accepted invitation is rejected further up.
  if (inv.invitedById && inv.invitedById !== targetUser.id) {
    await notifyInviterOfAcceptance(inv, board, targetUser);
  }

  return { success: true, board, user: targetUser };
}

// Best-effort on both channels: joining the board is what matters, so a
// failure to notify is logged and swallowed rather than failing the accept.
async function notifyInviterOfAcceptance(
  inv: BoardInvitation,
  board: Board,
  joiner: User
): Promise<void> {
  if (!isPrismaEnabled) return;
  try {
    const inviter = await prisma.user.findUnique({
      where: { id: inv.invitedById },
      select: { id: true, lineUserId: true },
    });
    if (!inviter) return;

    await prisma.notification
      .create({
        data: {
          // Deterministic, so a retried accept can't stack duplicates.
          id: `notif-joined-${inv.id}`,
          userId: inviter.id,
          type: "member_joined",
          title: "Invitation accepted",
          body: `${joiner.name} joined "${board.name}"`,
          taskId: null,
          boardId: board.id,
        },
      })
      .catch(() => {});

    if (inviter.lineUserId) {
      await sendLineMemberJoinedNotification(inviter.lineUserId, {
        memberName: joiner.name,
        memberEmail: joiner.email,
        boardName: board.name,
        boardId: board.id,
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Failed to notify inviter of acceptance:", e);
  }
}

import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
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

export async function getWorkspace(): Promise<Workspace> {
  const db = readDb();
  return db.workspace;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const db = readDb();
  return db.workspaces || [db.workspace];
}

export async function getWorkspaceById(id: string): Promise<Workspace | undefined> {
  const db = readDb();
  const list = db.workspaces || [db.workspace];
  return list.find((w) => w.id === id);
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
  privacy?: "open" | "closed";
  avatarColor?: string;
  creatorId?: string;
}): Promise<Workspace> {
  const db = readDb();
  const newWorkspace: Workspace = {
    id: `ws-${Date.now()}`,
    name: data.name,
    description: data.description || "",
    plan: "Pro",
    privacy: data.privacy || "open",
    avatarColor: data.avatarColor || "bg-indigo-600",
    isPinned: false,
    members: [
      {
        userId: data.creatorId || (db.users[0]?.id || "user-somchai"),
        workspaceId: `ws-${Date.now()}`,
        role: "owner",
        joinedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastViewedAt: new Date(),
  };

  const updatedWorkspaces = [...(db.workspaces || [db.workspace]), newWorkspace];
  db.workspaces = updatedWorkspaces;
  db.workspace = newWorkspace;
  writeDb(db);
  return newWorkspace;
}

export async function updateWorkspace(
  id: string,
  updates: Partial<Workspace>
): Promise<Workspace> {
  const db = readDb();
  const list = db.workspaces || [db.workspace];
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error("Workspace not found");

  const updated: Workspace = {
    ...list[idx],
    ...updates,
    updatedAt: new Date(),
  };
  list[idx] = updated;
  db.workspaces = list;
  if (db.workspace.id === id) {
    db.workspace = updated;
  }
  writeDb(db);
  return updated;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const db = readDb();
  const list = db.workspaces || [db.workspace];
  if (list.length <= 1) {
    throw new Error("Cannot delete the only workspace");
  }
  db.workspaces = list.filter((w) => w.id !== id);
  if (db.workspace.id === id) {
    db.workspace = db.workspaces[0];
  }
  writeDb(db);
  return true;
}

export async function togglePinWorkspace(id: string): Promise<Workspace> {
  const db = readDb();
  const list = db.workspaces || [db.workspace];
  const target = list.find((w) => w.id === id);
  if (!target) throw new Error("Workspace not found");

  return updateWorkspace(id, { isPinned: !target.isPinned });
}

// ─── Users Operations ────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  if (isPrismaEnabled) {
    try {
      const users = await prisma.user.findMany({ where: { isActive: true } });
      if (users.length > 0) {
        return users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarInitials: u.avatarInitials,
          avatarColor: u.avatarColor,
          role: u.role,
          isActive: u.isActive,
        }));
      }
    } catch (e) {
      console.warn("Prisma getUsers fallback:", e);
    }
  }
  return readDb().users;
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (isPrismaEnabled) {
    try {
      const u = await prisma.user.findUnique({ where: { id } });
      if (u) {
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarInitials: u.avatarInitials,
          avatarColor: u.avatarColor,
          role: u.role,
          isActive: u.isActive,
        };
      }
    } catch (e) {
      console.warn("Prisma getUserById fallback:", e);
    }
  }
  return readDb().users.find((u) => u.id === id);
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
      if (boards.length > 0) {
        return boards.map((b) => {
          const rawMemberIds = (b as any).memberIds;
          const memberIds =
            Array.isArray(rawMemberIds) && rawMemberIds.length > 0
              ? rawMemberIds
              : [b.ownerId];
          return {
            id: b.id,
            workspaceId: b.workspaceId,
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
        });
      }
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
  const newBoard: Board = {
    id: `board-${Date.now()}`,
    workspaceId: db.workspace.id,
    name: data.name,
    description: data.description || "",
    type: data.type || "general",
    color: data.color || "bg-blue-500",
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
  updates: Partial<Pick<Board, "name" | "description" | "color" | "isArchived">>
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
        },
        include: { groups: true },
      });
      return {
        id: updated.id,
        workspaceId: updated.workspaceId,
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
        data: { isArchived: true },
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

// ─── Groups Operations ───────────────────────────────────────────────────────

export async function getGroups(boardId?: string): Promise<Group[]> {
  if (isPrismaEnabled) {
    try {
      const groups = await prisma.group.findMany({
        where: boardId ? { boardId } : undefined,
        include: { tasks: { where: { isArchived: false } } },
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
  assigneeId?: string;
  status?: TaskStatus;
}): Promise<Task[]> {
  if (isPrismaEnabled) {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          isArchived: false,
          ...(filter?.boardId && { boardId: filter.boardId }),
          ...(filter?.groupId && { groupId: filter.groupId }),
          ...(filter?.assigneeId && { assigneeId: filter.assigneeId }),
          ...(filter?.status && { status: filter.status }),
        },
        include: {
          subtasks: true,
          comments: true,
          activities: true,
        },
        orderBy: { order: "asc" },
      });

      return tasks.map((t) => ({
        id: t.id,
        itemCode: t.itemCode,
        boardId: t.boardId,
        groupId: t.groupId,
        title: t.title,
        description: t.description || "",
        status: (t.status as any) || "todo",
        priority: (t.priority as any) || "medium",
        assigneeId: t.assigneeId,
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
    result = result.filter((t) => t.assigneeId === filter.assigneeId);
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
        include: { subtasks: true, comments: true, activities: true },
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
          assigneeId: t.assigneeId,
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
  assigneeId?: string | null;
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
    assigneeId: data.assigneeId || null,
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
          assigneeId: newTask.assigneeId,
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
      | "assigneeId"
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
          ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
          ...(updates.category && { category: updates.category }),
          ...(updates.assigneeId !== undefined && {
            assigneeId: updates.assigneeId,
          }),
          ...(updates.groupId && { groupId: updates.groupId }),
          ...(updates.order !== undefined && { order: updates.order }),
        },
        include: { subtasks: true, comments: true, activities: true },
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
        assigneeId: updated.assigneeId,
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
  newAssigneeId: string | null,
  actorId?: string
): Promise<Task | null> {
  const db = readDb();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const effectiveActorId = actorId || db.users[0]?.id || "user-somchai";
  const newAssignee = newAssigneeId
    ? db.users.find((u) => u.id === newAssigneeId)
    : null;

  task.assigneeId = newAssigneeId;
  task.updatedAt = new Date();

  if (isPrismaEnabled) {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: { assigneeId: newAssigneeId },
      });
    } catch (e) {
      console.warn("Prisma assignTask fallback:", e);
    }
  }

  // Log activity
  const act: Activity = {
    id: `act-${Date.now()}`,
    taskId,
    boardId: task.boardId,
    actorId: effectiveActorId,
    type: "assignee_changed",
    description: newAssignee
      ? `assigned item to ${newAssignee.name}`
      : "unassigned item",
    createdAt: new Date(),
  };
  db.activities.unshift(act);
  task.activityIds.push(act.id);

  // Send notification to assignee
  if (newAssigneeId && newAssigneeId !== effectiveActorId) {
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: newAssigneeId,
      type: "assignment",
      title: "New Task Assigned",
      body: `You were assigned to "${task.title}"`,
      taskId: task.id,
      boardId: task.boardId,
      isRead: false,
      createdAt: new Date(),
    };
    db.notifications.unshift(notif);
  }

  writeDb(db);
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (isPrismaEnabled) {
    try {
      await prisma.task.update({
        where: { id },
        data: { isArchived: true },
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

// ─── Comments Operations ────────────────────────────────────────────────────

export async function getComments(taskId?: string): Promise<Comment[]> {
  if (isPrismaEnabled) {
    try {
      const comments = await prisma.comment.findMany({
        where: taskId ? { taskId } : undefined,
        orderBy: { createdAt: "desc" },
      });
      if (comments.length > 0) {
        return comments.map((c) => ({
          id: c.id,
          taskId: c.taskId,
          authorId: c.authorId,
          content: c.content,
          isEdited: c.isEdited,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      }
    } catch (e) {
      console.warn("Prisma getComments fallback:", e);
    }
  }

  const db = readDb();
  if (taskId) {
    return db.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.comments;
}

export async function addComment(data: {
  taskId: string;
  authorId: string;
  content: string;
}): Promise<Comment> {
  const db = readDb();
  const task = db.tasks.find((t) => t.id === data.taskId);

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    taskId: data.taskId,
    authorId: data.authorId,
    content: data.content.trim(),
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
          isEdited: false,
        },
      });
    } catch (e) {
      console.warn("Prisma addComment fallback:", e);
    }
  }

  db.comments.unshift(newComment);
  if (task) {
    task.commentIds.push(newComment.id);
  }

  writeDb(db);
  return newComment;
}

// ─── Subtasks Operations ────────────────────────────────────────────────────

export async function getSubtasks(taskId?: string): Promise<Subtask[]> {
  if (isPrismaEnabled) {
    try {
      const subs = await prisma.subtask.findMany({
        where: taskId ? { taskId } : undefined,
        orderBy: { createdAt: "asc" },
      });
      if (subs.length > 0) {
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
      }
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
      if (acts.length > 0) {
        return acts.map((a) => ({
          id: a.id,
          taskId: a.taskId || "task-1",
          boardId: a.boardId || "board-1",
          actorId: a.actorId,
          type: a.type as any,
          description: a.description,
          createdAt: a.createdAt,
        }));
      }
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
      if (notifs.length > 0) {
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
      }
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

  // Also ensure targetUser is in workspace.members
  if (db.workspace && db.workspace.members) {
    if (!db.workspace.members.some((m) => m.userId === targetUser!.id)) {
      db.workspace.members.push({
        userId: targetUser.id,
        workspaceId: db.workspace.id,
        role: "member",
        joinedAt: new Date(),
      });
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

  return { success: true, board, user: targetUser };
}

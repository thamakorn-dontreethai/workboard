import type {
  User,
  Workspace,
  Board,
  Group,
  Task,
  Subtask,
  Comment,
  Activity,
  Notification,
  TaskStatus,
  TaskPriority,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const DEFAULT_USER: User = {
  id: "user-somchai",
  name: "Somchai",
  email: "somchai@tgas.co.th",
  avatarInitials: "SC",
  avatarColor: "bg-emerald-600",
  role: "Project Manager",
  department: "Management",
  isActive: true,
};

export const MOCK_USERS: User[] = [
  DEFAULT_USER,
  {
    id: "user-thamakhorn",
    name: "Thamakhorn",
    email: "thamakhorn@gmail.com",
    avatarInitials: "TH",
    avatarColor: "bg-teal-600",
    role: "Member",
    isActive: true,
  },
  {
    id: "user-1789025805350",
    name: "Tha Don",
    email: "thamakorn.do@ku.th",
    avatarInitials: "TD",
    avatarColor: "bg-indigo-600",
    role: "Member",
    department: "General",
    isActive: true,
  },
];

export const CURRENT_USER = DEFAULT_USER;

// ─── Workspace ────────────────────────────────────────────────────────────────

export const MOCK_WORKSPACE: Workspace = {
  id: "ws-1",
  name: "TGAS Workspace",
  description: "Main workspace for TGAS cross-functional teams and company-wide projects.",
  plan: "Enterprise",
  privacy: "open",
  avatarColor: "bg-indigo-600",
  isPinned: true,
  members: [
    {
      userId: "user-somchai",
      workspaceId: "ws-1",
      role: "owner",
      joinedAt: daysAgo(30),
    },
    {
      userId: "user-thamakhorn",
      workspaceId: "ws-1",
      role: "member",
      joinedAt: daysAgo(20),
    },
    {
      userId: "user-1789025805350",
      workspaceId: "ws-1",
      role: "member",
      joinedAt: daysAgo(10),
    },
  ],
  createdAt: daysAgo(60),
  lastViewedAt: new Date(),
};

export const MOCK_WORKSPACES: Workspace[] = [
  MOCK_WORKSPACE,
  {
    id: "ws-2",
    name: "Growth & Marketing",
    description: "Brand management, customer acquisition campaigns, and content strategy.",
    plan: "Pro",
    privacy: "open",
    avatarColor: "bg-emerald-600",
    isPinned: false,
    members: [
      {
        userId: "user-somchai",
        workspaceId: "ws-2",
        role: "owner",
        joinedAt: daysAgo(25),
      },
    ],
    createdAt: daysAgo(45),
    lastViewedAt: daysAgo(2),
  },
  {
    id: "ws-3",
    name: "Alex's Personal Space",
    description: "Private projects, quick notes, and individual task backlog.",
    plan: "Free",
    privacy: "closed",
    avatarColor: "bg-zinc-600",
    isPinned: false,
    members: [
      {
        userId: "user-somchai",
        workspaceId: "ws-3",
        role: "owner",
        joinedAt: daysAgo(15),
      },
    ],
    createdAt: daysAgo(30),
    lastViewedAt: daysAgo(5),
  },
];

// ─── Boards (Universal Business Terminology) ──────────────────────────────────

export const MOCK_BOARDS: Board[] = [];

// ─── Groups ───────────────────────────────────────────────────────────────────

export const MOCK_GROUPS: Group[] = [];

// ─── Initial State (empty – users populate their own data) ───────────────────

export const MOCK_TASKS: Task[] = [
];

export const MOCK_SUBTASKS: Subtask[] = [];

export const MOCK_COMMENTS: Comment[] = [];

export const MOCK_ACTIVITIES: Activity[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];

// ─── Data Access Helpers ──────────────────────────────────────────────────────

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getBoardById(id: string): Board | undefined {
  return MOCK_BOARDS.find((b) => b.id === id);
}

export function getGroupById(id: string): Group | undefined {
  return MOCK_GROUPS.find((g) => g.id === id);
}

export function getTaskById(id: string): Task | undefined {
  return MOCK_TASKS.find((t) => t.id === id);
}

export function getTasksByBoard(boardId: string): Task[] {
  return MOCK_TASKS.filter((t) => t.boardId === boardId && !t.isArchived);
}

export function getTasksByGroup(groupId: string): Task[] {
  return MOCK_TASKS.filter((t) => t.groupId === groupId && !t.isArchived).sort(
    (a, b) => a.order - b.order
  );
}

export function getGroupsByBoard(boardId: string): Group[] {
  return MOCK_GROUPS.filter((g) => g.boardId === boardId).sort(
    (a, b) => a.order - b.order
  );
}

export function getSubtasksByTask(taskId: string): Subtask[] {
  return MOCK_SUBTASKS.filter((s) => s.taskId === taskId);
}

export function getCommentsByTask(taskId: string): Comment[] {
  return MOCK_COMMENTS.filter((c) => c.taskId === taskId);
}

export function getActivitiesByTask(taskId: string): Activity[] {
  return MOCK_ACTIVITIES.filter((a) => a.taskId === taskId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getRecentActivities(limit = 10): Activity[] {
  return [...MOCK_ACTIVITIES]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getMyTasks(userId: string): Task[] {
  return MOCK_TASKS.filter(
    (t) => t.assigneeId === userId && !t.isArchived && t.status !== "done" && t.status !== "cancelled"
  );
}

export function getDueSoonTasks(userId: string, withinDays = 7): Task[] {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  return MOCK_TASKS.filter(
    (t) =>
      t.assigneeId === userId &&
      !t.isArchived &&
      t.status !== "done" &&
      t.status !== "cancelled" &&
      t.dueDate !== null &&
      t.dueDate >= now &&
      t.dueDate <= cutoff
  );
}

export function getRecentBoards(limit = 5): Board[] {
  return [...MOCK_BOARDS]
    .filter((b) => !b.isArchived && b.lastViewedAt)
    .sort((a, b) => b.lastViewedAt!.getTime() - a.lastViewedAt!.getTime())
    .slice(0, limit);
}

export function getBoardStats(boardId: string) {
  const tasks = getTasksByBoard(boardId);
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length,
    overdue: tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done"
    ).length,
  };
}

export function getWorkspaceStats(userId: string) {
  const myTasks = MOCK_TASKS.filter(
    (t) => t.assigneeId === userId && !t.isArchived
  );
  return {
    totalAssigned: myTasks.length,
    inProgress: myTasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length,
    completed: myTasks.filter((t) => t.status === "done").length,
    overdue: myTasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done"
    ).length,
  };
}

// Domain types for WorkBoard - Modern Universal Work & Project Management Platform

// ─── Core Identity ────────────────────────────────────────────────────────────

export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  password?: string;
  avatarInitials: string;
  avatarColor: string; // Tailwind bg class e.g. "bg-blue-500"
  role: string;
  department?: string;
  isActive: boolean;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: ID;
  name: string;
  description?: string;
  logo?: string;
  icon?: string; // e.g. "initial", "origami", "bolt", "brain", "crown", "diamond", etc.
  plan: "Free" | "Pro" | "Enterprise";
  privacy: "open" | "closed";
  avatarColor: string; // e.g. "bg-indigo-600"
  coverColor?: string; // Gradient / color for workspace cover header
  isPinned?: boolean;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt?: Date;
  lastViewedAt?: Date;
}

export interface WorkspaceMember {
  userId: ID;
  workspaceId: ID;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: Date;
}

// ─── Boards ───────────────────────────────────────────────────────────────────

export type BoardType = "project" | "roadmap" | "requests" | "marketing" | "operations" | "general";

export type BoardPrivacy = "main" | "private" | "shareable";

export interface Board {
  id: ID;
  workspaceId: ID;
  folderId?: ID;
  name: string;
  description: string;
  type: BoardType;
  color: string; // Tailwind color class e.g. "bg-blue-500"
  privacy?: BoardPrivacy;
  ownerId: ID;
  memberIds: ID[];
  groupIds: ID[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
}

// ─── Folders (organize boards within a workspace) ──────────────────────────

export interface Folder {
  id: ID;
  workspaceId: ID;
  name: string;
  color: string; // Tailwind text color class e.g. "text-amber-400"
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardInvitation {
  id: ID;
  token: string;
  boardId: ID;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  invitedById: ID;
  createdAt: Date;
  acceptedAt?: Date;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export interface Group {
  id: ID;
  boardId: ID;
  name: string;
  color: string; // Hex color for the group border e.g. "#3b82f6"
  order: number;
  isCollapsed: boolean;
  taskIds: ID[];
  createdAt: Date;
}

// ─── Tasks / Work Items (Universal) ──────────────────────────────────────────

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"
  | "on_hold"
  | "cancelled"
  | "new_request"
  | "approved"
  | "planning";

export type TaskPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "none";

export interface Task {
  id: ID;
  itemCode?: string; // e.g. "WB-101", "REQ-204"
  boardId: ID;
  groupId: ID;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ID | null;
  reporterId: ID;
  dueDate: Date | null;
  timeline?: { start: string; end: string } | null;
  category?: string; // e.g. "Design", "Marketing", "Operations", "Finance", "Strategy"
  estimatedHours?: number | null;
  votes?: number;
  tags: string[];
  subtaskIds: ID[];
  commentIds: ID[];
  attachmentIds: ID[];
  activityIds: ID[];
  order: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export interface Subtask {
  id: ID;
  taskId: ID;
  title: string;
  isCompleted: boolean;
  assigneeId: ID | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: ID;
  taskId: ID;
  authorId: ID;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export type AttachmentType = "image" | "document" | "video" | "archive" | "other";

export interface Attachment {
  id: ID;
  taskId: ID;
  uploadedById: ID;
  name: string;
  size: number;
  mimeType: string;
  type: AttachmentType;
  url: string;
  createdAt: Date;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType =
  | "task_created"
  | "task_updated"
  | "status_changed"
  | "priority_changed"
  | "assignee_changed"
  | "due_date_changed"
  | "comment_added"
  | "subtask_completed"
  | "attachment_added"
  | "task_completed";

export interface Activity {
  id: ID;
  taskId: ID;
  boardId: ID;
  actorId: ID;
  type: ActivityType;
  description: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "mention"
  | "assignment"
  | "status_change"
  | "comment"
  | "due_date"
  | "todo_reminder";

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  taskId: ID | null;
  boardId: ID | null;
  isRead: boolean;
  createdAt: Date;
}

// ─── Personal To-Dos (private, per-user, not tied to any workspace/board) ──────

export interface PersonalTodo {
  id: ID;
  userId: ID;
  title: string;
  notes?: string;
  dueAt: Date | null;
  reminderMinutesBefore: number;
  isCompleted: boolean;
  reminderSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Workspace Posts (a simple social feed scoped to one workspace) ───────────

export interface PostComment {
  id: ID;
  postId: ID;
  authorId: ID;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
}

export interface Post {
  id: ID;
  workspaceId: ID;
  authorId: ID;
  content: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comments: PostComment[];
  likeCount: number;
  dislikeCount: number;
  myReaction: "like" | "dislike" | null;
}

// ─── Workspace Files (document library — PDF, Word, Excel, 3D models, etc.) ───

export interface WorkspaceFile {
  id: ID;
  workspaceId: ID;
  name: string;
  caption?: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedById: ID;
  createdAt: Date;
}

// ─── Status & Priority Configurations (Universal Monday Style) ────────────────

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string; dotColor: string; barColor: string }
> = {
  todo: {
    label: "To Do",
    color: "text-zinc-200",
    bgColor: "bg-[#575a6b] hover:bg-[#666a7d]",
    dotColor: "bg-zinc-400",
    barColor: "#575a6b",
  },
  in_progress: {
    label: "Working on it",
    color: "text-zinc-900",
    bgColor: "bg-[#fdab3d] hover:bg-[#e59930] text-zinc-900 font-semibold",
    dotColor: "bg-amber-400",
    barColor: "#fdab3d",
  },
  in_review: {
    label: "Under Review",
    color: "text-white",
    bgColor: "bg-[#a25ddc] hover:bg-[#8f4cc9]",
    dotColor: "bg-purple-400",
    barColor: "#a25ddc",
  },
  done: {
    label: "Done",
    color: "text-white",
    bgColor: "bg-[#00c875] hover:bg-[#00b066]",
    dotColor: "bg-emerald-400",
    barColor: "#00c875",
  },
  blocked: {
    label: "Stuck",
    color: "text-white",
    bgColor: "bg-[#df2f4a] hover:bg-[#c9243d]",
    dotColor: "bg-red-400",
    barColor: "#df2f4a",
  },
  on_hold: {
    label: "On Hold",
    color: "text-white",
    bgColor: "bg-[#797e93] hover:bg-[#6a6f83]",
    dotColor: "bg-zinc-400",
    barColor: "#797e93",
  },
  new_request: {
    label: "New Request",
    color: "text-white",
    bgColor: "bg-[#0086c0] hover:bg-[#0073ea]",
    dotColor: "bg-sky-400",
    barColor: "#0086c0",
  },
  approved: {
    label: "Approved",
    color: "text-white",
    bgColor: "bg-[#00d084] hover:bg-[#00ba75]",
    dotColor: "bg-teal-400",
    barColor: "#00d084",
  },
  planning: {
    label: "Planning",
    color: "text-white",
    bgColor: "bg-[#5034ff] hover:bg-[#4327ea]",
    dotColor: "bg-indigo-400",
    barColor: "#5034ff",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-zinc-300",
    bgColor: "bg-[#333748] hover:bg-[#404458]",
    dotColor: "bg-zinc-500",
    barColor: "#333748",
  },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; iconColor: string }
> = {
  urgent: {
    label: "Urgent",
    color: "text-white",
    bgColor: "bg-red-600 hover:bg-red-500",
    iconColor: "text-red-500",
  },
  high: {
    label: "High",
    color: "text-white",
    bgColor: "bg-orange-600 hover:bg-orange-500",
    iconColor: "text-orange-500",
  },
  medium: {
    label: "Medium",
    color: "text-white",
    bgColor: "bg-blue-600 hover:bg-blue-500",
    iconColor: "text-blue-500",
  },
  low: {
    label: "Low",
    color: "text-white",
    bgColor: "bg-emerald-600 hover:bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  none: {
    label: "None",
    color: "text-zinc-400",
    bgColor: "bg-zinc-800",
    iconColor: "text-zinc-500",
  },
};

/** Shared palette used when a new group needs a color — both for picking a
 *  default that isn't reused within a board and for the group color picker UI. */
export const GROUP_COLOR_PALETTE: string[] = [
  "#0073ea", // Blue
  "#a25ddc", // Purple
  "#00c875", // Green
  "#fdab3d", // Orange
  "#e2445c", // Red
  "#579bfc", // Sky
  "#ff642e", // Deep orange
  "#bb3354", // Maroon
  "#037f4c", // Dark green
  "#9d99b9", // Gray purple
];

/** Safe helper to get status configuration with robust fallback */
export function getTaskStatusConfig(status: TaskStatus | string | undefined | null) {
  const norm = status === "stuck" ? "blocked" : status;
  if (norm && (TASK_STATUS_CONFIG as any)[norm]) {
    return (TASK_STATUS_CONFIG as any)[norm];
  }
  return {
    label: String(status || "To Do"),
    color: "text-zinc-200",
    bgColor: "bg-[#575a6b] hover:bg-[#666a7d]",
    dotColor: "bg-zinc-400",
    barColor: "#575a6b",
  };
}

/** Safe helper to get priority configuration with robust fallback */
export function getTaskPriorityConfig(priority: TaskPriority | string | undefined | null) {
  if (priority && (TASK_PRIORITY_CONFIG as any)[priority]) {
    return (TASK_PRIORITY_CONFIG as any)[priority];
  }
  return {
    label: String(priority || "Medium"),
    color: "text-white",
    bgColor: "bg-blue-600 hover:bg-blue-500",
    iconColor: "text-blue-500",
  };
}

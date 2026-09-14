import { type TaskStatus, type TaskPriority } from "@/types";

/**
 * Format a Date as a relative human-readable string.
 * e.g. "2 hours ago", "yesterday", "in 3 days"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  const minutes = Math.floor(absDiff / 60_000);
  const hours = Math.floor(absDiff / 3_600_000);
  const days = Math.floor(absDiff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return isPast ? `${minutes}m ago` : `in ${minutes}m`;
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`;
  if (days === 1) return isPast ? "yesterday" : "tomorrow";
  if (days < 7) return isPast ? `${days}d ago` : `in ${days}d`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return isPast ? `${weeks}w ago` : `in ${weeks}w`;
  }

  return formatDate(date);
}

/**
 * Format a Date as a short human-readable date string.
 * e.g. "Sep 12", "Jan 3, 2025"
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const sameYear = now.getFullYear() === date.getFullYear();

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Returns true if a due date is overdue (in the past) and task is not completed.
 */
export function isOverdue(dueDate: Date | null, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "approved" || status === "cancelled") return false;
  return dueDate < new Date();
}

/**
 * Returns true if a due date is "due soon" (within N days) and task is not completed.
 */
export function isDueSoon(
  dueDate: Date | null,
  status: TaskStatus,
  withinDays = 3
): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "approved" || status === "cancelled") return false;
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  return dueDate >= now && dueDate <= cutoff;
}

/**
 * Format file size into human readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Get the Tailwind classes for a task status badge.
 */
export function getStatusBadgeClasses(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    todo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_review: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blocked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    on_hold: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    new_request: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    approved: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    planning: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    cancelled: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
  };
  return map[status] || "bg-muted text-muted-foreground";
}

/**
 * Get the Tailwind text color class for a priority label.
 */
export function getPriorityColor(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    urgent: "text-red-600 dark:text-red-400",
    high: "text-orange-600 dark:text-orange-400",
    medium: "text-blue-600 dark:text-blue-400",
    low: "text-emerald-600 dark:text-emerald-400",
    none: "text-zinc-400 dark:text-zinc-500",
  };
  return map[priority] || "text-zinc-400";
}

/** Generate a stable color from a string (for user avatars, etc.) */
export function stringToColor(str: string): string {
  const colors = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-rose-600",
    "bg-red-600",
    "bg-amber-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

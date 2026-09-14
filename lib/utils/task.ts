import { type TaskPriority, type TaskStatus } from "@/types";
import {
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PRIORITY_ICON: Record<TaskPriority, LucideIcon> = {
  urgent: AlertTriangle,
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
  none: Minus,
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No Priority",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "Under Review",
  done: "Done",
  blocked: "Blocked",
  on_hold: "On Hold",
  new_request: "New Request",
  approved: "Approved",
  planning: "Planning",
  cancelled: "Cancelled",
};

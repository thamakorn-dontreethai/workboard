"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  getTaskStatusConfig,
  getTaskPriorityConfig,
  Task,
  TaskStatus,
} from "@/types";
import { formatDate, isOverdue } from "@/lib/utils/date";
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Calendar,
  Plus,
  Filter,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
} from "lucide-react";

export default function MyWorkPage() {
  const {
    currentUser,
    tasks,
    boards,
    updateTaskStatus,
    openTaskModal,
    openCreateTaskModal,
  } = useWorkBoard();

  const [filter, setFilter] = useState<"all" | "in_progress" | "high" | "done">(
    "all"
  );

  // Deep-link support: /my-work?taskId=... (e.g. from the Calendar page)
  // opens that task's detail slide-over automatically on arrival.
  const searchParams = useSearchParams();
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) openTaskModal(taskId);
  }, [searchParams, openTaskModal]);

  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id && !t.isArchived);

  const filteredTasks = myTasks.filter((t) => {
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "high") return t.priority === "urgent" || t.priority === "high";
    if (filter === "done") return t.status === "done";
    return t.status !== "done" && t.status !== "cancelled";
  });

  const now = new Date();
  const overdueTasks = filteredTasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate < now &&
      t.status !== "done" &&
      t.status !== "cancelled"
  );

  const upcomingTasks = filteredTasks.filter(
    (t) =>
      !t.dueDate ||
      t.dueDate >= now ||
      t.status === "done" ||
      t.status === "cancelled"
  );

  const renderTaskItem = (task: Task) => {
    const statusCfg = getTaskStatusConfig(task.status);
    const priorityCfg = getTaskPriorityConfig(task.priority);
    const board = boards.find((b) => b.id === task.boardId);
    const overdue = isOverdue(task.dueDate, task.status);

    return (
      <div
        key={task.id}
        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all group"
      >
        {/* Toggle complete button */}
        <button
          type="button"
          onClick={() =>
            updateTaskStatus(
              task.id,
              task.status === "done" ? "todo" : "done"
            )
          }
          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          {task.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Task Title & Board */}
        <div
          onClick={() => openTaskModal(task.id)}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <p
            className={`text-sm font-semibold truncate ${
              task.status === "done"
                ? "line-through text-muted-foreground"
                : "text-foreground group-hover:text-primary transition-colors"
            }`}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {board && (
              <span className="text-[11px] text-muted-foreground truncate">
                {board.name}
              </span>
            )}
            {task.description && (
              <>
                <span className="text-muted-foreground/40 text-[10px]">·</span>
                <span className="text-[11px] text-muted-foreground truncate line-clamp-1">
                  {task.description}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status pill */}
        <div className="shrink-0 hidden sm:block">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Priority */}
        <div className="shrink-0 hidden md:block">
          <span
            className={`text-[10px] font-bold uppercase ${priorityCfg.color}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="shrink-0 text-right">
            <span
              className={`text-xs font-medium tabular-nums ${
                overdue
                  ? "text-red-500 font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {overdue ? "⚠ " : ""}
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1200px] mx-auto w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              My Work
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {myTasks.filter((t) => t.status !== "done").length} open
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Personal task queue for <strong>{currentUser.name}</strong> (
            {currentUser.role}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateTaskModal()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs self-start sm:self-center"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        {(
          [
            { id: "all", label: "All Active" },
            { id: "in_progress", label: "In Progress" },
            { id: "high", label: "Urgent & High" },
            { id: "done", label: "Completed" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.id
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Overdue Section (if any) */}
        {overdueTasks.length > 0 && filter !== "done" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-500">
                Overdue ({overdueTasks.length})
              </h2>
            </div>
            <div className="space-y-2">
              {overdueTasks.map(renderTaskItem)}
            </div>
          </div>
        )}

        {/* Active / Filtered Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {filter === "done" ? "Completed Tasks" : "Active Tasks"} (
              {upcomingTasks.length})
            </h2>
          </div>

          {upcomingTasks.length === 0 && overdueTasks.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                No tasks to display!
              </p>
              <p className="text-xs text-muted-foreground">
                You have no matching tasks assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(renderTaskItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

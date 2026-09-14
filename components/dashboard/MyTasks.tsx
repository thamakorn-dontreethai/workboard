"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type Task, TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils/date";
import { PRIORITY_ICON } from "@/lib/utils/task";
import { ExternalLink, Minus } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const statusCfg = TASK_STATUS_CONFIG[task.status] || {
    label: task.status,
    bgColor: "bg-muted",
    color: "text-foreground",
    dotColor: "bg-zinc-400",
  };
  const priorityCfg = TASK_PRIORITY_CONFIG[task.priority] || {
    color: "text-foreground",
    iconColor: "text-zinc-400",
  };
  const PriorityIcon = PRIORITY_ICON[task.priority] || Minus;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 -mx-2 hover:bg-muted/60 transition-colors text-left cursor-pointer"
    >
      {/* Priority icon */}
      <div className="shrink-0">
        <PriorityIcon className={`h-3.5 w-3.5 ${priorityCfg.iconColor}`} />
      </div>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate leading-snug group-hover:text-primary transition-colors">
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {task.itemCode || `Task #${task.id.replace("task-", "")}`}
        </p>
      </div>

      {/* Status pill */}
      <div className="shrink-0">
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${statusCfg.bgColor} ${statusCfg.color}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotColor}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className="shrink-0 text-right">
          <span
            className={`text-xs tabular-nums font-medium ${
              overdue
                ? "text-red-500 dark:text-red-400 font-bold"
                : "text-muted-foreground"
            }`}
          >
            {overdue ? "⚠ " : ""}
            {formatDate(task.dueDate)}
          </span>
        </div>
      )}

      {/* Arrow on hover */}
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export function MyTasks() {
  const { getMyTasks, openTaskModal } = useWorkBoard();
  const tasks = getMyTasks();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? tasks : tasks.slice(0, 6);
  const hasMore = tasks.length > 6;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">My Assigned Tasks</h2>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
            {tasks.length}
          </span>
        </div>
        <Link
          href="/my-work"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          View all
        </Link>
      </div>

      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">All caught up! 🎉</p>
            <p className="text-xs text-muted-foreground">
              No open tasks currently assigned to you.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => openTaskModal(task.id)}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="w-full pt-2 text-xs font-medium text-primary hover:underline transition-all text-center"
              >
                {showAll ? "Show less" : `Show ${tasks.length - 6} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { TASK_STATUS_CONFIG, getTaskStatusConfig } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils/date";
import { CalendarClock } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

export function DueSoonTasks() {
  const { tasks, currentUser, openTaskModal } = useWorkBoard();

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 7);

  const dueSoonTasks = tasks
    .filter(
      (t) =>
        t.assigneeIds.includes(currentUser.id) &&
        !t.isArchived &&
        t.status !== "done" &&
        t.status !== "cancelled" &&
        t.dueDate !== null &&
        t.dueDate >= now &&
        t.dueDate <= cutoff
    )
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">Due Soon</h2>
          {dueSoonTasks.length > 0 && (
            <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              {dueSoonTasks.length}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">Next 7 days</span>
      </div>

      <div className="p-4">
        {dueSoonTasks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-muted-foreground">No tasks due this week.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dueSoonTasks.slice(0, 5).map((task) => {
              const statusCfg = getTaskStatusConfig(task.status);
              const overdue = isOverdue(task.dueDate, task.status);
              const daysUntilDue = task.dueDate
                ? Math.ceil(
                    (task.dueDate.getTime() - new Date().getTime()) / 86_400_000
                  )
                : null;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTaskModal(task.id)}
                  className="w-full flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/60 transition-colors group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dotColor}`}
                    />
                    <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-medium tabular-nums ${
                        overdue
                          ? "text-red-500"
                          : daysUntilDue !== null && daysUntilDue <= 2
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </span>
                    {daysUntilDue !== null && (
                      <span
                        className={`text-[10px] rounded px-1 py-0.5 font-medium ${
                          overdue
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : daysUntilDue === 0
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {overdue
                          ? "Overdue"
                          : daysUntilDue === 0
                          ? "Today"
                          : daysUntilDue === 1
                          ? "Tomorrow"
                          : `${daysUntilDue}d`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

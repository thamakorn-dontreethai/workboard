"use client";

import React from "react";
import { Task, TASK_STATUS_CONFIG, TaskStatus } from "@/types";

interface GroupSummaryBarProps {
  tasks: Task[];
  height?: string;
  showDetails?: boolean;
}

export function GroupSummaryBar({
  tasks,
  height = "h-4",
  showDetails = false,
}: GroupSummaryBarProps) {
  if (tasks.length === 0) {
    return (
      <div className={`w-full ${height} rounded-md bg-muted/40 overflow-hidden border border-border/40`} />
    );
  }

  // Count status distribution
  const statusCounts: Partial<Record<TaskStatus, number>> = {};
  tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  const total = tasks.length;
  const statusEntries = Object.entries(statusCounts) as [TaskStatus, number][];

  return (
    <div className="w-full flex flex-col gap-1">
      {/* Segmented bar */}
      <div
        className={`w-full ${height} rounded-md overflow-hidden flex border border-border/50 shadow-2xs`}
      >
        {statusEntries.map(([st, count]) => {
          const cfg = TASK_STATUS_CONFIG[st];
          const pct = (count / total) * 100;
          return (
            <div
              key={st}
              title={`${cfg?.label || st}: ${count} (${Math.round(pct)}%)`}
              className="h-full transition-all duration-300 hover:opacity-90 cursor-help first:rounded-l-sm last:rounded-r-sm"
              style={{
                width: `${pct}%`,
                backgroundColor: cfg?.barColor || "#71717a",
              }}
            />
          );
        })}
      </div>

      {/* Optional details */}
      {showDetails && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground pt-1">
          {statusEntries.map(([st, count]) => {
            const cfg = TASK_STATUS_CONFIG[st];
            return (
              <span key={st} className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cfg?.barColor || "#71717a" }}
                />
                <span>{cfg?.label || st}: {count}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

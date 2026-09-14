"use client";

import React from "react";
import Link from "next/link";
import { type Board } from "@/types";
import { formatRelativeDate } from "@/lib/utils/date";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

function BoardCard({ board }: { board: Board }) {
  const { tasks, users } = useWorkBoard();

  const boardTasks = tasks.filter((t) => t.boardId === board.id && !t.isArchived);
  const total = boardTasks.length;
  const completed = boardTasks.filter((t) => t.status === "done").length;
  const inProgress = boardTasks.filter((t) => t.status === "in_progress").length;
  const overdue = boardTasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate < new Date() &&
      t.status !== "done" &&
      t.status !== "cancelled"
  ).length;

  const members = users.filter((u) => board.memberIds.includes(u.id));
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link
      href={`/board/${board.id}`}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/40 transition-all p-4"
    >
      <div className="space-y-3">
        {/* Board color bar + name */}
        <div className="flex items-start gap-3">
          <div className={`h-8 w-1.5 rounded-full shrink-0 ${board.color}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
              {board.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {board.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground">
              {completionPct}% complete
            </span>
            <span className="text-[11px] text-muted-foreground">
              {completed}/{total} tasks
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: members + stats */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
        {/* Stacked avatars */}
        <div className="flex items-center">
          {members.slice(0, 4).map((member, idx) => (
            <div
              key={member.id}
              title={member.name}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-card ${
                member.avatarColor || "bg-primary"
              } ${idx > 0 ? "-ml-1.5" : ""}`}
            >
              {member.avatarInitials}
            </div>
          ))}
          {members.length > 4 && (
            <div className="flex h-5 w-5 -ml-1.5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-card">
              +{members.length - 4}
            </div>
          )}
        </div>

        {/* Task counts */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {inProgress > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {inProgress} active
            </span>
          )}
          {overdue > 0 && (
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {overdue} overdue
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RecentBoards() {
  const { boards } = useWorkBoard();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Project Boards</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {boards.length} boards
        </span>
      </div>

      <div className="p-4">
        {boards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No boards yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {boards.slice(0, 6).map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

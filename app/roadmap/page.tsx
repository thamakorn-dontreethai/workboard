"use client";

import React from "react";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { MondayTable } from "@/components/board/MondayTable";
import {
  Compass,
  Plus,
  ArrowLeft,
  Target,
} from "lucide-react";

export default function RoadmapPage() {
  const { tasks, openCreateTaskModal } = useWorkBoard();

  const okrTasks = tasks.filter((t) => t.boardId === "board-roadmap" && !t.isArchived);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 px-4 sm:px-6 pt-4 pb-2 border-b border-border bg-card shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Compass className="h-4 w-4" />
                </span>
                <h1 className="text-xl font-bold text-foreground truncate tracking-tight">
                  Company Goals & OKRs
                </h1>
                <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  {okrTasks.length} objectives
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Quarterly company key results, executive milestones, and cross-functional initiatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCreateTaskModal("board-roadmap", "group-rd1")}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Objective</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
        <MondayTable boardId="board-roadmap" />
      </div>
    </div>
  );
}

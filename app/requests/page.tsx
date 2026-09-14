"use client";

import React from "react";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { MondayTable } from "@/components/board/MondayTable";
import {
  Inbox,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function RequestsPage() {
  const { tasks, openCreateTaskModal } = useWorkBoard();

  const reqTasks = tasks.filter((t) => t.boardId === "board-requests" && !t.isArchived);
  const newRequests = reqTasks.filter((t) => t.status === "new_request").length;
  const inProgress = reqTasks.filter((t) => t.status === "in_progress" || t.status === "in_review").length;
  const approved = reqTasks.filter((t) => t.status === "done" || t.status === "approved").length;

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
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Inbox className="h-4 w-4" />
                </span>
                <h1 className="text-xl font-bold text-foreground truncate tracking-tight">
                  Client & Team Requests
                </h1>
                <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                  {reqTasks.length} requests
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Intake queue for cross-team requests, client deliverables, contracts, and approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">

            <button
              type="button"
              onClick={() => openCreateTaskModal("board-requests", "group-r1")}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Request</span>
            </button>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="flex items-center gap-4 text-xs font-semibold py-1">
          <span className="text-amber-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {newRequests} New Intake
          </span>
          <span className="text-blue-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {inProgress} In Review & Progress
          </span>
          <span className="text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {approved} Approved & Delivered
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
        <MondayTable boardId="board-requests" />
      </div>
    </div>
  );
}

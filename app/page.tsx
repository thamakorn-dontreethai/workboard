"use client";

import React from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { TaskStats } from "@/components/dashboard/TaskStats";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { DueSoonTasks } from "@/components/dashboard/DueSoonTasks";
import { RecentBoards } from "@/components/dashboard/RecentBoards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { Users, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { currentUser, getWorkspaceStats, openCreateTaskModal, openInviteMemberModal, workspace } =
    useWorkBoard();
  const stats = getWorkspaceStats();

  const currentMember = workspace.members.find(
    (m) => m.userId === currentUser.id
  );
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-200">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <WelcomeBanner user={currentUser} />

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/team"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Manage Team</span>
          </Link>

          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={openInviteMemberModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>Invite Member</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openCreateTaskModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create & Assign</span>
          </button>
        </div>
      </div>

      {/* Task statistics for active user */}
      <TaskStats
        totalAssigned={stats.totalAssigned}
        inProgress={stats.inProgress}
        completed={stats.completed}
        overdue={stats.overdue}
      />

      {/* Recent boards */}
      <RecentBoards />

      {/* My tasks + side widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <MyTasks />

        <div className="flex flex-col gap-4">
          <DueSoonTasks />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

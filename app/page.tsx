"use client";

import React from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { TaskStats } from "@/components/dashboard/TaskStats";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { DueSoonTasks } from "@/components/dashboard/DueSoonTasks";
import { RecentBoards } from "@/components/dashboard/RecentBoards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

export default function DashboardPage() {
  const { currentUser, getWorkspaceStats } = useWorkBoard();
  const stats = getWorkspaceStats();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-200">
      {/* Top Banner */}
      <WelcomeBanner user={currentUser} />

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

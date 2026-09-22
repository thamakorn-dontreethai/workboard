"use client";

import React, { useState } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, getTaskStatusConfig, getTaskPriorityConfig, Task } from "@/types";
import { formatDate } from "@/lib/utils/date";
import { PRIORITY_ICON } from "@/lib/utils/task";

export default function TeamPage() {
  const {
    workspace,
    users,
    tasks,
    currentUser,
    openInviteMemberModal,
    openCreateTaskModal,
    openTaskModal,
    updateMemberRole,
    removeMember,
    switchUser,
  } = useWorkBoard();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const currentMember = workspace.members?.find(
    (m) => m.userId === currentUser.id
  );
  const isOwnerOrAdmin =
    !currentMember ||
    currentMember?.role === "owner" ||
    currentMember?.role === "admin" ||
    currentUser.role?.toLowerCase().includes("owner") ||
    currentUser.role?.toLowerCase().includes("admin") ||
    currentUser.role?.toLowerCase().includes("manager");

  const displayUsers = users.some((u) => u.id === currentUser.id)
    ? users
    : currentUser.id
    ? [currentUser, ...users]
    : users;

  const memberList = displayUsers.map((user) => {
    const memberRecord = workspace.members.find((m) => m.userId === user.id);
    const assignedTasks = tasks.filter(
      (t) => t.assigneeIds.includes(user.id) && !t.isArchived
    );
    const inProgressTasks = assignedTasks.filter(
      (t) => t.status === "in_progress"
    );
    const doneTasks = assignedTasks.filter((t) => t.status === "done");
    const overdueTasks = assignedTasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < new Date() &&
        t.status !== "done" &&
        t.status !== "cancelled"
    );

    return {
      ...user,
      workspaceRole: memberRecord?.role || "member",
      joinedAt: memberRecord?.joinedAt || new Date(),
      totalTasks: assignedTasks.length,
      inProgressCount: inProgressTasks.length,
      doneCount: doneTasks.length,
      overdueCount: overdueTasks.length,
      tasks: assignedTasks,
    };
  });

  const filteredMembers = memberList.filter((m) => {
    const q = search.toLowerCase();
    const matchesQuery =
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q);
    const matchesRole =
      roleFilter === "all" ? true : m.workspaceRole === roleFilter;
    return matchesQuery && matchesRole;
  });

  const selectedMember = selectedMemberId
    ? memberList.find((m) => m.id === selectedMemberId)
    : null;

  const totalAssignedTasks = tasks.filter(
    (t) => t.assigneeIds.length > 0 && !t.isArchived
  ).length;
  const totalCompletedTasks = tasks.filter(
    (t) => t.status === "done" && !t.isArchived
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Team Members & Workload
            </h1>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
              {users.length} members
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage roles, delegate tasks, and monitor active engineering capacity
            for <strong>{workspace.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={openInviteMemberModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Total Team Size
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
              {users.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              1 Owner · {users.filter((u) => u.role.includes("Admin")).length || 1} Admins · {users.length - 2} Members
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Active Delegated Work
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
              {totalAssignedTasks}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              tasks assigned across all members
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Tasks Completed
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">
              {totalCompletedTasks}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              delivered by engineering team
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or email..."
            className="w-full rounded-lg bg-muted/50 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Role:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Members Grid + Workload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredMembers.map((member) => {
            const isCurrentUser = member.id === currentUser.id;
            const isSelected = member.id === selectedMemberId;

            return (
              <div
                key={member.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card transition-all ${
                  isSelected
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "border-border hover:border-border/80"
                }`}
              >
                {/* Member Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm shadow-xs ${
                      member.avatarColor || "bg-primary"
                    }`}
                  >
                    {member.avatarInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {member.email} · <span className="text-foreground/80">{member.role}</span>
                    </div>

                    {/* Workload badges */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                        <Clock className="h-3 w-3 text-blue-500" />
                        {member.totalTasks} active tasks
                      </span>
                      {member.inProgressCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          {member.inProgressCount} in progress
                        </span>
                      )}
                      {member.overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {member.overdueCount} overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Role Selector */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Role Selector */}
                  <select
                    value={member.workspaceRole}
                    disabled={!isOwnerOrAdmin || member.workspaceRole === "owner"}
                    onChange={(e) =>
                      updateMemberRole(
                        member.id,
                        e.target.value as "owner" | "admin" | "member" | "viewer"
                      )
                    }
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground capitalize focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {/* View Tasks Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMemberId(
                        selectedMemberId === member.id ? null : member.id
                      )
                    }
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                  </button>


                  {/* Remove Member */}
                  {isOwnerOrAdmin &&
                    !isCurrentUser &&
                    member.workspaceRole !== "owner" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${member.name} from the workspace? All assigned tasks will be unassigned.`
                            )
                          ) {
                            removeMember(member.id);
                          }
                        }}
                        title="Remove member"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workload Inspector / Assigned Tasks Sidebar (Right Col) */}
        <div className="lg:col-span-1">
          {selectedMember ? (
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs ${
                      selectedMember.avatarColor || "bg-primary"
                    }`}
                  >
                    {selectedMember.avatarInitials}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground truncate">
                      {selectedMember.name}&apos;s Tasks
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedMember.tasks.length} active assignments
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMemberId(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {selectedMember.tasks.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      No tasks assigned
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      This member has no active tasks.
                    </p>
                  </div>
                ) : (
                  selectedMember.tasks.map((task) => {
                    const statusCfg = getTaskStatusConfig(task.status);
                    const priorityCfg = getTaskPriorityConfig(task.priority);
                    const PriorityIcon = PRIORITY_ICON[task.priority] || PRIORITY_ICON.none;

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => openTaskModal(task.id)}
                        className="w-full text-left rounded-xl border border-border/70 bg-muted/20 p-3 hover:bg-muted/50 hover:border-primary/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {task.title}
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold shrink-0 ${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span className={`inline-flex items-center gap-1 font-semibold capitalize ${priorityCfg.iconColor}`}>
                            <PriorityIcon className="h-3 w-3" />
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span>Due {formatDate(task.dueDate)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Assign new work button */}
              <button
                type="button"
                onClick={() => openCreateTaskModal()}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Assign New Work</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
              <h4 className="text-xs font-semibold text-foreground">
                Workload Inspector
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click <strong>&quot;View Workload&quot;</strong> on any team member
                to inspect and reassign their active tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

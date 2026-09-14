"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { formatDate } from "@/lib/utils/date";
import {
  Inbox,
  CheckCircle2,
  Bell,
  MessageSquare,
  UserCheck,
  Check,
  ArrowLeft,
  Filter,
} from "lucide-react";

export default function InboxPage() {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openTaskModal,
    tasks,
  } = useWorkBoard();

  const [tab, setTab] = useState<"all" | "unread" | "mentions">("all");

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser.id
  );

  const filteredNotifications = userNotifications.filter((n) => {
    if (tab === "unread") return !n.isRead;
    if (tab === "mentions") return n.type === "mention";
    return true;
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1000px] mx-auto w-full animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Inbox
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Updates, mentions, task assignments, and activity for {currentUser.name}.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors self-start sm:self-center shadow-2xs"
          >
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        {(
          [
            { id: "all", label: `All (${userNotifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "mentions", label: "Mentions" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-card/40 p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                No notifications in this view
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You are all caught up on all task updates, comments, and mentions.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const task = n.taskId ? tasks.find((t) => t.id === n.taskId) : null;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markNotificationAsRead(n.id);
                  if (n.taskId) openTaskModal(n.taskId);
                }}
                className={`group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  !n.isRead
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                    n.type === "mention"
                      ? "bg-purple-500/10 text-purple-500"
                      : n.type === "assignment"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {n.type === "mention" ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : n.type === "assignment" ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.body}
                  </p>

                  {task && (
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground mt-1">
                      <span>Item:</span>
                      <span className="font-semibold">{task.title}</span>
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

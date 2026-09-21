"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox, Check, ArrowRight, Settings, X, ThumbsUp, MessageSquare, Megaphone } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { formatDate } from "@/lib/utils/date";

// Bell = a quick preview, not a second inbox — capped short so it never
// tries to be the full list; "View all" below sends you to the real one.
const PREVIEW_LIMIT = 6;

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function getNotifIcon(type: string) {
  switch (type) {
    case "post_like":
      return ThumbsUp;
    case "post_comment":
      return MessageSquare;
    case "new_post":
      return Megaphone;
    default:
      return Bell;
  }
}

export function NotificationsMenu() {
  const {
    notifications,
    currentUser,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openTaskModal,
    updateNotificationPreferences,
  } = useWorkBoard();

  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser.id
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: typeof userNotifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.taskId) {
      openTaskModal(notif.taskId);
      setIsOpen(false);
    }
  };

  return (
    <>
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications (${unreadNotificationCount} unread)`}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full z-50 mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">
                Notifications
              </span>
              {unreadNotificationCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                title="Notification settings"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List — a short preview, not the full inbox */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
            {userNotifications.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-1">
                <Inbox className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
                <p className="text-xs font-medium text-foreground">
                  Inbox zero
                </p>
                <p className="text-[11px] text-muted-foreground">
                  You are all caught up on assignments and updates.
                </p>
              </div>
            ) : (
              userNotifications.slice(0, PREVIEW_LIMIT).map((item) => {
                const Icon = getNotifIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 text-left transition-colors cursor-pointer hover:bg-muted/50 ${!item.isRead ? "bg-primary/5" : ""
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!item.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-foreground truncate">
                              {item.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — the one place that points to the real inbox, so the
              bell reads as a preview of it rather than a second copy */}
          <Link
            href="/inbox"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/30 p-2.5 text-xs font-semibold text-primary hover:bg-muted/50 transition-colors"
          >
            <span>
              View all{userNotifications.length > PREVIEW_LIMIT ? ` (${userNotifications.length})` : ""} in Inbox
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>

    {isSettingsOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notification settings"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div
          className="fixed inset-0"
          onClick={() => setIsSettingsOpen(false)}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-sm rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Notification Settings</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Choose what you get notified about
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {(
              [
                {
                  key: "notifyPostLikes" as const,
                  icon: ThumbsUp,
                  label: "Likes on your posts",
                  desc: "Someone reacts to a post you wrote",
                },
                {
                  key: "notifyPostComments" as const,
                  icon: MessageSquare,
                  label: "Comments on your posts",
                  desc: "Someone comments on a post you wrote",
                },
                {
                  key: "notifyNewPosts" as const,
                  icon: Megaphone,
                  label: "New posts in your workspaces",
                  desc: "Anyone posts in a workspace you belong to",
                },
              ] as const
            ).map((row) => {
              const Icon = row.icon;
              const checked = currentUser[row.key] !== false;
              return (
                <div key={row.key} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{row.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={checked}
                    onChange={(next) => updateNotificationPreferences({ [row.key]: next })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Inbox, Check } from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { formatDate } from "@/lib/utils/date";

export function NotificationsMenu() {
  const {
    notifications,
    currentUser,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openTaskModal,
  } = useWorkBoard();

  const [isOpen, setIsOpen] = useState(false);
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
                Inbox & Assignments
              </span>
              {unreadNotificationCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
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
          </div>

          {/* List */}
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
              userNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 text-left transition-colors cursor-pointer hover:bg-muted/50 ${
                    !item.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <span className="text-[10px] text-muted-foreground">
              Signed in as <strong className="text-foreground">{currentUser.name}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

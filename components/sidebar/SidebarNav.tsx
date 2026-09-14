"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  Inbox,
  Users,
  Briefcase,
  Megaphone,
  Inbox as RequestsIcon,
  Compass,
  LayoutGrid,
  FolderKanban,
  Calendar,
  BarChart3,
  Table,
} from "lucide-react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";

interface SidebarNavProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function SidebarNav({ collapsed = false, onItemClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { getMyTasks, unreadNotificationCount, users, tasks, boards } = useWorkBoard();

  const myTasksCount = getMyTasks().length;
  const requestsCount = tasks.filter(
    (t) => t.boardId === "board-requests" && t.status === "new_request"
  ).length;

  const primaryItems = [
    { name: "Calendar", href: "/calendar", icon: Calendar },
    {
      name: "My Work",
      href: "/my-work",
      icon: CheckSquare,
      badge: myTasksCount > 0 ? String(myTasksCount) : undefined,
    },
    {
      name: "Inbox",
      href: "/inbox",
      icon: Inbox,
      badge: unreadNotificationCount > 0 ? String(unreadNotificationCount) : undefined,
      badgeVariant: "highlight" as const,
    },
  ];

  const workspaceBoards = [
    {
      name: "Team Dashboard",
      href: "/",
      icon: BarChart3,
    },
    {
      name: "Projects & Deliverables",
      href: "/board/board-1",
      icon: Table,
    },
    {
      name: "Marketing & Launch",
      href: "/board/board-marketing",
      icon: Table,
    },
    {
      name: "Client & Requests",
      href: "/board/board-requests",
      icon: Table,
      badge: requestsCount > 0 ? String(requestsCount) : undefined,
      badgeVariant: "warning" as const,
    },
    {
      name: "Company Goals & OKRs",
      href: "/board/board-roadmap",
      icon: Table,
    },
    {
      name: "Team & Workload",
      href: "/team",
      icon: Users,
      badge: String(users.length),
    },
  ];

  return (
    <nav className="space-y-3 px-2" aria-label="Main Navigation">
      {/* Primary items */}
      <div className="space-y-0.5">
        {primaryItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              title={collapsed ? item.name : undefined}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              } ${collapsed ? "justify-center px-2 py-2" : "justify-between"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-sidebar-foreground"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    item.badgeVariant === "highlight"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Boards & Workflows */}
      <div>
        {!collapsed && (
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Boards & Workflows
          </div>
        )}
        <div className="space-y-0.5">
          {workspaceBoards.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onItemClick}
                title={collapsed ? item.name : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                } ${collapsed ? "justify-center px-2 py-2" : "justify-between"}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-sidebar-foreground"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      item.badgeVariant === "warning"
                        ? "bg-amber-500/10 text-amber-500 font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

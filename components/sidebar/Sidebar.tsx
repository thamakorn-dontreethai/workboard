"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Search,
  Plus,
  BarChart3,
  Table,
  Megaphone,
  Inbox,
  Compass,
  Users,
  CheckSquare,
  Home,
  Star,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  FilePlus,
  FolderPlus,
  Calendar,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  className = "",
  onItemClick,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    workspace,
    boards,
    getMyTasks,
    unreadNotificationCount,
    users,
    tasks,
    folders,
    openCreateTaskModal,
    openCreateBoardModal,
    openCreateFolderModal,
    openCreateDashboardModal,
    openInviteMemberModal,
  } = useWorkBoard();

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    "team-folder": true,
  });

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const myTasksCount = getMyTasks().length;
  const requestsCount = tasks.filter(
    (t) => t.boardId === "board-requests" && t.status === "new_request"
  ).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceDropdownOpen(false);
      }
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  interface SidebarBoardItem {
    id: string;
    name: string;
    href: string;
    icon: any;
    color: string;
    badge?: string;
    folderId?: string;
  }

  // Helper to get formal boards for each folder
  const getBoardsForFolder = (folderId: string): SidebarBoardItem[] => {
    if (folderId === "team-folder") {
      const items: SidebarBoardItem[] = [
        {
          id: "board-dashboard",
          name: "Team Dashboard",
          href: "/",
          icon: BarChart3,
          color: "bg-indigo-500",
          badge: undefined,
          folderId: "team-folder",
        },
        ...boards
          .filter((b) => !b.folderId || b.folderId === "team-folder")
          .map((b) => ({
            id: b.id,
            name: b.name,
            href: `/board/${b.id}`,
            icon: Table, // Uniform formal board icon (Monday.com standard)
            badge:
              b.id === "board-requests" && requestsCount > 0
                ? String(requestsCount)
                : undefined,
            color: b.color || "bg-blue-500",
            folderId: b.folderId || "team-folder",
          })),
      ];
      return searchQuery.trim()
        ? items.filter((b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : items;
    }

    const customItems: SidebarBoardItem[] = boards
      .filter((b) => b.folderId === folderId)
      .map((b) => ({
        id: b.id,
        name: b.name,
        href: `/board/${b.id}`,
        icon: Table, // Uniform formal board icon
        badge: undefined,
        color: b.color || "bg-blue-500",
        folderId,
      }));

    return searchQuery.trim()
      ? customItems.filter((b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : customItems;
  };

  if (collapsed) {
    return (
      <aside
        aria-label="Application Sidebar"
        className={`relative flex flex-col h-full bg-[#1e2029] border-r border-[#2d3142] select-none w-16 ${className}`}
      >
        <div className="flex items-center justify-center h-14 border-b border-[#2d3142]">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-md">
            <span>M</span>
            <span className="absolute -bottom-1 -right-1 text-[10px]">🏠</span>
          </div>
        </div>

        <div className="flex-1 py-3 flex flex-col items-center gap-2.5 overflow-y-auto">
          {/* Global Personal Views */}
          <Link
            href="/calendar"
            onClick={onItemClick}
            title="Calendar"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              pathname === "/calendar"
                ? "bg-[#36384d] text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Calendar className="h-4 w-4 text-sky-400" />
          </Link>

          <Link
            href="/my-work"
            onClick={onItemClick}
            title="My Work"
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              pathname === "/my-work"
                ? "bg-[#36384d] text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <CheckSquare className="h-4 w-4 text-blue-400" />
            {myTasksCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </Link>

          <Link
            href="/inbox"
            onClick={onItemClick}
            title="Inbox"
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              pathname === "/inbox"
                ? "bg-[#36384d] text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Inbox className="h-4 w-4 text-amber-400" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
            )}
          </Link>

          <div className="w-8 h-[1px] bg-[#2d3142] my-1" />

          {/* Team Items (Team Dashboard & Project Boards) */}
          {getBoardsForFolder("team-folder").map((b) => {
            const isActive = pathname === b.href;
            const Icon = b.icon;
            return (
              <Link
                key={b.id}
                href={b.href}
                onClick={onItemClick}
                title={b.name}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#36384d] text-white shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {b.badge && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-2 border-t border-[#2d3142]">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="w-full flex h-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Application Sidebar"
      className={`relative flex flex-col h-full bg-[#181922] text-zinc-200 border-r border-[#262836] select-none w-64 ${className} font-sans`}
    >
      {/* Top Global Quick Nav (Calendar, My Work, Inbox) */}
      <div className="px-3 pt-3 pb-2 space-y-1 border-b border-[#262836]/80 bg-[#161720]">
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm text-white tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
              <span>M</span>
              <span className="absolute -bottom-1 -right-1 text-[8px]">🏠</span>
            </div>
            <span>WorkBoard</span>
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-0.5 pt-1">
          {/* 1. Calendar */}
          <Link
            href="/calendar"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              pathname === "/calendar"
                ? "bg-[#36384d] text-white font-semibold shadow-xs"
                : "text-zinc-300 hover:bg-[#232533] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Calendar</span>
            </div>
          </Link>

          {/* 2. My Work */}
          <Link
            href="/my-work"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              pathname === "/my-work"
                ? "bg-[#36384d] text-white font-semibold shadow-xs"
                : "text-zinc-300 hover:bg-[#232533] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckSquare className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="truncate">My Work</span>
            </div>
            {myTasksCount > 0 && (
              <span className="rounded-full bg-blue-500/20 text-blue-400 px-1.5 py-0.2 text-[10px] font-bold">
                {myTasksCount}
              </span>
            )}
          </Link>

          {/* 3. Inbox */}
          <Link
            href="/inbox"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              pathname === "/inbox"
                ? "bg-[#36384d] text-white font-semibold shadow-xs"
                : "text-zinc-300 hover:bg-[#232533] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Inbox className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Inbox</span>
            </div>
            {unreadNotificationCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[10px] font-bold">
                {unreadNotificationCount}
              </span>
            )}
          </Link>

          {/* 4. Team & Members */}
          <Link
            href="/team"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              pathname === "/team"
                ? "bg-[#36384d] text-white font-semibold shadow-xs"
                : "text-zinc-300 hover:bg-[#232533] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Team & Members</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
              {users.length}
            </span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Section (Matching User's Screenshot Exactly) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
        {/* 1. Favorites > */}
        <div>
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <span>Favorites</span>
            {isFavoritesOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>

          {isFavoritesOpen && (
            <div className="mt-1 pl-2 space-y-0.5 border-l border-zinc-700/50">
              <Link
                href="/board/board-1"
                onClick={onItemClick}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <Table className="h-3.5 w-3.5 text-blue-400" />
                <span className="truncate">Projects & Deliverables</span>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Workspace Header with ... and Search Icon */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-200 tracking-tight">
              Workspace
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                title="Search boards"
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Workspace options"
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search bar when opened */}
          {isSearchOpen && (
            <div className="animate-in fade-in duration-100">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* 3. Workspace Selector Box: [ [M🏠] My Team  ▾ ]  [ + ] */}
          <div className="flex items-center gap-1.5">
            {/* Workspace Button with dropdown */}
            <div className="relative flex-1" ref={workspaceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-zinc-700/80 bg-[#1f212c] hover:bg-[#252836] transition-colors px-2.5 py-1.5 text-left shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-600 text-white font-bold text-[10px]">
                    <span>{(workspace.name || "M").charAt(0).toUpperCase()}</span>
                    <span className="absolute -bottom-1 -right-1 text-[7px]">🏠</span>
                  </div>
                  <span className="truncate text-xs font-semibold text-white">
                    {workspace.name || "My Team"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-1" />
              </button>

              {/* Workspace switch dropdown */}
              {isWorkspaceDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1 shadow-2xl text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-zinc-500">
                    Switch Workspace
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(false)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-indigo-600/20 text-white font-medium mb-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white font-bold text-[10px]">
                        M
                      </div>
                      <span>My Team (Main)</span>
                    </div>
                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWorkspaceDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[10px]">
                      G
                    </div>
                    <span>Growth & Marketing</span>
                  </button>
                </div>
              )}
            </div>

            {/* [+] Button next to workspace selector */}
            <div className="relative shrink-0" ref={plusMenuRef}>
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                title="Add new board or item"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/80 bg-[#1f212c] hover:bg-[#252836] text-zinc-300 hover:text-white transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* [+] Menu popup */}
              {isPlusMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Add to Workspace
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      openCreateBoardModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <Table className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>New Board / Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      openCreateFolderModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <FolderPlus className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>New Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      openInviteMemberModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Add Team / Member</span>
                  </button>

                  <div className="my-1 border-t border-zinc-700/60" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      openCreateDashboardModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>New Dashboard View</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Projects / Boards Section */}
        <div className="space-y-2 pt-1">
          {boards.length === 0 ? (
            <div className="p-3 text-center rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/40 space-y-2">
              <p className="text-xs text-zinc-300 font-medium">No projects yet</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Create a project to start organizing tasks with your team.
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={openCreateBoardModal}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Project</span>
                </button>
                <button
                  type="button"
                  onClick={openInviteMemberModal}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Invite Members</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-1 py-1 text-[11px] font-semibold text-zinc-400">
                <span>Projects ({boards.length})</span>
                <button
                  type="button"
                  onClick={openCreateBoardModal}
                  title="Add new project"
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {boards.map((b) => {
                const isActive = pathname === `/board/${b.id}`;
                const taskCount = tasks.filter((t) => t.boardId === b.id && !t.isArchived).length;
                return (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    onClick={onItemClick}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all ${
                      isActive
                        ? "bg-[#36384d] text-white font-medium shadow-xs"
                        : "text-zinc-300 hover:bg-[#232533] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Table
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          isActive
                            ? "text-blue-400"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}
                      />
                      <span className="truncate">{b.name}</span>
                    </div>

                    {taskCount > 0 && (
                      <span className="rounded-full bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 px-1.5 py-0.2 text-[10px] font-bold shrink-0">
                        {taskCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={openCreateBoardModal}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 mt-1 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/40 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Board / Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Team Quick Access */}
      <div className="p-3 border-t border-[#262836] bg-[#161720]">
        <Link
          href="/team"
          onClick={onItemClick}
          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${pathname === "/team"
              ? "bg-[#36384d] text-white font-semibold"
              : "text-zinc-400 hover:bg-[#232533] hover:text-white"
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Team & Workload</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {users.length} members
          </span>
        </Link>
      </div>
    </aside>
  );
}

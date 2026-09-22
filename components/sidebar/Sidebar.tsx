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
  LayoutGrid,
  Pin,
  Globe,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { WorkspaceAvatar } from "@/components/workspace/WorkspaceAvatar";
import { FloatingPanel } from "@/components/board/FloatingPanel";

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
    workspaces,
    workspace,
    switchWorkspace,
    togglePinWorkspace,
    openBrowseWorkspacesModal,
    openCreateWorkspaceModal,
    boards,
    getMyTasks,
    unreadNotificationCount,
    users,
    tasks,
    folders,
    dashboards,
    deleteDashboard,
    openCreateTaskModal,
    openCreateBoardModal,
    openCreateFolderModal,
    openCreateDashboardModal,
    openInviteMemberModal,
    updateBoard,
    deleteBoard,
    canDo,
    isWorkspaceLeader,
    createBoard,
    updateFolder,
    toggleFolderCollapse,
    emptyFolder,
    deleteFolder,
  } = useWorkBoard();

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    "team-folder": true,
  });

  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Right-click or "..." on a board row in the Projects list, to rename or
  // delete it without leaving the sidebar.
  const [boardMenuId, setBoardMenuId] = useState<string | null>(null);
  const boardMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [boardNameInput, setBoardNameInput] = useState("");

  const handleRenameBoardStart = (boardId: string, currentName: string) => {
    setBoardMenuId(null);
    setEditingBoardId(boardId);
    setBoardNameInput(currentName);
  };

  const handleRenameBoardSave = (boardId: string) => {
    const trimmed = boardNameInput.trim();
    setEditingBoardId(null);
    if (trimmed) updateBoard(boardId, { name: trimmed });
  };

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    setBoardMenuId(null);
    if (confirm(`Delete "${boardName}"? This can't be undone.`)) {
      deleteBoard(boardId);
    }
  };

  // Drag a board row onto a folder row to move it in; drag it into the
  // ungrouped area below to move it back out.
  const [draggingBoardId, setDraggingBoardId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDragOverUngrouped, setIsDragOverUngrouped] = useState(false);

  const handleDropOnFolder = (folderId: string) => {
    if (draggingBoardId && canDo("manage", draggingBoardId)) updateBoard(draggingBoardId, { folderId });
    setDraggingBoardId(null);
    setDragOverFolderId(null);
  };

  const handleDropOnUngrouped = () => {
    if (draggingBoardId && canDo("manage", draggingBoardId)) updateBoard(draggingBoardId, { folderId: null });
    setDraggingBoardId(null);
    setIsDragOverUngrouped(false);
  };

  // Folder "..." menu: rename, change color, new board inside, empty, delete.
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const folderMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState("");

  const FOLDER_COLORS = [
    { name: "Amber", class: "text-amber-400" },
    { name: "Blue", class: "text-blue-400" },
    { name: "Emerald", class: "text-emerald-400" },
    { name: "Purple", class: "text-purple-400" },
    { name: "Rose", class: "text-rose-400" },
    { name: "Indigo", class: "text-indigo-400" },
  ];

  const handleRenameFolderStart = (folderId: string, currentName: string) => {
    setFolderMenuId(null);
    setEditingFolderId(folderId);
    setFolderNameInput(currentName);
  };

  const handleRenameFolderSave = (folderId: string) => {
    const trimmed = folderNameInput.trim();
    setEditingFolderId(null);
    if (trimmed) updateFolder(folderId, { name: trimmed });
  };

  const handleNewBoardInFolder = async (folderId: string) => {
    setFolderMenuId(null);
    try {
      const newBoard = await createBoard({ name: "New Board", folderId });
      setEditingBoardId(newBoard.id);
      setBoardNameInput(newBoard.name);
    } catch (err) {
      console.error("Failed to create board in folder:", err);
    }
  };

  const handleEmptyFolder = (folderId: string, folderName: string) => {
    setFolderMenuId(null);
    if (confirm(`Move all boards out of "${folderName}"?`)) {
      emptyFolder(folderId);
    }
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setFolderMenuId(null);
    if (
      confirm(
        `Delete folder "${folderName}"? Boards inside will move back to the main list — they won't be deleted.`
      )
    ) {
      deleteFolder(folderId);
    }
  };

  const renderBoardRow = (b: (typeof boards)[number], opts: { indent?: boolean } = {}) => {
    const isActive = pathname === `/board/${b.id}`;
    const taskCount = tasks.filter((t) => t.boardId === b.id && !t.isArchived).length;

    if (editingBoardId === b.id) {
      return (
        <div
          key={b.id}
          className={`flex items-center gap-2.5 rounded-lg py-2 text-xs bg-sidebar-accent ${opts.indent ? "pl-7 pr-2.5" : "px-2.5"}`}
        >
          <Table className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
          <input
            autoFocus
            value={boardNameInput}
            onChange={(e) => setBoardNameInput(e.target.value)}
            onBlur={() => handleRenameBoardSave(b.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameBoardSave(b.id);
              if (e.key === "Escape") setEditingBoardId(null);
            }}
            className="flex-1 min-w-0 bg-transparent border-b border-indigo-500 text-sidebar-accent-foreground focus:outline-none"
          />
        </div>
      );
    }

    return (
      <div
        key={b.id}
        draggable
        onDragStart={() => setDraggingBoardId(b.id)}
        onDragEnd={() => {
          setDraggingBoardId(null);
          setDragOverFolderId(null);
          setIsDragOverUngrouped(false);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (canDo("manage", b.id)) setBoardMenuId(b.id);
        }}
        className={`group relative flex items-center justify-between rounded-lg text-xs transition-all cursor-grab active:cursor-grabbing ${isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-xs"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          } ${draggingBoardId === b.id ? "opacity-40" : ""}`}
      >
        <Link
          href={`/board/${b.id}`}
          onClick={onItemClick}
          draggable={false}
          className={`flex items-center gap-2.5 min-w-0 flex-1 py-2 ${opts.indent ? "pl-7 pr-2.5" : "px-2.5"}`}
        >
          <Table
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
              }`}
          />
          <span className="truncate">{b.name}</span>
        </Link>

        <div className="flex items-center gap-1 pr-2 shrink-0">
          {taskCount > 0 && (
            <span className="rounded-full bg-sidebar-accent text-sidebar-foreground/60 group-hover:text-sidebar-foreground px-1.5 py-0.2 text-[10px] font-bold">
              {taskCount}
            </span>
          )}
          <button
            ref={(el) => {
              boardMenuButtonRefs.current[b.id] = el;
            }}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBoardMenuId(boardMenuId === b.id ? null : b.id);
            }}
            title="Board options"
            className={`opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all shrink-0 cursor-pointer ${canDo("manage", b.id) ? "" : "hidden"
              }`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        <FloatingPanel
          isOpen={boardMenuId === b.id}
          onClose={() => setBoardMenuId(null)}
          anchorRef={{ current: boardMenuButtonRefs.current[b.id] }}
          align="right"
          className="w-48 rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-2xl text-left"
        >
          <button
            type="button"
            onClick={() => handleRenameBoardStart(b.id, b.name)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-blue-400" />
            <span>Rename</span>
          </button>
          {b.folderId && (
            <button
              type="button"
              onClick={() => {
                setBoardMenuId(null);
                updateBoard(b.id, { folderId: null });
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Remove from folder</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDeleteBoard(b.id, b.name)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </FloatingPanel>
      </div>
    );
  };

  const renderFolderRow = (f: (typeof folders)[number]) => {
    const folderBoards = boards.filter((b) => b.folderId === f.id);
    const isDropTarget = dragOverFolderId === f.id;

    if (editingFolderId === f.id) {
      return (
        <div key={f.id} className="space-y-0.5">
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs bg-sidebar-accent">
            <Folder className={`h-3.5 w-3.5 shrink-0 ${f.color}`} />
            <input
              autoFocus
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              onBlur={() => handleRenameFolderSave(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameFolderSave(f.id);
                if (e.key === "Escape") setEditingFolderId(null);
              }}
              className="flex-1 min-w-0 bg-transparent border-b border-indigo-500 text-sidebar-accent-foreground focus:outline-none"
            />
          </div>
        </div>
      );
    }

    return (
      <div key={f.id} className="space-y-0.5">
        <div
          onDragOver={(e) => {
            // Must preventDefault on every event to allow dropping here at
            // all — but that's all this handler does; the highlight state
            // itself is set once on enter/leave below, not on every tick,
            // since dragover fires continuously while hovering.
            if (draggingBoardId) e.preventDefault();
          }}
          onDragEnter={(e) => {
            if (draggingBoardId) {
              e.preventDefault();
              setDragOverFolderId(f.id);
            }
          }}
          onDragLeave={() => setDragOverFolderId((cur) => (cur === f.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            handleDropOnFolder(f.id);
          }}
          className={`group relative flex items-center justify-between rounded-lg pr-1 text-xs transition-all ${isDropTarget
            ? "bg-indigo-600/20 ring-1 ring-indigo-500"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
        >
          <button
            type="button"
            onClick={() => toggleFolderCollapse(f.id)}
            className="flex items-center gap-1.5 min-w-0 flex-1 px-1.5 py-2 cursor-pointer text-left"
          >
            {f.isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            )}
            <Folder className={`h-3.5 w-3.5 shrink-0 ${f.color}`} />
            <span className="truncate font-medium">{f.name}</span>
            {folderBoards.length > 0 && (
              <span className="text-[10px] text-sidebar-foreground/50 shrink-0">{folderBoards.length}</span>
            )}
          </button>

          <button
            ref={(el) => {
              folderMenuButtonRefs.current[f.id] = el;
            }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFolderMenuId(folderMenuId === f.id ? null : f.id);
            }}
            title="Folder options"
            className={`opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all shrink-0 cursor-pointer ${isWorkspaceLeader ? "" : "hidden"
              }`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          <FloatingPanel
            isOpen={folderMenuId === f.id}
            onClose={() => setFolderMenuId(null)}
            anchorRef={{ current: folderMenuButtonRefs.current[f.id] }}
            align="right"
            className="w-48 rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-2xl text-left"
          >
            <button
              type="button"
              onClick={() => handleRenameFolderStart(f.id, f.name)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-blue-400" />
              <span>Rename</span>
            </button>

            <div className="px-2.5 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-1.5">
                Color
              </div>
              <div className="flex items-center gap-1.5">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.class}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      updateFolder(f.id, { color: c.class });
                      setFolderMenuId(null);
                    }}
                    className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${f.color === c.class ? "border-white" : "border-transparent hover:border-sidebar-border"
                      }`}
                  >
                    <Folder className={`h-3.5 w-3.5 ${c.class}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="my-1 border-t border-sidebar-border" />

            <button
              type="button"
              onClick={() => handleNewBoardInFolder(f.id)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>New board</span>
            </button>

            {folderBoards.length > 0 && (
              <button
                type="button"
                onClick={() => handleEmptyFolder(f.id, f.name)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Move all boards out</span>
              </button>
            )}

            <div className="my-1 border-t border-sidebar-border" />

            <button
              type="button"
              onClick={() => handleDeleteFolder(f.id, f.name)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete folder</span>
            </button>
          </FloatingPanel>
        </div>

        {!f.isCollapsed && folderBoards.length > 0 && (
          <div className="space-y-0.5">
            {folderBoards.map((b) => renderBoardRow(b, { indent: true }))}
          </div>
        )}
        {!f.isCollapsed && folderBoards.length === 0 && (
          <p className="pl-7 pr-2.5 py-1 text-[11px] text-sidebar-foreground/50 italic">
            Drag a board here
          </p>
        )}
      </div>
    );
  };

  const myTasksCount = getMyTasks().length;
  const requestsCount = tasks.filter(
    (t) => t.boardId === "board-requests" && t.status === "new_request"
  ).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
        className={`relative flex flex-col h-full bg-sidebar border-r border-sidebar-border select-none w-16 ${className}`}
      >
        <div className="flex items-center justify-center h-14 border-b border-sidebar-border">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-md">
            <span>M</span>
            <span className="absolute -bottom-1 -right-1 text-[10px]">🏠</span>
          </div>
        </div>

        <div className="flex-1 py-3 flex flex-col items-center gap-2.5 overflow-y-auto">
          {/* Global Personal Views */}
          <Link
            href="/"
            onClick={onItemClick}
            title="Overview"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${pathname === "/"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
              : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              }`}
          >
            <Home className="h-4 w-4 text-indigo-400" />
          </Link>

          <Link
            href="/calendar"
            onClick={onItemClick}
            title="Calendar"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${pathname === "/calendar"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
              : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              }`}
          >
            <Calendar className="h-4 w-4 text-sky-400" />
          </Link>

          <Link
            href="/my-work"
            onClick={onItemClick}
            title="My Work"
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${pathname === "/my-work"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
              : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
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
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${pathname === "/inbox"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
              : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              }`}
          >
            <Inbox className="h-4 w-4 text-amber-400" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
            )}
          </Link>

          <div className="w-8 h-[1px] bg-sidebar-border my-1" />

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
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                  : "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
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

        <div className="p-2 border-t border-sidebar-border">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="w-full flex h-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
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
      className={`relative flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none w-64 ${className} font-sans`}
    >
      {/* Top Global Quick Nav (Calendar, My Work, Inbox) */}
      <div className="px-3 pt-3 pb-2 space-y-1 border-b border-sidebar-border/80 bg-sidebar">
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm text-sidebar-foreground tracking-tight hover:opacity-90 transition-opacity"
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
            className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-0.5 pt-1">
          {/* 1. Overview */}
          <Link
            href="/"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${pathname === "/"
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Home className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Overview</span>
            </div>
          </Link>

          {/* 2. Calendar */}
          <Link
            href="/calendar"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${pathname === "/calendar"
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Calendar</span>
            </div>
          </Link>

          {/* 3. My Work */}
          <Link
            href="/my-work"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${pathname === "/my-work"
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

          {/* 4. Inbox */}
          <Link
            href="/inbox"
            onClick={onItemClick}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${pathname === "/inbox"
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
        </div>
      </div>

      {/* Main Workspace Section (Matching User's Screenshot Exactly) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">


        {/* 2. Workspace Header with ... and Search Icon */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-sidebar-foreground tracking-tight">
              Workspace
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                title="Search boards"
                className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Workspace options"
                className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
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
                className="w-full rounded-lg border border-sidebar-border bg-sidebar/80 px-2.5 py-1 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* 3. Workspace Selector Box: unified pill [ [Avatar] TESTER ▾ | + ] */}
          <div className="flex items-center rounded-lg border border-sidebar-border/80 bg-sidebar">
            {/* Workspace Button with dropdown */}
            <div className="relative flex-1">
              <button
                ref={workspaceButtonRef}
                type="button"
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className="w-full flex items-center justify-between hover:bg-sidebar-accent transition-colors px-2.5 py-1.5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <WorkspaceAvatar
                    name={workspace.name}
                    avatarColor={workspace.avatarColor || "bg-indigo-600"}
                    icon={workspace.icon || "initial"}
                    size="md"
                  />
                  <span className="truncate text-xs font-semibold text-sidebar-foreground">
                    {workspace.name || "My Workspace"}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60 shrink-0 ml-1" />
              </button>

              {/* Workspace switch dropdown — portaled via FloatingPanel so it
                  escapes the sidebar's scroll container instead of being
                  clipped by its overflow-y-auto. */}
              <FloatingPanel
                isOpen={isWorkspaceDropdownOpen}
                onClose={() => setIsWorkspaceDropdownOpen(false)}
                anchorRef={workspaceButtonRef}
                align="left"
                className="w-64 rounded-xl border border-sidebar-border bg-sidebar p-2 shadow-2xl text-xs"
              >
                <>
                  {/* Search for a workspace */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/60" />
                    <input
                      type="text"
                      autoFocus
                      value={workspaceSearchQuery}
                      onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                      placeholder="Search for a workspace"
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-sidebar-border/80 bg-sidebar/90 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 scrollbar-thin">
                    {/* Recent Workspaces */}
                    <div className="space-y-0.5">
                      <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                        Recent workspaces
                      </div>
                      {workspaces
                        .filter((ws) =>
                          ws.name
                            .toLowerCase()
                            .includes(workspaceSearchQuery.toLowerCase())
                        )
                        .slice(0, 3)
                        .map((ws) => {
                          const isCurrent = ws.id === workspace.id;
                          return (
                            <div
                              key={`recent-${ws.id}`}
                              className={`group/ws flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isCurrent
                                ? "bg-sidebar-primary/20 text-sidebar-foreground font-medium"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                                }`}
                              onClick={() => {
                                switchWorkspace(ws.id);
                                setIsWorkspaceDropdownOpen(false);
                                router.push(`/workspace/${ws.id}`);
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <WorkspaceAvatar
                                  name={ws.name}
                                  avatarColor={ws.avatarColor || "bg-indigo-600"}
                                  icon={ws.icon || "initial"}
                                  size="sm"
                                />
                                <span className="truncate text-xs">{ws.name}</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePinWorkspace(ws.id);
                                }}
                                className={`p-0.5 rounded transition-colors ${ws.isPinned
                                  ? "text-amber-400"
                                  : "text-sidebar-foreground/50 opacity-0 group-hover/ws:opacity-100 hover:text-sidebar-foreground/80"
                                  }`}
                              >
                                <Pin className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* My Workspaces */}
                    <div className="space-y-0.5 pt-1 border-t border-sidebar-border/80">
                      <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                        My workspaces
                      </div>
                      {workspaces
                        .filter((ws) =>
                          ws.name
                            .toLowerCase()
                            .includes(workspaceSearchQuery.toLowerCase())
                        )
                        .map((ws) => {
                          const isCurrent = ws.id === workspace.id;
                          return (
                            <div
                              key={`my-${ws.id}`}
                              className={`group/ws flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isCurrent
                                ? "bg-sidebar-primary/20 text-sidebar-foreground font-medium"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                                }`}
                              onClick={() => {
                                switchWorkspace(ws.id);
                                setIsWorkspaceDropdownOpen(false);
                                router.push(`/workspace/${ws.id}`);
                              }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <WorkspaceAvatar
                                  name={ws.name}
                                  avatarColor={ws.avatarColor || "bg-indigo-600"}
                                  icon={ws.icon || "initial"}
                                  size="sm"
                                />
                                <span className="truncate text-xs">{ws.name}</span>
                              </div>

                              {isCurrent && (
                                <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Footer Actions: Browse all + Add workspace */}
                  <div className="mt-2 pt-1.5 border-t border-sidebar-border space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        openBrowseWorkspacesModal();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                      <span>Browse all</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        openCreateWorkspaceModal();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                    >
                      <Plus className="h-3.5 w-3.5 text-sidebar-foreground/60" />
                      <span>Add workspace</span>
                    </button>
                  </div>
                </>
              </FloatingPanel>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-sidebar-border shrink-0" />

            {/* [+] Button — joined to workspace selector */}
            <div className="relative shrink-0" ref={plusMenuRef}>
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                title="Add new board or item"
                className="flex h-full px-2.5 py-1.5 items-center justify-center hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* [+] Menu popup */}
              {isPlusMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-2xl text-xs animate-in fade-in zoom-in-95">
                  {!workspace.id ? (
                    // No real workspace to add any of this to yet — every
                    // option below assumes one exists, so offer to create
                    // one instead of letting these silently fail/attach to
                    // nothing.
                    <div className="p-2 space-y-2">
                      <p className="text-[11px] text-sidebar-foreground/60 leading-relaxed px-0.5">
                        You don't have a workspace yet. Create one first.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          openCreateWorkspaceModal();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Workspace</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                        Add to Workspace
                      </div>

                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            openCreateBoardModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                        >
                          <Table className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>New Board / Project</span>
                        </button>
                      )}

                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            openCreateFolderModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                        >
                          <FolderPlus className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>New Folder</span>
                        </button>
                      )}

                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            openInviteMemberModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                        >
                          <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>Add Team / Member</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-sidebar-border/60" />

                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlusMenuOpen(false);
                            openCreateDashboardModal();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <span>New Dashboard View</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3.5 Dashboards Section — only shown once at least one exists,
            since "+ New Dashboard View" in the Add menu already covers the
            empty case */}
        {(() => {
          const activeWorkspaceDashboards = dashboards.filter(
            (d) => d.workspaceId === workspace.id
          );
          if (activeWorkspaceDashboards.length === 0) return null;

          return (
            <div className="space-y-1 pt-1">
              <div className="px-1">
                <span className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-wider">
                  Dashboards
                </span>
              </div>
              {activeWorkspaceDashboards.map((d) => {
                const isActive = pathname === `/workspace/${workspace.id}/dashboard/${d.id}`;
                return (
                  <div
                    key={d.id}
                    className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
                      }`}
                  >
                    <Link
                      href={`/workspace/${workspace.id}/dashboard/${d.id}`}
                      draggable={false}
                      onClick={onItemClick}
                      className={`flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 text-xs ${isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{d.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Delete dashboard "${d.name}"?`)) deleteDashboard(d.id);
                      }}
                      title="Delete dashboard"
                      className="opacity-0 group-hover:opacity-100 shrink-0 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* 4. Projects / Boards Section */}
        <div className="space-y-2 pt-1">
          {(() => {
            const activeWorkspaceFolders = folders.filter(
              (f) => f.workspaceId === workspace.id
            );
            const activeWorkspaceBoards = boards.filter(
              (b) => !b.workspaceId || b.workspaceId === workspace.id
            );
            const ungroupedBoards = activeWorkspaceBoards.filter((b) => !b.folderId);

            return activeWorkspaceFolders.length === 0 && activeWorkspaceBoards.length === 0 ? (
              <div className="p-3 text-center rounded-xl border border-dashed border-sidebar-border/60 bg-sidebar/40 space-y-2">
                {!workspace.id ? (
                  <>
                    <p className="text-xs text-sidebar-foreground/80 font-medium">No workspace yet</p>
                    <p className="text-[11px] text-sidebar-foreground/50 leading-relaxed">
                      Create your own workspace, or ask to be invited to one.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={openCreateWorkspaceModal}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Workspace</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-sidebar-foreground/80 font-medium">No projects yet</p>
                    <p className="text-[11px] text-sidebar-foreground/50 leading-relaxed">
                      Create a project in {workspace.name} to get started.
                    </p>
                    <div className="pt-1 flex flex-col gap-1.5">
                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={openCreateBoardModal}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create First Project</span>
                        </button>
                      )}
                      {isWorkspaceLeader && (
                        <button
                          type="button"
                          onClick={openInviteMemberModal}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-accent-foreground text-xs font-medium transition-colors"
                        >
                          <Users className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Invite Members</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {activeWorkspaceFolders.length > 0 && (
                  <div className="space-y-1">
                    {activeWorkspaceFolders.map((f) => renderFolderRow(f))}
                  </div>
                )}

                <div
                  onDragOver={(e) => {
                    if (draggingBoardId) e.preventDefault();
                  }}
                  onDragEnter={(e) => {
                    if (draggingBoardId) {
                      e.preventDefault();
                      setIsDragOverUngrouped(true);
                    }
                  }}
                  onDragLeave={() => setIsDragOverUngrouped(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnUngrouped();
                  }}
                  className={`space-y-0.5 rounded-lg transition-colors ${isDragOverUngrouped ? "bg-indigo-600/10 ring-1 ring-indigo-500/50" : ""
                    }`}
                >
                  {ungroupedBoards.map((b) => renderBoardRow(b))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </aside>
  );
}

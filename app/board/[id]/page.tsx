"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  MondayTable,
  UNASSIGNED_FILTER_ID,
  type MondayTableSortBy,
  type MondayTableColumn,
} from "@/components/board/MondayTable";
import { FloatingPanel } from "@/components/board/FloatingPanel";
import { getBoardMemberIds } from "@/lib/utils/boardMembers";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  type TaskStatus,
  type TaskPriority,
} from "@/types";
import {
  UserPlus,
  MoreHorizontal,
  Search,
  User,
  Filter,
  ArrowUpDown,
  EyeOff,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  Cpu,
  Lightbulb,
  RefreshCw,
  Rows2,
  Check,
  Download,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.id as string;

  const {
    boards,
    groups,
    tasks,
    users,
    workspaces,
    createTask,
    openCreateTaskModal,
    openInviteBoardModal,
    addGroup,
    updateBoard,
    canDo,
    toggleGroupCollapse,
  } = useWorkBoard();

  const board = boards.find((b) => b.id === boardId) || boards[0];
  const [boardTitle, setBoardTitle] = useState(board ? board.name : "New Board");

  // Keep the input in sync if the board changes underneath it (switching
  // boards, or a rename made elsewhere e.g. the sidebar's rename menu).
  useEffect(() => {
    if (board) setBoardTitle(board.name);
  }, [board?.id, board?.name]);

  const handleSaveBoardTitle = () => {
    const trimmed = boardTitle.trim();
    if (!board) return;
    if (trimmed && trimmed !== board.name) {
      updateBoard(board.id, { name: trimmed });
    } else {
      setBoardTitle(board.name);
    }
  };
  const [searchFilter, setSearchFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main-table");
  const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
  const newItemButtonRef = useRef<HTMLButtonElement>(null);

  // ─── Toolbar: Person / Filter / Sort / Hide / Group by / More ───────────
  const [isPersonMenuOpen, setIsPersonMenuOpen] = useState(false);
  const personButtonRef = useRef<HTMLButtonElement>(null);
  const [personFilter, setPersonFilter] = useState<string[]>([]);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [statusFilterSel, setStatusFilterSel] = useState<TaskStatus[]>([]);
  const [priorityFilterSel, setPriorityFilterSel] = useState<TaskPriority[]>([]);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [sortBy, setSortBy] = useState<MondayTableSortBy>("manual");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [isHideMenuOpen, setIsHideMenuOpen] = useState(false);
  const hideButtonRef = useRef<HTMLButtonElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<MondayTableColumn>>(new Set());

  const [isGroupByMenuOpen, setIsGroupByMenuOpen] = useState(false);
  const groupByButtonRef = useRef<HTMLButtonElement>(null);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const togglePersonFilter = (id: string) => {
    setPersonFilter((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleStatusFilter = (s: TaskStatus) => {
    setStatusFilterSel((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };
  const togglePriorityFilter = (p: TaskPriority) => {
    setPriorityFilterSel((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };
  const toggleHiddenColumn = (c: MondayTableColumn) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  if (!board) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-lg font-bold text-foreground">Board not found</h2>
        <Link
          href="/"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const boardGroups = groups.filter((g) => g.boardId === board.id);

  // Creating items/groups, renaming and inviting are leader-only (the API
  // enforces it too); members work through status updates and comments.
  const canManage = canDo("manage", board.id);

  const boardMemberIds = getBoardMemberIds(board, workspaces);
  const boardMembers = users.filter((u) => boardMemberIds.includes(u.id));

  const handleCollapseAllGroups = () => {
    boardGroups.forEach((g) => {
      if (!g.isCollapsed) toggleGroupCollapse(g.id);
    });
    setIsGroupByMenuOpen(false);
  };
  const handleExpandAllGroups = () => {
    boardGroups.forEach((g) => {
      if (g.isCollapsed) toggleGroupCollapse(g.id);
    });
    setIsGroupByMenuOpen(false);
  };

  const handleExportCsv = () => {
    const rows: string[][] = [["Item", "Group", "Status", "Priority", "Assignee", "Due Date"]];
    boardGroups.forEach((g) => {
      tasks
        .filter((t) => t.groupId === g.id && !t.isArchived)
        .forEach((t) => {
          const assignee = t.assigneeIds
            .map((id) => users.find((u) => u.id === id)?.name)
            .filter(Boolean)
            .join(", ");
          const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "";
          rows.push([
            t.title,
            g.name,
            TASK_STATUS_CONFIG[t.status]?.label || t.status,
            TASK_PRIORITY_CONFIG[t.priority]?.label || t.priority,
            assignee,
            due,
          ]);
        });
    });
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${board.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsMoreMenuOpen(false);
  };

  // Clicking "New item" drops a blank item straight into the first group's
  // table, like monday.com — no modal in the way. Falls back to the modal
  // flow if the board has no group yet to put it in.
  const handleQuickAddItem = () => {
    const targetGroupId = boardGroups[0]?.id;
    if (!targetGroupId) {
      openCreateTaskModal(board.id, undefined);
      return;
    }
    createTask({
      title: "New item",
      boardId: board.id,
      groupId: targetGroupId,
      status: "todo",
      priority: "medium",
    }).catch((err) => console.error("Failed to create item:", err));
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e21] text-zinc-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="px-6 pt-4 pb-2 border-b border-[#2a2a2e] bg-[#1c1c1f] shrink-0 space-y-3">
        {/* Title + Top Right Actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Board Title (Editable) */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleSaveBoardTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setBoardTitle(board.name);
                  e.currentTarget.blur();
                }
              }}
              className="text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none py-0.5 tracking-tight transition-colors"
            />
            <ChevronDown className="h-4 w-4 text-zinc-400 cursor-pointer hover:text-white" />
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 text-xs">
            {/* Integrate */}
            <button
              type="button"
              title="Integrate"
              className="flex items-center gap-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
            >
              <Zap className="h-4 w-4" />
              <span>Integrate</span>
            </button>

            {/* Automate */}
            <button
              type="button"
              title="Automate"
              className="flex items-center gap-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
            >
              <Cpu className="h-4 w-4" />
              <span>Automate</span>
            </button>

            {/* Agents */}
            <button
              type="button"
              title="Agents"
              className="flex items-center gap-1.5 rounded-lg text-zinc-300 hover:text-white transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span>Agents</span>
            </button>

            {/* Invite Button */}
            <button
              type="button"
              onClick={() => openInviteBoardModal(board.id)}
              className={`flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#1f212c] px-2.5 py-1 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors ${
                canManage ? "" : "hidden"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                Invite / {boardMembers.length}
              </span>
            </button>

            {/* Sync */}
            <button
              type="button"
              title="Sync"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* More */}
            <button
              type="button"
              title="More options"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Tabs: Main table ... + */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#262836]/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("main-table")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg font-semibold transition-colors border-b-2 ${activeTab === "main-table"
                ? "border-indigo-500 text-white bg-zinc-800/40"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <span>Main table</span>
          </button>

        </div>
      </div>

      {/* Action Toolbar Bar: New Item Button + Search/Filter/Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-[#1e1e21] border-b border-[#2a2a2e]">
        {/* Left: Gray "New item ▾" Button — clicking the label adds an
            item immediately; the chevron is a separate click target that
            opens the "New group of items" menu. */}
        <div className={`flex items-center gap-2 ${canManage ? "" : "hidden"}`}>
          <div className="flex items-center rounded-lg bg-gradient-to-r from-[#0073ea] to-[#0060c0] hover:from-[#0084ff] hover:to-[#0073ea] text-white text-xs font-semibold shadow-md shadow-[#0073ea]/20 hover:shadow-lg hover:shadow-[#0073ea]/40 ring-1 ring-white/10 transition-all duration-200 overflow-hidden">
            <button
              type="button"
              onClick={handleQuickAddItem}
              className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 hover:bg-white/10 active:scale-[0.96] transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New item</span>
            </button>
            <button
              ref={newItemButtonRef}
              type="button"
              onClick={() => setIsNewItemMenuOpen((v) => !v)}
              title="More new-item options"
              className="flex items-center pl-1.5 pr-3 py-1.5 border-l border-white/20 hover:bg-white/10 active:scale-[0.96] transition-all duration-150"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isNewItemMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <FloatingPanel
            isOpen={isNewItemMenuOpen}
            onClose={() => setIsNewItemMenuOpen(false)}
            anchorRef={newItemButtonRef}
            align="left"
            className="w-56 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setIsNewItemMenuOpen(false);
                openCreateTaskModal(board.id, boardGroups[0]?.id);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>New item (with details)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewItemMenuOpen(false);
                addGroup(board.id, "New Group").catch((err) =>
                  console.error("Failed to create group:", err)
                );
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Rows2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>New group of items</span>
            </button>
          </FloatingPanel>
        </div>

        {/* Right Toolbar: Search | Person | Filter | Sort | Hide | Group by */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-300">
          {/* Search */}
          <div className="flex items-center">
            {isSearchOpen ? (
              <input
                type="text"
                autoFocus
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search this board..."
                className="w-36 sm:w-48 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </button>
            )}
          </div>

          {/* Person */}
          <button
            ref={personButtonRef}
            type="button"
            onClick={() => setIsPersonMenuOpen((v) => !v)}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              personFilter.length > 0
                ? "bg-[#0073ea]/15 text-[#5b9fff] hover:bg-[#0073ea]/25"
                : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Person</span>
            {personFilter.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0073ea] px-1 text-[9px] font-bold text-white">
                {personFilter.length}
              </span>
            )}
          </button>
          <FloatingPanel
            isOpen={isPersonMenuOpen}
            onClose={() => setIsPersonMenuOpen(false)}
            anchorRef={personButtonRef}
            align="left"
            className="w-56 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              <button
                type="button"
                onClick={() => togglePersonFilter(UNASSIGNED_FILTER_ID)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 text-[10px] font-bold shrink-0">
                  ?
                </span>
                <span className="flex-1 truncate">Unassigned</span>
                {personFilter.includes(UNASSIGNED_FILTER_ID) && (
                  <Check className="h-3.5 w-3.5 text-[#0073ea] shrink-0" />
                )}
              </button>
              {boardMembers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => togglePersonFilter(u.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0 ${u.avatarColor || "bg-indigo-600"}`}
                  >
                    {u.avatarInitials}
                  </span>
                  <span className="flex-1 truncate">{u.name}</span>
                  {personFilter.includes(u.id) && (
                    <Check className="h-3.5 w-3.5 text-[#0073ea] shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {personFilter.length > 0 && (
              <>
                <div className="my-1 border-t border-zinc-700/60" />
                <button
                  type="button"
                  onClick={() => setPersonFilter([])}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </FloatingPanel>

          {/* Filter (status + priority) */}
          <button
            ref={filterButtonRef}
            type="button"
            onClick={() => setIsFilterMenuOpen((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              statusFilterSel.length > 0 || priorityFilterSel.length > 0
                ? "bg-[#0073ea]/15 text-[#5b9fff] hover:bg-[#0073ea]/25"
                : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {statusFilterSel.length + priorityFilterSel.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0073ea] px-1 text-[9px] font-bold text-white">
                {statusFilterSel.length + priorityFilterSel.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>
          <FloatingPanel
            isOpen={isFilterMenuOpen}
            onClose={() => setIsFilterMenuOpen(false)}
            anchorRef={filterButtonRef}
            align="left"
            className="w-64 rounded-xl border border-zinc-700 bg-[#1c1e28] p-2.5 shadow-2xl space-y-3"
          >
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TASK_STATUS_CONFIG) as TaskStatus[]).map((s) => {
                  const cfg = TASK_STATUS_CONFIG[s];
                  const isChecked = statusFilterSel.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStatusFilter(s)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                        isChecked
                          ? "border-[#0073ea] bg-[#0073ea]/15 text-white"
                          : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.barColor }}
                      />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 px-0.5">
                Priority
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
                  const cfg = TASK_PRIORITY_CONFIG[p];
                  const isChecked = priorityFilterSel.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePriorityFilter(p)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                        isChecked
                          ? "border-[#0073ea] bg-[#0073ea]/15 text-white"
                          : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {(statusFilterSel.length > 0 || priorityFilterSel.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilterSel([]);
                  setPriorityFilterSel([]);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border-t border-zinc-700/60 pt-2"
              >
                <X className="h-3 w-3" />
                <span>Clear filters</span>
              </button>
            )}
          </FloatingPanel>

          {/* Sort */}
          <button
            ref={sortButtonRef}
            type="button"
            onClick={() => setIsSortMenuOpen((v) => !v)}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              sortBy !== "manual"
                ? "bg-[#0073ea]/15 text-[#5b9fff] hover:bg-[#0073ea]/25"
                : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort</span>
          </button>
          <FloatingPanel
            isOpen={isSortMenuOpen}
            onClose={() => setIsSortMenuOpen(false)}
            anchorRef={sortButtonRef}
            align="left"
            className="w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            {(
              [
                { id: "manual", label: "Manual (drag order)" },
                { id: "dueDate", label: "Due Date" },
                { id: "priority", label: "Priority" },
                { id: "status", label: "Status" },
                { id: "title", label: "Item Name" },
              ] as { id: MondayTableSortBy; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSortBy(opt.id);
                  setIsSortMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                  sortBy === opt.id
                    ? "bg-[#0073ea]/15 text-[#5b9fff]"
                    : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <span>{opt.label}</span>
                {sortBy === opt.id && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
            {sortBy !== "manual" && (
              <>
                <div className="my-1 border-t border-zinc-700/60" />
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>{sortDir === "asc" ? "Ascending" : "Descending"}</span>
                </button>
              </>
            )}
          </FloatingPanel>

          {/* Hide columns */}
          <button
            ref={hideButtonRef}
            type="button"
            onClick={() => setIsHideMenuOpen((v) => !v)}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              hiddenColumns.size > 0
                ? "bg-[#0073ea]/15 text-[#5b9fff] hover:bg-[#0073ea]/25"
                : "hover:bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Hide</span>
          </button>
          <FloatingPanel
            isOpen={isHideMenuOpen}
            onClose={() => setIsHideMenuOpen(false)}
            anchorRef={hideButtonRef}
            align="left"
            className="w-48 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            {(
              [
                { id: "person", label: "Person" },
                { id: "status", label: "Status" },
                { id: "date", label: "Date" },
              ] as { id: MondayTableColumn; label: string }[]
            ).map((col) => {
              const isHidden = hiddenColumns.has(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleHiddenColumn(col.id)}
                  className="w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                >
                  <span>{col.label}</span>
                  <span
                    className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                      !isHidden
                        ? "bg-[#0073ea] border-[#0073ea]"
                        : "border-zinc-600 bg-transparent"
                    }`}
                  >
                    {!isHidden && <Check className="h-3 w-3 text-white" />}
                  </span>
                </button>
              );
            })}
          </FloatingPanel>

          {/* Group by (collapse/expand all groups) */}
          <button
            ref={groupByButtonRef}
            type="button"
            onClick={() => setIsGroupByMenuOpen((v) => !v)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Group by</span>
          </button>
          <FloatingPanel
            isOpen={isGroupByMenuOpen}
            onClose={() => setIsGroupByMenuOpen(false)}
            anchorRef={groupByButtonRef}
            align="left"
            className="w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleExpandAllGroups}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Maximize2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>Expand all groups</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAllGroups}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Minimize2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>Collapse all groups</span>
            </button>
          </FloatingPanel>

          {/* More */}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setIsMoreMenuOpen((v) => !v)}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <FloatingPanel
            isOpen={isMoreMenuOpen}
            onClose={() => setIsMoreMenuOpen(false)}
            anchorRef={moreButtonRef}
            align="right"
            className="w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>Export board to CSV</span>
            </button>
          </FloatingPanel>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#1a1a1d]">
        <MondayTable
          boardId={board.id}
          filters={{
            searchQuery: searchFilter,
            personIds: personFilter,
            statusFilter: statusFilterSel,
            priorityFilter: priorityFilterSel,
            sortBy,
            sortDir,
            hiddenColumns,
          }}
        />

        {/* Add new group button */}
        <button
          type="button"
          onClick={() =>
            addGroup(board.id, "New Group").catch((err) =>
              console.error("Failed to create group:", err)
            )
          }
          className={`mt-6 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer ${
            canManage ? "" : "hidden"
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Add new group</span>
        </button>
      </div>
    </div>
  );
}

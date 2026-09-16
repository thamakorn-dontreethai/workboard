"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { MondayTable } from "@/components/board/MondayTable";
import { FloatingPanel } from "@/components/board/FloatingPanel";
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
} from "lucide-react";

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.id as string;

  const {
    boards,
    groups,
    tasks,
    users,
    createTask,
    openCreateTaskModal,
    openInviteBoardModal,
    addGroup,
  } = useWorkBoard();

  const board = boards.find((b) => b.id === boardId) || boards[0];
  const [boardTitle, setBoardTitle] = useState(board ? board.name : "New Board");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main-table");
  const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
  const newItemButtonRef = useRef<HTMLButtonElement>(null);

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
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#1f212c] px-2.5 py-1 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                Invite /{" "}
                {board.memberIds && board.memberIds.length > 0
                  ? board.memberIds.length
                  : 1}
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg font-semibold transition-colors border-b-2 ${
              activeTab === "main-table"
                ? "border-indigo-500 text-white bg-zinc-800/40"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Main table</span>
          </button>

          <button
            type="button"
            title="View options"
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800/50"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Add view"
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800/50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Action Toolbar Bar: New Item Button + Search/Filter/Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-[#1e1e21] border-b border-[#2a2a2e]">
        {/* Left: Gray "New item ▾" Button — clicking the label adds an
            item immediately; the chevron is a separate click target that
            opens the "New group of items" menu. */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-[#3a3f52] hover:bg-[#454b63] text-white text-xs font-semibold shadow-sm transition-colors overflow-hidden">
            <button
              type="button"
              onClick={handleQuickAddItem}
              className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-1.5 hover:bg-white/10 transition-colors"
            >
              <span>New item</span>
            </button>
            <button
              ref={newItemButtonRef}
              type="button"
              onClick={() => setIsNewItemMenuOpen((v) => !v)}
              title="More new-item options"
              className="flex items-center pl-1.5 pr-3 py-1.5 border-l border-white/20 hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
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
            type="button"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            <span>Person</span>
          </button>

          {/* Filter */}
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {/* Sort */}
          <button
            type="button"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort</span>
          </button>

          {/* Hide */}
          <button
            type="button"
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Hide</span>
          </button>

          {/* Group by */}
          <button
            type="button"
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Group by</span>
          </button>

          {/* More */}
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#1a1a1d]">
        <MondayTable boardId={board.id} />

        {/* Add new group button */}
        <button
          type="button"
          onClick={() =>
            addGroup(board.id, "New Group").catch((err) =>
              console.error("Failed to create group:", err)
            )
          }
          className="mt-6 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add new group</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { MondayTable } from "@/components/board/MondayTable";
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
} from "lucide-react";

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.id as string;

  const {
    boards,
    groups,
    tasks,
    users,
    openCreateTaskModal,
    openInviteBoardModal,
  } = useWorkBoard();

  const board = boards.find((b) => b.id === boardId) || boards[0];
  const [boardTitle, setBoardTitle] = useState(board ? board.name : "New Board");
  const [searchFilter, setSearchFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main-table");

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

  return (
    <div className="flex flex-col h-full bg-[#181922] text-zinc-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="px-6 pt-4 pb-2 border-b border-[#262836] bg-[#161720] shrink-0 space-y-3">
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

            {/* More */}
            <button
              type="button"
              title="More options"
              className="p-1 rounded-lg border border-zinc-700/80 bg-[#1f212c] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-[#181922] border-b border-[#262836]">
        {/* Left: Blue "New item ▾" Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateTaskModal(board.id, boardGroups[0]?.id)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <span>New item</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
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
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#14151c]">
        <MondayTable boardId={board.id} />
      </div>
    </div>
  );
}

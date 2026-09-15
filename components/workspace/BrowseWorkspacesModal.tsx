"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  X,
  Search,
  Plus,
  Pin,
  Globe,
  Lock,
  Users,
  Table,
  Check,
  Building,
  Clock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { WorkspaceAvatar } from "./WorkspaceAvatar";

type NavFilter = "all" | "recent" | "owner" | "member" | "collaborator";

export function BrowseWorkspacesModal() {
  const router = useRouter();
  const {
    isBrowseWorkspacesOpen,
    closeBrowseWorkspacesModal,
    openCreateWorkspaceModal,
    workspaces,
    workspace,
    boards,
    currentUser,
    switchWorkspace,
    togglePinWorkspace,
  } = useWorkBoard();

  const [activeFilter, setActiveFilter] = useState<NavFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isBrowseWorkspacesOpen) return null;

  // Filter logic
  const filteredWorkspaces = workspaces.filter((ws) => {
    // Search query
    if (
      searchQuery.trim() &&
      !ws.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(ws.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (activeFilter === "recent") {
      return Boolean(ws.isPinned || ws.lastViewedAt);
    }
    if (activeFilter === "owner") {
      const myMembership = ws.members?.find((m) => m.userId === currentUser.id);
      return myMembership?.role === "owner" || ws.id === "ws-1";
    }
    if (activeFilter === "member") {
      const myMembership = ws.members?.find((m) => m.userId === currentUser.id);
      return myMembership?.role === "member";
    }
    if (activeFilter === "collaborator") {
      const myMembership = ws.members?.find((m) => m.userId === currentUser.id);
      return myMembership?.role === "viewer" || myMembership?.role === "admin";
    }

    return true;
  });

  const handleSelectWorkspace = (wsId: string) => {
    switchWorkspace(wsId);
    closeBrowseWorkspacesModal();
    router.push(`/workspace/${wsId}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="browse-workspaces-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeBrowseWorkspacesModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl h-[80vh] max-h-[640px] rounded-2xl border border-zinc-700/80 bg-[#161720] text-zinc-100 shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800/80 bg-[#181924]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="browse-workspaces-title"
                className="text-base font-bold text-white tracking-tight"
              >
                Browse all workspaces
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a workspace..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={closeBrowseWorkspacesModal}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Category Nav */}
          <div className="w-56 border-r border-zinc-800/80 p-3 flex flex-col justify-between bg-[#14151e]">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeFilter === "all"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5" />
                  <span>All workspaces</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {workspaces.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("recent")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeFilter === "recent"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recent workspaces</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {workspaces.filter((w) => w.isPinned || w.lastViewedAt).length}
                </span>
              </button>

              <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                My workspaces
              </div>

              <button
                type="button"
                onClick={() => setActiveFilter("owner")}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeFilter === "owner"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>Owner</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("member")}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  activeFilter === "member"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Member</span>
                </div>
              </button>
            </div>

            {/* + Create Workspace Button */}
            <button
              type="button"
              onClick={() => {
                closeBrowseWorkspacesModal();
                openCreateWorkspaceModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create workspace</span>
            </button>
          </div>

          {/* Right Main Grid */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {activeFilter === "recent"
                  ? "Recent Workspaces"
                  : activeFilter === "owner"
                  ? "Workspaces you own"
                  : activeFilter === "member"
                  ? "Workspaces you joined"
                  : "All Available Workspaces"}
              </h3>
              <span className="text-xs text-zinc-500 font-medium">
                {filteredWorkspaces.length} workspace
                {filteredWorkspaces.length === 1 ? "" : "s"}
              </span>
            </div>

            {filteredWorkspaces.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/60 text-zinc-500 mx-auto">
                  <Building className="h-6 w-6" />
                </div>
                <p className="text-xs text-zinc-400">No workspaces match your filter</p>
                <button
                  type="button"
                  onClick={() => {
                    closeBrowseWorkspacesModal();
                    openCreateWorkspaceModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredWorkspaces.map((ws) => {
                  const isCurrent = ws.id === workspace.id;
                  const wsBoards = boards.filter((b) => b.workspaceId === ws.id);
                  const initial = (ws.name || "W").charAt(0).toUpperCase();

                  return (
                    <div
                      key={ws.id}
                      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? "border-indigo-500/80 bg-[#1e202d] shadow-md ring-1 ring-indigo-500/40"
                          : "border-zinc-800 bg-[#1a1b26] hover:border-zinc-700 hover:bg-[#1f202e]"
                      }`}
                    >
                      <div>
                        {/* Card Header: Avatar + Title + Pin */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <WorkspaceAvatar
                              name={ws.name}
                              avatarColor={ws.avatarColor || "bg-indigo-600"}
                              icon={ws.icon || "initial"}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-white truncate">
                                  {ws.name}
                                </h4>
                                {isCurrent && (
                                  <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] font-medium">
                                    <Check className="h-2.5 w-2.5" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                                {ws.description || "No description provided"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinWorkspace(ws.id);
                            }}
                            title={ws.isPinned ? "Unpin workspace" : "Pin workspace"}
                            className={`p-1 rounded-md transition-colors ${
                              ws.isPinned
                                ? "text-amber-400 hover:text-amber-300 bg-amber-400/10"
                                : "text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-200"
                            }`}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Badges: Privacy & Plan */}
                        <div className="flex items-center gap-2 mt-3 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 border border-zinc-700/60">
                            {ws.privacy === "closed" ? (
                              <>
                                <Lock className="h-2.5 w-2.5 text-amber-400" />
                                <span>Closed</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-2.5 w-2.5 text-indigo-400" />
                                <span>Open</span>
                              </>
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1 text-zinc-400">
                            <Table className="h-3 w-3 text-zinc-500" />
                            <span>{wsBoards.length} boards</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-zinc-400">
                            <Users className="h-3 w-3 text-zinc-500" />
                            <span>{ws.members?.length || 1} members</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Switch Button */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">
                          {ws.plan || "Pro"} Plan
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSelectWorkspace(ws.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white"
                          }`}
                        >
                          {isCurrent ? "Open Workspace" : "Switch to this"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

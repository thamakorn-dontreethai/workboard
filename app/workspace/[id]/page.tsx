"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  Table,
  Plus,
  Users,
  Search,
  Lock,
  Globe,
  Star,
  Clock,
  LayoutGrid,
  Shield,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Sparkles,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
  Palette,
  Pencil,
  FileText,
  AlertTriangle,
  MessageCircleHeart,
  User,
  SquarePen,
  PanelLeft,
} from "lucide-react";

import { CoverColorPicker } from "@/components/workspace/CoverColorPicker";
import { AvatarCustomizerPicker } from "@/components/workspace/AvatarCustomizerPicker";
import { WorkspaceAvatar } from "@/components/workspace/WorkspaceAvatar";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const workspaceId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const {
    workspaces,
    workspace,
    switchWorkspace,
    updateWorkspace,
    deleteWorkspace,
    boards,
    users,
    tasks,
    currentUser,
    openCreateBoardModal,
    openInviteMemberModal,
  } = useWorkBoard();

  // Find target workspace
  const currentWs =
    workspaces.find((w) => w.id === workspaceId) || workspace;

  // Auto-switch context if different
  useEffect(() => {
    if (workspaceId && workspace.id !== workspaceId) {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (target) {
        switchWorkspace(workspaceId);
      }
    }
  }, [workspaceId, workspace.id, workspaces, switchWorkspace]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"recent" | "content" | "permissions">(
    "recent"
  );

  // Editable Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentWs?.name || "");

  // Editable Description State
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(
    currentWs?.description || ""
  );

  // Dropdowns & Modals State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Search & Starred Boards
  const [contentSearch, setContentSearch] = useState("");
  const [starredBoards, setStarredBoards] = useState<Record<string, boolean>>({});

  const menuRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs when current workspace changes
  useEffect(() => {
    if (currentWs) {
      setNameInput(currentWs.name || "");
      setDescriptionInput(currentWs.description || "");
    }
  }, [currentWs?.id, currentWs?.name, currentWs?.description]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Handle outside click for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Workspace Name (on blur or Enter)
  const handleSaveName = async () => {
    if (currentWs && nameInput.trim() && nameInput.trim() !== currentWs.name) {
      await updateWorkspace(currentWs.id, { name: nameInput.trim() });
    } else if (currentWs) {
      setNameInput(currentWs.name);
    }
    setIsEditingName(false);
  };

  // Save Workspace Description (on blur or Enter)
  const handleSaveDescription = async () => {
    if (currentWs && descriptionInput.trim() !== currentWs.description) {
      await updateWorkspace(currentWs.id, {
        description: descriptionInput.trim(),
      });
    }
    setIsEditingDescription(false);
  };

  // Toggle Privacy (Open <-> Closed)
  const handleTogglePrivacy = async () => {
    if (!currentWs) return;
    const newPrivacy = currentWs.privacy === "closed" ? "open" : "closed";
    await updateWorkspace(currentWs.id, { privacy: newPrivacy });
    setIsMenuOpen(false);
  };

  // Change Avatar Color
  const handleChangeAvatarColor = async (colorClass: string) => {
    if (!currentWs) return;
    await updateWorkspace(currentWs.id, { avatarColor: colorClass });
  };

  // Change Avatar Icon
  const handleChangeAvatarIcon = async (iconId: string) => {
    if (!currentWs) return;
    await updateWorkspace(currentWs.id, { icon: iconId });
  };

  // Change Cover Style
  const handleChangeCover = async (coverStyle: string) => {
    if (!currentWs) return;
    await updateWorkspace(currentWs.id, { coverColor: coverStyle });
  };

  // Confirm Delete Workspace
  const handleConfirmDelete = async () => {
    if (!currentWs) return;
    const remaining = workspaces.filter((w) => w.id !== currentWs.id);
    const success = await deleteWorkspace(currentWs.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      const fallback = remaining[0] || workspace;
      router.push(`/workspace/${fallback.id}`);
    }
  };

  // Toggle Star / Favorite on Board
  const toggleStarBoard = (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  // Boards in this workspace
  const workspaceBoards = boards.filter((b) => b.workspaceId === currentWs?.id);

  const filteredBoards = workspaceBoards.filter((b) =>
    b.name.toLowerCase().includes(contentSearch.toLowerCase())
  );

  const rawCover = currentWs?.coverColor || "bg-white";
  const isCustomImage = rawCover.startsWith("custom-image:");
  const customImageUrl = isCustomImage ? rawCover.slice("custom-image:".length) : null;
  const currentCoverStyle = isCustomImage ? "" : rawCover;

  return (
    <div className="flex-1 overflow-y-auto bg-[#141414] text-zinc-100 min-h-full flex flex-col font-sans select-none">
      {/* ─── 1. TOP COVER BANNER (Clean White Banner, Exact Match to Photo) ───── */}
      <div
        className={`relative w-full h-[238px] transition-colors bg-cover bg-center ${currentCoverStyle}`}
        style={customImageUrl ? { backgroundImage: `url(${customImageUrl})` } : undefined}
      >
        {/* Change Cover Button (Top Right of Cover) */}
        <div className="absolute top-3.5 right-8 z-20" ref={coverRef}>
          <button
            type="button"
            onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0073ea] hover:bg-[#0060c0] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Change cover</span>
          </button>

          {/* Cover Color & Gradient Picker (33 Choices + Upload) */}
          {isCoverPickerOpen && (
            <CoverColorPicker
              currentCover={currentCoverStyle}
              onSelectCover={handleChangeCover}
              onClose={() => setIsCoverPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* ─── 2. MAIN HEADER & AVATAR (In Dark Section) ────────────────────────── */}
      <div className="bg-[#141414] px-16 pb-0 pt-0">
        <div className="w-full">
          <div className="flex items-start justify-between gap-6 relative">
            {/* Left: Avatar + Title + Description */}
            <div className="flex items-start gap-5 min-w-0">
              {/* Avatar (Overlapping the white cover banner by -mt-10) */}
              <div className="relative -mt-9 shrink-0" ref={avatarRef}>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  title="Click to customize workspace icon and color"
                  className="group relative rounded-2xl shadow-xl transition-all hover:scale-105 ring-4 ring-white cursor-pointer"
                >
                  <WorkspaceAvatar
                    name={currentWs?.name}
                    avatarColor={currentWs?.avatarColor || "bg-[#57b6ff]"}
                    icon={currentWs?.icon || "initial"}
                    size="2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                </button>

                {/* Avatar Background & Icon Customizer Picker (21 Colors + 20 Icons) */}
                {isAvatarPickerOpen && (
                  <AvatarCustomizerPicker
                    currentColor={currentWs?.avatarColor || "bg-[#57b6ff]"}
                    currentIcon={currentWs?.icon || "initial"}
                    workspaceName={currentWs?.name}
                    onSelectColor={handleChangeAvatarColor}
                    onSelectIcon={handleChangeAvatarIcon}
                    onClose={() => setIsAvatarPickerOpen(false)}
                  />
                )}
              </div>

              {/* Title & Editable Name & Description (Firmly in dark area) */}
              <div className="min-w-0 pt-4 pb-1 space-y-2">
                {/* Title (Inline editable) */}
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") {
                            setNameInput(currentWs.name);
                            setIsEditingName(false);
                          }
                        }}
                        className="rounded-md bg-zinc-900 border border-[#0073ea] px-2.5 py-0.5 text-[32px] font-semibold text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2" ref={menuRef}>
                      <h1
                        onClick={() => setIsEditingName(true)}
                        className="text-[32px] font-semibold text-white tracking-tight cursor-pointer hover:text-zinc-200 transition-colors leading-tight"
                        title="Click to rename"
                      >
                        {currentWs.name || "Workspace"}
                      </h1>

                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-zinc-200 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        title="Workspace options"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </button>

                      {/* Dropdown Menu (Rename, Icon color, Privacy, Delete) */}
                      {isMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Workspace Settings
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsEditingName(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                            <span>Rename workspace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsAvatarPickerOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                          >
                            <Palette className="h-3.5 w-3.5 text-amber-400" />
                            <span>Change icon color</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleTogglePrivacy}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
                          >
                            {currentWs.privacy === "closed" ? (
                              <>
                                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Change to Open</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5 text-amber-400" />
                                <span>Change to Closed</span>
                              </>
                            )}
                          </button>

                          <div className="my-1 border-t border-zinc-800" />

                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete workspace</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtitle / Description */}
                {isEditingDescription ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      onBlur={handleSaveDescription}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDescription();
                        if (e.key === "Escape") {
                          setDescriptionInput(currentWs.description || "");
                          setIsEditingDescription(false);
                        }
                      }}
                      placeholder="Add workspace description"
                      className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea] w-72"
                    />
                  </div>
                ) : (
                  <p
                    onClick={() => setIsEditingDescription(true)}
                    className="text-sm text-zinc-200 hover:text-white cursor-pointer transition-colors"
                  >
                    {currentWs.description || "Add workspace description"}
                  </p>
                )}
              </div>
            </div>

            {/* Right Actions: Feedback, Avatar, Invite / 1, ••• (Firmly in dark area) */}
            <div className="flex items-center gap-5 pt-4">
              {/* Feedback */}
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-1 rounded text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MessageCircleHeart className="h-4 w-4" />
                <span>Feedback</span>
              </button>

              {/* Current User */}
              <div className="text-white" title={currentUser.name}>
                <User className="h-5 w-5 fill-white" />
              </div>

              {/* Invite / 1 Button (Matching Blue Pill Button in Photo) */}
              <button
                type="button"
                onClick={openInviteMemberModal}
                className="px-2.5 rounded bg-[#0073ea] hover:bg-[#0060c0] text-white text-sm font-medium h-8 flex items-center shadow-xs transition-colors cursor-pointer"
              >
                Invite / {currentWs.members?.length || 1}
              </button>

              {/* Three Dots Menu Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ─── 3. TABS (Recents | Content | Permissions) ───────────────────── */}
          <div className="flex items-center border-b border-zinc-600 mt-8">
            {(
              [
                { id: "recent", label: "Recents", icon: Clock },
                { id: "content", label: "Content", icon: SquarePen },
                { id: "permissions", label: "Permissions", icon: Lock },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 pb-2.5 text-[15px] transition-colors relative cursor-pointer outline-none focus:outline-none ${activeTab === id
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {activeTab === id && (
                  <div className="absolute -bottom-px left-0 right-0 h-[2px] bg-[#0073ea]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. BOARD LIST (Exact Match to User's Photo) ─────────────────────── */}
      <div className="px-16 flex-1">
        <div className="w-full">
          {/* TAB 1: RECENTS (Clean Rows with Star) */}
          {/* Empty workspace: Add new board / Start with a template */}
          {activeTab === "recent" && workspaceBoards.length === 0 && (
            <div className="pt-6 space-y-5">
              <p className="text-[15px] font-medium text-white">
                Welcome to your new workspace
              </p>
              <div className="flex flex-wrap gap-5">
                <button
                  type="button"
                  onClick={openCreateBoardModal}
                  className="group flex flex-col gap-2 text-left cursor-pointer"
                >
                  <div className="flex h-[108px] w-[170px] items-center justify-center rounded-lg border border-zinc-700 bg-[#1e1f21] group-hover:border-zinc-400 transition-colors">
                    <Plus className="h-10 w-10 text-white stroke-[1.5]" />
                  </div>
                  <span className="text-sm text-zinc-200">Add new board</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateBoardModal}
                  className="group flex flex-col gap-2 text-left cursor-pointer"
                >
                  <div className="flex h-[108px] w-[170px] items-center justify-center rounded-lg border border-zinc-700 bg-[#1e1f21] group-hover:border-zinc-400 transition-colors">
                    <div className="w-[110px] rounded bg-white p-2 space-y-1.5 shadow">
                      <div className="h-2 w-12 rounded-sm bg-rose-500" />
                      <div className="h-1.5 rounded-sm bg-zinc-200" />
                      <div className="h-1.5 rounded-sm bg-zinc-200" />
                      <div className="h-1.5 w-2/3 rounded-sm bg-zinc-200" />
                    </div>
                  </div>
                  <span className="text-sm text-zinc-200">Start with a template</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "recent" && workspaceBoards.length > 0 && (
            <div className="pt-6">
              {filteredBoards.map((b) => {
                const isStarred = Boolean(starredBoards[b.id]);
                return (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    className="group flex items-center justify-between py-4 px-7 mx-1 border-b border-zinc-700 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {/* Left: Icon + Board Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <PanelLeft className="h-4 w-4 text-zinc-300" />
                        {b.privacy === "private" && (
                          <Lock className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-zinc-300 bg-[#141414] rounded-sm" />
                        )}
                      </div>
                      <span className="text-sm text-white group-hover:text-[#57b6ff] transition-colors truncate">
                        {b.name}
                      </span>
                    </div>

                    {/* Right: Star Outline */}
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={(e) => toggleStarBoard(b.id, e)}
                        className={`p-1 rounded transition-colors cursor-pointer ${isStarred
                          ? "text-amber-400"
                          : "text-zinc-300 hover:text-white"
                          }`}
                        title={isStarred ? "Starred" : "Star"}
                      >
                        <Star
                          className={`h-5 w-5 ${isStarred ? "fill-amber-400 text-amber-400" : ""
                            }`}
                        />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* TAB 2: CONTENT */}
          {activeTab === "content" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Search boards..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea]"
                  />
                </div>

                <button
                  type="button"
                  onClick={openCreateBoardModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Board</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {filteredBoards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    className="group flex items-center justify-between py-3 px-1 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-xs font-medium text-white group-hover:text-[#57b6ff] transition-colors truncate">
                        {b.name}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500">
                      {tasks.filter((t) => t.boardId === b.id && !t.isArchived).length} tasks
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Workspace Members
                </h3>
                <button
                  type="button"
                  onClick={openInviteMemberModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] text-white text-xs font-semibold transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite Members</span>
                </button>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {users.map((u) => {
                  const isOwner =
                    u.role?.toLowerCase().includes("owner") ||
                    u.role?.toLowerCase().includes("manager");
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between py-2.5 px-1"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs text-white ${u.avatarColor || "bg-indigo-600"
                            }`}
                        >
                          {u.avatarInitials || u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-zinc-500">{u.email}</div>
                        </div>
                      </div>

                      <span className="text-xs text-zinc-400 font-medium">
                        {isOwner ? "Owner" : "Member"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. DELETE WORKSPACE CONFIRMATION MODAL ──────────────────────────── */}
      {isDeleteDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsDeleteDialogOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-[#1c1e28] p-6 text-zinc-100 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Delete "{currentWs.name}"?
              </h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to delete this workspace? This will remove all
              custom settings and cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

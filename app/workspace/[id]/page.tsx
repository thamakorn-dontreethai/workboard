"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  LayoutGrid,
  Shield,
  Trash2,
  Edit2,
  Check,
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
  ThumbsUp,
  ThumbsDown,
  Share2,
  ImagePlus,
  Send,
  X,
  Upload,
  Download,
  File as FileIcon,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Box,
} from "lucide-react";
import type { Post, WorkspaceFile } from "@/types";
import { formatDate } from "@/lib/utils/date";

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
    removeMembers,
    refreshWorkspaces,
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
  const [activeTab, setActiveTab] = useState<"posts" | "content" | "files" | "permissions">(
    "posts"
  );

  // ─── Workspace Posts (simple social feed, scoped to this workspace) ────
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentImageDrafts, setCommentImageDrafts] = useState<Record<string, string | null>>({});
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const commentImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  // Board content search
  const [contentSearch, setContentSearch] = useState("");

  // Multi-select on the Member tab, for bulk removal
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isRemovingMembers, setIsRemovingMembers] = useState(false);

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
    setSelectedMemberIds([]);
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

  // Boards in this workspace
  const workspaceBoards = boards.filter((b) => b.workspaceId === currentWs?.id);

  const filteredBoards = workspaceBoards.filter((b) =>
    b.name.toLowerCase().includes(contentSearch.toLowerCase())
  );

  // ─── Posts feed (scoped to this workspace only) ─────────────────────────
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWs?.id) return;
    let cancelled = false;
    setIsLoadingPosts(true);
    fetch(
      `/api/posts?workspaceId=${encodeURIComponent(currentWs.id)}&viewerId=${encodeURIComponent(currentUser.id)}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;
        setPosts(
          res.data.map((p: Post) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            comments: p.comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })),
          }))
        );
      })
      .catch((err) => console.error("Failed to load posts:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingPosts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentWs?.id, currentUser.id]);

  const readImageAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ─── Files (document library, scoped to this workspace) ─────────────────
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_BYTES = 15 * 1024 * 1024;

  useEffect(() => {
    if (!currentWs?.id || activeTab !== "files") return;
    let cancelled = false;
    setIsLoadingFiles(true);
    fetch(`/api/files?workspaceId=${encodeURIComponent(currentWs.id)}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;
        setFiles(
          res.data.map((f: WorkspaceFile) => ({ ...f, createdAt: new Date(f.createdAt) }))
        );
      })
      .catch((err) => console.error("Failed to load files:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingFiles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentWs?.id, activeTab]);

  // Membership can change from another device/session (someone accepting
  // an invite elsewhere) — refetch it whenever the Member tab is opened so
  // it doesn't sit on a stale list from whenever this tab last loaded.
  useEffect(() => {
    if (activeTab === "permissions") refreshWorkspaces();
  }, [activeTab, refreshWorkspaces]);

  // Picking a file doesn't upload it right away — it's held as "pending"
  // so the user can add an optional caption/note before it actually goes
  // up, instead of uploading blind and editing after the fact.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCaption, setPendingCaption] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileUploadError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileUploadError(
        `"${file.name}" is too large — the limit is ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.`
      );
      return;
    }
    setPendingFile(file);
    setPendingCaption("");
  };

  const handleCancelPendingUpload = () => {
    setPendingFile(null);
    setPendingCaption("");
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !currentWs?.id) return;
    setIsUploadingFile(true);
    try {
      const dataUrl = await readImageAsDataUrl(pendingFile);
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWs.id,
          name: pendingFile.name,
          caption: pendingCaption.trim(),
          mimeType: pendingFile.type || "application/octet-stream",
          size: pendingFile.size,
          dataUrl,
          uploadedById: currentUser.id,
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) throw new Error(result?.error);
      const uploaded: WorkspaceFile = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
      };
      setFiles((prev) => [uploaded, ...prev]);
      setPendingFile(null);
      setPendingCaption("");
    } catch (err: any) {
      setFileUploadError(err.message || "Failed to upload file.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  // Inline caption editing on an already-uploaded file.
  const [editingCaptionFileId, setEditingCaptionFileId] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState("");

  const handleEditCaptionStart = (f: WorkspaceFile) => {
    setEditingCaptionFileId(f.id);
    setCaptionInput(f.caption || "");
  };

  const handleEditCaptionSave = (fileId: string) => {
    const trimmed = captionInput.trim();
    setEditingCaptionFileId(null);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, caption: trimmed } : f)));
    fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: trimmed }),
    }).catch((err) => console.error("Failed to save caption:", err));
  };

  const getFileIcon = (mimeType: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf" || ext === "pdf") return FileText;
    if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
    if (["glb", "gltf", "obj", "fbx", "stl", "3ds", "blend", "usdz"].includes(ext)) return Box;
    return FileIcon;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const handlePostImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setNewPostImage(await readImageAsDataUrl(file));
    }
    e.target.value = "";
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !currentWs?.id) return;
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWs.id,
          authorId: currentUser.id,
          content: newPostContent.trim(),
          imageUrl: newPostImage,
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) throw new Error(result?.error);
      const post: Post = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
        comments: [],
      };
      setPosts((prev) => [post, ...prev]);
      setNewPostContent("");
      setNewPostImage(null);
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  const handleReaction = async (postId: string, type: "like" | "dislike") => {
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, type }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) throw new Error(result?.error);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...result.data,
                createdAt: new Date(result.data.createdAt),
                updatedAt: new Date(result.data.updatedAt),
                comments: result.data.comments.map((c: any) => ({
                  ...c,
                  createdAt: new Date(c.createdAt),
                })),
              }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to react to post:", err);
    }
  };

  const handleCommentImageSelect = async (
    postId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const dataUrl = await readImageAsDataUrl(file);
      setCommentImageDrafts((prev) => ({ ...prev, [postId]: dataUrl }));
    }
    e.target.value = "";
  };

  const handleAddComment = async (postId: string) => {
    const content = (commentDrafts[postId] || "").trim();
    const imageUrl = commentImageDrafts[postId] || null;
    if (!content && !imageUrl) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId: currentUser.id, content: content || " ", imageUrl }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) throw new Error(result?.error);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...result.data,
                createdAt: new Date(result.data.createdAt),
                updatedAt: new Date(result.data.updatedAt),
                comments: result.data.comments.map((c: any) => ({
                  ...c,
                  createdAt: new Date(c.createdAt),
                })),
              }
            : p
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setCommentImageDrafts((prev) => ({ ...prev, [postId]: null }));
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleSharePost = async (postId: string) => {
    const url = `${window.location.origin}/workspace/${currentWs.id}?post=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId((cur) => (cur === postId ? null : cur)), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

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
                    <div className="flex items-center gap-2">
                      <h1
                        onClick={() => setIsEditingName(true)}
                        className="text-[32px] font-semibold text-white tracking-tight cursor-pointer hover:text-zinc-200 transition-colors leading-tight"
                        title="Click to rename"
                      >
                        {currentWs.name || "Workspace"}
                      </h1>
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

            {/* Right Actions: Feedback, Avatar, ••• (Firmly in dark area) */}
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

              {/* Three Dots Menu Button */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                  title="Workspace options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {/* Dropdown Menu (Rename, Icon color, Privacy, Delete) */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95">
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
            </div>
          </div>

          {/* ─── 3. TABS (Posts | Content | Files | Member) ─────────────────── */}
          <div className="flex items-center border-b border-zinc-600 mt-8">
            {(
              [
                { id: "posts", label: "Posts", icon: MessageSquare },
                { id: "content", label: "Content", icon: SquarePen },
                { id: "files", label: "Files", icon: FileIcon },
                { id: "permissions", label: "Member", icon: Lock },
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
          {/* TAB: POSTS — a simple social feed scoped to this workspace only */}
          {activeTab === "posts" && (
            <div className="pt-6 pb-10 max-w-2xl mx-auto space-y-5">
              {/* Composer */}
              <div className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs text-white ${currentUser.avatarColor || "bg-indigo-600"}`}
                  >
                    {currentUser.avatarInitials}
                  </div>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={`Share an update with ${currentWs.name}...`}
                    rows={2}
                    className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none leading-relaxed pt-1.5"
                  />
                </div>

                {newPostImage && (
                  <div className="relative ml-12 inline-block">
                    <img
                      src={newPostImage}
                      alt="Attached"
                      className="max-h-48 rounded-xl border border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPostImage(null)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 ml-12">
                  <input
                    ref={postImageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePostImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => postImageInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] disabled:opacity-40 disabled:hover:bg-[#0073ea] text-white text-xs font-semibold transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Feed */}
              {isLoadingPosts ? (
                <div className="py-16 text-center text-xs text-zinc-500">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-800 space-y-2">
                  <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">No posts yet</p>
                  <p className="text-xs text-zinc-500">
                    Be the first to share something with this workspace.
                  </p>
                </div>
              ) : (
                posts.map((post) => {
                  const author = users.find((u) => u.id === post.authorId);
                  const isExpanded = expandedCommentsPostId === post.id;
                  return (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-zinc-800 bg-[#1a1b1e] overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs text-white ${author?.avatarColor || "bg-indigo-600"}`}
                            >
                              {author?.avatarInitials || "?"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {author?.name || "Unknown"}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {formatDate(post.createdAt)}
                              </div>
                            </div>
                          </div>
                          {post.authorId === currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              title="Delete post"
                              className="text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full max-h-96 object-cover rounded-xl border border-zinc-800"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 px-4 py-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => handleReaction(post.id, "like")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${post.myReaction === "like" ? "text-[#57b6ff] bg-[#0073ea]/10" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                        >
                          <ThumbsUp
                            className={`h-3.5 w-3.5 ${post.myReaction === "like" ? "fill-current" : ""}`}
                          />
                          <span>{post.likeCount > 0 ? post.likeCount : "Like"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReaction(post.id, "dislike")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${post.myReaction === "dislike" ? "text-rose-400 bg-rose-500/10" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                        >
                          <ThumbsDown
                            className={`h-3.5 w-3.5 ${post.myReaction === "dislike" ? "fill-current" : ""}`}
                          />
                          {post.dislikeCount > 0 && <span>{post.dislikeCount}</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCommentsPostId(isExpanded ? null : post.id)
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isExpanded ? "text-white bg-zinc-800" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{post.comments.length > 0 ? post.comments.length : "Comment"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSharePost(post.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ml-auto"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{copiedPostId === post.id ? "Link copied!" : "Share"}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-zinc-800/80 bg-[#161719] p-4 space-y-3">
                          {post.comments.map((c) => {
                            const commentAuthor = users.find((u) => u.id === c.authorId);
                            return (
                              <div key={c.id} className="flex items-start gap-2.5">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[10px] text-white ${commentAuthor?.avatarColor || "bg-indigo-600"}`}
                                >
                                  {commentAuthor?.avatarInitials || "?"}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="rounded-2xl bg-zinc-800/70 px-3 py-2">
                                    <div className="text-xs font-semibold text-white">
                                      {commentAuthor?.name || "Unknown"}
                                    </div>
                                    {c.content.trim() && (
                                      <p className="text-xs text-zinc-200 mt-0.5 whitespace-pre-wrap">
                                        {c.content}
                                      </p>
                                    )}
                                  </div>
                                  {c.imageUrl && (
                                    <img
                                      src={c.imageUrl}
                                      alt=""
                                      className="max-h-40 rounded-xl border border-zinc-800"
                                    />
                                  )}
                                  <div className="text-[10px] text-zinc-500 pl-3">
                                    {formatDate(c.createdAt)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Add comment */}
                          <div className="flex items-start gap-2.5 pt-1">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[10px] text-white ${currentUser.avatarColor || "bg-indigo-600"}`}
                            >
                              {currentUser.avatarInitials}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              {commentImageDrafts[post.id] && (
                                <div className="relative inline-block">
                                  <img
                                    src={commentImageDrafts[post.id]!}
                                    alt="Attached"
                                    className="max-h-32 rounded-lg border border-zinc-700"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCommentImageDrafts((prev) => ({ ...prev, [post.id]: null }))
                                    }
                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 pl-3 pr-1.5 py-1">
                                <input
                                  type="text"
                                  value={commentDrafts[post.id] || ""}
                                  onChange={(e) =>
                                    setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddComment(post.id);
                                  }}
                                  placeholder="Write a comment..."
                                  className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                                />
                                <input
                                  ref={(el) => {
                                    commentImageInputRefs.current[post.id] = el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => handleCommentImageSelect(post.id, e)}
                                />
                                <button
                                  type="button"
                                  onClick={() => commentImageInputRefs.current[post.id]?.click()}
                                  title="Attach image"
                                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                  <ImagePlus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={
                                    !(commentDrafts[post.id] || "").trim() &&
                                    !commentImageDrafts[post.id]
                                  }
                                  title="Send"
                                  className="p-1.5 rounded-full bg-[#0073ea] hover:bg-[#0060c0] disabled:opacity-30 text-white transition-colors"
                                >
                                  <Send className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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

          {/* TAB: FILES (document library — PDF, Word, Excel, 3D models, etc.) */}
          {activeTab === "files" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea]"
                  />
                </div>

                <input
                  ref={fileUploadInputRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileUploadInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingFile ? "Uploading..." : "Upload File"}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-500">
                PDF, Word, Excel, images, 3D models (.glb, .obj, .stl, ...) — any file type, up to{" "}
                {Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.
              </p>

              {fileUploadError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fileUploadError}</span>
                </div>
              )}

              {pendingFile && (
                <div className="p-3 rounded-xl border border-[#0073ea]/40 bg-[#0073ea]/5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const Icon = getFileIcon(pendingFile.type, pendingFile.name);
                      return <Icon className="h-4 w-4 text-zinc-400 shrink-0" />;
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{pendingFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{formatFileSize(pendingFile.size)}</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={pendingCaption}
                    onChange={(e) => setPendingCaption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmUpload();
                      if (e.key === "Escape") handleCancelPendingUpload();
                    }}
                    placeholder="Add a caption or note (optional)..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0073ea]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelPendingUpload}
                      disabled={isUploadingFile}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUpload}
                      disabled={isUploadingFile}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isUploadingFile ? "Uploading..." : "Upload"}</span>
                    </button>
                  </div>
                </div>
              )}

              {isLoadingFiles ? (
                <div className="py-16 text-center text-xs text-zinc-500">Loading files...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-800 space-y-2">
                  <FileIcon className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">
                    {files.length === 0 ? "No files yet" : "No files match your search"}
                  </p>
                  {files.length === 0 && (
                    <p className="text-xs text-zinc-500">
                      Upload documents, spreadsheets, or 3D models for this workspace.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {filteredFiles.map((f) => {
                    const Icon = getFileIcon(f.mimeType, f.name);
                    const uploader = users.find((u) => u.id === f.uploadedById);
                    return (
                      <div
                        key={f.id}
                        className="group flex items-center justify-between gap-3 py-3 px-1 hover:bg-zinc-800/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">{f.name}</p>
                            <p className="text-[10px] text-zinc-500">
                              {formatFileSize(f.size)} · {uploader?.name || "Unknown"} ·{" "}
                              {formatDate(f.createdAt)}
                            </p>
                            {editingCaptionFileId === f.id ? (
                              <input
                                type="text"
                                autoFocus
                                value={captionInput}
                                onChange={(e) => setCaptionInput(e.target.value)}
                                onBlur={() => handleEditCaptionSave(f.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleEditCaptionSave(f.id);
                                  if (e.key === "Escape") setEditingCaptionFileId(null);
                                }}
                                placeholder="Add a caption or note..."
                                className="mt-1 w-full rounded border-b border-[#0073ea] bg-transparent text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditCaptionStart(f)}
                                className="mt-0.5 flex items-center gap-1 text-[11px] text-left transition-colors group/caption"
                              >
                                {f.caption ? (
                                  <span className="text-zinc-400 truncate">{f.caption}</span>
                                ) : (
                                  <span className="text-zinc-600 italic opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Add a caption
                                  </span>
                                )}
                                <Pencil className="h-2.5 w-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={f.dataUrl}
                            download={f.name}
                            title="Download"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(f.id, f.name)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERMISSIONS (Member) */}
          {activeTab === "permissions" && (() => {
            const removableMembers = (currentWs.members || []).filter(
              (m) => m.userId !== currentUser.id
            );
            const allRemovableSelected =
              removableMembers.length > 0 &&
              removableMembers.every((m) => selectedMemberIds.includes(m.userId));

            const toggleSelectMember = (userId: string) => {
              setSelectedMemberIds((prev) =>
                prev.includes(userId)
                  ? prev.filter((id) => id !== userId)
                  : [...prev, userId]
              );
            };

            const toggleSelectAllMembers = () => {
              setSelectedMemberIds(
                allRemovableSelected ? [] : removableMembers.map((m) => m.userId)
              );
            };

            const handleRemoveSelected = async () => {
              const count = selectedMemberIds.length;
              if (count === 0) return;
              if (
                !confirm(
                  `Remove ${count} member${count === 1 ? "" : "s"} from this workspace?`
                )
              ) {
                return;
              }
              setIsRemovingMembers(true);
              try {
                await removeMembers(selectedMemberIds);
                setSelectedMemberIds([]);
              } finally {
                setIsRemovingMembers(false);
              }
            };

            return (
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {removableMembers.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allRemovableSelected}
                        onChange={toggleSelectAllMembers}
                        title="Select all"
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 cursor-pointer accent-[#0073ea]"
                      />
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Workspace Members
                    </h3>
                  </div>
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
                  {(currentWs.members || []).map((member) => {
                    const u = users.find((usr) => usr.id === member.userId);
                    if (!u) return null;
                    const roleLabel =
                      member.role.charAt(0).toUpperCase() + member.role.slice(1);
                    const isSelf = member.userId === currentUser.id;
                    const isSelected = selectedMemberIds.includes(member.userId);
                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between py-2.5 px-1 rounded-lg transition-colors ${isSelected ? "bg-[#0073ea]/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isSelf}
                            onChange={() => toggleSelectMember(member.userId)}
                            title={isSelf ? "You can't remove yourself" : "Select"}
                            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 cursor-pointer accent-[#0073ea] disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs text-white ${u.avatarColor || "bg-indigo-600"
                              }`}
                          >
                            {u.avatarInitials || u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">
                              {u.name}
                              {isSelf && (
                                <span className="text-zinc-500 font-normal"> (you)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500">{u.email}</div>
                          </div>
                        </div>

                        <span className="text-xs text-zinc-400 font-medium">
                          {roleLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Floating bulk-action bar — portal'd to <body> so it
                    floats above everything regardless of scroll position. */}
                {selectedMemberIds.length > 0 &&
                  createPortal(
                    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-700 bg-[#1c1e28] pl-4 pr-2 py-2 shadow-2xl shadow-black/40">
                        <span className="flex items-center gap-2 pr-3 mr-1 border-r border-zinc-700 text-xs font-semibold text-white whitespace-nowrap">
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0073ea] px-1.5 text-[11px] font-bold text-white">
                            {selectedMemberIds.length}
                          </span>
                          <span>selected</span>
                        </span>

                        <button
                          type="button"
                          onClick={handleRemoveSelected}
                          disabled={isRemovingMembers}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{isRemovingMembers ? "Removing..." : "Remove from workspace"}</span>
                        </button>

                        <div className="mx-1 h-5 w-px bg-zinc-700" />

                        <button
                          type="button"
                          onClick={() => setSelectedMemberIds([])}
                          title="Clear selection"
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            );
          })()}
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

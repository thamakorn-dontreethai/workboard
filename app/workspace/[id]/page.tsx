"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bell,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import type { Post, WorkspaceFile, WorkspaceAppointment } from "@/types";
import { formatDate, isOverdue } from "@/lib/utils/date";
import { getThaiHolidayForDate } from "@/lib/utils/thaiHolidays";

import { CoverColorPicker } from "@/components/workspace/CoverColorPicker";
import { AvatarCustomizerPicker } from "@/components/workspace/AvatarCustomizerPicker";
import { WorkspaceAvatar } from "@/components/workspace/WorkspaceAvatar";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Workspace settings are for owners/admins (the API enforces this too);
  // deleting the workspace is owner-only. Members just see the workspace.
  const myWsRole = currentWs?.members?.find((m) => m.userId === currentUser.id)?.role;
  const canManageWs = myWsRole === "owner" || myWsRole === "admin";
  const isWsOwner = myWsRole === "owner";

  // Auto-switch context if different
  useEffect(() => {
    if (workspaceId && workspace.id !== workspaceId) {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (target) {
        switchWorkspace(workspaceId);
      }
    }
  }, [workspaceId, workspace.id, workspaces, switchWorkspace]);

  // Tab State — honors ?tab= so links (e.g. from the global Calendar page)
  // can deep-link straight into a specific tab.
  const VALID_TABS = ["posts", "content", "files", "calendar", "permissions"] as const;
  type WorkspaceTab = (typeof VALID_TABS)[number];
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    const tabParam = searchParams?.get("tab");
    return (VALID_TABS as readonly string[]).includes(tabParam || "")
      ? (tabParam as WorkspaceTab)
      : "posts";
  });

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

  // ─── Calendar (this workspace's board tasks + shared appointments) ──────
  const workspaceBoardIds = useMemo(
    () => new Set(workspaceBoards.map((b) => b.id)),
    [workspaceBoards]
  );
  const workspaceTasks = useMemo(
    () => tasks.filter((t) => workspaceBoardIds.has(t.boardId) && t.dueDate && !t.isArchived),
    [tasks, workspaceBoardIds]
  );

  // Per-member task stats for the Member tab — unlike workspaceTasks above
  // (calendar-only, requires a due date), this counts every active task so
  // "Assigned" reflects a member's real load, not just their scheduled one.
  const memberTaskStats = useMemo(() => {
    const map = new Map<string, { assigned: number; completed: number; overdue: number }>();
    tasks.forEach((t) => {
      if (t.isArchived || !workspaceBoardIds.has(t.boardId)) return;
      t.assigneeIds.forEach((assigneeId) => {
        const entry = map.get(assigneeId) || { assigned: 0, completed: 0, overdue: 0 };
        entry.assigned += 1;
        if (t.status === "done" || t.status === "approved") entry.completed += 1;
        if (isOverdue(t.dueDate, t.status)) entry.overdue += 1;
        map.set(assigneeId, entry);
      });
    });
    return map;
  }, [tasks, workspaceBoardIds]);
  const workspaceMembersList = useMemo(
    () =>
      (currentWs.members || [])
        .map((m) => users.find((u) => u.id === m.userId))
        .filter((u): u is (typeof users)[number] => Boolean(u)),
    [currentWs.members, users]
  );

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [appointments, setAppointments] = useState<WorkspaceAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [newApptTitle, setNewApptTitle] = useState("");
  const [newApptNotes, setNewApptNotes] = useState("");
  const [newApptTime, setNewApptTime] = useState("09:00");
  const [newApptReminder, setNewApptReminder] = useState(30);
  const [newApptAttendeeIds, setNewApptAttendeeIds] = useState<string[]>([]);
  const [apptFormError, setApptFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWs?.id || activeTab !== "calendar") return;
    let cancelled = false;
    setIsLoadingAppointments(true);
    fetch(`/api/appointments?workspaceId=${encodeURIComponent(currentWs.id)}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;
        setAppointments(
          res.data.map((a: WorkspaceAppointment) => ({
            ...a,
            startAt: new Date(a.startAt),
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          }))
        );
      })
      .catch((err) => console.error("Failed to load appointments:", err))
      .finally(() => {
        if (!cancelled) setIsLoadingAppointments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentWs?.id, activeTab]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const monthDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from(
      { length: 42 },
      (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    );
  }, [calendarMonth]);

  const tasksByDay = (day: Date) =>
    workspaceTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  const appointmentsByDay = (day: Date) =>
    appointments.filter((a) => isSameDay(a.startAt, day));

  const toggleAttendee = (userId: string) => {
    setNewApptAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateAppointment = async () => {
    if (!newApptTitle.trim()) {
      setApptFormError("Title is required.");
      return;
    }
    const [hh, mm] = newApptTime.split(":").map(Number);
    const startAt = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      hh || 0,
      mm || 0
    );
    try {
      setApptFormError(null);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWs.id,
          createdById: currentUser.id,
          title: newApptTitle.trim(),
          notes: newApptNotes.trim(),
          startAt: startAt.toISOString(),
          attendeeIds: newApptAttendeeIds,
          reminderMinutesBefore: newApptReminder,
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) throw new Error(result?.error);
      const created: WorkspaceAppointment = {
        ...result.data,
        startAt: new Date(result.data.startAt),
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
      setAppointments((prev) =>
        [...prev, created].sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      );
      setIsCreatingAppointment(false);
      setNewApptTitle("");
      setNewApptNotes("");
      setNewApptTime("09:00");
      setNewApptReminder(30);
      setNewApptAttendeeIds([]);
    } catch (err: any) {
      setApptFormError(err.message || "Failed to create appointment.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete appointment:", err);
    }
  };

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
    <div className="flex-1 overflow-y-auto bg-background text-foreground min-h-full flex flex-col font-sans select-none">
      {/* ─── 1. TOP COVER BANNER (Clean White Banner, Exact Match to Photo) ───── */}
      <div
        className={`relative w-full h-[238px] transition-colors bg-cover bg-center ${currentCoverStyle}`}
        style={customImageUrl ? { backgroundImage: `url(${customImageUrl})` } : undefined}
      >
        {/* Change Cover Button (Top Right of Cover) */}
        <div className={`absolute top-3.5 right-8 z-20 ${canManageWs ? "" : "hidden"}`} ref={coverRef}>
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
      <div className="bg-background px-16 pb-0 pt-0">
        <div className="w-full">
          <div className="flex items-start justify-between gap-6 relative">
            {/* Left: Avatar + Title + Description */}
            <div className="flex items-start gap-5 min-w-0">
              {/* Avatar (Overlapping the white cover banner by -mt-10) */}
              <div className="relative -mt-9 shrink-0" ref={avatarRef}>
                <button
                  type="button"
                  onClick={() => canManageWs && setIsAvatarPickerOpen(!isAvatarPickerOpen)}
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
                        className="rounded-md bg-muted border border-[#0073ea] px-2.5 py-0.5 text-[32px] font-semibold text-foreground focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1
                        onClick={() => canManageWs && setIsEditingName(true)}
                        className="text-[32px] font-semibold text-foreground tracking-tight cursor-pointer hover:text-foreground transition-colors leading-tight"
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
                      className="rounded bg-muted border border-border px-2 py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea] w-72"
                    />
                  </div>
                ) : (
                  <p
                    onClick={() => canManageWs && setIsEditingDescription(true)}
                    className="text-sm text-foreground hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    {currentWs.description || "Add workspace description"}
                  </p>
                )}
              </div>
            </div>

            {/* Right Actions: Feedback, Avatar, ••• (Firmly in dark area) */}
            <div className="flex items-center gap-5 pt-4">



              {/* Current User */}
              <div className="text-foreground" title={currentUser.name}>
                <User className="h-5 w-5 fill-white" />
              </div>

              {/* Three Dots Menu Button */}
              <div className={`relative ${canManageWs ? "" : "hidden"}`} ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-foreground p-1 rounded hover:bg-accent transition-colors cursor-pointer"
                  title="Workspace options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {/* Dropdown Menu (Rename, Icon color, Privacy, Delete) */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-2xl text-xs z-50 animate-in fade-in zoom-in-95">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Workspace Settings
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsEditingName(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left cursor-pointer"
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
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left cursor-pointer"
                    >
                      <Palette className="h-3.5 w-3.5 text-amber-400" />
                      <span>Change icon color</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePrivacy}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left cursor-pointer"
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

                    <div className="my-1 border-t border-border" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium cursor-pointer ${
                        isWsOwner ? "" : "hidden"
                      }`}
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
          <div className="flex items-center border-b border-border mt-8">
            {(
              [
                { id: "posts", label: "Posts", icon: MessageSquare },
                { id: "content", label: "Content", icon: SquarePen },
                { id: "calendar", label: "Calendar", icon: CalendarIcon },
                { id: "permissions", label: "Member", icon: Lock },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 pb-2.5 text-[15px] transition-colors relative cursor-pointer outline-none focus:outline-none ${activeTab === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
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
                    className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed pt-1.5"
                  />
                </div>

                {newPostImage && (
                  <div className="relative ml-12 inline-block">
                    <img
                      src={newPostImage}
                      alt="Attached"
                      className="max-h-48 rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPostImage(null)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:text-accent-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border ml-12">
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
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
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
                <div className="py-16 text-center text-xs text-muted-foreground">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-border space-y-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold text-muted-foreground">No posts yet</p>
                  <p className="text-xs text-muted-foreground">
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
                      className="rounded-2xl border border-border bg-card overflow-hidden"
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
                              <div className="text-sm font-semibold text-foreground">
                                {author?.name || "Unknown"}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {formatDate(post.createdAt)}
                              </div>
                            </div>
                          </div>
                          {post.authorId === currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              title="Delete post"
                              className="text-muted-foreground hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-full max-h-96 object-cover rounded-xl border border-border"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1 px-4 py-2 border-t border-border/80">
                        <button
                          type="button"
                          onClick={() => handleReaction(post.id, "like")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${post.myReaction === "like" ? "text-[#57b6ff] bg-[#0073ea]/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                        >
                          <ThumbsUp
                            className={`h-3.5 w-3.5 ${post.myReaction === "like" ? "fill-current" : ""}`}
                          />
                          <span>{post.likeCount > 0 ? post.likeCount : "Like"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReaction(post.id, "dislike")}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${post.myReaction === "dislike" ? "text-rose-400 bg-rose-500/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
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
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isExpanded ? "text-accent-foreground bg-accent" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{post.comments.length > 0 ? post.comments.length : "Comment"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSharePost(post.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors ml-auto"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{copiedPostId === post.id ? "Link copied!" : "Share"}</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border/80 bg-muted p-4 space-y-3">
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
                                  <div className="rounded-2xl bg-accent/70 px-3 py-2">
                                    <div className="text-xs font-semibold text-foreground">
                                      {commentAuthor?.name || "Unknown"}
                                    </div>
                                    {c.content.trim() && (
                                      <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">
                                        {c.content}
                                      </p>
                                    )}
                                  </div>
                                  {c.imageUrl && (
                                    <img
                                      src={c.imageUrl}
                                      alt=""
                                      className="max-h-40 rounded-xl border border-border"
                                    />
                                  )}
                                  <div className="text-[10px] text-muted-foreground pl-3">
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
                                    className="max-h-32 rounded-lg border border-border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCommentImageDrafts((prev) => ({ ...prev, [post.id]: null }))
                                    }
                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:text-accent-foreground transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 pl-3 pr-1.5 py-1">
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
                                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
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
                                  className="p-1 rounded-full text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Search boards..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-muted/90 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea]"
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
                    className="group flex items-center justify-between py-3 px-1 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground group-hover:text-[#57b6ff] transition-colors truncate">
                        {b.name}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-muted/90 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea]"
                  />
                </div>

                <input
                  ref={fileUploadInputRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
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
                      return <Icon className="h-4 w-4 text-muted-foreground shrink-0" />;
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{pendingFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFileSize(pendingFile.size)}</p>
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
                    className="w-full rounded-lg border border-border bg-muted/90 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelPendingUpload}
                      disabled={isUploadingFile}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
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
                <div className="py-16 text-center text-xs text-muted-foreground">Loading files...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-border space-y-2">
                  <FileIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    {files.length === 0 ? "No files yet" : "No files match your search"}
                  </p>
                  {files.length === 0 && (
                    <p className="text-xs text-muted-foreground">
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
                        className="group flex items-center justify-between gap-3 py-3 px-1 hover:bg-accent/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                            <p className="text-[10px] text-muted-foreground">
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
                                className="mt-1 w-full rounded border-b border-[#0073ea] bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditCaptionStart(f)}
                                className="mt-0.5 flex items-center gap-1 text-[11px] text-left transition-colors group/caption"
                              >
                                {f.caption ? (
                                  <span className="text-muted-foreground truncate">{f.caption}</span>
                                ) : (
                                  <span className="text-muted-foreground italic opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Add a caption
                                  </span>
                                )}
                                <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={f.dataUrl}
                            download={f.name}
                            title="Download"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(f.id, f.name)}
                            title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

          {/* TAB: CALENDAR — this workspace's board tasks + shared appointments */}
          {activeTab === "calendar" && (() => {
            const myRole = (currentWs.members || []).find(
              (m) => m.userId === currentUser.id
            )?.role;
            const canManage = myRole === "owner" || myRole === "admin";
            const selectedDayTasks = tasksByDay(selectedDay);
            const selectedDayAppointments = appointmentsByDay(selectedDay);
            const selectedDayHoliday = getThaiHolidayForDate(selectedDay);
            const monthLabel = calendarMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });
            const today = new Date();

            return (
              <div className="py-4 flex flex-col lg:flex-row gap-6">
                {/* Month grid */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{monthLabel}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                          setSelectedDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold mb-1 px-0.5">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div key={d} className="text-center py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day, i) => {
                      const inMonth = day.getMonth() === calendarMonth.getMonth();
                      const dayTasks = tasksByDay(day);
                      const dayAppts = appointmentsByDay(day);
                      const isToday = isSameDay(day, today);
                      const isSelected = isSameDay(day, selectedDay);
                      const holiday = getThaiHolidayForDate(day);
                      const totalItems = dayTasks.length + dayAppts.length;
                      const visibleAppts = dayAppts.slice(0, 2);
                      const visibleTasks = dayTasks.slice(0, Math.max(0, 2 - visibleAppts.length));
                      const overflow = totalItems - visibleAppts.length - visibleTasks.length;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`min-h-[84px] sm:min-h-[104px] rounded-lg p-1 sm:p-1.5 text-left flex flex-col gap-0.5 border transition-colors cursor-pointer ${isSelected
                            ? "border-[#0073ea] bg-[#0073ea]/10"
                            : holiday
                              ? "border-rose-900/30 bg-rose-950/10 hover:border-rose-700/50"
                              : "border-transparent hover:bg-accent/40"
                            } ${inMonth ? "" : "opacity-40"}`}
                        >
                          <span
                            className={`shrink-0 text-[11px] font-medium ${isToday
                              ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#0073ea] text-white"
                              : holiday
                                ? "text-rose-300 font-semibold"
                                : "text-muted-foreground"
                              }`}
                          >
                            {day.getDate()}
                          </span>

                          {holiday && (
                            <span
                              className="text-[8.5px] sm:text-[9px] leading-tight text-rose-300 truncate"
                              title={`${holiday.nameTh} · ${holiday.nameEn}`}
                            >
                              🇹🇭 {holiday.nameTh}
                            </span>
                          )}

                          <div className="flex-1 space-y-0.5 overflow-hidden">
                            {visibleAppts.map((a) => (
                              <div
                                key={a.id}
                                title={a.title}
                                className="truncate rounded bg-emerald-950/40 border border-emerald-700/30 px-1 py-0.5 text-[8.5px] sm:text-[9.5px] text-emerald-200"
                              >
                                {a.startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                                {a.title}
                              </div>
                            ))}
                            {visibleTasks.map((t) => (
                              <div
                                key={t.id}
                                title={t.title}
                                className="truncate rounded bg-blue-950/40 border border-blue-700/30 px-1 py-0.5 text-[8.5px] sm:text-[9.5px] text-blue-200"
                              >
                                {t.title}
                              </div>
                            ))}
                            {overflow > 0 && (
                              <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-indigo-400 px-1">
                                +{overflow} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Task due
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Appointment
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>🇹🇭</span> Thai holiday
                    </span>
                  </div>
                </div>

                {/* Day panel */}
                <div className="w-full lg:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      {selectedDay.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setApptFormError(null);
                        setNewApptTitle("");
                        setNewApptNotes("");
                        setNewApptTime("09:00");
                        setNewApptReminder(30);
                        setNewApptAttendeeIds([]);
                        setIsCreatingAppointment(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0073ea] hover:bg-[#0060c0] text-white text-[11px] font-semibold transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Appointment
                    </button>
                  </div>

                  {selectedDayHoliday && (
                    <div className="mb-3 p-2.5 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-200 flex items-start gap-2.5 text-xs">
                      <span className="text-base leading-none shrink-0">🇹🇭</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-rose-300">{selectedDayHoliday.nameTh}</p>
                        <p className="text-[10px] text-rose-400/80">{selectedDayHoliday.nameEn}</p>
                      </div>
                    </div>
                  )}

                  {isLoadingAppointments ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">Loading...</div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayAppointments.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Appointments
                          </p>
                          {selectedDayAppointments.map((a) => {
                            const creator = users.find((u) => u.id === a.createdById);
                            const canDelete = canManage || a.createdById === currentUser.id;
                            return (
                              <div
                                key={a.id}
                                className="group flex items-start justify-between gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {a.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {a.startAt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {creator ? ` · ${creator.name}` : ""}
                                  </p>
                                  {a.notes && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.notes}</p>
                                  )}
                                </div>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAppointment(a.id)}
                                    title="Delete"
                                    className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedDayTasks.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Tasks Due
                          </p>
                          {selectedDayTasks.map((t) => {
                            const board = boards.find((b) => b.id === t.boardId);
                            return (
                              <Link
                                key={t.id}
                                href={`/board/${t.boardId}`}
                                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {t.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {board?.name || "Board"}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {selectedDayAppointments.length === 0 && selectedDayTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          Nothing scheduled for this day.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: PERMISSIONS (Member) */}
          {activeTab === "permissions" && (() => {
            const myRole = (currentWs.members || []).find(
              (m) => m.userId === currentUser.id
            )?.role;
            const canManageMembers = myRole === "owner" || myRole === "admin";
            // Nobody can be bulk-removed here except plain members/admins —
            // never yourself, and never the owner (no ownership-transfer
            // flow exists yet, so that would leave the workspace ownerless).
            const removableMembers = (currentWs.members || []).filter(
              (m) => m.userId !== currentUser.id && m.role !== "owner"
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
                    {canManageMembers && removableMembers.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allRemovableSelected}
                        onChange={toggleSelectAllMembers}
                        title="Select all"
                        className="h-3.5 w-3.5 rounded border-border bg-muted cursor-pointer accent-[#0073ea]"
                      />
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    const isOwner = member.role === "owner";
                    const isSelected = selectedMemberIds.includes(member.userId);
                    const disabledReason = isOwner
                      ? "The owner can't be removed"
                      : isSelf
                        ? "You can't remove yourself"
                        : undefined;
                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between py-2.5 px-1 rounded-lg transition-colors ${isSelected ? "bg-[#0073ea]/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          {canManageMembers && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isSelf || isOwner}
                              onChange={() => toggleSelectMember(member.userId)}
                              title={disabledReason || "Select"}
                              className="h-3.5 w-3.5 rounded border-border bg-muted cursor-pointer accent-[#0073ea] disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          )}
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs text-white ${u.avatarColor || "bg-indigo-600"
                              }`}
                          >
                            {u.avatarInitials || u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">
                              {u.name}
                              {isSelf && (
                                <span className="text-muted-foreground font-normal"> (you)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{u.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {(() => {
                            const stats = memberTaskStats.get(member.userId) || {
                              assigned: 0,
                              completed: 0,
                              overdue: 0,
                            };
                            return (
                              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                                <span
                                  className="flex items-center gap-1"
                                  title={`${stats.assigned} assigned task${stats.assigned === 1 ? "" : "s"}`}
                                >
                                  <ListChecks className="h-3 w-3 text-blue-400" />
                                  {stats.assigned}
                                </span>
                                <span
                                  className="flex items-center gap-1"
                                  title={`${stats.completed} completed task${stats.completed === 1 ? "" : "s"}`}
                                >
                                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  {stats.completed}
                                </span>
                                <span
                                  className={`flex items-center gap-1 ${
                                    stats.overdue > 0 ? "text-rose-400 font-semibold" : ""
                                  }`}
                                  title={`${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"}`}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {stats.overdue}
                                </span>
                              </div>
                            );
                          })()}
                          <span className="text-xs text-muted-foreground font-medium shrink-0">
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floating bulk-action bar — portal'd to <body> so it
                    floats above everything regardless of scroll position. */}
                {selectedMemberIds.length > 0 &&
                  createPortal(
                    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-2 fade-in duration-200">
                      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border bg-popover pl-4 pr-2 py-2 shadow-2xl shadow-black/40">
                        <span className="flex items-center gap-2 pr-3 mr-1 border-r border-border text-xs font-semibold text-foreground whitespace-nowrap">
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

                        <div className="mx-1 h-5 w-px bg-border" />

                        <button
                          type="button"
                          onClick={() => setSelectedMemberIds([])}
                          title="Clear selection"
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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

      {/* ─── NEW APPOINTMENT MODAL ────────────────────────────────────────────── */}
      {isCreatingAppointment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsCreatingAppointment(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-5 sm:p-6 text-foreground shadow-2xl z-10 space-y-4 max-h-[88vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">New Appointment</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingAppointment(false)}
                className="text-muted-foreground hover:text-accent-foreground p-1 rounded-md hover:bg-accent shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                autoFocus
                value={newApptTitle}
                onChange={(e) => setNewApptTitle(e.target.value)}
                placeholder="e.g. Weekly sync with design team"
                className="w-full rounded-lg border border-border bg-muted/90 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Notes (optional)</label>
              <textarea
                value={newApptNotes}
                onChange={(e) => setNewApptNotes(e.target.value)}
                placeholder="Agenda, meeting link, location..."
                rows={3}
                className="w-full rounded-lg border border-border bg-muted/90 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0073ea] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time
                </label>
                <input
                  type="time"
                  value={newApptTime}
                  onChange={(e) => setNewApptTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/90 px-2.5 py-2 text-sm text-foreground focus:outline-none focus:border-[#0073ea]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Bell className="h-3 w-3" /> Reminder
                </label>
                <select
                  value={newApptReminder}
                  onChange={(e) => setNewApptReminder(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-muted/90 px-2.5 py-2 text-sm text-foreground focus:outline-none focus:border-[#0073ea]"
                >
                  <option value={10}>10m before</option>
                  <option value={30}>30m before</option>
                  <option value={60}>1h before</option>
                  <option value={1440}>1d before</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Attendees (none selected = everyone in this workspace)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {workspaceMembersList.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAttendee(u.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${newApptAttendeeIds.includes(u.id)
                      ? "border-[#0073ea] bg-[#0073ea]/20 text-[#0073ea]"
                      : "border-border text-muted-foreground hover:text-accent-foreground"
                      }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${u.avatarColor}`}
                    >
                      {u.avatarInitials}
                    </span>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {apptFormError && <p className="text-xs text-rose-400">{apptFormError}</p>}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsCreatingAppointment(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAppointment}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0073ea] hover:bg-[#0060c0] text-white shadow-md transition-colors"
              >
                Create Appointment
              </button>
            </div>
          </div>
        </div>
      )}

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

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 text-foreground shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Delete "{currentWs.name}"?
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this workspace? This will remove all
              custom settings and cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"
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

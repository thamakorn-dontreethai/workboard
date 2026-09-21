"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { AssigneeSelect } from "@/components/common/AssigneeSelect";
import { getBoardMemberIds } from "@/lib/utils/boardMembers";
import { formatDate, formatRelativeDate } from "@/lib/utils/date";
import {
  INLINE_IMAGE_TYPES,
  MAX_ATTACHMENTS_PER_COMMENT,
  formatBytes,
  validateAttachments,
} from "@/lib/utils/commentAttachments";
import {
  X,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  AtSign,
  Paperclip,
  Info as InfoIcon,
  FileText,
  Tag,
  FolderKanban,
} from "lucide-react";

export function MondaySlideOver() {
  const {
    activeTaskId,
    closeTaskModal,
    slideOverTab,
    setSlideOverTab,
    tasks,
    boards,
    groups,
    users,
    workspaces,
    subtasks,
    comments,
    activities,
    currentUser,
    assignTask,
    updateTaskStatus,
    updateTaskPriority,
    updateTaskField,
    updateTaskDetails,
    deleteTask,
    toggleSubtask,
    addSubtask,
    addComment,
    editComment,
    deleteComment,
    canDo,
  } = useWorkBoard();

  const task = tasks.find((t) => t.id === activeTaskId);
  const board = task ? boards.find((b) => b.id === task.boardId) : null;
  const group = task ? groups.find((g) => g.id === task.groupId) : null;

  const taskSubtasks = subtasks.filter((s) => s.taskId === activeTaskId);
  // Newest first, so the latest update is right under the composer.
  const taskComments = comments
    .filter((c) => c.taskId === activeTaskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const taskActivities = activities.filter((a) => a.taskId === activeTaskId);

  // People that can be @mentioned: the board's team, falling back to
  // everyone if it can't be resolved.
  const mentionables = useMemo(() => {
    if (!board) return users;
    const ids = new Set(getBoardMemberIds(board, workspaces));
    const members = users.filter((u) => ids.has(u.id));
    return members.length > 0 ? members : users;
  }, [board, users, workspaces]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const updateInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Files chosen but not yet posted; `url` is the base64 data URL.
  const [pendingFiles, setPendingFiles] = useState<
    { name: string; size: number; mimeType: string; url: string }[]
  >([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category || "");
    }
  }, [task]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && activeTaskId) {
        closeTaskModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTaskId, closeTaskModal]);

  if (!task) return null;

  // Leaders (workspace owner/admin, or the board's owner) can edit anything;
  // a member can change status on items assigned to them and add
  // comments / checklist steps; viewers are read-only. The API enforces the
  // same rules — this just avoids offering controls that would be refused.
  const canManage = canDo("manage", task.boardId);
  const canChangeStatus = canDo("status", task.boardId, task);
  const canWrite = canDo("write", task.boardId);

  const statusConfig = TASK_STATUS_CONFIG[task.status] || {
    label: task.status,
    bgColor: "bg-muted",
    color: "text-foreground",
  };
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority] || {
    label: task.priority,
    bgColor: "bg-muted",
    color: "text-foreground",
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTaskDetails(task.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      updateTaskDetails(task.id, { description });
    }
  };

  const handleCategoryBlur = () => {
    if (category !== (task.category || "")) {
      updateTaskField(task.id, "category", category);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim()).catch((err) =>
        console.error("Failed to add subtask:", err)
      );
      setNewSubtaskTitle("");
    }
  };

  const handlePostUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newUpdateContent.trim();
    if ((!content && pendingFiles.length === 0) || isPosting) return;

    setIsPosting(true);
    setCommentError(null);
    try {
      await addComment(task.id, content, pendingFiles);
      setNewUpdateContent("");
      setPendingFiles([]);
      setMentionQuery(null);
    } catch (err) {
      console.error("Failed to add comment:", err);
      setCommentError("Couldn't post your update. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (chosen.length === 0) return;

    const limitError = validateAttachments([...pendingFiles, ...chosen]);
    if (limitError) {
      setCommentError(limitError);
      return;
    }
    try {
      const added = await Promise.all(
        chosen.map(async (file) => ({
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          url: await readAsDataUrl(file),
        }))
      );
      setCommentError(null);
      setPendingFiles((prev) => [...prev, ...added]);
    } catch (err) {
      console.error("Failed to read file:", err);
      setCommentError("Couldn't read that file. Please try again.");
    }
  };

  // Inserts text at the caret (or replaces [from, to)) and puts the caret
  // right after it — used by the @ button and mention picker.
  const insertAtCaret = (text: string, from?: number, to?: number) => {
    const el = updateInputRef.current;
    const start = from ?? el?.selectionStart ?? newUpdateContent.length;
    const end = to ?? el?.selectionEnd ?? start;
    setNewUpdateContent(newUpdateContent.slice(0, start) + text + newUpdateContent.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  // Opens the picker when the caret sits right after "@<partial name>".
  const detectMention = (value: string, caret: number) => {
    const match = /(?:^|\s)@([^\s@]*)$/.exec(value.slice(0, caret));
    setMentionQuery(match ? match[1].toLowerCase() : null);
  };

  const pickMention = (name: string) => {
    const el = updateInputRef.current;
    const caret = el?.selectionStart ?? newUpdateContent.length;
    const atIndex = newUpdateContent.slice(0, caret).lastIndexOf("@");
    insertAtCaret(`@${name} `, atIndex, caret);
    setMentionQuery(null);
  };

  const mentionMatches =
    mentionQuery === null
      ? []
      : mentionables
          .filter((u) =>
            u.name
              .toLowerCase()
              .split(/\s+/)
              .some((part) => part.startsWith(mentionQuery)) ||
            u.name.toLowerCase().startsWith(mentionQuery)
          )
          .slice(0, 6);

  const startEditing = (id: string, content: string) => {
    setEditingCommentId(id);
    setEditingContent(content);
    setCommentError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;
    const original = comments.find((c) => c.id === editingCommentId);
    const content = editingContent.trim();
    if (!content || content === original?.content) {
      setEditingCommentId(null);
      return;
    }
    try {
      await editComment(editingCommentId, content);
      setEditingCommentId(null);
    } catch (err) {
      console.error("Failed to edit comment:", err);
      setCommentError("Couldn't save your edit. Please try again.");
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Delete this update permanently?")) return;
    try {
      await deleteComment(id);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setCommentError("Couldn't delete the update. Please try again.");
    }
  };

  // Wraps "@Full Name" mentions in a highlight; everything else stays text.
  const renderContent = (content: string) => {
    const names = mentionables
      .map((u) => u.name)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (names.length === 0) return content;
    const parts = content.split(new RegExp(`(@(?:${names.join("|")}))`, "i"));
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} className="font-semibold text-blue-400">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const universalStatuses: TaskStatus[] = [
    "todo",
    "in_progress",
    "in_review",
    "done",
    "blocked",
    "on_hold",
    "new_request",
    "approved",
    "planning",
  ];

  const universalPriorities: TaskPriority[] = [
    "urgent",
    "high",
    "medium",
    "low",
    "none",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Item details"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={closeTaskModal}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-5xl h-full bg-[#111217] text-zinc-100 shadow-2xl border-l border-zinc-800 flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/80 bg-[#16181f]">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSlideOverTab("details")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                slideOverTab === "details"
                  ? "bg-zinc-800 text-white shadow-2xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => setSlideOverTab("activity")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                slideOverTab === "activity"
                  ? "bg-zinc-800 text-white shadow-2xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Comments</span>
              {taskComments.length > 0 && (
                <span className="rounded-full bg-zinc-700 px-1.5 text-[10px] font-bold text-zinc-300">
                  {taskComments.length}
                </span>
              )}
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {canManage && (
<button
              type="button"
              onClick={() => {
                if (confirm("Delete this item permanently?")) {
                  deleteTask(task.id);
                }
              }}
              title="Delete item"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
)}

            <button
              type="button"
              onClick={closeTaskModal}
              title="Close drawer (Esc)"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Item Name */}
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-[#13141b]">
          <input
            type="text"
            value={title}
            readOnly={!canManage}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="New item name..."
            className="w-full text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-blue-500 focus:outline-none py-1 transition-colors"
          />
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            {board && <span className="font-medium text-zinc-300">{board.name}</span>}
            {group && (
              <>
                <span>/</span>
                <span style={{ color: group.color || "#3b82f6" }} className="font-semibold">
                  {group.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Body: Details tab and Comments tab are separate pages now, not a
            split-screen — each rendered full width, one at a time. */}
        <div className="flex-1 overflow-y-auto">
          {slideOverTab === "details" ? (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            {/* Info Widget Box */}
            <div className="rounded-xl border border-zinc-800 bg-[#16181f] p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <InfoIcon className="h-3.5 w-3.5 text-blue-400" />
                  <span>Item Info</span>
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {task.itemCode || `WB-${task.id.replace("task-", "")}`}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {/* Owner */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Owner</label>
                  <div className="pt-0.5">
                    <AssigneeSelect
                      currentAssigneeIds={task.assigneeIds}
                      onAssign={(newUids) => assignTask(task.id, newUids)}
                      boardId={task.boardId}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-zinc-400">Status</label>
                  <button
                    type="button"
                    disabled={!canChangeStatus}
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`w-full py-1.5 px-2.5 rounded-lg font-semibold text-xs transition-all ${statusConfig.bgColor} ${statusConfig.color} text-center`}
                  >
                    {statusConfig.label}
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-44 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                      {universalStatuses.map((st) => {
                        const cfg = TASK_STATUS_CONFIG[st];
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              updateTaskStatus(task.id, st);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold mb-0.5 text-center transition-all ${cfg.bgColor} ${cfg.color}`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-semibold text-zinc-400">Priority</label>
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    className={`w-full py-1.5 px-2.5 rounded-lg font-semibold text-xs transition-all ${priorityConfig.bgColor} ${priorityConfig.color} text-center`}
                  >
                    {priorityConfig.label}
                  </button>

                  {isPriorityDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-36 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                      {universalPriorities.map((pr) => {
                        const cfg = TASK_PRIORITY_CONFIG[pr];
                        return (
                          <button
                            key={pr}
                            type="button"
                            onClick={() => {
                              updateTaskPriority(task.id, pr);
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold mb-0.5 text-center transition-all ${cfg.bgColor} ${cfg.color}`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category / Department */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Department</label>
                  <input
                    type="text"
                    value={category}
                    readOnly={!canManage}
                    onChange={(e) => setCategory(e.target.value)}
                    onBlur={handleCategoryBlur}
                    placeholder="e.g. Marketing, Design"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Due Date</label>
                  <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-zinc-200 text-center">
                    {task.dueDate ? formatDate(task.dueDate) : "No deadline"}
                  </div>
                </div>

                {/* Group / Board Section */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">Group</label>
                  <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-purple-300 text-center truncate">
                    {group?.name || "General"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Widget Box */}
            <div className="rounded-xl border border-zinc-800 bg-[#16181f] p-4 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span>Description</span>
              </span>
              <textarea
                rows={4}
                value={description}
                readOnly={!canManage}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="+ Write project details, requirements, or deliverables..."
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Subtasks Widget Box */}
            <div className="rounded-xl border border-zinc-800 bg-[#16181f] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Subtasks & Checklist</span>
                </span>
                {taskSubtasks.length > 0 && (
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                    {taskSubtasks.filter((s) => s.isCompleted).length} / {taskSubtasks.length}
                  </span>
                )}
              </div>

              {taskSubtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs"
                >
                  <button
                    type="button"
                    disabled={!canWrite}
                    onClick={() => toggleSubtask(st.id)}
                    className="text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {st.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={`flex-1 truncate ${
                      st.isCompleted
                        ? "line-through text-zinc-500"
                        : "text-zinc-200"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}

              {canWrite && (
<form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 shadow-2xs"
                >
                  Add
                </button>
              </form>
)}
            </div>
          </div>
          ) : (
          <div className="max-w-2xl mx-auto p-6 flex flex-col space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  <span>Item updates</span>
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span>Update via email</span>
                  <span>·</span>
                  <span>Give feedback</span>
                </div>
              </div>

              {/* Updates Form with formatting icons */}
              {canWrite ? (
<form
                onSubmit={handlePostUpdate}
                className="relative rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-3 space-y-2 shadow-xs"
              >
                <textarea
                  ref={updateInputRef}
                  rows={3}
                  value={newUpdateContent}
                  onChange={(e) => {
                    setNewUpdateContent(e.target.value);
                    detectMention(e.target.value, e.target.selectionStart);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && mentionQuery !== null) {
                      // Close the picker only — don't let Esc close the drawer.
                      e.stopPropagation();
                      setMentionQuery(null);
                    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handlePostUpdate();
                    } else if (e.key === "Enter" && mentionMatches.length > 0) {
                      e.preventDefault();
                      pickMention(mentionMatches[0].name);
                    }
                  }}
                  placeholder="Write an update and mention others with @"
                  className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Files waiting to be posted */}
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pendingFiles.map((file, i) => (
                      <span
                        key={`${file.name}-${i}`}
                        className="flex max-w-full items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 py-1 pl-2 pr-1 text-[11px] text-zinc-200"
                      >
                        <Paperclip className="h-3 w-3 shrink-0 text-zinc-400" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-zinc-500">{formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          title="Remove file"
                          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* @mention suggestions */}
                {mentionMatches.length > 0 && (
                  <div className="absolute left-3 right-3 top-[4.5rem] z-20 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                    {mentionMatches.map((u, i) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={(e) => {
                          // Keep the textarea focused so the caret position survives.
                          e.preventDefault();
                          pickMention(u.name);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-800 ${
                          i === 0 ? "bg-zinc-800/60" : ""
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${u.avatarColor}`}
                        >
                          {u.avatarInitials}
                        </span>
                        <span className="font-medium text-zinc-200">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Toolbar icons (@, attachment, emoji, pen) + Submit */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="relative flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => {
                        insertAtCaret("@");
                        setMentionQuery("");
                      }}
                      title="Mention member"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pendingFiles.length >= MAX_ATTACHMENTS_PER_COMMENT}
                      title="Attach file"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFilesSelected}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-[10px] text-zinc-600">Ctrl + Enter</span>
                    <button
                      type="submit"
                      disabled={(!newUpdateContent.trim() && pendingFiles.length === 0) || isPosting}
                      className="rounded-lg bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 shadow-2xs"
                    >
                      {isPosting ? "Posting…" : "Update"}
                    </button>
                  </div>
                </div>
              </form>
) : (
  <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-[11px] text-zinc-500">
    You have view-only access to this board, so you can read updates but not post them.
  </p>
)}

              {commentError && (
                <p role="alert" className="text-[11px] text-red-400">
                  {commentError}
                </p>
              )}

              {/* Updates stream / Activity log */}
              <div className="space-y-3 pt-2">
                {taskComments.length === 0 && taskActivities.length === 0 ? (
                  /* "No updates yet" Box */
                  <div className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-zinc-200">
                        No updates yet
                      </h5>
                      <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                        Share progress, mention a teammate, or upload a file to get things moving.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Comments list */}
                    {taskComments.map((comment) => {
                      const author = users.find((u) => u.id === comment.authorId);
                      const isOwn = comment.authorId === currentUser.id;
                      const isEditing = editingCommentId === comment.id;
                      return (
                        <div
                          key={comment.id}
                          className="group rounded-xl border border-zinc-800 bg-[#16181f] p-3 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                                  author?.avatarColor || "bg-blue-600"
                                }`}
                              >
                                {author?.avatarInitials || "WB"}
                              </div>
                              <span className="font-semibold text-zinc-200">
                                {author?.name || "Team Member"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isOwn && !isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => startEditing(comment.id, comment.content)}
                                    title="Edit"
                                    className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    title="Delete"
                                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              <span
                                className="text-[10px] text-zinc-500"
                                title={new Date(comment.createdAt).toLocaleString()}
                              >
                                {formatRelativeDate(new Date(comment.createdAt))}
                                {comment.isEdited && " · edited"}
                              </span>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="pl-7 space-y-2">
                              <textarea
                                autoFocus
                                rows={3}
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.stopPropagation();
                                    setEditingCommentId(null);
                                  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  }
                                }}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="rounded-lg px-3 py-1 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  disabled={!editingContent.trim()}
                                  className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            comment.content && (
                              <p className="text-zinc-300 leading-relaxed pl-7 whitespace-pre-wrap break-words">
                                {renderContent(comment.content)}
                              </p>
                            )
                          )}

                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="pl-7 flex flex-wrap gap-2">
                              {comment.attachments.map((file) =>
                                INLINE_IMAGE_TYPES.includes(file.mimeType) ? (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={file.name}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={file.url}
                                      alt={file.name}
                                      className="max-h-40 max-w-full rounded-lg border border-zinc-700 object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    download={file.name}
                                    className="flex max-w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
                                  >
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="shrink-0 text-zinc-500">
                                      {formatBytes(file.size)}
                                    </span>
                                  </a>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Delegation Activity Log */}
                    {taskActivities.map((act) => {
                      const actor = users.find((u) => u.id === act.actorId);
                      return (
                        <div
                          key={act.id}
                          className="flex items-center gap-2 text-[11px] text-zinc-500 px-2"
                        >
                          <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                          <span className="text-zinc-300 font-medium">
                            {actor?.name || "Member"}:
                          </span>
                          <span className="truncate">{act.description}</span>
                          <span className="text-[10px] text-zinc-600 ml-auto">
                            {formatDate(act.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

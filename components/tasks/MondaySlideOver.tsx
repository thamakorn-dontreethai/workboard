"use client";

import React, { useState, useEffect } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { AssigneeSelect } from "@/components/common/AssigneeSelect";
import { formatDate } from "@/lib/utils/date";
import {
  X,
  Trash2,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  AtSign,
  Paperclip,
  Smile,
  PenTool,
  Info as InfoIcon,
  FileText,
  Tag,
  FolderKanban,
  Paperclip as PaperclipIcon,
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
  } = useWorkBoard();

  const task = tasks.find((t) => t.id === activeTaskId);
  const board = task ? boards.find((b) => b.id === task.boardId) : null;
  const group = task ? groups.find((g) => g.id === task.groupId) : null;

  const taskSubtasks = subtasks.filter((s) => s.taskId === activeTaskId);
  const taskComments = comments.filter((c) => c.taskId === activeTaskId);
  const taskActivities = activities.filter((a) => a.taskId === activeTaskId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

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

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUpdateContent.trim()) {
      addComment(task.id, newUpdateContent.trim()).catch((err) =>
        console.error("Failed to add comment:", err)
      );
      setNewUpdateContent("");
    }
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
              <Clock className="h-3.5 w-3.5" />
              <span>Activity Log</span>
            </button>

            <button
              type="button"
              onClick={() => setSlideOverTab("git")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                slideOverTab === "git"
                  ? "bg-zinc-800 text-white shadow-2xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <PaperclipIcon className="h-3.5 w-3.5" />
              <span>Files & Subtasks</span>
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
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

        {/* Dual Panel Body: Left (Info & Description) | Right (Item updates) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
          {/* ─── LEFT COLUMN (Cols 1-7): Info, Description, Subtasks ─── */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
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
                      currentAssigneeId={task.assigneeId}
                      onAssign={(newUid) => assignTask(task.id, newUid)}
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
            </div>
          </div>

          {/* ─── RIGHT COLUMN (Cols 8-12): Item updates ─── */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-4 bg-[#14151c]">
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
              <form
                onSubmit={handlePostUpdate}
                className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 p-3 space-y-2 shadow-xs"
              >
                <textarea
                  rows={3}
                  value={newUpdateContent}
                  onChange={(e) => setNewUpdateContent(e.target.value)}
                  placeholder="Write an update and mention others with @"
                  className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Toolbar icons (@, attachment, emoji, pen) + Submit */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() =>
                        setNewUpdateContent((prev) => prev + "@" + currentUser.name + " ")
                      }
                      title="Mention member"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <AtSign className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Attach file"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Add emoji"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Smile className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Formatting"
                      className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newUpdateContent.trim()}
                    className="rounded-lg bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 shadow-2xs"
                  >
                    Update
                  </button>
                </div>
              </form>

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
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {/* Comments list */}
                    {taskComments.map((comment) => {
                      const author = users.find((u) => u.id === comment.authorId);
                      return (
                        <div
                          key={comment.id}
                          className="rounded-xl border border-zinc-800 bg-[#16181f] p-3 space-y-2 text-xs"
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
                            <span className="text-[10px] text-zinc-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed pl-7">
                            {comment.content}
                          </p>
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
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  getTaskStatusConfig,
  getTaskPriorityConfig,
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
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  Layers,
} from "lucide-react";

export function TaskModal() {
  const {
    activeTaskId,
    closeTaskModal,
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
    updateTaskDueDate,
    updateTaskDetails,
    deleteTask,
    toggleSubtask,
    addSubtask,
    addComment,
  } = useWorkBoard();

  const task = tasks.find((t) => t.id === activeTaskId);
  const board = task ? boards.find((b) => b.id === task.boardId) : null;
  const group = task ? groups.find((g) => g.id === task.groupId) : null;
  const reporter = task ? users.find((u) => u.id === task.reporterId) : null;

  const taskSubtasks = subtasks.filter((s) => s.taskId === activeTaskId);
  const taskComments = comments.filter((c) => c.taskId === activeTaskId);
  const taskActivities = activities.filter((a) => a.taskId === activeTaskId);

  // Local state for editing title and description
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
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

  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getTaskPriorityConfig(task.priority);

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

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim()).catch((err) =>
        console.error("Failed to add subtask:", err)
      );
      setNewSubtaskTitle("");
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommentContent.trim()) {
      addComment(task.id, newCommentContent.trim()).catch((err) =>
        console.error("Failed to add comment:", err)
      );
      setNewCommentContent("");
    }
  };

  const completedSubtasks = taskSubtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = taskSubtasks.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Task Details"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        onClick={closeTaskModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-card">
          <div className="flex items-center gap-2.5 min-w-0">
            {board && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                <span className={`h-2 w-2 rounded-full ${board.color || "bg-blue-500"}`} />
                {board.name}
              </span>
            )}
            {group && (
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <span>/</span>
                <span className="font-medium text-foreground">{group.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this task?")) {
                  deleteTask(task.id);
                }
              }}
              title="Delete task"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeTaskModal}
              title="Close modal"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Title input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Task title..."
              className="w-full text-xl font-bold text-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-1 rounded transition-colors"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-border/70 bg-muted/30">
            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assignee
              </label>
              <div className="pt-0.5">
                <AssigneeSelect
                  currentAssigneeIds={task.assigneeIds}
                  onAssign={(newUids) => assignTask(task.id, newUids)}
                  boardId={task.boardId}
                  size="md"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border border-border/80 ${statusConfig.bgColor} ${statusConfig.color} hover:opacity-90 transition-opacity w-full justify-between`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                    <span>{statusConfig.label}</span>
                  </div>
                </button>

                {isStatusDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl z-30">
                    {(
                      [
                        "todo",
                        "in_progress",
                        "in_review",
                        "done",
                        "blocked",
                        "cancelled",
                      ] as TaskStatus[]
                    ).map((st) => {
                      const cfg = TASK_STATUS_CONFIG[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            updateTaskStatus(task.id, st);
                            setIsStatusDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors text-left"
                        >
                          <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
                          <span className="font-medium">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors w-full justify-between"
                >
                  <span className={`font-semibold capitalize ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                </button>

                {isPriorityDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-36 rounded-xl border border-border bg-popover p-1 shadow-xl z-30">
                    {(
                      [
                        "urgent",
                        "high",
                        "medium",
                        "low",
                        "none",
                      ] as TaskPriority[]
                    ).map((pr) => {
                      const cfg = TASK_PRIORITY_CONFIG[pr];
                      return (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => {
                            updateTaskPriority(task.id, pr);
                            setIsPriorityDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs capitalize hover:bg-accent transition-colors text-left ${cfg.color}`}
                        >
                          <span className="font-medium">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reporter / Creator */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Created By
              </label>
              <div className="flex items-center gap-2 py-1">
                {reporter ? (
                  <>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                        reporter.avatarColor || "bg-indigo-600"
                      }`}
                    >
                      {reporter.avatarInitials}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">
                      {reporter.name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">System</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add more details, acceptance criteria, or context for the assignee..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Subtasks
                </span>
                {totalSubtasks > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {completedSubtasks} / {totalSubtasks}
                  </span>
                )}
              </div>
            </div>

            {/* Subtask list */}
            {taskSubtasks.length > 0 && (
              <div className="space-y-1.5">
                {taskSubtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(st.id)}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {st.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={`flex-1 truncate ${
                        st.isCompleted
                          ? "line-through text-muted-foreground"
                          : "text-foreground font-medium"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Activity Timeline & Delegation Log */}
          <div className="space-y-3 pt-2 border-t border-border/70">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Activity & Work Delegation History</span>
            </h4>

            {taskActivities.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {taskActivities.map((act) => {
                  const actor = users.find((u) => u.id === act.actorId);
                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-2.5 text-xs text-muted-foreground"
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white mt-0.5 ${
                          actor?.avatarColor || "bg-primary"
                        }`}
                      >
                        {actor?.avatarInitials || "WB"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">
                          {actor?.name || "Team Member"}{" "}
                        </span>
                        <span className="text-foreground/90">{act.description}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-2 border-t border-border/70">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Comments & Collaboration ({taskComments.length})</span>
            </h4>

            {taskComments.length > 0 && (
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {taskComments.map((comment) => {
                  const author = users.find((u) => u.id === comment.authorId);
                  return (
                    <div
                      key={comment.id}
                      className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                          author?.avatarColor || "bg-primary"
                        }`}
                      >
                        {author?.avatarInitials || "WB"}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {author?.name || "Team Member"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Write comment */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write a comment or update for the team..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newCommentContent.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { TaskPriority, TASK_PRIORITY_CONFIG } from "@/types";
import { X, Plus, Calendar, AlertCircle } from "lucide-react";
import { AssigneeSelect } from "@/components/common/AssigneeSelect";

export function CreateTaskModal() {
  const {
    isCreateTaskOpen,
    closeCreateTaskModal,
    createTaskDefaultBoardId,
    createTaskDefaultGroupId,
    createTaskDefaultDueDate,
    boards: allBoards,
    groups,
    canDo,
    createTask,
    openTaskModal,
  } = useWorkBoard();

  // Creating items is leader-only, so only boards the person manages are choices.
  // Memoised: it's a dependency of the reset effect below, and a fresh array
  // on every render would re-run it (wiping the form) on each keystroke.
  const boards = useMemo(
    () => allBoards.filter((b) => canDo("manage", b.id)),
    [allBoards, canDo]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boardId, setBoardId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDateStr, setDueDateStr] = useState("");

  useEffect(() => {
    if (isCreateTaskOpen) {
      setTitle("");
      setDescription("");
      const initialBoardId = createTaskDefaultBoardId || boards[0]?.id || "";
      setBoardId(initialBoardId);
      const availableGroups = groups.filter((g) => g.boardId === initialBoardId);
      setGroupId(createTaskDefaultGroupId || availableGroups[0]?.id || "");
      setAssigneeIds([]);
      setPriority("medium");
      if (createTaskDefaultDueDate) {
        const d = new Date(createTaskDefaultDueDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDueDateStr(`${yyyy}-${mm}-${dd}`);
      } else {
        setDueDateStr("");
      }
    }
  }, [
    isCreateTaskOpen,
    createTaskDefaultBoardId,
    createTaskDefaultGroupId,
    createTaskDefaultDueDate,
    boards,
    groups,
  ]);

  // Update groups when board changes
  const handleBoardChange = (newBoardId: string) => {
    setBoardId(newBoardId);
    setAssigneeIds([]);
    const availableGroups = groups.filter((g) => g.boardId === newBoardId);
    setGroupId(availableGroups[0]?.id || "");
  };

  const availableGroups = groups.filter((g) => g.boardId === boardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !boardId || !groupId) return;

    try {
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim(),
        boardId,
        groupId,
        assigneeIds,
        priority,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
      });

      closeCreateTaskModal();
      openTaskModal(newTask.id);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (!isCreateTaskOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create New Item"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl text-card-foreground p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Create New Item
              </h2>
              <p className="text-xs text-muted-foreground">
                Add an item to your board workflow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCreateTaskModal}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Item Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Implement user authentication flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add key details or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
            />
          </div>

          {/* Board & Group Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Board <span className="text-destructive">*</span>
              </label>
              <select
                value={boardId}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Group / Section <span className="text-destructive">*</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Assign Work To
              </label>
              <div className="pt-0.5">
                <AssigneeSelect
                  currentAssigneeIds={assigneeIds}
                  onAssign={(uids) => setAssigneeIds(uids)}
                  boardId={boardId}
                  size="md"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground capitalize focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {(
                  [
                    "urgent",
                    "high",
                    "medium",
                    "low",
                    "none",
                  ] as TaskPriority[]
                ).map((pr) => (
                  <option key={pr} value={pr} className="capitalize">
                    {TASK_PRIORITY_CONFIG[pr].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Due Date
            </label>
            <input
              type="date"
              value={dueDateStr}
              onChange={(e) => setDueDateStr(e.target.value)}
              // Open the calendar on a click anywhere in the field, not just
              // on the tiny browser icon.
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch {
                  // Unsupported / not allowed here — the native icon still works.
                }
              }}
              className="w-full cursor-pointer rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={closeCreateTaskModal}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !boardId || !groupId}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

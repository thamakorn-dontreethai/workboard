"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Task,
  Group,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskStatus,
  TaskPriority,
  GROUP_COLOR_PALETTE,
} from "@/types";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { AssigneeSelect } from "@/components/common/AssigneeSelect";
import { GroupSummaryBar } from "@/components/board/GroupSummaryBar";
import { StatusDropdown } from "@/components/board/StatusDropdown";
import { DatePicker } from "@/components/board/DatePicker";
import { FloatingPanel } from "@/components/board/FloatingPanel";
import { formatDate } from "@/lib/utils/date";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
  Check,
  Pencil,
  MoreHorizontal,
  ArrowRightLeft,
} from "lucide-react";

interface MondayTableProps {
  boardId: string;
}

export function MondayTable({ boardId }: MondayTableProps) {
  const {
    groups,
    tasks,
    currentUser,
    assignTask,
    updateTaskStatus,
    updateTaskPriority,
    updateTaskField,
    createTask,
    lastCreatedTaskId,
    clearLastCreatedTaskId,
    deleteTask,
    moveTaskToGroup,
    deleteGroup,
    toggleGroupCollapse,
    addGroup,
    updateGroup,
    reorderGroups,
    openTaskModal,
    comments,
  } = useWorkBoard();

  const boardGroups = groups
    .filter((g) => g.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  const [newRowTitles, setNewRowTitles] = useState<Record<string, string>>({});
  const [activeStatusPopoverTaskId, setActiveStatusPopoverTaskId] = useState<
    string | null
  >(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [colorPickerGroupId, setColorPickerGroupId] = useState<string | null>(null);
  const colorButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Clicking a task's title renames it inline (same pattern as group
  // rename), instead of opening the details modal — the comment-bubble
  // icon next to the title still opens the modal for anyone who needs it.
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitleInput, setTaskTitleInput] = useState("");
  const [rowMenuTaskId, setRowMenuTaskId] = useState<string | null>(null);
  const rowMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [groupMenuId, setGroupMenuId] = useState<string | null>(null);
  const groupMenuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // The row "⋯" menu/drag-handle floats outside the table (in the page
  // gutter, level with whichever row is hovered) instead of living inside
  // a table column — a portal + getBoundingClientRect positioning, same
  // trick FloatingPanel uses to escape the table's horizontal-scroll clip.
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [rowHandlePos, setRowHandlePos] = useState<{ top: number; left: number } | null>(null);
  const hoverHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  const showRowHandle = (taskId: string) => {
    if (hoverHideTimeoutRef.current) {
      clearTimeout(hoverHideTimeoutRef.current);
      hoverHideTimeoutRef.current = null;
    }
    setHoveredTaskId(taskId);
  };
  // A short grace period before hiding — without it, moving the mouse from
  // the row onto the (portaled, so DOM-detached) handle button would fire
  // the row's mouseleave first and yank the button away before the click
  // registers.
  const scheduleHideRowHandle = () => {
    if (hoverHideTimeoutRef.current) clearTimeout(hoverHideTimeoutRef.current);
    hoverHideTimeoutRef.current = setTimeout(() => setHoveredTaskId(null), 200);
  };

  // Group reordering — press-and-hold the group header (or its "⋯" handle)
  // and drag up/down past a sibling group to reorder.
  const groupBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [groupDropTarget, setGroupDropTarget] = useState<{
    groupId: string;
    position: "before" | "after";
  } | null>(null);
  // Mirrors groupDropTarget for the pointerup handler below: that handler
  // is a closure created once at pointerdown and never re-created as state
  // changes mid-drag, so reading React state there would only ever see the
  // value from the moment the drag started. A ref updated in lockstep with
  // the state gives the handler the current value instead.
  const groupDropTargetRef = useRef<typeof groupDropTarget>(null);

  const handleAddRow = (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newRowTitles[groupId];
    if (!title || !title.trim()) return;

    createTask({
      title: title.trim(),
      boardId,
      groupId,
      status: "todo",
      priority: "medium",
    }).catch((err) => console.error("Failed to create item:", err));

    setNewRowTitles((prev) => ({ ...prev, [groupId]: "" }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    // Let addGroup pick a color that isn't already used on this board.
    addGroup(boardId, newGroupName.trim()).catch((err) =>
      console.error("Failed to create group:", err)
    );
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const startEditingGroupName = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupNameInput(group.name);
  };

  const saveGroupName = (group: Group) => {
    if (groupNameInput.trim() && groupNameInput.trim() !== group.name) {
      updateGroup(group.id, { name: groupNameInput.trim() });
    }
    setEditingGroupId(null);
  };

  // A freshly created item (via the "New item" quick-add) is highlighted
  // and drops straight into an inline, focused title field so the user can
  // immediately type the real name — instead of a silent blank row nobody
  // notices, matching monday.com's behavior. Reuses the same inline-rename
  // mechanism as clicking any task's title.
  useEffect(() => {
    if (!lastCreatedTaskId) return;
    const created = tasks.find((t) => t.id === lastCreatedTaskId);
    if (created) {
      setEditingTaskId(created.id);
      setTaskTitleInput(created.title);
    }
    // Deliberately only re-sync when the highlighted task changes, not on
    // every `tasks` update — otherwise editing another cell on this same
    // row (assignee, status, ...) would reset whatever the user had typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCreatedTaskId]);

  const startEditingTaskTitle = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitleInput(task.title);
  };

  const saveTaskTitle = (task: Task) => {
    const trimmed = taskTitleInput.trim();
    if (trimmed && trimmed !== task.title) {
      updateTaskField(task.id, "title", trimmed);
    }
    setEditingTaskId(null);
    if (task.id === lastCreatedTaskId) clearLastCreatedTaskId();
  };

  const cancelEditingTaskTitle = (task: Task) => {
    setEditingTaskId(null);
    if (task.id === lastCreatedTaskId) clearLastCreatedTaskId();
  };

  // Drag-and-drop to move a task between groups, implemented by hand with
  // Pointer Events instead of native HTML5 drag-and-drop. Native DnD kept
  // getting the interaction stuck (broken ghost image from a hidden
  // handle, dragleave firing on every child crossed inside the drop zone,
  // and the drag session losing sync with React's own re-renders). Doing
  // it ourselves means we own start/move/end and nothing can desync.
  //
  // Press-and-hold ANYWHERE on the row (except an interactive control —
  // checkbox, status pill, date, the "⋯" menu, etc., which need their own
  // click to keep working) and drag past a small threshold to start moving
  // it; drop it on another group's box to move it there.
  const DRAG_THRESHOLD_PX = 5;

  const handleRowPointerDown = (
    e: React.PointerEvent<HTMLElement>,
    task: Task
  ) => {
    if (e.button !== 0) return; // left click / primary touch only
    const target = e.target as HTMLElement;
    // The row's "⋯" button is deliberately exempted from the exclusion
    // list below — it's dual-purpose: a plain click opens its menu (we
    // never call preventDefault, so the native click still fires), while
    // pressing and dragging it moves the task, same as dragging anywhere
    // else on the row.
    if (
      !target.closest("[data-row-drag-handle]") &&
      target.closest("button, input, select, textarea, a")
    ) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStarted) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        dragStarted = true;
        setDraggingTaskId(task.id);
      }
      const hoveredEl = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const groupEl = hoveredEl?.closest<HTMLElement>("[data-drop-group-id]");
      setDragOverGroupId(groupEl?.dataset.dropGroupId ?? null);
    };

    // pointerup/pointercancel are the only events that reliably signal the
    // gesture is over, no matter where the pointer ends up — this is what
    // guarantees state always gets cleaned up instead of getting stuck.
    const endDrag = (upEvent: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);

      if (dragStarted) {
        const droppedEl = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const groupEl = droppedEl?.closest<HTMLElement>("[data-drop-group-id]");
        const targetGroupId = groupEl?.dataset.dropGroupId;
        if (targetGroupId) moveTaskToGroup(task.id, targetGroupId);
      }
      setDraggingTaskId(null);
      setDragOverGroupId(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
  };

  useEffect(() => setPortalMounted(true), []);

  // Keep the floating row handle glued to whichever row is hovered,
  // recomputing on scroll/resize like FloatingPanel does. Once its menu is
  // open, stay anchored to that row even if the mouse has moved off it —
  // otherwise moving toward the (portaled, DOM-detached) menu to click an
  // item would hide the row handle and unmount the menu out from under it.
  useLayoutEffect(() => {
    const activeId = rowMenuTaskId || hoveredTaskId;
    if (!activeId) {
      setRowHandlePos(null);
      return;
    }
    const update = () => {
      const rowEl = rowRefs.current[activeId];
      if (!rowEl) return;
      const rect = rowEl.getBoundingClientRect();
      setRowHandlePos({
        top: rect.top + rect.height / 2 - 12,
        left: rect.left - 26,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [hoveredTaskId, rowMenuTaskId]);

  // Reorder groups — press-and-hold the header (or its "⋯" handle, tagged
  // data-group-drag-handle) and drag it above/below a sibling group.
  const GROUP_DRAG_THRESHOLD_PX = 5;

  const handleGroupHeaderPointerDown = (
    e: React.PointerEvent<HTMLElement>,
    group: Group
  ) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      !target.closest("[data-group-drag-handle]") &&
      target.closest("button, input, select, textarea, a")
    ) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStarted) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.hypot(dx, dy) < GROUP_DRAG_THRESHOLD_PX) return;
        dragStarted = true;
        setDraggingGroupId(group.id);
      }

      const hoveredEl = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const blockEl = hoveredEl?.closest<HTMLElement>("[data-group-block-id]");
      const targetGroupId = blockEl?.dataset.groupBlockId;
      if (!targetGroupId || targetGroupId === group.id) {
        groupDropTargetRef.current = null;
        setGroupDropTarget(null);
        return;
      }
      const rect = blockEl!.getBoundingClientRect();
      const position = moveEvent.clientY < rect.top + rect.height / 2 ? "before" : "after";
      const next = { groupId: targetGroupId, position } as const;
      groupDropTargetRef.current = next;
      setGroupDropTarget(next);
    };

    // Snapshot the sibling order now — it doesn't change mid-gesture, so
    // there's no staleness risk the way there is with groupDropTarget.
    const siblingGroups = boardGroups;

    const endDrag = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);

      if (dragStarted && groupDropTargetRef.current) {
        const { groupId: targetId, position } = groupDropTargetRef.current;
        const others = siblingGroups.filter((g) => g.id !== group.id);
        const targetIndex = others.findIndex((g) => g.id === targetId);
        const insertAt = position === "before" ? targetIndex : targetIndex + 1;
        const reordered = [
          ...others.slice(0, insertAt),
          group,
          ...others.slice(insertAt),
        ];
        reorderGroups(boardId, reordered.map((g) => g.id));
      }
      groupDropTargetRef.current = null;
      setDraggingGroupId(null);
      setGroupDropTarget(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
  };

  const toggleSelectAll = (groupTasks: Task[]) => {
    const groupTaskIds = groupTasks.map((t) => t.id);
    const allSelected = groupTaskIds.every((id) =>
      selectedTaskIds.includes(id)
    );
    if (allSelected) {
      setSelectedTaskIds((prev) =>
        prev.filter((id) => !groupTaskIds.includes(id))
      );
    } else {
      setSelectedTaskIds((prev) => [
        ...prev,
        ...groupTaskIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const statusList: TaskStatus[] = [
    "in_progress",
    "done",
    "blocked",
    "todo",
    "in_review",
    "on_hold",
    "new_request",
    "approved",
  ];

  return (
    <div className="space-y-8 pb-16 select-none font-sans">
      {boardGroups.map((group) => {
        const groupTasks = tasks
          .filter((t) => t.groupId === group.id && !t.isArchived)
          .sort((a, b) => a.order - b.order);

        const isDropBefore =
          groupDropTarget?.groupId === group.id && groupDropTarget.position === "before";
        const isDropAfter =
          groupDropTarget?.groupId === group.id && groupDropTarget.position === "after";

        return (
          <div
            key={group.id}
            ref={(el) => {
              groupBlockRefs.current[group.id] = el;
            }}
            data-group-block-id={group.id}
            className={`space-y-1 transition-opacity ${
              draggingGroupId === group.id ? "opacity-40" : ""
            }`}
          >
            {/* Insertion-point indicator while dragging another group over
                this one — shown above or below depending on which half of
                this group's block the pointer is currently over. */}
            {isDropBefore && (
              <div className="h-0.5 rounded-full bg-[#0073ea] -mt-2 mb-1.5" />
            )}
            {group.isCollapsed ? (
              /* Collapsed group — a single bordered row mimicking the
                 table's column layout, with the status-summary bar sitting
                 where the "Status" column would be. */
              <div
                onPointerDown={(e) => handleGroupHeaderPointerDown(e, group)}
                className="flex items-stretch rounded-xl border border-zinc-800/90 bg-[#1c1c1f] shadow-sm overflow-hidden cursor-pointer"
              >
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: group.color || "#0073ea" }}
                />
                <button
                  ref={(el) => {
                    groupMenuButtonRefs.current[group.id] = el;
                  }}
                  data-group-drag-handle
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupMenuId(groupMenuId === group.id ? null : group.id);
                  }}
                  title="Click for group options, or press and drag to reorder"
                  className="flex items-center justify-center h-6 w-6 my-auto ml-2 shrink-0 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                <FloatingPanel
                  isOpen={groupMenuId === group.id}
                  onClose={() => setGroupMenuId(null)}
                  anchorRef={{ current: groupMenuButtonRefs.current[group.id] }}
                  align="left"
                  className="w-48 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-left"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMenuId(null);
                      createTask({
                        title: "New item",
                        boardId,
                        groupId: group.id,
                        status: "todo",
                        priority: "medium",
                      }).catch((err) => console.error("Failed to create item:", err));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add item</span>
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMenuId(null);
                      if (confirm(`Delete group "${group.name}"?`)) {
                        deleteGroup(group.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Delete group</span>
                  </button>
                </FloatingPanel>

                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors flex-1 min-w-0 text-left"
                  title="Expand group"
                >
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: group.color || "#0073ea" }}
                  />
                  <div className="min-w-0">
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: group.color || "#0073ea" }}
                    >
                      {group.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {groupTasks.length} {groupTasks.length === 1 ? "Item" : "Items"}
                    </div>
                  </div>
                </button>
                <div className="w-32 shrink-0 hidden sm:block" />
                <div className="w-40 shrink-0 flex items-center justify-center px-2">
                  <GroupSummaryBar tasks={groupTasks} height="h-3.5" />
                </div>
                <div className="w-36 shrink-0 hidden sm:block" />
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete group "${group.name}"?`)) {
                        deleteGroup(group.id);
                      }
                    }}
                    title="Delete group"
                    className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Group Header Title (e.g. ⌵ Group Title) */}
            <div
              onPointerDown={(e) => handleGroupHeaderPointerDown(e, group)}
              className="flex items-center justify-between gap-3 px-1 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Group options menu — sits in front of the collapse arrow,
                    not tucked into a per-row hover state. */}
                <button
                  ref={(el) => {
                    groupMenuButtonRefs.current[group.id] = el;
                  }}
                  data-group-drag-handle
                  type="button"
                  onClick={() =>
                    setGroupMenuId(groupMenuId === group.id ? null : group.id)
                  }
                  title="Click for group options, or press and drag to reorder"
                  className="flex items-center justify-center h-6 w-6 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                <FloatingPanel
                  isOpen={groupMenuId === group.id}
                  onClose={() => setGroupMenuId(null)}
                  anchorRef={{ current: groupMenuButtonRefs.current[group.id] }}
                  align="left"
                  className="w-48 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-left"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMenuId(null);
                      createTask({
                        title: "New item",
                        boardId,
                        groupId: group.id,
                        status: "todo",
                        priority: "medium",
                      }).catch((err) => console.error("Failed to create item:", err));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add item</span>
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMenuId(null);
                      if (confirm(`Delete group "${group.name}"?`)) {
                        deleteGroup(group.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Delete group</span>
                  </button>
                </FloatingPanel>

                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="p-0.5 rounded transition-opacity hover:opacity-80 shrink-0"
                  style={{ color: group.color || "#0073ea" }}
                  title={group.isCollapsed ? "Expand group" : "Collapse group"}
                >
                  {group.isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Group name — click to rename. The color swatch only
                    appears while editing, so the header stays uncluttered
                    the rest of the time. */}
                {editingGroupId === group.id ? (
                  <>
                    {/* Color swatch — opens the color picker. onMouseDown
                        preventDefault so clicking it doesn't blur the name
                        input first (which would exit edit mode and unmount
                        this button before the click registers). */}
                    <button
                      ref={(el) => {
                        colorButtonRefs.current[group.id] = el;
                      }}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        setColorPickerGroupId(
                          colorPickerGroupId === group.id ? null : group.id
                        )
                      }
                      title="Change group color"
                      className="flex items-center justify-center h-6 w-6 rounded-full shrink-0 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-1 ring-white/30"
                        style={{ backgroundColor: group.color || "#0073ea" }}
                      />
                    </button>

                    <FloatingPanel
                      isOpen={colorPickerGroupId === group.id}
                      onClose={() => setColorPickerGroupId(null)}
                      anchorRef={{ current: colorButtonRefs.current[group.id] }}
                      align="left"
                      className="w-48 rounded-xl border border-zinc-700 bg-[#1c1e28] p-2 shadow-2xl"
                    >
                      <div
                        className="grid grid-cols-5 gap-1.5 p-1"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {GROUP_COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              updateGroup(group.id, { color: c });
                              setColorPickerGroupId(null);
                            }}
                            title={c}
                            className="h-6 w-6 rounded-full flex items-center justify-center ring-1 ring-white/10 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                          >
                            {group.color === c && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </FloatingPanel>

                    <input
                      type="text"
                      autoFocus
                      value={groupNameInput}
                      onChange={(e) => setGroupNameInput(e.target.value)}
                      onBlur={() => {
                        // Don't exit edit mode while the color picker is
                        // open — the blur came from clicking the swatch.
                        if (colorPickerGroupId !== group.id) saveGroupName(group);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveGroupName(group);
                        if (e.key === "Escape") setEditingGroupId(null);
                      }}
                      className="text-sm font-semibold bg-zinc-900 border rounded px-1.5 py-0.5 min-w-0 focus:outline-none"
                      style={{ color: group.color || "#0073ea", borderColor: group.color || "#0073ea" }}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingGroupName(group)}
                    title="Click to rename"
                    className="group/rename flex items-center gap-1.5 min-w-0 cursor-pointer"
                  >
                    <span
                      className="text-sm font-semibold truncate group-hover/rename:opacity-80 transition-opacity"
                      style={{ color: group.color || "#0073ea" }}
                    >
                      {group.name}
                    </span>
                    <Pencil className="h-3 w-3 text-zinc-500 opacity-0 group-hover/rename:opacity-100 transition-opacity shrink-0" />
                  </button>
                )}

                <span className="text-[11px] text-zinc-500 font-normal shrink-0">
                  {groupTasks.length} {groupTasks.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"?`)) {
                      deleteGroup(group.id);
                    }
                  }}
                  title="Delete group"
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Table Container — also the drop target for dragging a task
                into this group (see handleRowPointerDown: hit-tested via
                this data attribute, not native HTML5 drag events). */}
              <div
                data-drop-group-id={group.id}
                className={`ml-7 rounded-xl border shadow-sm overflow-x-auto transition-colors ${
                  dragOverGroupId === group.id
                    ? "border-[#0073ea] bg-[#0073ea]/5"
                    : "border-zinc-800/90 bg-[#1c1c1f]"
                }`}
              >
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  {/* Table Column Headers */}
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#202023] text-zinc-400 font-normal text-[11px]">
                      {/* Left border indicator column */}
                      <th
                        className="w-1.5 p-0"
                        style={{ backgroundColor: group.color || "#0073ea" }}
                      />
                      <th className="w-9 px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={
                            groupTasks.length > 0 &&
                            groupTasks.every((t) =>
                              selectedTaskIds.includes(t.id)
                            )
                          }
                          onChange={() => toggleSelectAll(groupTasks)}
                          className="rounded border-zinc-700 bg-zinc-900 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2 text-zinc-300 font-medium min-w-[260px] border-l border-zinc-800">
                        Item
                      </th>
                      <th className="px-3 py-2 w-32 text-center text-zinc-300 font-medium border-l border-zinc-800">
                        Person
                      </th>
                      <th className="px-3 py-2 w-40 text-center text-zinc-300 font-medium border-l border-zinc-800">
                        Status
                      </th>
                      <th className="px-3 py-2 w-36 text-center text-zinc-300 font-medium border-l border-zinc-800">
                        Date
                      </th>
                      <th className="w-10 px-2 py-2 text-center text-zinc-500 border-l border-zinc-800">
                        <Plus className="h-3.5 w-3.5 mx-auto" />
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body Rows */}
                  <tbody className="divide-y divide-zinc-800/60">
                    {groupTasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      const statusCfg = TASK_STATUS_CONFIG[task.status] || {
                        label: task.status,
                        bgColor: "bg-[#575a6b]",
                        color: "text-zinc-200",
                      };

                      const taskComments = comments.filter(
                        (c) => c.taskId === task.id
                      );

                      const isNewlyCreated = task.id === lastCreatedTaskId;

                      return (
                        <tr
                          key={task.id}
                          ref={(el) => {
                            rowRefs.current[task.id] = el;
                          }}
                          onPointerDown={(e) => handleRowPointerDown(e, task)}
                          onMouseEnter={() => showRowHandle(task.id)}
                          onMouseLeave={scheduleHideRowHandle}
                          className={`group transition-colors cursor-pointer ${
                            draggingTaskId === task.id
                              ? "opacity-40"
                              : isNewlyCreated
                              ? "bg-[#363b58]"
                              : isSelected
                              ? "bg-[#2d3144]"
                              : "hover:bg-[#202230]"
                          }`}
                        >
                          {/* Left colored border */}
                          <td
                            className="w-1.5 p-0"
                            style={{ backgroundColor: group.color || "#0073ea" }}
                          />

                          {/* Checkbox */}
                          <td className="px-2.5 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTask(task.id)}
                              className="rounded border-zinc-700 bg-zinc-900 cursor-pointer"
                            />
                          </td>

                          {/* Item Title + Comment Bubble */}
                          <td className="px-3 py-2 border-l border-zinc-800/60">
                            <div className="flex items-center justify-between gap-2">
                              {editingTaskId === task.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={taskTitleInput}
                                  onChange={(e) => setTaskTitleInput(e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onBlur={() => saveTaskTitle(task)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTaskTitle(task);
                                    if (e.key === "Escape") cancelEditingTaskTitle(task);
                                  }}
                                  className="flex-1 min-w-0 rounded border border-zinc-600 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-[#0073ea]"
                                />
                              ) : (
                                <span
                                  onClick={() => startEditingTaskTitle(task)}
                                  title="Click to rename"
                                  className="font-normal text-zinc-100 hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1 flex-1 text-xs"
                                >
                                  {task.title}
                                </span>
                              )}

                              {/* Comment bubble icon */}
                              <button
                                type="button"
                                onClick={() => openTaskModal(task.id, "activity")}
                                title="Open updates"
                                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>
                                  {taskComments.length > 0 ? taskComments.length : "+"}
                                </span>
                              </button>
                            </div>
                          </td>

                          {/* Person / Owner Avatar */}
                          <td className="px-3 py-1.5 text-center border-l border-zinc-800/60">
                            <div className="flex justify-center">
                              <AssigneeSelect
                                currentAssigneeId={task.assigneeId}
                                onAssign={(newUid) => assignTask(task.id, newUid)}
                                boardId={boardId}
                                size="sm"
                                showLabel={false}
                              />
                            </div>
                          </td>

                          {/* Status Block */}
                          <td className="px-2 py-1 text-center border-l border-zinc-800/60">
                            <StatusDropdown
                              currentStatus={task.status}
                              onStatusChange={(newStatus) =>
                                updateTaskStatus(task.id, newStatus)
                              }
                            />
                          </td>

                          {/* Date */}
                          <td className="px-3 py-1.5 border-l border-zinc-800/60">
                            <DatePicker
                              currentDate={task.dueDate}
                              onDateChange={(newDate) =>
                                updateTaskField(task.id, "dueDate", newDate)
                              }
                            />
                          </td>

                          {/* Add button placeholder */}
                          <td className="border-l border-zinc-800/60" />
                        </tr>
                      );
                    })}

                    {/* Inline "+ Add item" Row */}
                    <tr className="bg-transparent hover:bg-zinc-800/30 transition-colors">
                      <td
                        className="w-1.5 p-0"
                        style={{ backgroundColor: group.color || "#0073ea" }}
                      />
                      <td className="px-2.5 py-2 text-center text-zinc-500">
                        <Plus className="h-3.5 w-3.5 mx-auto" />
                      </td>
                      <td colSpan={5} className="px-3 py-1.5 border-l border-zinc-800/60">
                        <form
                          onSubmit={(e) => handleAddRow(group.id, e)}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={newRowTitles[group.id] || ""}
                            onChange={(e) =>
                              setNewRowTitles({
                                ...newRowTitles,
                                [group.id]: e.target.value,
                              })
                            }
                            placeholder="+ Add item"
                            className="w-full bg-transparent px-1 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                          />
                          {newRowTitles[group.id]?.trim() && (
                            <button
                              type="submit"
                              className="rounded-md bg-[#0073ea] px-3 py-1 text-[11px] font-semibold text-white shrink-0 hover:bg-[#0060c0]"
                            >
                              Add
                            </button>
                          )}
                        </form>
                      </td>
                    </tr>
                  </tbody>

                  {/* Group Summary Footer Row with Segmented Bar */}
                  <tfoot>
                    <tr className="border-t border-zinc-800/80 bg-[#1c1c1f]">
                      <td
                        className="w-1.5 p-0"
                        style={{ backgroundColor: group.color || "#0073ea" }}
                      />
                      <td />
                      <td />
                      {/* Segmented Status Distribution Bar */}
                      <td className="px-2 py-2 text-center">
                        <GroupSummaryBar tasks={groupTasks} height="h-3.5" />
                      </td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              </>
            )}
            {isDropAfter && (
              <div className="h-0.5 rounded-full bg-[#0073ea] mt-1.5 -mb-2" />
            )}
          </div>
        );
      })}

      {/* "+ add new group" Button at bottom */}
      <div className="pt-2">
        {isAddingGroup ? (
          <form
            onSubmit={handleCreateGroup}
            className="flex items-center gap-2 max-w-sm rounded-xl border border-zinc-700 bg-[#1e202c] p-2 shadow-sm"
          >
            <input
              type="text"
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newGroupName.trim()}
              className="rounded-lg bg-[#0073ea] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0060c0] disabled:opacity-50"
            >
              Add Group
            </button>
            <button
              type="button"
              onClick={() => setIsAddingGroup(false)}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingGroup(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700/80 px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ add new group</span>
          </button>
        )}
      </div>

      {/* Floating row "⋯" handle — portaled to document.body and fixed-
          positioned off the left edge of whichever row is active (hovered,
          or with its menu open), instead of living inside the table where
          the horizontal-scroll wrapper would clip it. */}
      {portalMounted &&
        rowHandlePos &&
        (() => {
          const activeRowId = rowMenuTaskId || hoveredTaskId;
          const activeTask = tasks.find((t) => t.id === activeRowId);
          if (!activeTask) return null;

          return createPortal(
            <div
              style={{ position: "fixed", top: rowHandlePos.top, left: rowHandlePos.left }}
              onMouseEnter={() => showRowHandle(activeTask.id)}
              onMouseLeave={scheduleHideRowHandle}
              className="z-40"
            >
              <button
                ref={(el) => {
                  rowMenuButtonRefs.current[activeTask.id] = el;
                }}
                data-row-drag-handle
                type="button"
                onPointerDown={(e) => handleRowPointerDown(e, activeTask)}
                onClick={() =>
                  setRowMenuTaskId(
                    rowMenuTaskId === activeTask.id ? null : activeTask.id
                  )
                }
                title="Click for menu, or press and drag to move"
                className="flex items-center justify-center h-6 w-6 rounded bg-[#1c1e28] text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-md transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              <FloatingPanel
                isOpen={rowMenuTaskId === activeTask.id}
                onClose={() => setRowMenuTaskId(null)}
                anchorRef={{ current: rowMenuButtonRefs.current[activeTask.id] }}
                align="left"
                className="w-52 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl text-left"
              >
                <button
                  type="button"
                  onClick={() => {
                    setRowMenuTaskId(null);
                    if (confirm(`Delete "${activeTask.title}"?`)) {
                      deleteTask(activeTask.id);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Delete task</span>
                </button>

                {boardGroups.length > 1 && (
                  <>
                    <div className="my-1 border-t border-zinc-800" />
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>Move to</span>
                    </div>
                    {boardGroups
                      .filter((g) => g.id !== activeTask.groupId)
                      .map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setRowMenuTaskId(null);
                            moveTaskToGroup(activeTask.id, g.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: g.color || "#0073ea" }}
                          />
                          <span className="truncate">{g.name}</span>
                        </button>
                      ))}
                  </>
                )}
              </FloatingPanel>
            </div>,
            document.body
          );
        })()}
    </div>
  );
}

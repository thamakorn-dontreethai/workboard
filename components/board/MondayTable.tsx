"use client";

import React, { useState } from "react";
import {
  Task,
  Group,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import { AssigneeSelect } from "@/components/common/AssigneeSelect";
import { GroupSummaryBar } from "@/components/board/GroupSummaryBar";
import { formatDate } from "@/lib/utils/date";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
  Calendar,
  User as UserIcon,
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
    deleteGroup,
    toggleGroupCollapse,
    addGroup,
    openTaskModal,
    comments,
  } = useWorkBoard();

  const boardGroups = groups.filter((g) => g.boardId === boardId);
  const [newRowTitles, setNewRowTitles] = useState<Record<string, string>>({});
  const [activeStatusPopoverTaskId, setActiveStatusPopoverTaskId] = useState<
    string | null
  >(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

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
    });

    setNewRowTitles((prev) => ({ ...prev, [groupId]: "" }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const colors = [
      "#0073ea", // Blue
      "#a25ddc", // Purple
      "#00c875", // Green
      "#fdab3d", // Orange
      "#e2445c", // Red
      "#579bfc", // Sky
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    addGroup(boardId, newGroupName.trim(), randomColor);
    setNewGroupName("");
    setIsAddingGroup(false);
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

        return (
          <div key={group.id} className="space-y-1">
            {/* Group Header Title (e.g. ⌵ Group Title) */}
            <div className="flex items-center justify-between gap-3 px-1 py-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ color: group.color || "#0073ea" }}
                >
                  {group.isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>{group.name}</span>
                </button>
                <span className="text-[11px] text-zinc-500 font-normal">
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

            {/* Table Container */}
            {!group.isCollapsed && (
              <div className="rounded-xl border border-zinc-800/90 bg-[#161720] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  {/* Table Column Headers */}
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#1a1c26] text-zinc-400 font-normal text-[11px]">
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
                      <th className="px-3 py-2 text-zinc-300 font-medium min-w-[260px]">
                        Item
                      </th>
                      <th className="px-3 py-2 w-32 text-center text-zinc-300 font-medium">
                        Person
                      </th>
                      <th className="px-3 py-2 w-40 text-center text-zinc-300 font-medium">
                        Status
                      </th>
                      <th className="px-3 py-2 w-36 text-center text-zinc-300 font-medium">
                        Date
                      </th>
                      <th className="w-10 px-2 py-2 text-center text-zinc-500">
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

                      return (
                        <tr
                          key={task.id}
                          className={`group transition-colors ${
                            isSelected
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
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                onClick={() => openTaskModal(task.id, "details")}
                                className="font-normal text-zinc-100 hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1 flex-1 text-xs"
                              >
                                {task.title}
                              </span>

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
                          <td className="px-3 py-1.5 text-center">
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
                          <td className="px-2 py-1 text-center relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveStatusPopoverTaskId(
                                  activeStatusPopoverTaskId === task.id
                                    ? null
                                    : task.id
                                )
                              }
                              className={`w-full py-1.5 px-2 rounded font-medium text-xs transition-all shadow-xs text-center ${statusCfg.bgColor} ${statusCfg.color}`}
                            >
                              {statusCfg.label || "—"}
                            </button>

                            {/* Status Popover */}
                            {activeStatusPopoverTaskId === task.id && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 w-44 rounded-xl border border-zinc-700 bg-[#1c1e28] p-1.5 shadow-2xl animate-in fade-in zoom-in-95">
                                {statusList.map((st) => {
                                  const cfg = TASK_STATUS_CONFIG[st];
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => {
                                        updateTaskStatus(task.id, st);
                                        setActiveStatusPopoverTaskId(null);
                                      }}
                                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold mb-0.5 text-center transition-all ${cfg.bgColor} ${cfg.color}`}
                                    >
                                      {cfg.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2 text-center">
                            <span className="text-zinc-400 font-normal text-xs">
                              {task.dueDate
                                ? formatDate(task.dueDate)
                                : "—"}
                            </span>
                          </td>

                          {/* Add button placeholder */}
                          <td />
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
                      <td colSpan={5} className="px-3 py-1.5">
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
                    <tr className="border-t border-zinc-800/80 bg-[#161720]">
                      <td
                        className="w-1.5 p-0"
                        style={{ backgroundColor: group.color || "#0073ea" }}
                      />
                      <td />
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
    </div>
  );
}

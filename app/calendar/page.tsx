"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkBoard } from "@/lib/context/WorkBoardContext";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  Task,
  TaskStatus,
  TaskPriority,
  PersonalTodo,
} from "@/types";
import { formatDate, isOverdue } from "@/lib/utils/date";
import { getThaiHolidayForDate, ThaiHoliday } from "@/lib/utils/thaiHolidays";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Briefcase,
  LayoutGrid,
  List,
  CalendarDays,
  ChevronDown,
  X,
  Flame,
  CalendarCheck2,
  Building2,
  StickyNote,
  Bell,
  Trash2,
} from "lucide-react";

type ViewMode = "month" | "agenda";

/** Safe date parser handling Date instances, ISO strings, timestamps */
function parseSafeDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/** Format a Date to local YYYY-MM-DD string */
function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Safe status configuration lookup with fallback */
function getStatusCfg(status: TaskStatus | string) {
  const norm = status === "stuck" ? "blocked" : status;
  if (norm && (TASK_STATUS_CONFIG as any)[norm]) {
    return (TASK_STATUS_CONFIG as any)[norm];
  }
  return {
    label: String(status || "To Do"),
    color: "text-zinc-200",
    bgColor: "bg-[#575a6b] hover:bg-[#666a7d]",
    dotColor: "bg-zinc-400",
    barColor: "#575a6b",
  };
}

/** Safe priority configuration lookup with fallback */
function getPriorityCfg(priority: TaskPriority | string) {
  if (priority && (TASK_PRIORITY_CONFIG as any)[priority]) {
    return (TASK_PRIORITY_CONFIG as any)[priority];
  }
  return {
    label: String(priority || "Medium"),
    color: "text-blue-500",
    bgColor: "bg-blue-600 hover:bg-blue-500",
    iconColor: "text-blue-500",
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const {
    tasks,
    boards,
    users,
    workspaces,
    personalTodos,
    createPersonalTodo,
    toggleTodoComplete,
    deletePersonalTodo,
    updateTaskStatus,
    updateTaskDueDate,
    openTaskModal,
    openCreateTaskModal,
  } = useWorkBoard();

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Quick "Add personal to-do" inline form (side panel)
  const [isAddingTodo, setIsAddingTodo] = useState<boolean>(false);
  const [newTodoTitle, setNewTodoTitle] = useState<string>("");
  const [newTodoTime, setNewTodoTime] = useState<string>("09:00");
  const [newTodoReminderMinutes, setNewTodoReminderMinutes] = useState<number>(10);

  // Filters (Defaults to "all" so all tasks in the workspace are visible by default)
  const [workspaceFilter, setWorkspaceFilter] = useState<string>("all"); // "all" | workspaceId
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSidePanel, setShowSidePanel] = useState<boolean>(true);
  const [showUnscheduled, setShowUnscheduled] = useState<boolean>(false);
  const [showThaiHolidays, setShowThaiHolidays] = useState<boolean>(true);

  // Month & Year calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Active unarchived tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => !t.isArchived);
  }, [tasks]);

  // Filter tasks based on selected settings
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      // Workspace filter
      if (workspaceFilter !== "all") {
        const taskBoard = boards.find((b) => b.id === task.boardId);
        if (!taskBoard || taskBoard.workspaceId !== workspaceFilter) return false;
      }

      // Board filter
      if (boardFilter !== "all" && task.boardId !== boardFilter) return false;

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesItemCode = task.itemCode?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesItemCode) return false;
      }

      return true;
    });
  }, [
    activeTasks,
    workspaceFilter,
    boards,
    boardFilter,
    statusFilter,
    priorityFilter,
    searchQuery,
  ]);

  // Tasks with and without due dates
  const scheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => Boolean(t.dueDate));
  }, [filteredTasks]);

  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.dueDate);
  }, [filteredTasks]);

  // Map tasks to dates (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    filteredTasks.forEach((task) => {
      const due = parseSafeDate(task.dueDate);
      if (!due) return;

      const dueKey = toDateKey(due);
      const existing = map.get(dueKey) || [];
      if (!existing.some((t) => t.id === task.id)) {
        map.set(dueKey, [...existing, task]);
      }
    });

    return map;
  }, [filteredTasks]);

  // Map personal to-dos to dates (YYYY-MM-DD) — independent of workspace/
  // board filters since they are private and never belong to either.
  const todosByDate = useMemo(() => {
    const map = new Map<string, PersonalTodo[]>();

    personalTodos.forEach((todo) => {
      const due = parseSafeDate(todo.dueAt);
      if (!due) return;

      const dueKey = toDateKey(due);
      const existing = map.get(dueKey) || [];
      map.set(dueKey, [...existing, todo]);
    });

    return map;
  }, [personalTodos]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthTasks = scheduledTasks.filter((t) => {
      const d = parseSafeDate(t.dueDate);
      return d && d.getFullYear() === year && d.getMonth() === month;
    });

    const completed = monthTasks.filter((t) => t.status === "done" || t.status === "approved").length;
    const inProgress = monthTasks.filter((t) => t.status === "in_progress").length;
    const overdue = monthTasks.filter((t) => isOverdue(parseSafeDate(t.dueDate), t.status)).length;
    const total = monthTasks.length;

    return { total, completed, inProgress, overdue, unscheduled: unscheduledTasks.length };
  }, [scheduledTasks, unscheduledTasks, year, month]);

  // Generate calendar grid days for current month (35 or 42 days)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      prevDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    const currentDays: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const totalRendered = prevDays.length + currentDays.length;
    const targetTotal = totalRendered > 35 ? 42 : 35;
    const nextDays: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 1; i <= targetTotal - totalRendered; i++) {
      nextDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [year, month]);

  // Selected date key & items
  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateTasks = tasksByDate.get(selectedDateKey) || [];
  const selectedDateTodos = todosByDate.get(selectedDateKey) || [];
  const selectedDayHoliday = showThaiHolidays ? getThaiHolidayForDate(selectedDate) : null;

  // Today key
  const today = new Date();
  const todayKey = toDateKey(today);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to open create modal for specific date
  const handleAddNewForDate = (date: Date) => {
    openCreateTaskModal(undefined, undefined, date);
  };

  // Helper to schedule an unscheduled task to the selected date
  const handleScheduleTask = (taskId: string, targetDate: Date) => {
    updateTaskDueDate(taskId, targetDate);
  };

  // Personal to-do quick-add (side panel) — private per-user reminder,
  // never tied to any board/workspace.
  const handleOpenAddTodo = () => {
    setNewTodoTitle("");
    setNewTodoTime("09:00");
    setNewTodoReminderMinutes(10);
    setIsAddingTodo(true);
  };

  const handleSubmitNewTodo = async () => {
    if (!newTodoTitle.trim()) return;
    const [hh, mm] = newTodoTime.split(":").map((v) => parseInt(v, 10) || 0);
    const dueAt = new Date(selectedDate);
    dueAt.setHours(hh, mm, 0, 0);

    try {
      await createPersonalTodo({
        title: newTodoTitle.trim(),
        dueAt,
        reminderMinutesBefore: newTodoReminderMinutes,
      });
      setIsAddingTodo(false);
      setNewTodoTitle("");
    } catch (err) {
      console.error("Failed to create personal to-do:", err);
    }
  };

  // Get Board Theme / Color
  const getBoardDetails = (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    return {
      name: board ? board.name : "Board",
      colorClass: board?.color || "bg-blue-500",
    };
  };

  return (
    <div className="flex flex-col h-full bg-[#14151c] text-zinc-100 overflow-hidden font-sans select-none animate-in fade-in duration-200">
      {/* ─── Top Main Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 sm:px-6 pt-4 pb-3 border-b border-[#262836] bg-[#181922] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Title & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2e3144] bg-[#1f212c] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/20">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight truncate">
                  Monthly Task Calendar
                </h1>
                <span className="rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 text-xs font-semibold">
                  {monthlyStats.total} scheduled this month
                </span>
              </div>
              {(workspaceFilter !== "all" || boardFilter !== "all") && (
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {workspaceFilter !== "all"
                    ? `Showing tasks from ${workspaces.find((w) => w.id === workspaceFilter)?.name || "selected workspace"}`
                    : `Showing tasks from ${boards.find((b) => b.id === boardFilter)?.name || "selected board"}`}
                </p>
              )}
            </div>
          </div>

          {/* Right Action: Add Task & Side panel toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {unscheduledTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowUnscheduled(!showUnscheduled)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showUnscheduled
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                    : "border-[#2e3144] bg-[#1f212c] text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Unscheduled ({unscheduledTasks.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSidePanel(!showSidePanel)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showSidePanel
                  ? "border-indigo-500/50 bg-indigo-600/10 text-indigo-400"
                  : "border-[#2e3144] bg-[#1f212c] text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{showSidePanel ? "Hide Details" : "Show Details"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Control Toolbar (Month Picker, View Modes, Filters) ─────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-[#181922] border-b border-[#262836] text-xs">
        {/* Left: Month Navigator */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1 rounded-lg border border-[#2e3144] bg-[#1f212c] text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-xs"
          >
            Today
          </button>

          <div className="flex items-center rounded-lg border border-[#2e3144] bg-[#1f212c] overflow-hidden">
            <button
              type="button"
              onClick={prevMonth}
              title="Previous Month"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              title="Next Month"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-white pl-1 tracking-tight">
            {monthNames[month]} {year}
          </span>
        </div>

        {/* Middle / Right: Filter dropdowns & Thai Holiday toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Thai Holidays Toggle Switch */}
          <button
            type="button"
            onClick={() => setShowThaiHolidays(!showThaiHolidays)}
            title="Toggle Thailand Public Holidays"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              showThaiHolidays
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 font-semibold"
                : "border-[#2e3144] bg-[#1f212c] text-zinc-400 hover:text-white"
            }`}
          >
            <span>🇹🇭</span>
            <span>วันหยุดไทย</span>
          </button>

          {/* Workspace Filter */}
          <div className="flex items-center gap-1 bg-[#1f212c] border border-[#2e3144] rounded-lg px-2 py-0.5">
            <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <select
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
              aria-label="Filter tasks by workspace"
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer py-1 pr-1 font-medium"
            >
              <option value="all" className="bg-[#1c1e28] text-white">
                🏢 All Workspace (ทั้งหมด)
              </option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#1c1e28] text-white">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Board Filter */}
          <div className="flex items-center gap-1 bg-[#1f212c] border border-[#2e3144] rounded-lg px-2 py-0.5">
            <Briefcase className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              aria-label="Filter tasks by board"
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer py-1 pr-1"
            >
              <option value="all" className="bg-[#1c1e28] text-white">
                All Boards
              </option>
              {boards.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#1c1e28] text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#1f212c] border border-[#2e3144] rounded-lg px-2 py-0.5">
            <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter tasks by status"
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer py-1 pr-1"
            >
              <option value="all" className="bg-[#1c1e28] text-white">
                All Statuses
              </option>
              {Object.entries(TASK_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#1c1e28] text-white">
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-28 sm:w-40 rounded-lg border border-[#2e3144] bg-[#1f212c] pl-7 pr-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* View mode buttons */}
          <div className="flex items-center rounded-lg border border-[#2e3144] bg-[#1f212c] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              title="Month Grid"
              className={`p-1 rounded-md transition-colors ${
                viewMode === "month"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              title="Agenda Timeline"
              className={`p-1 rounded-md transition-colors ${
                viewMode === "agenda"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Unscheduled Tasks Backlog Drawer (If Open) ──────────────────── */}
      {showUnscheduled && (
        <div className="bg-[#191b26] border-b border-[#292c3d] p-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Unscheduled Tasks Backlog ({unscheduledTasks.length})
              </span>
              <span className="text-[11px] text-zinc-400">
                Click &quot;Schedule&quot; to assign task to selected date ({formatDate(selectedDate)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUnscheduled(false)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          {unscheduledTasks.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">
              All tasks currently have scheduled due dates!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {unscheduledTasks.map((task) => {
                const boardInfo = getBoardDetails(task.boardId);
                return (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg bg-[#14151e] border border-[#292c3d] flex items-center justify-between gap-2 hover:border-indigo-500/40 transition-colors"
                  >
                    <div
                      onClick={() => openTaskModal(task.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <p className="text-xs font-medium text-zinc-200 truncate hover:text-white">
                        {task.title}
                      </p>
                      <span className="text-[10px] text-zinc-500">
                        {boardInfo.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleScheduleTask(task.id, selectedDate)}
                      title={`Schedule to ${selectedDate.toLocaleDateString()}`}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-semibold transition-colors shrink-0"
                    >
                      <CalendarCheck2 className="h-3 w-3" />
                      <span>Schedule</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Main Content Area (Split Grid + Detail Drawer) ─────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Month Grid or Agenda View */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#14151c]">
          {viewMode === "month" ? (
            <div className="flex-1 flex flex-col p-3 sm:p-4 min-w-[700px]">
              {/* Day headers: Sun - Sat */}
              <div className="grid grid-cols-7 gap-px mb-1 text-center">
                {weekDayNames.map((d, index) => (
                  <div
                    key={d}
                    className={`py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      index === 0 || index === 6
                        ? "text-rose-400/80"
                        : "text-zinc-400"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 35 or 42 Day Grid Cells */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 gap-1 bg-[#1a1c26]/40 rounded-xl p-1 border border-[#262836]">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const cellKey = toDateKey(date);
                  const dayTasks = tasksByDate.get(cellKey) || [];
                  const dayTodos = todosByDate.get(cellKey) || [];
                  const isToday = cellKey === todayKey;
                  const isSelected = cellKey === selectedDateKey;
                  const holiday = showThaiHolidays ? getThaiHolidayForDate(date) : null;

                  return (
                    <div
                      key={cellKey}
                      onClick={() => setSelectedDate(date)}
                      className={`group relative flex flex-col min-h-[95px] p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#252837] border-indigo-500 shadow-lg ring-1 ring-indigo-500/50"
                          : isToday
                          ? "bg-[#1c1e2a] border-sky-500/50 shadow-xs"
                          : holiday
                          ? "bg-[#1f1a24] border-rose-900/30 hover:border-rose-700/60"
                          : isCurrentMonth
                          ? "bg-[#181a24] border-[#222433] hover:border-zinc-700/80 hover:bg-[#1f2230]"
                          : "bg-[#14151e]/60 border-transparent opacity-40 hover:opacity-75"
                      }`}
                    >
                      {/* Cell Header: Date Number, Thai Flag / Holiday Indicator & Add Button */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={`flex items-center justify-center h-5 w-5 rounded-full text-xs font-semibold ${
                              isToday
                                ? "bg-sky-500 text-white font-bold"
                                : isSelected
                                ? "bg-indigo-600 text-white font-bold"
                                : holiday
                                ? "bg-rose-600 text-white font-bold"
                                : isCurrentMonth
                                ? "text-zinc-200"
                                : "text-zinc-500"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {dayTasks.length + dayTodos.length > 0 && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 rounded-full px-1.5 py-0.2">
                              {dayTasks.length + dayTodos.length}
                            </span>
                          )}
                        </div>

                        {/* Quick Add Button on Cell Hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNewForDate(date);
                          }}
                          title={`Add task for ${date.toLocaleDateString()}`}
                          className="opacity-0 group-hover:opacity-100 flex h-4 w-4 items-center justify-center rounded bg-zinc-700 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Thai Holiday Chip if present */}
                      {holiday && (
                        <div
                          title={`🇹🇭 ${holiday.nameTh} (${holiday.nameEn})`}
                          className="mb-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/50 border border-rose-800/40 text-rose-300 truncate shadow-2xs"
                        >
                          <span className="text-[9px] shrink-0">🇹🇭</span>
                          <span className="truncate">{holiday.nameTh}</span>
                        </div>
                      )}

                      {/* Task & To-Do Chips Container */}
                      <div className="flex-1 space-y-1 overflow-y-hidden">
                        {dayTasks.slice(0, holiday ? 2 : 3).map((task) => {
                          const statusCfg = getStatusCfg(task.status);
                          const isTaskDone = task.status === "done" || task.status === "approved";
                          const overdue = isOverdue(parseSafeDate(task.dueDate), task.status);
                          const boardInfo = getBoardDetails(task.boardId);

                          return (
                            <div
                              key={`${task.id}-${cellKey}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openTaskModal(task.id);
                              }}
                              title={`${task.title} (${statusCfg.label}) - ${boardInfo.name}`}
                              className={`group/chip flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] truncate border transition-all ${
                                isTaskDone
                                  ? "bg-emerald-950/20 border-emerald-800/30 text-zinc-400 line-through"
                                  : overdue
                                  ? "bg-red-950/30 border-red-800/40 text-red-200 hover:border-red-500"
                                  : "bg-[#222533] border-[#2f3346] text-zinc-200 hover:border-indigo-500/60 hover:bg-[#2b2f42]"
                              }`}
                            >
                              {/* Board color vertical stripe */}
                              <span
                                className={`h-2.5 w-1 rounded-full shrink-0 ${boardInfo.colorClass}`}
                              />

                              {/* Priority flame if urgent */}
                              {task.priority === "urgent" && (
                                <Flame className="h-3 w-3 text-red-400 shrink-0" />
                              )}

                              {/* Title */}
                              <span className="truncate font-medium flex-1">
                                {task.title}
                              </span>

                              {/* Overdue alert indicator */}
                              {overdue && (
                                <span className="text-[9px] text-red-400 font-bold shrink-0">
                                  !
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Personal to-do chips (fill remaining slots after tasks) */}
                        {dayTodos
                          .slice(0, Math.max(0, (holiday ? 2 : 3) - dayTasks.length))
                          .map((todo) => (
                            <div
                              key={`${todo.id}-${cellKey}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTodoComplete(todo.id);
                              }}
                              title={`${todo.title} (Personal To-Do)`}
                              className={`group/chip flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] truncate border border-dashed transition-all ${
                                todo.isCompleted
                                  ? "bg-violet-950/10 border-violet-800/30 text-zinc-500 line-through"
                                  : "bg-violet-950/20 border-violet-700/40 text-violet-200 hover:border-violet-500"
                              }`}
                            >
                              <StickyNote className="h-3 w-3 shrink-0" />
                              <span className="truncate font-medium flex-1">
                                {todo.title}
                              </span>
                            </div>
                          ))}

                        {/* "+N more" badge */}
                        {dayTasks.length + dayTodos.length > (holiday ? 2 : 3) && (
                          <div className="text-[10px] font-bold text-indigo-400 pl-1 hover:underline">
                            +{dayTasks.length + dayTodos.length - (holiday ? 2 : 3)} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── Agenda List View ────────────────────────────────────── */
            <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#262836]">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Monthly Agenda & Deadlines ({scheduledTasks.length} tasks)
                </h2>
              </div>

              {scheduledTasks.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-[#2d3142] bg-[#181922] space-y-2">
                  <CalendarIcon className="h-8 w-8 text-zinc-500 mx-auto" />
                  <p className="text-sm font-semibold text-zinc-300">
                    No scheduled tasks found
                  </p>
                  <p className="text-xs text-zinc-500">
                    Try changing your filter settings or create a new task.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledTasks
                    .sort((a, b) => {
                      const da = parseSafeDate(a.dueDate)?.getTime() || 0;
                      const db = parseSafeDate(b.dueDate)?.getTime() || 0;
                      return da - db;
                    })
                    .map((task) => {
                      const statusCfg = getStatusCfg(task.status);
                      const priorityCfg = getPriorityCfg(task.priority);
                      const board = boards.find((b) => b.id === task.boardId);
                      const parsedDue = parseSafeDate(task.dueDate);
                      const overdue = isOverdue(parsedDue, task.status);
                      const isTaskDone = task.status === "done" || task.status === "approved";
                      const boardInfo = getBoardDetails(task.boardId);
                      const holiday = parsedDue && showThaiHolidays ? getThaiHolidayForDate(parsedDue) : null;

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#262836] bg-[#181922] hover:border-indigo-500/40 hover:bg-[#1d1f2b] transition-all group"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateTaskStatus(
                                task.id,
                                isTaskDone ? "todo" : "done"
                              )
                            }
                            className="text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
                          >
                            {isTaskDone ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>

                          <div
                            onClick={() => openTaskModal(task.id)}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <p
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                isTaskDone
                                  ? "line-through text-zinc-500"
                                  : "text-zinc-200 group-hover:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${boardInfo.colorClass}`} />
                                <span className="truncate">{board?.name || "Board"}</span>
                              </span>
                              {holiday && (
                                <span className="text-rose-400 font-medium">
                                  · 🇹🇭 {holiday.nameTh}
                                </span>
                              )}
                              {task.category && (
                                <>
                                  <span className="text-zinc-600">·</span>
                                  <span>{task.category}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <span
                            className={`hidden sm:inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase hidden md:block ${priorityCfg.color}`}
                          >
                            {task.priority}
                          </span>

                          {parsedDue && (
                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  overdue
                                    ? "text-red-400 font-bold"
                                    : "text-zinc-400"
                                }`}
                              >
                                {overdue ? "⚠ " : ""}
                                {formatDate(parsedDue)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right Schedule Side Panel ───────────────────────────────────── */}
        {showSidePanel && (
          <div className="w-80 sm:w-96 border-l border-[#262836] bg-[#181922] flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-[#262836] space-y-2 bg-[#161720]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Day Schedule</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSidePanel(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedDateTasks.length} {selectedDateTasks.length === 1 ? "task" : "tasks"} · {selectedDateTodos.length} personal {selectedDateTodos.length === 1 ? "to-do" : "to-dos"}
                </p>
              </div>

              {/* Thai Holiday Banner if Selected Date is a Holiday */}
              {selectedDayHoliday && (
                <div className="p-2.5 rounded-xl border border-rose-800/40 bg-rose-950/30 text-rose-200 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
                  <span className="text-base leading-none shrink-0">🇹🇭</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-rose-300">
                      {selectedDayHoliday.nameTh}
                    </p>
                    <p className="text-[10px] text-rose-400/80">
                      {selectedDayHoliday.nameEn} · วันหยุดนักขัตฤกษ์
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tasks list on selected day */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedDateTasks.length === 0 && selectedDateTodos.length === 0 && !isAddingTodo ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-[#2e3144] bg-[#14151c]/60 p-4 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-500 mx-auto">
                    <StickyNote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">
                      Nothing scheduled for this day
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Add a personal to-do — private to you, with an optional reminder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddTodo}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add To-Do for this Day</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDateTasks.map((task) => {
                    const statusCfg = getStatusCfg(task.status);
                    const priorityCfg = getPriorityCfg(task.priority);
                    const isTaskDone = task.status === "done" || task.status === "approved";
                    const board = boards.find((b) => b.id === task.boardId);
                    const parsedDue = parseSafeDate(task.dueDate);
                    const overdue = isOverdue(parsedDue, task.status);
                    const boardInfo = getBoardDetails(task.boardId);
                    const assignee = users.find((u) => u.id === task.assigneeId);

                    return (
                      <div
                        key={task.id}
                        onClick={() => router.push(`/my-work?taskId=${task.id}`)}
                        title="Open in My Work"
                        className="p-3 rounded-xl border border-[#292c3d] bg-[#1c1e2a] hover:border-indigo-500/50 hover:bg-[#212433] transition-all space-y-2 group cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Status indicator (read-only — edit from My Work) */}
                          <span className="mt-0.5 text-zinc-500 shrink-0">
                            {isTaskDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </span>

                          {/* Task title */}
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-semibold leading-snug ${
                                isTaskDone
                                  ? "line-through text-zinc-500"
                                  : "text-zinc-100 group-hover:text-white"
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Assignee & Due Date (read-only) */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-[#292c3d]/40">
                          <div className="flex items-center gap-1.5 truncate">
                            {assignee ? (
                              <span className="flex items-center gap-1 text-zinc-300">
                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${assignee.avatarColor || 'bg-indigo-600'}`}>
                                  {assignee.avatarInitials}
                                </span>
                                <span className="truncate">{assignee.name}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500 italic">Unassigned</span>
                            )}
                          </div>

                          {parsedDue && (
                            <span
                              className={`text-[10px] font-medium tabular-nums ${
                                overdue ? "text-red-400 font-bold" : "text-zinc-400"
                              }`}
                            >
                              {overdue ? "⚠ " : ""}
                              {formatDate(parsedDue)}
                            </span>
                          )}
                        </div>

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#292c3d]/60 text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300 font-medium truncate">
                              <span className={`h-1.5 w-1.5 rounded-full ${boardInfo.colorClass}`} />
                              <span className="truncate">{boardInfo.name}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`rounded px-1.5 py-0.5 font-bold uppercase ${priorityCfg.color}`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ─── Personal To-Do Section ───────────────────────────── */}
                  <div className="pt-3 mt-1 border-t border-[#262836] space-y-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-400">
                      <StickyNote className="h-3.5 w-3.5" />
                      <span>Personal To-Do</span>
                    </span>

                    {selectedDateTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border border-dashed border-violet-800/40 bg-violet-950/10 hover:border-violet-500/60 transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTodoComplete(todo.id)}
                          className="mt-0.5 text-zinc-500 hover:text-violet-400 transition-colors shrink-0"
                        >
                          {todo.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-violet-400" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              todo.isCompleted
                                ? "line-through text-zinc-500"
                                : "text-zinc-100"
                            }`}
                          >
                            {todo.title}
                          </p>
                          {todo.dueAt && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                              <Bell className="h-3 w-3" />
                              {new Date(todo.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" · reminds "}
                              {todo.reminderMinutesBefore}
                              {" min before"}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deletePersonalTodo(todo.id)}
                          title="Delete to-do"
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {isAddingTodo ? (
                      <div className="p-2.5 rounded-xl border border-violet-700/40 bg-[#14151e] space-y-2">
                        <input
                          type="text"
                          autoFocus
                          value={newTodoTitle}
                          onChange={(e) => setNewTodoTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmitNewTodo();
                            if (e.key === "Escape") setIsAddingTodo(false);
                          }}
                          placeholder="What do you need to do?"
                          className="w-full rounded-lg border border-[#2e3144] bg-[#1c1e28] px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={newTodoTime}
                            onChange={(e) => setNewTodoTime(e.target.value)}
                            className="rounded-lg border border-[#2e3144] bg-[#1c1e28] px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-violet-500"
                          />
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Bell className="h-3 w-3" />
                            <input
                              type="number"
                              min={0}
                              value={newTodoReminderMinutes}
                              onChange={(e) => setNewTodoReminderMinutes(parseInt(e.target.value, 10) || 0)}
                              className="w-12 rounded-lg border border-[#2e3144] bg-[#1c1e28] px-1.5 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-violet-500"
                            />
                            <span>min before</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingTodo(false)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitNewTodo}
                            disabled={!newTodoTitle.trim()}
                            className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-[11px] font-semibold text-white transition-colors"
                          >
                            Add To-Do
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenAddTodo}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#2e3144] py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-violet-500 hover:bg-[#1f212c] transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add To-Do for this Day</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

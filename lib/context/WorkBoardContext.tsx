"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  User,
  Workspace,
  WorkspaceMember,
  Board,
  Group,
  Task,
  Subtask,
  Comment,
  Activity,
  Notification,
  TaskStatus,
  TaskPriority,
} from "@/types";
import {
  MOCK_USERS,
  DEFAULT_USER,
  CURRENT_USER,
  MOCK_WORKSPACE,
  MOCK_BOARDS,
  MOCK_GROUPS,
  MOCK_TASKS,
  MOCK_SUBTASKS,
  MOCK_COMMENTS,
  MOCK_ACTIVITIES,
  MOCK_NOTIFICATIONS,
} from "@/lib/mock/data";

interface WorkBoardContextType {
  currentUser: User;
  users: User[];
  workspace: Workspace;
  boards: Board[];
  groups: Group[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  activities: Activity[];
  notifications: Notification[];
  unreadNotificationCount: number;

  // Active Modals & SlideOver
  activeTaskId: string | null;
  slideOverTab: "details" | "activity" | "git";
  setSlideOverTab: (tab: "details" | "activity" | "git") => void;
  isCreateTaskOpen: boolean;
  createTaskDefaultBoardId?: string;
  createTaskDefaultGroupId?: string;
  createTaskDefaultDueDate?: Date | null;
  isInviteMemberOpen: boolean;

  // Auth & Session
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Actions - Tasks & Items
  assignTask: (taskId: string, newAssigneeId: string | null) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  updateTaskDueDate: (taskId: string, dueDate: Date | null) => void;
  updateTaskField: <K extends keyof Task>(
    taskId: string,
    field: K,
    value: Task[K]
  ) => void;
  updateTaskDetails: (
    taskId: string,
    updates: Partial<Task>
  ) => void;
  createTask: (newTask: {
    title: string;
    description?: string;
    boardId: string;
    groupId: string;
    assigneeId?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: Date | null;
    category?: string;
    timeline?: { start: string; end: string } | null;
    tags?: string[];
  }) => Task;
  deleteTask: (taskId: string) => void;
  voteItem: (taskId: string) => void;

  // Actions - Groups
  addGroup: (boardId: string, name: string, color?: string) => void;
  deleteGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;

  // Actions - Subtasks & Comments
  toggleSubtask: (subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  addComment: (taskId: string, content: string) => void;

  // Actions - Members & Workspace
  inviteMember: (member: {
    name: string;
    email: string;
    role: "owner" | "admin" | "member" | "viewer";
  }) => Promise<User | null>;
  updateMemberRole: (
    userId: string,
    role: "owner" | "admin" | "member" | "viewer"
  ) => void;
  removeMember: (userId: string) => void;

  // Actions - Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Modal Triggers
  openTaskModal: (taskId: string, tab?: "details" | "activity" | "git") => void;
  closeTaskModal: () => void;
  openCreateTaskModal: (boardId?: string, groupId?: string, defaultDueDate?: Date | null) => void;
  closeCreateTaskModal: () => void;
  openInviteMemberModal: () => void;
  closeInviteMemberModal: () => void;

  // Board, Folder & Dashboard Creation Modals
  isCreateBoardOpen: boolean;
  openCreateBoardModal: () => void;
  closeCreateBoardModal: () => void;
  isCreateFolderOpen: boolean;
  openCreateFolderModal: () => void;
  closeCreateFolderModal: () => void;
  isCreateDashboardOpen: boolean;
  openCreateDashboardModal: () => void;
  closeCreateDashboardModal: () => void;
  createBoard: (data: {
    name: string;
    description?: string;
    color?: string;
    folderId?: string;
  }) => Promise<Board>;
  folders: Array<{ id: string; name: string; color?: string }>;
  createFolder: (name: string, color?: string) => { id: string; name: string; color?: string };

  // Board Specific Invitation Modal
  isInviteBoardModalOpen: boolean;
  inviteBoardId: string | null;
  openInviteBoardModal: (boardId: string) => void;
  closeInviteBoardModal: () => void;
  inviteToBoard: (
    boardId: string,
    email: string,
    role?: string
  ) => Promise<{
    success: boolean;
    token?: string;
    inviteLink?: string;
    emailDelivery?: any;
  }>;
  acceptBoardInvite: (token: string) => Promise<boolean>;

  // Computed Selectors
  getUserById: (id: string) => User | undefined;
  getTasksByAssignee: (userId: string) => Task[];
  getTasksByBoard: (boardId: string) => Task[];
  getTasksByGroup: (groupId: string) => Task[];
  getMyTasks: () => Task[];
  getWorkspaceStats: () => {
    totalAssigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

const WorkBoardContext = createContext<WorkBoardContextType | undefined>(
  undefined
);

const STORAGE_KEY = "workboard_state_v5";

const DUMMY_USER_IDS = ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"];
const DUMMY_USER_NAMES = ["Alex Morgan", "Sarah Chen", "Marcus Vance", "Elena Rostova", "David Kim", "Priya Patel"];

function isRealUser(u: User): boolean {
  return !DUMMY_USER_IDS.includes(u.id) && !DUMMY_USER_NAMES.includes(u.name);
}

export function WorkBoardProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [workspace, setWorkspace] = useState<Workspace>(MOCK_WORKSPACE);
  const [boards, setBoards] = useState<Board[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Modal State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<"details" | "activity" | "git">("details");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultBoardId, setCreateTaskDefaultBoardId] = useState<
    string | undefined
  >();
  const [createTaskDefaultGroupId, setCreateTaskDefaultGroupId] = useState<
    string | undefined
  >();
  const [createTaskDefaultDueDate, setCreateTaskDefaultDueDate] = useState<
    Date | null | undefined
  >();
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isInviteBoardModalOpen, setIsInviteBoardModalOpen] = useState(false);
  const [inviteBoardId, setInviteBoardId] = useState<string | null>(null);

  // Additional Modals State (Board, Folder, Dashboard)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [folders, setFolders] = useState<Array<{ id: string; name: string; color?: string }>>([
  ]);

  // ─── Server & LocalStorage Hydration ──────────────────────────────────────
  useEffect(() => {
    // Restore auth session and workspace state from localStorage
    try {
      // Remove legacy keys
      localStorage.removeItem("workboard_state_v1");
      localStorage.removeItem("workboard_state_v2");
      localStorage.removeItem("workboard_state_v3");
      localStorage.removeItem("workboard_state_v4");

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Restore authentication state
        if (parsed.isAuthenticated && parsed.currentUserId) {
          const cleanUsers = (parsed.users || []).filter(isRealUser);
          const foundUser = cleanUsers.find(
            (u: User) => u.id === parsed.currentUserId
          );
          if (foundUser) {
            setCurrentUser(foundUser);
            setIsAuthenticated(true);
            if (cleanUsers.length > 0) setUsers(cleanUsers);
          }
        }
        // Restore workspace data
        if (parsed.boards) setBoards(parsed.boards);
        if (parsed.groups) setGroups(parsed.groups);
        if (parsed.workspace) setWorkspace(parsed.workspace);
        if (parsed.tasks) {
          setTasks(
            parsed.tasks.map((t: Task) => ({
              ...t,
              dueDate: t.dueDate ? new Date(t.dueDate) : null,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            }))
          );
        }
        if (parsed.activities) {
          setActivities(
            parsed.activities.map((a: Activity) => ({
              ...a,
              createdAt: new Date(a.createdAt),
            }))
          );
        }
        if (parsed.notifications) {
          setNotifications(
            parsed.notifications.map((n: Notification) => ({
              ...n,
              createdAt: new Date(n.createdAt),
            }))
          );
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const persistState = useCallback(
    (
      newUsers: User[],
      newWorkspace: Workspace,
      newTasks: Task[],
      newActivities: Activity[],
      newNotifications: Notification[],
      currUser: User,
      newGroups?: Group[],
      newBoards?: Board[],
      authenticated?: boolean
    ) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: authenticated ?? true,
            currentUserId: currUser.id,
            users: newUsers,
            workspace: newWorkspace,
            tasks: newTasks,
            activities: newActivities,
            notifications: newNotifications,
            groups: newGroups || groups,
            boards: newBoards || boards,
          })
        );
      } catch {
        // ignore
      }
    },
    [groups, boards]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const loggedInUser: User = data.data;
          setCurrentUser(loggedInUser);
          setIsAuthenticated(true);
          const newUsers = users.some((u) => u.id === loggedInUser.id)
            ? users
            : [...users, loggedInUser];
          setUsers(newUsers);
          // Persist auth session to localStorage
          persistState(newUsers, workspace, tasks, activities, notifications, loggedInUser, groups, boards, true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [users, workspace, tasks, activities, notifications, groups, boards, persistState]
  );

  const register = useCallback(
    async (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
      department?: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const newUser: User = data.data;
          setCurrentUser(newUser);
          setIsAuthenticated(true);
          const newUsers = [...users, newUser];
          setUsers(newUsers);
          // Persist auth session to localStorage
          persistState(newUsers, workspace, tasks, activities, notifications, newUser, groups, boards, true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [users, workspace, tasks, activities, notifications, groups, boards, persistState]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    // Clear auth session from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const switchUser = useCallback(
    (userId: string) => {
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        setCurrentUser(targetUser);
        persistState(users, workspace, tasks, activities, notifications, targetUser);
      }
    },
    [users, workspace, tasks, activities, notifications, persistState]
  );

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const assignTask = useCallback(
    (taskId: string, newAssigneeId: string | null) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const previousAssignee = targetTask.assigneeId
        ? users.find((u) => u.id === targetTask.assigneeId)
        : null;
      const newAssignee = newAssigneeId
        ? users.find((u) => u.id === newAssigneeId)
        : null;

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigneeId: newAssigneeId,
              updatedAt: new Date(),
            }
          : t
      );

      const activityText = newAssignee
        ? previousAssignee
          ? `reassigned this item from ${previousAssignee.name} to ${newAssignee.name}`
          : `assigned this item to ${newAssignee.name}`
        : `unassigned this item`;

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        taskId,
        boardId: targetTask.boardId,
        actorId: currentUser.id,
        type: "assignee_changed",
        description: activityText,
        createdAt: new Date(),
      };

      const updatedActivities = [newActivity, ...activities];

      let updatedNotifications = [...notifications];
      if (newAssignee && newAssignee.id !== currentUser.id) {
        const board = boards.find((b) => b.id === targetTask.boardId);
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          userId: newAssignee.id,
          type: "assignment",
          title: `${currentUser.name} assigned you a task`,
          body: `${targetTask.title}${board ? ` · ${board.name}` : ""}`,
          taskId: targetTask.id,
          boardId: targetTask.boardId,
          isRead: false,
          createdAt: new Date(),
        };
        updatedNotifications = [newNotif, ...notifications];
      }

      setTasks(updatedTasks);
      setActivities(updatedActivities);
      setNotifications(updatedNotifications);
      persistState(
        users,
        workspace,
        updatedTasks,
        updatedActivities,
        updatedNotifications,
        currentUser
      );
    },
    [
      tasks,
      users,
      currentUser,
      activities,
      notifications,
      boards,
      workspace,
      persistState,
    ]
  );

  const resolveTargetGroupId = useCallback(
    (
      task: Task,
      newStatus: TaskStatus,
      newDueDate: Date | null,
      boardGroups: Group[]
    ): string => {
      const now = new Date();
      const isLate = Boolean(newDueDate && new Date(newDueDate) < now);

      // Rule 1: If work done, move to completed group
      if (newStatus === "done") {
        const completedGroup = boardGroups.find((g) =>
          /complete|done|finish|deliver|approve/i.test(g.name)
        );
        if (completedGroup) return completedGroup.id;
      }

      // Rule 2: If overdue / late (past due and not done), move to late group
      if (newStatus !== "done" && isLate) {
        const lateGroup = boardGroups.find((g) =>
          /overdue|late|delay/i.test(g.name)
        );
        if (lateGroup) return lateGroup.id;
      }

      // Rule 3: If reverting from done or late, move back to active group
      const currentGroup = boardGroups.find((g) => g.id === task.groupId);
      const isCurrentlyInCompletedOrLate =
        currentGroup &&
        (/complete|done|finish|deliver|approve/i.test(currentGroup.name) ||
          /overdue|late|delay/i.test(currentGroup.name));

      if (isCurrentlyInCompletedOrLate) {
        const activeGroup =
          boardGroups.find((g) =>
            /active|deliverable|progress|todo/i.test(g.name)
          ) || boardGroups[0];
        if (activeGroup) return activeGroup.id;
      }

      return task.groupId;
    },
    []
  );

  const updateTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || targetTask.status === status) return;

      const boardGroups = groups.filter((g) => g.boardId === targetTask.boardId);
      const newGroupId = resolveTargetGroupId(
        targetTask,
        status,
        targetTask.dueDate,
        boardGroups
      );

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? { ...t, status, groupId: newGroupId, updatedAt: new Date() }
          : t
      );

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        taskId,
        boardId: targetTask.boardId,
        actorId: currentUser.id,
        type: "status_changed",
        description: `changed status to ${status.toUpperCase().replace("_", " ")}`,
        createdAt: new Date(),
      };

      const updatedActivities = [newActivity, ...activities];
      setTasks(updatedTasks);
      setActivities(updatedActivities);
      persistState(
        users,
        workspace,
        updatedTasks,
        updatedActivities,
        notifications,
        currentUser
      );
    },
    [tasks, groups, currentUser, activities, users, workspace, notifications, persistState, resolveTargetGroupId]
  );

  const updateTaskPriority = useCallback(
    (taskId: string, priority: TaskPriority) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask || targetTask.priority === priority) return;

      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, priority, updatedAt: new Date() } : t
      );

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        taskId,
        boardId: targetTask.boardId,
        actorId: currentUser.id,
        type: "priority_changed",
        description: `changed priority to ${priority.toUpperCase().replace("_", " ")}`,
        createdAt: new Date(),
      };

      const updatedActivities = [newActivity, ...activities];
      setTasks(updatedTasks);
      setActivities(updatedActivities);
      persistState(
        users,
        workspace,
        updatedTasks,
        updatedActivities,
        notifications,
        currentUser
      );
    },
    [tasks, currentUser, activities, users, workspace, notifications, persistState]
  );

  const updateTaskDueDate = useCallback(
    (taskId: string, dueDate: Date | null) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const boardGroups = groups.filter((g) => g.boardId === targetTask.boardId);
      const newGroupId = resolveTargetGroupId(
        targetTask,
        targetTask.status,
        dueDate,
        boardGroups
      );

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? { ...t, dueDate, groupId: newGroupId, updatedAt: new Date() }
          : t
      );

      setTasks(updatedTasks);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );
    },
    [tasks, groups, users, workspace, activities, notifications, currentUser, persistState, resolveTargetGroupId]
  );

  const updateTaskField = useCallback(
    <K extends keyof Task>(taskId: string, field: K, value: Task[K]) => {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, [field]: value, updatedAt: new Date() } : t
      );
      setTasks(updatedTasks);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );
    },
    [tasks, users, workspace, activities, notifications, currentUser, persistState]
  );

  const updateTaskDetails = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date() } : t
      );
      setTasks(updatedTasks);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );
    },
    [tasks, users, workspace, activities, notifications, currentUser, persistState]
  );

  const voteItem = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, votes: (t.votes || 0) + 1 } : t
      )
    );
  }, []);

  const createTask = useCallback(
    (newTaskData: {
      title: string;
      description?: string;
      boardId: string;
      groupId: string;
      assigneeId?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: Date | null;
      category?: string;
      timeline?: { start: string; end: string } | null;
      tags?: string[];
    }) => {
      const prefix =
        newTaskData.boardId === "board-requests"
          ? "REQ"
          : newTaskData.boardId === "board-marketing"
          ? "MKT"
          : newTaskData.boardId === "board-roadmap"
          ? "OKR"
          : "WB";

      const num = Math.floor(Math.random() * 900) + 100;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        itemCode: `${prefix}-${num}`,
        boardId: newTaskData.boardId,
        groupId: newTaskData.groupId,
        title: newTaskData.title.trim(),
        description: newTaskData.description || "",
        status:
          newTaskData.status ||
          (newTaskData.boardId === "board-requests" ? "new_request" : "todo"),
        priority: newTaskData.priority || "medium",
        assigneeId: newTaskData.assigneeId || null,
        reporterId: currentUser.id,
        dueDate: newTaskData.dueDate || null,
        category: newTaskData.category || "General",
        timeline: newTaskData.timeline || null,
        votes: 0,
        tags: newTaskData.tags || [],
        subtaskIds: [],
        commentIds: [],
        attachmentIds: [],
        activityIds: [],
        order: tasks.filter((t) => t.groupId === newTaskData.groupId).length,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTasks = [newTask, ...tasks];

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        taskId: newTask.id,
        boardId: newTask.boardId,
        actorId: currentUser.id,
        type: "task_created",
        description: "created this item",
        createdAt: new Date(),
      };

      const updatedActivities = [newActivity, ...activities];

      setTasks(updatedTasks);
      setActivities(updatedActivities);
      persistState(
        users,
        workspace,
        updatedTasks,
        updatedActivities,
        notifications,
        currentUser
      );
      return newTask;
    },
    [
      tasks,
      currentUser,
      activities,
      notifications,
      users,
      workspace,
      persistState,
    ]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      setTasks(updatedTasks);
      if (activeTaskId === taskId) setActiveTaskId(null);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );
    },
    [tasks, activeTaskId, users, workspace, activities, notifications, currentUser, persistState]
  );

  // Group Management
  const addGroup = useCallback(
    (boardId: string, name: string, color?: string) => {
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        boardId,
        name: name.trim() || "New Group",
        color: color || "#3b82f6",
        order: groups.filter((g) => g.boardId === boardId).length,
        isCollapsed: false,
        taskIds: [],
        createdAt: new Date(),
      };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      persistState(
        users,
        workspace,
        tasks,
        activities,
        notifications,
        currentUser,
        updatedGroups
      );
    },
    [groups, users, workspace, tasks, activities, notifications, currentUser, persistState]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      const updatedGroups = groups.filter((g) => g.id !== groupId);
      const updatedTasks = tasks.filter((t) => t.groupId !== groupId);
      setGroups(updatedGroups);
      setTasks(updatedTasks);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser,
        updatedGroups
      );
    },
    [groups, tasks, users, workspace, activities, notifications, currentUser, persistState]
  );

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
      )
    );
  }, []);

  const toggleSubtask = useCallback((subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId
          ? { ...s, isCompleted: !s.isCompleted, updatedAt: new Date() }
          : s
      )
    );
  }, []);

  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      if (!title.trim()) return;
      const newSub: Subtask = {
        id: `sub-${Date.now()}`,
        taskId,
        title: title.trim(),
        isCompleted: false,
        assigneeId: null,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSubtasks((prev) => [...prev, newSub]);
    },
    []
  );

  const addComment = useCallback(
    (taskId: string, content: string) => {
      if (!content.trim()) return;
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        taskId,
        authorId: currentUser.id,
        content: content.trim(),
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setComments((prev) => [...prev, newComment]);

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        taskId,
        boardId: tasks.find((t) => t.id === taskId)?.boardId || "",
        actorId: currentUser.id,
        type: "comment_added",
        description: "added an update",
        createdAt: new Date(),
      };
      setActivities((prev) => [newActivity, ...prev]);
    },
    [currentUser, tasks]
  );

  const inviteMember = useCallback(
    async (data: {
      name: string;
      email: string;
      role: "owner" | "admin" | "member" | "viewer";
    }) => {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            role:
              data.role === "owner"
                ? "Workspace Owner"
                : data.role === "admin"
                ? "Team Admin"
                : "Member",
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const newUser: User = json.data;
          setUsers((prev) => {
            const clean = prev.filter((u) => u.id !== newUser.id && isRealUser(u));
            return [...clean, newUser];
          });

          // Dispatch real invitation email for primary board
          const targetBoardId = boards[0]?.id || "board-1";
          await fetch(`/api/boards/${targetBoardId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.email,
              role: data.role === "admin" ? "Project Lead" : "Member",
              invitedById: currentUser.id,
            }),
          });

          return newUser;
        }
      } catch (err) {
        console.error("Failed to create member via API:", err);
      }
      return null;
    },
    [boards, currentUser.id]
  );

  const updateMemberRole = useCallback(
    (userId: string, role: "owner" | "admin" | "member" | "viewer") => {
      const updatedWorkspace: Workspace = {
        ...workspace,
        members: workspace.members.map((m) =>
          m.userId === userId ? { ...m, role } : m
        ),
      };
      setWorkspace(updatedWorkspace);
      persistState(
        users,
        updatedWorkspace,
        tasks,
        activities,
        notifications,
        currentUser
      );
    },
    [workspace, users, tasks, activities, notifications, currentUser, persistState]
  );

  const removeMember = useCallback(
    (userId: string) => {
      if (userId === currentUser.id) return;
      const updatedWorkspace: Workspace = {
        ...workspace,
        members: workspace.members.filter((m) => m.userId !== userId),
      };
      const updatedUsers = users.filter((u) => u.id !== userId);
      const updatedTasks = tasks.map((t) =>
        t.assigneeId === userId ? { ...t, assigneeId: null } : t
      );

      setWorkspace(updatedWorkspace);
      setUsers(updatedUsers);
      setTasks(updatedTasks);
      persistState(
        updatedUsers,
        updatedWorkspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );
    },
    [currentUser.id, workspace, users, tasks, activities, notifications, persistState]
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const openTaskModal = useCallback(
    (taskId: string, tab: "details" | "activity" | "git" = "details") => {
      setActiveTaskId(taskId);
      setSlideOverTab(tab);
    },
    []
  );

  const closeTaskModal = useCallback(() => {
    setActiveTaskId(null);
  }, []);

  const openCreateTaskModal = useCallback(
    (boardId?: string, groupId?: string, defaultDueDate?: Date | null) => {
      setCreateTaskDefaultBoardId(boardId);
      setCreateTaskDefaultGroupId(groupId);
      setCreateTaskDefaultDueDate(defaultDueDate);
      setIsCreateTaskOpen(true);
    },
    []
  );

  const closeCreateTaskModal = useCallback(() => {
    setIsCreateTaskOpen(false);
    setCreateTaskDefaultBoardId(undefined);
    setCreateTaskDefaultGroupId(undefined);
    setCreateTaskDefaultDueDate(undefined);
  }, []);

  const openInviteMemberModal = useCallback(() => {
    setIsInviteMemberOpen(true);
  }, []);

  const closeInviteMemberModal = useCallback(() => {
    setIsInviteMemberOpen(false);
  }, []);

  const openInviteBoardModal = useCallback((boardId: string) => {
    setInviteBoardId(boardId);
    setIsInviteBoardModalOpen(true);
  }, []);

  const closeInviteBoardModal = useCallback(() => {
    setIsInviteBoardModalOpen(false);
    setInviteBoardId(null);
  }, []);

  const inviteToBoard = useCallback(
    async (
      boardId: string,
      email: string,
      role?: string
    ): Promise<{
      success: boolean;
      token?: string;
      inviteLink?: string;
      emailDelivery?: any;
    }> => {
      try {
        const res = await fetch(`/api/boards/${boardId}/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role, invitedById: currentUser.id }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          return {
            success: true,
            token: data.data.invitation.token,
            inviteLink: data.data.inviteLink,
            emailDelivery: data.data.emailDelivery,
          };
        }
        return { success: false };
      } catch {
        return { success: false };
      }
    },
    [currentUser.id]
  );

  const acceptBoardInvite = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/invitations/${token}/accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success && data.data?.board) {
          const updatedBoard = data.data.board;
          const acceptedUser = data.data.user;

          setBoards((prev) =>
            prev.map((b) =>
              b.id === updatedBoard.id
                ? { ...b, memberIds: updatedBoard.memberIds }
                : b
            )
          );

          if (acceptedUser) {
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === acceptedUser.id);
              return exists ? prev : [...prev, acceptedUser];
            });
          }

          // Direct sync to localStorage so next render won't revert
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.boards = (parsed.boards || []).map((b: any) =>
                b.id === updatedBoard.id
                  ? { ...b, memberIds: updatedBoard.memberIds }
                  : b
              );
              if (
                acceptedUser &&
                !parsed.users?.some((u: any) => u.id === acceptedUser.id)
              ) {
                parsed.users = [...(parsed.users || []), acceptedUser];
              }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
          } catch {}

          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const openCreateBoardModal = useCallback(() => setIsCreateBoardOpen(true), []);
  const closeCreateBoardModal = useCallback(() => setIsCreateBoardOpen(false), []);

  const openCreateFolderModal = useCallback(() => setIsCreateFolderOpen(true), []);
  const closeCreateFolderModal = useCallback(() => setIsCreateFolderOpen(false), []);

  const openCreateDashboardModal = useCallback(() => setIsCreateDashboardOpen(true), []);
  const closeCreateDashboardModal = useCallback(() => setIsCreateDashboardOpen(false), []);

  const createFolder = useCallback((name: string, color?: string) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      color: color || "text-zinc-400",
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const createBoard = useCallback(
    async (data: {
      name: string;
      description?: string;
      color?: string;
      folderId?: string;
    }): Promise<Board> => {
      try {
        const res = await fetch("/api/boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description || "",
            color: data.color || "#3b82f6",
            ownerId: currentUser.id,
          }),
        });
        const result = await res.json();
        if (result?.success && result?.data) {
          const newBoard: Board = result.data;
          setBoards((prev) => {
            if (prev.some((b) => b.id === newBoard.id)) return prev;
            return [...prev, newBoard];
          });
          return newBoard;
        }
      } catch (err) {
        console.error("Failed to create board on API:", err);
      }

      const fallbackBoard: Board = {
        id: `board-${Date.now()}`,
        name: data.name,
        description: data.description || "",
        type: "project",
        workspaceId: workspace.id,
        ownerId: currentUser.id,
        color: data.color || "bg-blue-500",
        groupIds: [],
        memberIds: [currentUser.id],
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBoards((prev) => [...prev, fallbackBoard]);
      return fallbackBoard;
    },
    [currentUser.id, workspace.id]
  );

  const getTasksByAssignee = useCallback(
    (userId: string) =>
      tasks.filter(
        (t) =>
          t.assigneeId === userId &&
          !t.isArchived &&
          t.status !== "done" &&
          t.status !== "cancelled"
      ),
    [tasks]
  );

  const getTasksByBoard = useCallback(
    (boardId: string) =>
      tasks.filter((t) => t.boardId === boardId && !t.isArchived),
    [tasks]
  );

  const getTasksByGroup = useCallback(
    (groupId: string) =>
      tasks
        .filter((t) => t.groupId === groupId && !t.isArchived)
        .sort((a, b) => a.order - b.order),
    [tasks]
  );

  const getMyTasks = useCallback(() => {
    return tasks.filter(
      (t) =>
        t.assigneeId === currentUser.id &&
        !t.isArchived &&
        t.status !== "done" &&
        t.status !== "cancelled"
    );
  }, [tasks, currentUser.id]);

  const getWorkspaceStats = useCallback(() => {
    const userTasks = tasks.filter(
      (t) => t.assigneeId === currentUser.id && !t.isArchived
    );
    return {
      totalAssigned: userTasks.length,
      inProgress: userTasks.filter(
        (t) => t.status === "in_progress" || t.status === "in_review"
      ).length,
      completed: userTasks.filter(
        (t) => t.status === "done" || t.status === "approved"
      ).length,
      overdue: userTasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < new Date() &&
          t.status !== "done" &&
          t.status !== "approved" &&
          t.status !== "cancelled"
      ).length,
    };
  }, [tasks, currentUser.id]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(
      (n) => n.userId === currentUser.id && !n.isRead
    ).length;
  }, [notifications, currentUser.id]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      workspace,
      boards,
      groups,
      tasks,
      subtasks,
      comments,
      activities,
      notifications,
      unreadNotificationCount,

      activeTaskId,
      slideOverTab,
      setSlideOverTab,
      isCreateTaskOpen,
      createTaskDefaultBoardId,
      createTaskDefaultGroupId,
      createTaskDefaultDueDate,
      isInviteMemberOpen,

      isAuthenticated,
      login,
      register,
      logout,
      switchUser,
      assignTask,
      updateTaskStatus,
      updateTaskPriority,
      updateTaskDueDate,
      updateTaskField,
      updateTaskDetails,
      createTask,
      deleteTask,
      voteItem,

      addGroup,
      deleteGroup,
      toggleGroupCollapse,

      toggleSubtask,
      addSubtask,
      addComment,

      inviteMember,
      updateMemberRole,
      removeMember,

      markNotificationAsRead,
      markAllNotificationsAsRead,

      openTaskModal,
      closeTaskModal,
      openCreateTaskModal,
      closeCreateTaskModal,
      openInviteMemberModal,
      closeInviteMemberModal,

      // Board, Folder & Dashboard
      isCreateBoardOpen,
      openCreateBoardModal,
      closeCreateBoardModal,
      isCreateFolderOpen,
      openCreateFolderModal,
      closeCreateFolderModal,
      isCreateDashboardOpen,
      openCreateDashboardModal,
      closeCreateDashboardModal,
      createBoard,
      folders,
      createFolder,

      isInviteBoardModalOpen,
      inviteBoardId,
      openInviteBoardModal,
      closeInviteBoardModal,
      inviteToBoard,
      acceptBoardInvite,

      getUserById,
      getTasksByAssignee,
      getTasksByBoard,
      getTasksByGroup,
      getMyTasks,
      getWorkspaceStats,
    }),
    [
      currentUser,
      users,
      workspace,
      boards,
      groups,
      tasks,
      subtasks,
      comments,
      activities,
      notifications,
      unreadNotificationCount,
      activeTaskId,
      slideOverTab,
      setSlideOverTab,
      isCreateTaskOpen,
      createTaskDefaultBoardId,
      createTaskDefaultGroupId,
      createTaskDefaultDueDate,
      isInviteMemberOpen,
      isCreateBoardOpen,
      openCreateBoardModal,
      closeCreateBoardModal,
      isCreateFolderOpen,
      openCreateFolderModal,
      closeCreateFolderModal,
      isCreateDashboardOpen,
      openCreateDashboardModal,
      closeCreateDashboardModal,
      createBoard,
      folders,
      createFolder,
      isInviteBoardModalOpen,
      inviteBoardId,
      openInviteBoardModal,
      closeInviteBoardModal,
      inviteToBoard,
      acceptBoardInvite,
      isAuthenticated,
      login,
      register,
      logout,
      switchUser,
      assignTask,
      updateTaskStatus,
      updateTaskPriority,
      updateTaskDueDate,
      updateTaskField,
      updateTaskDetails,
      createTask,
      deleteTask,
      voteItem,
      addGroup,
      deleteGroup,
      toggleGroupCollapse,
      toggleSubtask,
      addSubtask,
      addComment,
      inviteMember,
      updateMemberRole,
      removeMember,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      openTaskModal,
      closeTaskModal,
      openCreateTaskModal,
      closeCreateTaskModal,
      openInviteMemberModal,
      closeInviteMemberModal,
      getUserById,
      getTasksByAssignee,
      getTasksByBoard,
      getTasksByGroup,
      getMyTasks,
      getWorkspaceStats,
    ]
  );

  return (
    <WorkBoardContext.Provider value={value}>
      {children}
    </WorkBoardContext.Provider>
  );
}

export function useWorkBoard() {
  const context = useContext(WorkBoardContext);
  if (!context) {
    throw new Error("useWorkBoard must be used within a WorkBoardProvider");
  }
  return context;
}

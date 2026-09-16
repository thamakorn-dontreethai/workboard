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
  BoardPrivacy,
  Group,
  Task,
  Subtask,
  Comment,
  Activity,
  Notification,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { GROUP_COLOR_PALETTE } from "@/types";
import {
  MOCK_USERS,
  DEFAULT_USER,
  CURRENT_USER,
  MOCK_WORKSPACE,
  MOCK_WORKSPACES,
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
  workspaces: Workspace[];
  boards: Board[];
  groups: Group[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  activities: Activity[];
  notifications: Notification[];
  unreadNotificationCount: number;

  // Multi-Workspace & Management
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (data: {
    name: string;
    description?: string;
    privacy?: "open" | "closed";
    avatarColor?: string;
  }) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<Workspace>
  ) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  togglePinWorkspace: (workspaceId: string) => Promise<void>;

  // Workspace Modals
  isBrowseWorkspacesOpen: boolean;
  openBrowseWorkspacesModal: () => void;
  closeBrowseWorkspacesModal: () => void;
  isCreateWorkspaceOpen: boolean;
  openCreateWorkspaceModal: () => void;
  closeCreateWorkspaceModal: () => void;

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
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    teamName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
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
  }) => Promise<Task>;
  lastCreatedTaskId: string | null;
  clearLastCreatedTaskId: () => void;
  deleteTask: (taskId: string) => void;
  moveTaskToGroup: (taskId: string, newGroupId: string) => void;
  voteItem: (taskId: string) => void;

  // Actions - Groups
  addGroup: (boardId: string, name: string, color?: string) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, "name" | "color">>) => void;
  reorderGroups: (boardId: string, orderedGroupIds: string[]) => void;
  deleteGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;

  // Actions - Subtasks & Comments
  toggleSubtask: (subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;

  // Actions - Members & Workspace
  inviteMember: (member: {
    name: string;
    email: string;
    role: "owner" | "admin" | "member" | "viewer";
  }) => Promise<{ user: User; inviteLink?: string } | null>;
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
    privacy?: BoardPrivacy;
    itemLabel?: string;
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
// Not the source of truth for workspace data (the database is) — just a
// per-browser convenience remembering which workspace tab was last open,
// so a refresh doesn't always dump you back on the first one.
const ACTIVE_WORKSPACE_KEY = "workboard_active_workspace_id";

const DUMMY_USER_IDS = ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"];
const DUMMY_USER_NAMES = ["Alex Morgan", "Sarah Chen", "Marcus Vance", "Elena Rostova", "David Kim", "Priya Patel"];

function isRealUser(u: User): boolean {
  return !DUMMY_USER_IDS.includes(u.id) && !DUMMY_USER_NAMES.includes(u.name);
}

export function WorkBoardProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [workspace, setWorkspace] = useState<Workspace>(MOCK_WORKSPACE);
  const [boards, setBoards] = useState<Board[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // The most recently created task, so the board table can highlight it and
  // drop straight into inline title-editing — matches monday.com's "New
  // item" behavior instead of silently adding a row nobody notices.
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);

  // Workspace Modals State
  const [isBrowseWorkspacesOpen, setIsBrowseWorkspacesOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // True once BOTH the localStorage-restore effect and the database fetch
  // below have run at least once. AppShell must wait for this before
  // deciding to redirect to /login — otherwise it sees the default
  // isAuthenticated=false on first mount and bounces an already-logged-in
  // user out before the session is restored.
  const [isLocalHydrated, setIsLocalHydrated] = useState<boolean>(false);
  const [isServerHydrated, setIsServerHydrated] = useState<boolean>(false);
  const isHydrated = isLocalHydrated && isServerHydrated;

  // ─── Workspaces, boards, groups, tasks, comments, subtasks, activities:
  // hydrate from the database ─────────────────────────────────────────────
  // None of these are read from localStorage anymore — the database is the
  // source of truth, so a refresh (or a different browser/device) shows
  // the real current state instead of whatever this one browser cached.
  useEffect(() => {
    let cancelled = false;

    async function hydrateFromServer() {
      try {
        let activeWorkspaceIdHint: string | null = null;
        try {
          activeWorkspaceIdHint = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
        } catch {
          // ignore — localStorage unavailable
        }

        const [wsRes, boardsRes, groupsRes, tasksRes, commentsRes, subtasksRes, activitiesRes] =
          await Promise.all([
            fetch("/api/workspaces").then((r) => r.json()).catch(() => null),
            fetch("/api/boards").then((r) => r.json()).catch(() => null),
            fetch("/api/groups").then((r) => r.json()).catch(() => null),
            fetch("/api/tasks").then((r) => r.json()).catch(() => null),
            fetch("/api/comments").then((r) => r.json()).catch(() => null),
            fetch("/api/subtasks").then((r) => r.json()).catch(() => null),
            fetch("/api/activities").then((r) => r.json()).catch(() => null),
          ]);

        if (cancelled) return;

        if (wsRes?.success && Array.isArray(wsRes.workspaces) && wsRes.workspaces.length > 0) {
          const list: Workspace[] = wsRes.workspaces;
          setWorkspaces(list);
          const preferred = activeWorkspaceIdHint
            ? list.find((w) => w.id === activeWorkspaceIdHint)
            : undefined;
          setWorkspace(preferred || wsRes.data || list[0]);
        }

        if (boardsRes?.success && Array.isArray(boardsRes.data)) {
          setBoards(boardsRes.data);
        }

        if (groupsRes?.success && Array.isArray(groupsRes.data)) {
          setGroups(groupsRes.data);
        }

        if (tasksRes?.success && Array.isArray(tasksRes.data)) {
          setTasks(
            tasksRes.data.map((t: Task) => ({
              ...t,
              dueDate: t.dueDate ? new Date(t.dueDate) : null,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            }))
          );
        }

        if (commentsRes?.success && Array.isArray(commentsRes.data)) {
          setComments(
            commentsRes.data.map((c: Comment) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            }))
          );
        }

        if (subtasksRes?.success && Array.isArray(subtasksRes.data)) {
          setSubtasks(
            subtasksRes.data.map((s: Subtask) => ({
              ...s,
              dueDate: s.dueDate ? new Date(s.dueDate) : null,
              createdAt: new Date(s.createdAt),
              updatedAt: new Date(s.updatedAt),
            }))
          );
        }

        if (activitiesRes?.success && Array.isArray(activitiesRes.data)) {
          setActivities(
            activitiesRes.data.map((a: Activity) => ({
              ...a,
              createdAt: new Date(a.createdAt),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to hydrate board data from the database:", err);
      } finally {
        if (!cancelled) setIsServerHydrated(true);
      }
    }

    hydrateFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Notifications: hydrate per-user once the signed-in user is known ────
  // Runs again whenever the user changes (login/switch), not just once on
  // mount — unlike workspaces/boards/tasks, this data IS user-specific.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    let cancelled = false;

    fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;
        setNotifications(
          res.data.map((n: Notification) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }))
        );
      })
      .catch((err) => console.error("Failed to hydrate notifications:", err));

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.id]);

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
        // Workspaces, boards, groups, tasks, comments, subtasks,
        // activities and notifications now all come from the database
        // (see the hydrateFromServer / notifications effects above) — not
        // restored from here.
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLocalHydrated(true);
    }
  }, []);

  const persistState = useCallback(
    // Everything except auth (isAuthenticated/currentUserId/users) is
    // accepted here only so every one of this function's many call sites
    // keeps working unchanged — none of it is written to localStorage
    // anymore. The database is the source of truth for workspaces, boards,
    // groups, tasks, comments, subtasks, activities and notifications now
    // (see the hydrateFromServer / notifications effects above); writing
    // them here too would just be stale data nothing ever reads back.
    (
      newUsers: User[],
      _newWorkspace: Workspace,
      _newTasks: Task[],
      _newActivities: Activity[],
      _newNotifications: Notification[],
      currUser: User,
      _newGroups?: Group[],
      _newBoards?: Board[],
      authenticated?: boolean,
      _newWorkspaces?: Workspace[]
    ) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: authenticated ?? true,
            currentUserId: currUser.id,
            users: newUsers,
          })
        );
      } catch {
        // ignore
      }
    },
    []
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

          const isMember = workspace.members.some((m) => m.userId === loggedInUser.id);
          const userRole = (loggedInUser.role?.toLowerCase().includes("owner") || loggedInUser.role?.toLowerCase().includes("admin") || workspace.members.length === 0)
            ? ("owner" as const)
            : ("member" as const);
          const updatedWorkspace: Workspace = isMember
            ? workspace
            : {
                ...workspace,
                members: [
                  ...workspace.members,
                  {
                    userId: loggedInUser.id,
                    workspaceId: workspace.id,
                    role: userRole,
                    joinedAt: new Date(),
                  },
                ],
              };
          setWorkspace(updatedWorkspace);

          // Persist auth session to localStorage
          persistState(newUsers, updatedWorkspace, tasks, activities, notifications, loggedInUser, groups, boards, true);
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
      teamName?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...userData,
            role: userData.role || "Workspace Owner",
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const newUser: User = data.data;
          setCurrentUser(newUser);
          setIsAuthenticated(true);
          const newUsers = [...users.filter((u) => u.id !== newUser.id), newUser];
          setUsers(newUsers);

          // Give the registered user ownership of their team
          const teamTitle = userData.teamName || `${newUser.name}'s Team`;
          const updatedWorkspace: Workspace = {
            ...workspace,
            name: teamTitle,
            members: [
              ...workspace.members.filter((m) => m.userId !== newUser.id),
              {
                userId: newUser.id,
                workspaceId: workspace.id,
                role: "owner",
                joinedAt: new Date(),
              },
            ],
          };
          setWorkspace(updatedWorkspace);

          // Persist auth session to localStorage
          persistState(newUsers, updatedWorkspace, tasks, activities, notifications, newUser, groups, boards, true);
          return { success: true };
        }
        return { success: false, error: data.error || "Registration failed" };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
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

      fetch(`/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId, actorId: currentUser.id }),
      }).catch((err) => console.error("Failed to persist assignee:", err));
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, groupId: newGroupId, actorId: currentUser.id }),
      }).catch((err) => console.error("Failed to persist status:", err));
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority, actorId: currentUser.id }),
      }).catch((err) => console.error("Failed to persist priority:", err));
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate, groupId: newGroupId, actorId: currentUser.id }),
      }).catch((err) => console.error("Failed to persist due date:", err));
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      }).catch((err) => console.error(`Failed to persist ${String(field)}:`, err));
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) => console.error("Failed to persist task details:", err));
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
    async (newTaskData: {
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
    }): Promise<Task> => {
      const status =
        newTaskData.status ||
        (newTaskData.boardId === "board-requests" ? "new_request" : "todo");

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskData.title.trim(),
          description: newTaskData.description || "",
          boardId: newTaskData.boardId,
          groupId: newTaskData.groupId,
          assigneeId: newTaskData.assigneeId || null,
          priority: newTaskData.priority || "medium",
          status,
          dueDate: newTaskData.dueDate || null,
          category: newTaskData.category || "General",
          reporterId: currentUser.id,
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create task");
      }
      // The server doesn't persist timeline/tags/votes (no columns for them
      // yet) — keep them client-side on top of the server's real record so
      // the UI doesn't regress while that's still a gap.
      const newTask: Task = {
        ...result.data,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
        timeline: newTaskData.timeline || null,
        votes: 0,
        tags: newTaskData.tags || [],
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
      setLastCreatedTaskId(newTask.id);
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

  const clearLastCreatedTaskId = useCallback(() => {
    setLastCreatedTaskId(null);
  }, []);

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

      fetch(`/api/tasks/${taskId}`, { method: "DELETE" }).catch((err) =>
        console.error("Failed to delete task:", err)
      );
    },
    [tasks, activeTaskId, users, workspace, activities, notifications, currentUser, persistState]
  );

  const moveTaskToGroup = useCallback(
    (taskId: string, newGroupId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.groupId === newGroupId) return;

      const newOrder = tasks.filter((t) => t.groupId === newGroupId).length;
      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? { ...t, groupId: newGroupId, order: newOrder, updatedAt: new Date() }
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

      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: newGroupId, order: newOrder, actorId: currentUser.id }),
      }).catch((err) => console.error("Failed to persist group move:", err));
    },
    [tasks, users, workspace, activities, notifications, currentUser, persistState]
  );

  // Group Management
  const addGroup = useCallback(
    async (boardId: string, name: string, color?: string) => {
      const siblingGroups = groups.filter((g) => g.boardId === boardId);
      // Pick a color that isn't already used by a sibling group on this
      // board, so newly-created groups don't all end up the same shade.
      // Falls back to cycling through the palette once every color is taken.
      const usedColors = new Set(siblingGroups.map((g) => g.color));
      const nextColor =
        color ||
        GROUP_COLOR_PALETTE.find((c) => !usedColors.has(c)) ||
        GROUP_COLOR_PALETTE[siblingGroups.length % GROUP_COLOR_PALETTE.length];

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, name: name.trim() || "New Group", color: nextColor }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create group");
      }
      const newGroup: Group = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
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

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<Pick<Group, "name" | "color">>) => {
      const updatedGroups = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ...(updates.name !== undefined
                ? { name: updates.name.trim() || g.name }
                : {}),
              ...(updates.color !== undefined ? { color: updates.color } : {}),
            }
          : g
      );
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

      fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) => console.error("Failed to persist group update:", err));
    },
    [groups, users, workspace, tasks, activities, notifications, currentUser, persistState]
  );

  const reorderGroups = useCallback(
    (boardId: string, orderedGroupIds: string[]) => {
      const orderIndex = new Map(orderedGroupIds.map((id, index) => [id, index]));
      const updatedGroups = groups.map((g) =>
        g.boardId === boardId && orderIndex.has(g.id)
          ? { ...g, order: orderIndex.get(g.id)! }
          : g
      );
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

      orderedGroupIds.forEach((id, index) => {
        fetch(`/api/groups/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        }).catch((err) => console.error("Failed to persist group order:", err));
      });
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

      fetch(`/api/groups/${groupId}`, { method: "DELETE" }).catch((err) =>
        console.error("Failed to delete group:", err)
      );
    },
    [groups, tasks, users, workspace, activities, notifications, currentUser, persistState]
  );

  const toggleGroupCollapse = useCallback(
    (groupId: string) => {
      const target = groups.find((g) => g.id === groupId);
      if (!target) return;
      const isCollapsed = !target.isCollapsed;

      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, isCollapsed } : g))
      );

      fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCollapsed }),
      }).catch((err) => console.error("Failed to persist group collapse:", err));
    },
    [groups]
  );

  const toggleSubtask = useCallback(
    (subtaskId: string) => {
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtaskId
            ? { ...s, isCompleted: !s.isCompleted, updatedAt: new Date() }
            : s
        )
      );

      const taskId = subtasks.find((s) => s.id === subtaskId)?.taskId;
      fetch(`/api/tasks/${taskId || "unknown"}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId }),
      }).catch((err) => console.error("Failed to persist subtask toggle:", err));
    },
    [subtasks]
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      if (!title.trim()) return;

      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create subtask");
      }
      const newSub: Subtask = {
        ...result.data,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
      setSubtasks((prev) => [...prev, newSub]);
    },
    []
  );

  const addComment = useCallback(
    async (taskId: string, content: string) => {
      if (!content.trim()) return;

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), authorId: currentUser.id }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to add comment");
      }
      const newComment: Comment = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
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
          let inviteLink = "";
          try {
            const inviteRes = await fetch(`/api/boards/${targetBoardId}/invite`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.email,
                role: data.role === "admin" ? "Project Lead" : "Member",
                invitedById: currentUser.id,
              }),
            });
            const inviteJson = await inviteRes.json();
            if (inviteJson?.data?.inviteLink) {
              inviteLink = inviteJson.data.inviteLink;
            }
          } catch (e) {
            console.warn("Board invite link fallback:", e);
          }

          if (!inviteLink) {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            inviteLink = `${origin}/register?email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;
          }

          const updatedWorkspace: Workspace = {
            ...workspace,
            members: [
              ...workspace.members.filter((m) => m.userId !== newUser.id),
              {
                userId: newUser.id,
                workspaceId: workspace.id,
                role: data.role,
                joinedAt: new Date(),
              },
            ],
          };
          setWorkspace(updatedWorkspace);
          persistState(
            [...users.filter((u) => u.id !== newUser.id && isRealUser(u)), newUser],
            updatedWorkspace,
            tasks,
            activities,
            notifications,
            currentUser
          );

          return { user: newUser, inviteLink };
        }
      } catch (err) {
        console.error("Failed to create member via API:", err);
      }
      return null;
    },
    [boards, currentUser, workspace, users, tasks, activities, notifications, persistState]
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

    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch((err) =>
      console.error("Failed to persist notification read state:", err)
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id }),
    }).catch((err) => console.error("Failed to persist notifications read state:", err));
  }, [currentUser.id]);

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

  // Multi-Workspace Modals & Handlers
  const openBrowseWorkspacesModal = useCallback(() => setIsBrowseWorkspacesOpen(true), []);
  const closeBrowseWorkspacesModal = useCallback(() => setIsBrowseWorkspacesOpen(false), []);

  const openCreateWorkspaceModal = useCallback(() => setIsCreateWorkspaceOpen(true), []);
  const closeCreateWorkspaceModal = useCallback(() => setIsCreateWorkspaceOpen(false), []);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (target) {
        setWorkspace(target);
        try {
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
        } catch {
          // ignore — localStorage unavailable
        }
        // Best-effort: record the view server-side too, so lastViewedAt is
        // meaningful if it's ever surfaced (e.g. "recently viewed"). Not
        // awaited — switching tabs shouldn't wait on a network round trip.
        fetch(`/api/workspaces/${workspaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastViewedAt: new Date() }),
        }).catch(() => {
          // non-critical — ignore
        });
      }
    },
    [workspaces]
  );

  const createWorkspace = useCallback(
    async (data: {
      name: string;
      description?: string;
      privacy?: "open" | "closed";
      avatarColor?: string;
      icon?: string;
      coverColor?: string;
    }): Promise<Workspace> => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, creatorId: currentUser.id }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create workspace");
      }
      const newWs: Workspace = result.data;

      setWorkspaces((prev) => [...prev, newWs]);
      setWorkspace(newWs);
      try {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, newWs.id);
      } catch {
        // ignore — localStorage unavailable
      }
      return newWs;
    },
    [currentUser]
  );

  const updateWorkspace = useCallback(
    async (workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to update workspace");
      }
      const updated: Workspace = result.data;

      setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? updated : w)));
      setWorkspace((prev) => (prev.id === workspaceId ? updated : prev));
      return updated;
    },
    []
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: string): Promise<boolean> => {
      if (workspaces.length <= 1) return false;

      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result?.success) {
        throw new Error(result?.error || "Failed to delete workspace");
      }

      const updatedList = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(updatedList);
      const newActive = updatedList[0];
      setWorkspace(newActive);
      try {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, newActive.id);
      } catch {
        // ignore — localStorage unavailable
      }
      return true;
    },
    [workspaces]
  );

  const togglePinWorkspace = useCallback(
    async (workspaceId: string): Promise<void> => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "togglePin" }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to toggle pin");
      }
      const updated: Workspace = result.data;

      setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? updated : w)));
      setWorkspace((prev) => (prev.id === workspaceId ? updated : prev));
    },
    []
  );

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
      privacy?: BoardPrivacy;
      itemLabel?: string;
    }): Promise<Board> => {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
          color: data.color || "#3b82f6",
          ownerId: currentUser.id,
          workspaceId: workspace.id,
          privacy: data.privacy || "main",
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create board");
      }
      const createdBoard: Board = result.data;

      const now = Date.now();

      // Always pin the board to the workspace it was created from. The
      // server also creates a starter "Active Items" group — replaced
      // below with a richer client-side starter layout until groups/tasks
      // move to the database too (next phase).
      const newBoard: Board = {
        ...createdBoard,
        workspaceId: workspace.id,
        privacy: data.privacy || "main",
        groupIds: [],
      };

      // Start like monday.com: two "Group Title" groups holding 3 + 2 starter items
      const newGroups: Group[] = ["#579bfc", "#a25ddc"].map((color, i) => ({
        id: `group-${now}-${i}`,
        boardId: newBoard.id,
        name: "Group Title",
        color,
        order: i,
        isCollapsed: false,
        taskIds: [],
        createdAt: new Date(),
      }));

      const itemLabel = data.itemLabel?.trim() || "Item";
      const starterStatuses: TaskStatus[] = ["in_progress", "done", "todo", "todo", "todo"];
      const newTasks: Task[] = starterStatuses.map((status, i) => {
        const group = newGroups[i < 3 ? 0 : 1];
        const task: Task = {
          id: `task-${now}-${i}`,
          itemCode: `WB-${Math.floor(Math.random() * 900) + 100}`,
          boardId: newBoard.id,
          groupId: group.id,
          title: `${itemLabel} ${i + 1}`,
          description: "",
          status,
          priority: "medium",
          assigneeId: null,
          reporterId: currentUser.id,
          dueDate: new Date(now + (i + 2) * 24 * 60 * 60 * 1000),
          category: "General",
          timeline: null,
          votes: 0,
          tags: [],
          subtaskIds: [],
          commentIds: [],
          attachmentIds: [],
          activityIds: [],
          order: group.taskIds.length,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        group.taskIds.push(task.id);
        return task;
      });

      newBoard.groupIds = newGroups.map((g) => g.id);

      const updatedBoards = [...boards.filter((b) => b.id !== newBoard.id), newBoard];
      const updatedGroups = [...groups.filter((g) => g.boardId !== newBoard.id), ...newGroups];
      const updatedTasks = [...newTasks, ...tasks];

      setBoards(updatedBoards);
      setGroups(updatedGroups);
      setTasks(updatedTasks);

      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser,
        updatedGroups,
        updatedBoards
      );

      return newBoard;
    },
    [currentUser, workspace, boards, groups, users, tasks, activities, notifications, persistState]
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

  const value = useMemo<WorkBoardContextType>(
    () => ({
      currentUser,
      users,
      workspace,
      workspaces,
      boards,
      groups,
      tasks,
      subtasks,
      comments,
      activities,
      notifications,
      unreadNotificationCount,

      // Multi-Workspace
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      togglePinWorkspace,

      // Workspace Modals
      isBrowseWorkspacesOpen,
      openBrowseWorkspacesModal,
      closeBrowseWorkspacesModal,
      isCreateWorkspaceOpen,
      openCreateWorkspaceModal,
      closeCreateWorkspaceModal,

      activeTaskId,
      slideOverTab,
      setSlideOverTab,
      isCreateTaskOpen,
      createTaskDefaultBoardId,
      createTaskDefaultGroupId,
      createTaskDefaultDueDate,
      isInviteMemberOpen,

      isAuthenticated,
      isHydrated,
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
      lastCreatedTaskId,
      clearLastCreatedTaskId,
      deleteTask,
      moveTaskToGroup,
      voteItem,

      addGroup,
      updateGroup,
      reorderGroups,
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
      workspaces,
      boards,
      groups,
      tasks,
      subtasks,
      comments,
      activities,
      notifications,
      unreadNotificationCount,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      togglePinWorkspace,
      isBrowseWorkspacesOpen,
      openBrowseWorkspacesModal,
      closeBrowseWorkspacesModal,
      isCreateWorkspaceOpen,
      openCreateWorkspaceModal,
      closeCreateWorkspaceModal,
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
      isHydrated,
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
      lastCreatedTaskId,
      clearLastCreatedTaskId,
      deleteTask,
      moveTaskToGroup,
      voteItem,
      addGroup,
      updateGroup,
      reorderGroups,
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

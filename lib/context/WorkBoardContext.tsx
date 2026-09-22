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
  PersonalTodo,
  Folder,
  Dashboard,
  DashboardWidgetId,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { GROUP_COLOR_PALETTE } from "@/types";
import {
  resolveBoardRole,
  roleCan,
  type BoardAction,
} from "@/lib/utils/permissions";
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
  refreshWorkspaces: () => void;
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
  slideOverTab: "details" | "activity";
  setSlideOverTab: (tab: "details" | "activity") => void;
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
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Actions - Tasks & Items
  assignTask: (taskId: string, newAssigneeIds: string[]) => void;
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
    assigneeIds?: string[];
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
  deleteTasks: (taskIds: string[]) => void;
  moveTaskToGroup: (taskId: string, newGroupId: string) => void;
  moveTasksToGroup: (taskIds: string[], newGroupId: string) => void;
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
  addComment: (
    taskId: string,
    content: string,
    attachments?: { name: string; size: number; mimeType: string; url: string }[]
  ) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

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
  removeMembers: (userIds: string[]) => Promise<void>;

  // Actions - Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Personal To-Dos (private, per-user, not tied to any workspace/board)
  personalTodos: PersonalTodo[];
  createPersonalTodo: (data: {
    title: string;
    notes?: string;
    dueAt?: Date | null;
    reminderMinutesBefore?: number;
  }) => Promise<PersonalTodo>;
  updatePersonalTodo: (
    id: string,
    updates: Partial<
      Pick<PersonalTodo, "title" | "notes" | "dueAt" | "reminderMinutesBefore" | "isCompleted">
    >
  ) => void;
  toggleTodoComplete: (id: string) => void;
  deletePersonalTodo: (id: string) => void;

  // Modal Triggers
  openTaskModal: (taskId: string, tab?: "details" | "activity") => void;
  closeTaskModal: () => void;
  openCreateTaskModal: (boardId?: string, groupId?: string, defaultDueDate?: Date | null) => void;

  // Permissions (mirrors the server's rules in lib/utils/permissions.ts).
  // Use these to hide/disable what the signed-in person can't do; the API
  // enforces the same rules regardless.
  canDo: (action: BoardAction, boardId: string, task?: Task) => boolean;
  // True when the signed-in person is an owner/admin of the active workspace.
  isWorkspaceLeader: boolean;
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
  updateBoard: (
    boardId: string,
    updates: Partial<Pick<Board, "name" | "description" | "color">> & { folderId?: string | null }
  ) => void;
  deleteBoard: (boardId: string) => void;
  folders: Folder[];
  createFolder: (name: string, color?: string) => Promise<Folder>;
  updateFolder: (
    folderId: string,
    updates: Partial<Pick<Folder, "name" | "color">>
  ) => void;
  toggleFolderCollapse: (folderId: string) => void;
  emptyFolder: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  dashboards: Dashboard[];
  createDashboard: (data: {
    name: string;
    description?: string;
    widgets?: DashboardWidgetId[];
  }) => Promise<Dashboard>;
  deleteDashboard: (dashboardId: string) => void;

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

  updateNotificationPreferences: (updates: {
    notifyPostLikes?: boolean;
    notifyPostComments?: boolean;
    notifyNewPosts?: boolean;
  }) => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarColor?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;

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

// Free alternative to a real-time backend (WebSocket/SSE would need a
// persistent server process, which this app's serverless API routes don't
// have): just silently re-fetch on an interval so other people's changes —
// and new notifications — show up without a manual refresh. Paused while
// the tab is hidden so a background tab doesn't keep polling for nothing.
const POLL_INTERVAL_MS = 15000;

// Stand-in for "this user has no workspace at all" (a brand-new,
// not-yet-invited account, or right after logging out). `id: ""` can
// never collide with a real workspace id, so anything that filters
// boards/folders/activities by `workspaceId === workspace.id` naturally
// comes up empty instead of accidentally matching whatever workspace
// happened to be active before — the bug this used to have.
const EMPTY_WORKSPACE: Workspace = {
  id: "",
  name: "No Workspace",
  description: "",
  plan: "Free",
  privacy: "closed",
  avatarColor: "bg-zinc-600",
  isPinned: false,
  members: [],
  createdAt: new Date(),
};

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
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>([]);
  // The most recently created task, so the board table can highlight it and
  // drop straight into inline title-editing — matches monday.com's "New
  // item" behavior instead of silently adding a row nobody notices.
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState<string | null>(null);

  // Workspace Modals State
  const [isBrowseWorkspacesOpen, setIsBrowseWorkspacesOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  // Modal State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [slideOverTab, setSlideOverTab] = useState<"details" | "activity">("details");
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

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

    // A single failed request (dev-server recompile, cold serverless start,
    // brief DB hiccup) used to leave that slice empty until the next manual
    // refresh — e.g. every comment "vanishing". Retry once before giving up.
    async function fetchSlice(url: string) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const json = await fetch(url).then((r) => r.json());
          if (json?.success) return json;
        } catch {
          // fall through to the retry
        }
        if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
      }
      return null;
    }

    async function hydrateFromServer() {
      try {
        // Workspaces are hydrated separately, once the signed-in user is
        // known — see the per-user effect below. Fetching them here
        // unconditionally used to return every workspace in the database,
        // including ones this user was never invited to.
        const [boardsRes, groupsRes, tasksRes, commentsRes, subtasksRes, activitiesRes, foldersRes, dashboardsRes] =
          await Promise.all([
            fetchSlice("/api/boards"),
            fetchSlice("/api/groups"),
            fetchSlice("/api/tasks"),
            fetchSlice("/api/comments"),
            fetchSlice("/api/subtasks"),
            fetchSlice("/api/activities"),
            fetchSlice("/api/folders"),
            fetchSlice("/api/dashboards"),
          ]);

        if (cancelled) return;

        if (boardsRes?.success && Array.isArray(boardsRes.data)) {
          setBoards(boardsRes.data);
        }

        if (groupsRes?.success && Array.isArray(groupsRes.data)) {
          setGroups(groupsRes.data);
        }

        if (foldersRes?.success && Array.isArray(foldersRes.data)) {
          setFolders(
            foldersRes.data.map((f: Folder) => ({
              ...f,
              createdAt: new Date(f.createdAt),
              updatedAt: new Date(f.updatedAt),
            }))
          );
        }

        if (dashboardsRes?.success && Array.isArray(dashboardsRes.data)) {
          setDashboards(
            dashboardsRes.data.map((d: Dashboard) => ({
              ...d,
              createdAt: new Date(d.createdAt),
              updatedAt: new Date(d.updatedAt),
            }))
          );
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
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") hydrateFromServer();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Workspaces, notifications, personal to-dos: hydrate per-user once ───
  // the signed-in user is known. Runs again whenever the user changes
  // (login/switch), not just once on mount — unlike boards/tasks (which
  // aren't scoped per-user yet), this data IS user-specific: workspaces in
  // particular must only include ones this user is actually a member of.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    let cancelled = false;

    function hydratePerUser() {
      let activeWorkspaceIdHint: string | null = null;
      try {
        activeWorkspaceIdHint = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      } catch {
        // ignore — localStorage unavailable
      }

      fetch(`/api/workspaces?userId=${encodeURIComponent(currentUser!.id)}`)
        .then((r) => r.json())
        .then((res) => {
          if (cancelled || !res?.success || !Array.isArray(res.workspaces)) return;
          const list: Workspace[] = res.workspaces;
          setWorkspaces(list);
          if (list.length > 0) {
            const preferred = activeWorkspaceIdHint
              ? list.find((w) => w.id === activeWorkspaceIdHint)
              : undefined;
            setWorkspace(preferred || res.data || list[0]);
          } else {
            // This user genuinely has no workspace — without this, `workspace`
            // keeps whatever was active before (a previous account's, on a
            // shared browser/tab), and every "current workspace" filter
            // elsewhere would keep matching it.
            setWorkspace(EMPTY_WORKSPACE);
          }
        })
        .catch((err) => console.error("Failed to hydrate workspaces:", err));

      fetch(`/api/notifications?userId=${encodeURIComponent(currentUser!.id)}`)
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

      fetch(`/api/todos?userId=${encodeURIComponent(currentUser!.id)}`)
        .then((r) => r.json())
        .then((res) => {
          if (cancelled || !res?.success || !Array.isArray(res.data)) return;
          setPersonalTodos(
            res.data.map((t: PersonalTodo) => ({
              ...t,
              dueAt: t.dueAt ? new Date(t.dueAt) : null,
              reminderSentAt: t.reminderSentAt ? new Date(t.reminderSentAt) : null,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            }))
          );
        })
        .catch((err) => console.error("Failed to hydrate personal to-dos:", err));
    }

    hydratePerUser();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") hydratePerUser();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, currentUser?.id]);

  // Re-fetches this user's workspace list on demand — e.g. the workspace
  // page calls this when the Member tab is opened, so a membership change
  // (someone accepting an invite from another device/session) shows up
  // without needing a full page reload. Unlike the initial hydration
  // above, this keeps whichever workspace is currently active rather than
  // jumping to the last-viewed one from localStorage.
  const refreshWorkspaces = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/workspaces?userId=${encodeURIComponent(currentUser.id)}`);
      const result = await res.json();
      if (!result?.success || !Array.isArray(result.workspaces)) return;
      const list: Workspace[] = result.workspaces;
      setWorkspaces(list);
      if (list.length > 0) {
        setWorkspace((prev) => list.find((w) => w.id === prev.id) || result.data || list[0]);
      } else {
        setWorkspace(EMPTY_WORKSPACE);
      }
    } catch (err) {
      console.error("Failed to refresh workspaces:", err);
    }
  }, [currentUser?.id]);

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

          // Deliberately create no workspace here — a brand-new account
          // starts with none. The per-user hydration effect will fetch
          // this user's real workspace list right after (correctly empty,
          // unless they registered via an invite link and then accept it,
          // in which case that workspace shows up once accepted). The
          // "Add workspace" / "Browse all" actions in the sidebar are how
          // they create or discover one from here. Also reset `workspace`
          // itself (not just the list) — otherwise it keeps whatever was
          // active before this account registered, e.g. someone else's
          // workspace left over from a previous session on this browser.
          setWorkspaces([]);
          setWorkspace(EMPTY_WORKSPACE);
          try {
            localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
          } catch {
            // ignore — localStorage unavailable
          }

          // Persist auth session to localStorage
          persistState(newUsers, workspace, tasks, activities, notifications, newUser, groups, boards, true);
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
    // Clear the signed session cookie too (it's HttpOnly, so only the server can).
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    // This used to leave `workspace`/`workspaces` untouched, so the next
    // person to sign in on this browser/tab (a different, unrelated
    // account) would see whatever workspace the previous session had
    // open — its boards, folders, and activity — until something else
    // happened to overwrite it.
    setWorkspaces([]);
    setWorkspace(EMPTY_WORKSPACE);
    // Clear auth session from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
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

  // The browser remembers "logged in" in localStorage, but API permissions
  // come from a signed cookie. If the two disagree (e.g. a login from before
  // the cookie existed, or an expired one), sign out so the person logs in
  // again instead of hitting silent "not allowed" errors.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => {
        if (!cancelled && res.status === 401) logout();
      })
      .catch(() => {
        // Offline / transient — keep the local session; the API still guards writes.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, logout]);

  const canDo = useCallback(
    (action: BoardAction, boardId: string, task?: Task) => {
      const board = boards.find((b) => b.id === boardId);
      if (!board) return false;
      const ws =
        workspaces.find((w) => w.id === board.workspaceId) ??
        (workspace.id === board.workspaceId ? workspace : undefined);
      return roleCan(resolveBoardRole(currentUser.id, board, ws), action, task, currentUser.id);
    },
    [boards, workspaces, workspace, currentUser.id]
  );

  const isWorkspaceLeader = workspace.members.some(
    (m) => m.userId === currentUser.id && (m.role === "owner" || m.role === "admin")
  );

  const updateNotificationPreferences = useCallback(
    async (updates: {
      notifyPostLikes?: boolean;
      notifyPostComments?: boolean;
      notifyNewPosts?: boolean;
    }) => {
      const updatedUser: User = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
      setUsers(updatedUsers);
      persistState(updatedUsers, workspace, tasks, activities, notifications, updatedUser);

      try {
        const res = await fetch(`/api/users/${currentUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const result = await res.json();
        if (!result?.success) throw new Error(result?.error);
      } catch (err) {
        console.error("Failed to save notification preferences:", err);
      }
    },
    [currentUser, users, workspace, tasks, activities, notifications, persistState]
  );

  const updateProfile = useCallback(
    async (updates: { name?: string; avatarColor?: string }) => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const result = await res.json();
        if (!result?.success) {
          return { success: false, error: result?.error || "Failed to update profile" };
        }
        const updatedUser: User = { ...currentUser, ...result.data };
        setCurrentUser(updatedUser);
        const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
        setUsers(updatedUsers);
        persistState(updatedUsers, workspace, tasks, activities, notifications, updatedUser);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      }
    },
    [currentUser, users, workspace, tasks, activities, notifications, persistState]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const result = await res.json();
        if (!result?.success) {
          return { success: false, error: result?.error || "Failed to change password" };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      }
    },
    []
  );

  const assignTask = useCallback(
    (taskId: string, newAssigneeIds: string[]) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const previousIds = targetTask.assigneeIds || [];
      const addedIds = newAssigneeIds.filter((id) => !previousIds.includes(id));
      const removedIds = previousIds.filter((id) => !newAssigneeIds.includes(id));
      const addedUsers = users.filter((u) => addedIds.includes(u.id));
      const removedUsers = users.filter((u) => removedIds.includes(u.id));

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigneeIds: newAssigneeIds,
              updatedAt: new Date(),
            }
          : t
      );

      const parts: string[] = [];
      if (addedUsers.length) parts.push(`assigned to ${addedUsers.map((u) => u.name).join(", ")}`);
      if (removedUsers.length) parts.push(`removed ${removedUsers.map((u) => u.name).join(", ")}`);

      let updatedActivities = activities;
      if (parts.length > 0) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          taskId,
          boardId: targetTask.boardId,
          actorId: currentUser.id,
          type: "assignee_changed",
          description: parts.join("; "),
          createdAt: new Date(),
        };
        updatedActivities = [newActivity, ...activities];
      }

      // Only the newly-added people get notified, and never the person
      // making the change — matches the server-side assignTask behavior.
      const board = boards.find((b) => b.id === targetTask.boardId);
      const newNotifs: Notification[] = addedUsers
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          id: `notif-${Date.now()}-${u.id}`,
          userId: u.id,
          type: "assignment",
          title: `${currentUser.name} assigned you a task`,
          body: `${targetTask.title}${board ? ` · ${board.name}` : ""}`,
          taskId: targetTask.id,
          boardId: targetTask.boardId,
          isRead: false,
          createdAt: new Date(),
        }));
      const updatedNotifications =
        newNotifs.length > 0 ? [...newNotifs, ...notifications] : notifications;

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
        body: JSON.stringify({ assigneeIds: newAssigneeIds, actorId: currentUser.id }),
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
      assigneeIds?: string[];
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
          assigneeIds: newTaskData.assigneeIds || [],
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

  // Deletes several tasks in one state update — same reasoning as
  // moveTasksToGroup: looping deleteTask reads the same stale `tasks`
  // closure each time and overwrites state with a plain value instead of
  // an updater function, so only the last call in the loop actually sticks.
  const deleteTasks = useCallback(
    (taskIds: string[]) => {
      const idSet = new Set(taskIds);
      if (idSet.size === 0) return;

      const updatedTasks = tasks.filter((t) => !idSet.has(t.id));
      setTasks(updatedTasks);
      if (activeTaskId && idSet.has(activeTaskId)) setActiveTaskId(null);
      persistState(
        users,
        workspace,
        updatedTasks,
        activities,
        notifications,
        currentUser
      );

      taskIds.forEach((id) => {
        fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch((err) =>
          console.error("Failed to delete task:", err)
        );
      });
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

  // Moves several tasks to a group in one state update. Calling
  // moveTaskToGroup in a loop doesn't work for this: each call reads the
  // same stale `tasks` closure and calls setTasks with a plain object (not
  // an updater function), so only the last call in the loop actually wins.
  const moveTasksToGroup = useCallback(
    (taskIds: string[], newGroupId: string) => {
      const idsToMove = taskIds.filter((id) => {
        const t = tasks.find((task) => task.id === id);
        return t && t.groupId !== newGroupId;
      });
      if (idsToMove.length === 0) return;

      let nextOrder = tasks.filter((t) => t.groupId === newGroupId).length;
      const orderById = new Map<string, number>();
      idsToMove.forEach((id) => {
        orderById.set(id, nextOrder);
        nextOrder += 1;
      });

      const updatedTasks = tasks.map((t) =>
        orderById.has(t.id)
          ? { ...t, groupId: newGroupId, order: orderById.get(t.id)!, updatedAt: new Date() }
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

      idsToMove.forEach((id) => {
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: newGroupId,
            order: orderById.get(id),
            actorId: currentUser.id,
          }),
        }).catch((err) => console.error("Failed to persist group move:", err));
      });
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
    async (
      taskId: string,
      content: string,
      attachments: { name: string; size: number; mimeType: string; url: string }[] = []
    ) => {
      if (!content.trim() && attachments.length === 0) return;

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          attachments,
          authorId: currentUser.id,
        }),
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

  const editComment = useCallback(
    async (commentId: string, content: string) => {
      if (!content.trim()) return;

      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), authorId: currentUser.id }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to edit comment");
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                content: result.data.content,
                isEdited: true,
                updatedAt: new Date(result.data.updatedAt),
              }
            : c
        )
      );
    },
    [currentUser]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const res = await fetch(
        `/api/comments/${commentId}?authorId=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (!result?.success) {
        throw new Error(result?.error || "Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    [currentUser]
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

          // Dispatch real invitation email for a board in THIS workspace —
          // boards[0] used to be picked from the globally-hydrated board
          // list (every workspace, every user), so it could easily belong
          // to a workspace the inviter doesn't even manage. authorizeBoard
          // would then reject the call, silently falling back to a plain
          // /register link that never actually joins anyone to this
          // workspace — accepted invites just vanished.
          const targetBoardId = boards.find((b) => b.workspaceId === workspace.id)?.id;
          let inviteLink = "";
          if (targetBoardId) {
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

  // Removes one or more people from THIS workspace only — this used to
  // delete the user from the global `users` list (i.e. their entire
  // account, workspace-wide) and never actually persisted anywhere beyond
  // localStorage, since persistState no longer writes workspace data.
  const removeMembers = useCallback(
    async (userIds: string[]) => {
      // Only the owner/admin may remove members, and the owner can never
      // be removed this way (there's no ownership-transfer flow yet, so
      // that would leave the workspace without one) — this used to only
      // guard against removing yourself, which let any member, including
      // a plain "member", remove the owner.
      const callerRole = workspace.members.find((m) => m.userId === currentUser.id)?.role;
      if (callerRole !== "owner" && callerRole !== "admin") {
        console.error("Only the workspace owner or an admin can remove members.");
        return;
      }

      const ownerIds = new Set(
        workspace.members.filter((m) => m.role === "owner").map((m) => m.userId)
      );
      const idSet = new Set(
        userIds.filter((id) => id !== currentUser.id && !ownerIds.has(id))
      );
      if (idSet.size === 0) return;

      const updatedMembers = workspace.members.filter((m) => !idSet.has(m.userId));
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: updatedMembers }),
        });
        const result = await res.json();
        if (!result?.success || !result?.data) {
          throw new Error(result?.error || "Failed to remove member");
        }
        const updated: Workspace = result.data;
        setWorkspace(updated);
        setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } catch (err) {
        console.error("Failed to remove member(s):", err);
      }
    },
    [currentUser.id, workspace]
  );

  const removeMember = useCallback(
    (userId: string) => {
      removeMembers([userId]);
    },
    [removeMembers]
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

  // ─── Personal To-Dos (private, per-user; not tied to any workspace/board) ─

  const createPersonalTodo = useCallback(
    async (data: {
      title: string;
      notes?: string;
      dueAt?: Date | null;
      reminderMinutesBefore?: number;
    }): Promise<PersonalTodo> => {
      if (
        typeof window !== "undefined" &&
        data.dueAt &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch(() => {});
      }

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          title: data.title,
          notes: data.notes,
          dueAt: data.dueAt ? data.dueAt.toISOString() : null,
          reminderMinutesBefore: data.reminderMinutesBefore,
        }),
      });
      const result = await res.json();
      if (!result?.success) {
        throw new Error(result?.error || "Failed to create to-do");
      }

      const newTodo: PersonalTodo = {
        ...result.data,
        dueAt: result.data.dueAt ? new Date(result.data.dueAt) : null,
        reminderSentAt: result.data.reminderSentAt ? new Date(result.data.reminderSentAt) : null,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
      setPersonalTodos((prev) => [...prev, newTodo]);
      return newTodo;
    },
    [currentUser.id]
  );

  const updatePersonalTodo = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<
          PersonalTodo,
          "title" | "notes" | "dueAt" | "reminderMinutesBefore" | "isCompleted" | "reminderSentAt"
        >
      >
    ) => {
      setPersonalTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t))
      );

      fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          dueAt:
            updates.dueAt !== undefined
              ? updates.dueAt
                ? updates.dueAt.toISOString()
                : null
              : undefined,
          reminderSentAt:
            updates.reminderSentAt !== undefined
              ? updates.reminderSentAt
                ? updates.reminderSentAt.toISOString()
                : null
              : undefined,
        }),
      }).catch((err) => console.error("Failed to persist to-do update:", err));
    },
    []
  );

  const toggleTodoComplete = useCallback(
    (id: string) => {
      const todo = personalTodos.find((t) => t.id === id);
      if (!todo) return;
      updatePersonalTodo(id, { isCompleted: !todo.isCompleted });
    },
    [personalTodos, updatePersonalTodo]
  );

  const deletePersonalTodo = useCallback((id: string) => {
    setPersonalTodos((prev) => prev.filter((t) => t.id !== id));
    fetch(`/api/todos/${id}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to delete to-do:", err)
    );
  }, []);

  // ─── Personal To-Do Reminders: fire a browser + in-app notification once ──
  // per to-do, `reminderMinutesBefore` minutes ahead of its due time.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    const checkReminders = () => {
      const now = Date.now();
      personalTodos.forEach((todo) => {
        if (todo.isCompleted || !todo.dueAt || todo.reminderSentAt) return;
        const dueTime = new Date(todo.dueAt).getTime();
        const reminderTime = dueTime - todo.reminderMinutesBefore * 60000;
        // Window stays open a few minutes past due time in case the tab
        // was inactive/closed when the exact reminder moment passed.
        if (now >= reminderTime && now <= dueTime + 5 * 60000) {
          const dueLabel = new Date(todo.dueAt as Date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`⏰ ${todo.title}`, {
              body: `Starts at ${dueLabel}`,
            });
          }

          setNotifications((prev) => [
            {
              id: `todo-notif-${todo.id}`,
              userId: currentUser.id,
              type: "todo_reminder",
              title: `Reminder: ${todo.title}`,
              body: `Due at ${dueLabel}`,
              taskId: null,
              boardId: null,
              isRead: false,
              createdAt: new Date(),
            },
            ...prev,
          ]);

          updatePersonalTodo(todo.id, { reminderSentAt: new Date() });
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser?.id, personalTodos, updatePersonalTodo]);

  // ─── Workspace Appointment Reminders ───────────────────────────────────
  // Unlike personal to-dos, appointments are shared — the server creates a
  // Notification row + sends an email for every attendee, not just this
  // client's user. There's no cron in this app, so any authenticated client
  // with a workspace open periodically asks the server "is anything due?";
  // the server-side claim in checkAndSendAppointmentReminders keeps two
  // clients polling at once from double-sending. This tab still merges its
  // own resulting notifications in immediately for instant feedback.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || !workspace.id) return;

    const checkAppointmentReminders = () => {
      fetch("/api/appointments/check-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res?.success || !Array.isArray(res.data?.notifications)) return;
          const mine: Notification[] = res.data.notifications
            .filter((n: Notification) => n.userId === currentUser.id)
            .map((n: Notification) => ({ ...n, createdAt: new Date(n.createdAt) }));
          if (mine.length === 0) return;

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = mine.filter((n) => !existingIds.has(n.id));
            return fresh.length > 0 ? [...fresh, ...prev] : prev;
          });

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            mine.forEach((n) => {
              new Notification(n.title, { body: n.body });
            });
          }
        })
        .catch((err) => console.error("Failed to check appointment reminders:", err));
    };

    checkAppointmentReminders();
    const interval = setInterval(checkAppointmentReminders, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser?.id, workspace.id]);

  // ─── Task Due-Date Reminders (in-app + LINE) ───────────────────────────
  // Same "any open client nudges the server, server claims + dedupes"
  // pattern as the appointment reminders above.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || !workspace.id) return;

    const checkTaskDueReminders = () => {
      fetch("/api/tasks/check-due-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res?.success || !Array.isArray(res.data?.notifications)) return;
          const mine: Notification[] = res.data.notifications
            .filter((n: Notification) => n.userId === currentUser.id)
            .map((n: Notification) => ({ ...n, createdAt: new Date(n.createdAt) }));
          if (mine.length === 0) return;

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = mine.filter((n) => !existingIds.has(n.id));
            return fresh.length > 0 ? [...fresh, ...prev] : prev;
          });

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            mine.forEach((n) => {
              new Notification(n.title, { body: n.body });
            });
          }
        })
        .catch((err) => console.error("Failed to check task due reminders:", err));
    };

    checkTaskDueReminders();
    const dueInterval = setInterval(checkTaskDueReminders, 30000);
    return () => clearInterval(dueInterval);
  }, [isAuthenticated, currentUser?.id, workspace.id]);

  const openTaskModal = useCallback(
    (taskId: string, tab: "details" | "activity" = "details") => {
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
      // Creating items is leader-only; don't open a form that will be refused.
      const allowed = boardId
        ? canDo("manage", boardId)
        : boards.some((b) => canDo("manage", b.id));
      if (!allowed) return;
      setCreateTaskDefaultBoardId(boardId);
      setCreateTaskDefaultGroupId(groupId);
      setCreateTaskDefaultDueDate(defaultDueDate);
      setIsCreateTaskOpen(true);
    },
    [boards, canDo]
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

          // Refresh this user's workspace list — accepting the invite may
          // have just granted membership to a workspace they didn't have
          // before, and the workspace switcher won't show it otherwise.
          fetch(`/api/workspaces?userId=${encodeURIComponent(currentUser.id)}`)
            .then((r) => r.json())
            .then((wsRes) => {
              if (wsRes?.success && Array.isArray(wsRes.workspaces)) {
                const list: Workspace[] = wsRes.workspaces;
                setWorkspaces(list);
                if (list.length > 0) {
                  const joined = list.find((w) => w.id === updatedBoard.workspaceId);
                  setWorkspace(joined || wsRes.data || list[0]);
                }
              }
            })
            .catch((err) =>
              console.error("Failed to refresh workspaces after accepting invite:", err)
            );

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
    [currentUser.id]
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
      // No "must keep at least one workspace" guard here anymore — that
      // used to block on `workspaces.length <= 1`, but `workspaces` is now
      // scoped to just this user's own memberships (see the per-user
      // hydration effect), so anyone with only one workspace — the common
      // case — could never delete it. Ending up with zero is fine; it's
      // the same state a freshly-registered, not-yet-invited user is in.
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result?.success) {
        throw new Error(result?.error || "Failed to delete workspace");
      }

      const updatedList = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(updatedList);
      const newActive = updatedList[0];
      if (newActive) {
        setWorkspace(newActive);
        try {
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, newActive.id);
        } catch {
          // ignore — localStorage unavailable
        }
      } else {
        setWorkspace(EMPTY_WORKSPACE);
        try {
          localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        } catch {
          // ignore — localStorage unavailable
        }
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

  const createFolder = useCallback(
    async (name: string, color?: string): Promise<Folder> => {
      if (!workspace.id) {
        throw new Error("Create or join a workspace before adding a folder.");
      }
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace.id, name, color }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create folder");
      }
      const newFolder: Folder = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    },
    [workspace.id]
  );

  const updateFolder = useCallback(
    (folderId: string, updates: Partial<Pick<Folder, "name" | "color">>) => {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, ...updates, updatedAt: new Date() } : f))
      );
      fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) => console.error("Failed to update folder:", err));
    },
    []
  );

  const toggleFolderCollapse = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      const nextCollapsed = !(folder?.isCollapsed ?? false);
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, isCollapsed: nextCollapsed } : f))
      );
      fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCollapsed: nextCollapsed }),
      }).catch((err) => console.error("Failed to toggle folder collapse:", err));
    },
    [folders]
  );

  const emptyFolder = useCallback(
    (folderId: string) => {
      setBoards((prev) =>
        prev.map((b) => (b.folderId === folderId ? { ...b, folderId: undefined } : b))
      );
      fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "empty" }),
      }).catch((err) => console.error("Failed to empty folder:", err));
    },
    []
  );

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setBoards((prev) =>
      prev.map((b) => (b.folderId === folderId ? { ...b, folderId: undefined } : b))
    );
    fetch(`/api/folders/${folderId}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to delete folder:", err)
    );
  }, []);

  const createDashboard = useCallback(
    async (data: {
      name: string;
      description?: string;
      widgets?: DashboardWidgetId[];
    }): Promise<Dashboard> => {
      if (!workspace.id) {
        throw new Error("Create or join a workspace before adding a dashboard.");
      }
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          name: data.name,
          description: data.description,
          widgets: data.widgets,
          createdById: currentUser.id,
        }),
      });
      const result = await res.json();
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to create dashboard");
      }
      const newDashboard: Dashboard = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
      setDashboards((prev) => [...prev, newDashboard]);
      return newDashboard;
    },
    [workspace.id, currentUser.id]
  );

  const deleteDashboard = useCallback((dashboardId: string) => {
    setDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
    fetch(`/api/dashboards/${dashboardId}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to delete dashboard:", err)
    );
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
      // Refuse outright if there's no real active workspace to attach
      // this to (the "No Workspace" placeholder used while a brand-new
      // account has none yet) — every UI entry point that creates a board
      // should already be hiding/disabling itself in that state, but this
      // is the backstop in case another one doesn't.
      if (!workspace.id) {
        throw new Error("Create or join a workspace before adding a board.");
      }

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
      // The server also creates a single placeholder "Active Items" group
      // as a baseline — it's replaced below by the richer monday.com-style
      // starter layout (2 groups, 3+2 items), so it gets deleted once the
      // real ones exist.
      const serverDefaultGroupId = createdBoard.groupIds[0];

      const now = Date.now();

      // Start like monday.com: two "Group Title" groups holding 3 + 2
      // starter items — created for real via the API (not faked locally)
      // so they actually exist in the database and can be assigned, etc.
      const groupResponses = await Promise.all(
        ["#579bfc", "#a25ddc"].map((color) =>
          fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boardId: createdBoard.id, name: "Group Title", color }),
          }).then((r) => r.json())
        )
      );
      if (groupResponses.some((r) => !r?.success || !r?.data)) {
        throw new Error("Failed to create starter groups");
      }
      const newGroups: Group[] = groupResponses.map((r) => ({
        ...r.data,
        createdAt: new Date(r.data.createdAt),
      }));

      const itemLabel = data.itemLabel?.trim() || "Item";
      const starterStatuses: TaskStatus[] = ["in_progress", "done", "todo", "todo", "todo"];
      const taskResponses = await Promise.all(
        starterStatuses.map((status, i) => {
          const group = newGroups[i < 3 ? 0 : 1];
          return fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `${itemLabel} ${i + 1}`,
              boardId: createdBoard.id,
              groupId: group.id,
              status,
              priority: "medium",
              dueDate: new Date(now + (i + 2) * 24 * 60 * 60 * 1000).toISOString(),
              reporterId: currentUser.id,
            }),
          }).then((r) => r.json());
        })
      );
      if (taskResponses.some((r) => !r?.success || !r?.data)) {
        throw new Error("Failed to create starter items");
      }
      const newTasks: Task[] = taskResponses.map((r) => ({
        ...r.data,
        dueDate: r.data.dueDate ? new Date(r.data.dueDate) : null,
        createdAt: new Date(r.data.createdAt),
        updatedAt: new Date(r.data.updatedAt),
        timeline: null,
        votes: 0,
        tags: [],
      }));

      newGroups.forEach((g) => {
        g.taskIds = newTasks.filter((t) => t.groupId === g.id).map((t) => t.id);
      });

      // Always pin the board to the workspace it was created from.
      const newBoard: Board = {
        ...createdBoard,
        workspaceId: workspace.id,
        privacy: data.privacy || "main",
        folderId: data.folderId,
        groupIds: newGroups.map((g) => g.id),
      };

      // The initial POST /api/boards doesn't carry folderId (that endpoint
      // is shared with the plain "new board" flow) — patch it in right
      // after if this board was created from inside a folder's menu.
      if (data.folderId) {
        fetch(`/api/boards/${newBoard.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: data.folderId }),
        }).catch((err) => console.error("Failed to set board folder:", err));
      }

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

      if (serverDefaultGroupId) {
        fetch(`/api/groups/${serverDefaultGroupId}`, { method: "DELETE" }).catch(() => {});
      }

      return newBoard;
    },
    [currentUser, workspace, boards, groups, users, tasks, activities, notifications, persistState]
  );

  const updateBoard = useCallback(
    (
      boardId: string,
      updates: Partial<Pick<Board, "name" | "description" | "color">> & {
        folderId?: string | null;
      }
    ) => {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? {
                ...b,
                ...updates,
                folderId:
                  updates.folderId === undefined ? b.folderId : updates.folderId || undefined,
                updatedAt: new Date(),
              }
            : b
        )
      );
      // JSON.stringify drops `undefined` keys but keeps `null` — pass
      // folderId: null (not undefined) to actually clear it server-side.
      fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) => console.error("Failed to update board:", err));
    },
    []
  );

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    fetch(`/api/boards/${boardId}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to delete board:", err)
    );
  }, []);

  const getTasksByAssignee = useCallback(
    (userId: string) =>
      tasks.filter(
        (t) =>
          t.assigneeIds.includes(userId) &&
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
        t.assigneeIds.includes(currentUser.id) &&
        !t.isArchived &&
        t.status !== "done" &&
        t.status !== "cancelled"
    );
  }, [tasks, currentUser.id]);

  const getWorkspaceStats = useCallback(() => {
    const userTasks = tasks.filter(
      (t) => t.assigneeIds.includes(currentUser.id) && !t.isArchived
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
      refreshWorkspaces,
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
      deleteTasks,
      moveTaskToGroup,
      moveTasksToGroup,
      voteItem,

      addGroup,
      updateGroup,
      reorderGroups,
      deleteGroup,
      toggleGroupCollapse,

      toggleSubtask,
      addSubtask,
      addComment,
      editComment,
      deleteComment,

      inviteMember,
      updateMemberRole,
      removeMember,
      removeMembers,

      markNotificationAsRead,
      markAllNotificationsAsRead,

      personalTodos,
      createPersonalTodo,
      updatePersonalTodo,
      toggleTodoComplete,
      deletePersonalTodo,

      openTaskModal,
      closeTaskModal,
      openCreateTaskModal,
      closeCreateTaskModal,
      openInviteMemberModal,
      closeInviteMemberModal,
      canDo,
      isWorkspaceLeader,

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
      updateBoard,
      deleteBoard,
      folders,
      createFolder,
      updateFolder,
      toggleFolderCollapse,
      emptyFolder,
      deleteFolder,
      dashboards,
      createDashboard,
      deleteDashboard,

      isInviteBoardModalOpen,
      inviteBoardId,
      openInviteBoardModal,
      closeInviteBoardModal,
      inviteToBoard,
      acceptBoardInvite,

      updateNotificationPreferences,
      updateProfile,
      changePassword,

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
      refreshWorkspaces,
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
      updateBoard,
      deleteBoard,
      folders,
      createFolder,
      updateFolder,
      toggleFolderCollapse,
      emptyFolder,
      deleteFolder,
      dashboards,
      createDashboard,
      deleteDashboard,
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
      deleteTasks,
      moveTaskToGroup,
      moveTasksToGroup,
      voteItem,
      addGroup,
      updateGroup,
      reorderGroups,
      deleteGroup,
      toggleGroupCollapse,
      toggleSubtask,
      addSubtask,
      addComment,
      editComment,
      deleteComment,
      inviteMember,
      updateMemberRole,
      removeMember,
      removeMembers,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      personalTodos,
      createPersonalTodo,
      updatePersonalTodo,
      toggleTodoComplete,
      deletePersonalTodo,
      openTaskModal,
      closeTaskModal,
      openCreateTaskModal,
      closeCreateTaskModal,
      openInviteMemberModal,
      closeInviteMemberModal,
      canDo,
      isWorkspaceLeader,
      updateNotificationPreferences,
      updateProfile,
      changePassword,
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

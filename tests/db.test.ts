import { describe, it, expect, beforeEach } from "vitest";
import {
  resetDb,
  readDb,
  getWorkspace,
  getUsers,
  createUser,
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  assignTask,
  deleteTask,
  addComment,
  getComments,
  addSubtask,
  toggleSubtask,
  getSubtasks,
  getActivities,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../lib/server/db";

describe("Database & Server Layer Tests", () => {
  beforeEach(() => {
    resetDb();
  });

  it("should initialize default workspace, boards, and users", async () => {
    const ws = await getWorkspace();
    expect(ws).toBeDefined();
    expect(ws!.name).toBe("TGAS Workspace");

    const users = await getUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].name).toBe("Somchai");

    const boards = await getBoards();
    expect(boards.length).toBeGreaterThanOrEqual(4);
    expect(boards.map((b) => b.id)).toContain("board-1");
  });

  it("should create, update, and delete a board", async () => {
    const newBoard = await createBoard({
      name: "Q4 Marketing Strategy",
      description: "Quarterly marketing assets",
      color: "bg-purple-500",
    });
    expect(newBoard.id).toBeDefined();
    expect(newBoard.name).toBe("Q4 Marketing Strategy");

    const updated = await updateBoard(newBoard.id, { name: "Q4 Marketing Strategy (Updated)" });
    expect(updated?.name).toBe("Q4 Marketing Strategy (Updated)");

    const deleted = await deleteBoard(newBoard.id);
    expect(deleted).toBe(true);

    const activeBoards = await getBoards();
    expect(activeBoards.find((b) => b.id === newBoard.id)).toBeUndefined();
  });

  it("should create, update, and delete a group with cascading tasks", async () => {
    const group = await createGroup({
      boardId: "board-1",
      name: "Design Sprint",
      color: "#ec4899",
    });
    expect(group.id).toBeDefined();
    expect(group.name).toBe("Design Sprint");

    const task = await createTask({
      title: "Hero banner mockup",
      boardId: "board-1",
      groupId: group.id,
      priority: "high",
    });
    expect(task.id).toBeDefined();

    const taskListBefore = await getTasks({ groupId: group.id });
    expect(taskListBefore.length).toBe(1);

    await deleteGroup(group.id);
    const groupsAfter = await getGroups("board-1");
    expect(groupsAfter.find((g) => g.id === group.id)).toBeUndefined();

    const taskListAfter = await getTasks({ groupId: group.id });
    expect(taskListAfter.length).toBe(0);
  });

  it("should create, update status, and assign task with real activity log", async () => {
    const task = await createTask({
      title: "Audit security logs",
      boardId: "board-1",
      groupId: "group-1",
      priority: "urgent",
      status: "todo",
    });
    expect(task.itemCode).toBeDefined();
    expect(task.itemCode?.startsWith("WB-")).toBe(true);

    // Update status to working on it
    const updated = await updateTask(task.id, { status: "in_progress" });
    expect(updated?.status).toBe("in_progress");

    // Assign to Sarah Chen (user-2)
    const assigned = await assignTask(task.id, "user-2", "user-1");
    expect(assigned?.assigneeId).toBe("user-2");

    // Check activity log
    const activities = await getActivities(task.id);
    expect(activities.length).toBeGreaterThanOrEqual(2);
    expect(activities.some((a) => a.type === "assignee_changed")).toBe(true);

    // Check notification sent to user-2
    const notifs = await getNotifications("user-2");
    expect(notifs.some((n) => n.taskId === task.id && n.type === "assignment")).toBe(true);
  });

  it("should post comments and toggle subtasks", async () => {
    const task = await createTask({
      title: "Annual performance review",
      boardId: "board-1",
      groupId: "group-1",
    });

    const comment = await addComment({
      taskId: task.id,
      authorId: "user-1",
      content: "@Sarah Chen please review the KPIs",
    });
    expect(comment.id).toBeDefined();
    const comments = await getComments(task.id);
    expect(comments.length).toBe(1);

    const subtask = await addSubtask({
      taskId: task.id,
      title: "Collect feedback forms",
    });
    expect(subtask.isCompleted).toBe(false);

    const toggled = await toggleSubtask(subtask.id);
    expect(toggled?.isCompleted).toBe(true);
    const subs = await getSubtasks(task.id);
    expect(subs[0].isCompleted).toBe(true);
  });

  it("should manage user notifications read status", async () => {
    const notifs = await getNotifications("user-1");
    if (notifs.length > 0) {
      await markNotificationRead(notifs[0].id);
      const updated = await getNotifications("user-1");
      expect(updated.find((n) => n.id === notifs[0].id)?.isRead).toBe(true);
    }

    await markAllNotificationsRead("user-1");
    const all = await getNotifications("user-1");
    expect(all.every((n) => n.isRead)).toBe(true);
  });
});

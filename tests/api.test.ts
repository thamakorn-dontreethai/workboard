import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../lib/server/db";
import { GET as getBoardsRoute, POST as postBoardsRoute } from "../app/api/boards/route";
import { GET as getBoardByIdRoute, PATCH as patchBoardRoute, DELETE as deleteBoardRoute } from "../app/api/boards/[id]/route";
import { GET as getTasksRoute, POST as postTasksRoute } from "../app/api/tasks/route";
import { GET as getTaskByIdRoute, PATCH as patchTaskRoute, DELETE as deleteTaskRoute } from "../app/api/tasks/[id]/route";
import { POST as assignTaskRoute } from "../app/api/tasks/[id]/assign/route";
import { GET as getCommentsRoute, POST as postCommentRoute } from "../app/api/tasks/[id]/comments/route";
import { GET as getSubtasksRoute, POST as postSubtaskRoute, PATCH as patchSubtaskRoute } from "../app/api/tasks/[id]/subtasks/route";
import { GET as getUsersRoute, POST as postUserRoute } from "../app/api/users/route";

describe("REST API Endpoints Integration Tests", () => {
  beforeEach(() => {
    resetDb();
  });

  it("GET /api/boards should return all active boards", async () => {
    const res = await getBoardsRoute();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(4);
  });

  it("POST /api/boards should create a new board", async () => {
    const req = new Request("http://localhost:3000/api/boards", {
      method: "POST",
      body: JSON.stringify({
        name: "Enterprise Client Alpha",
        description: "Onboarding deliverables",
      }),
    });
    const res = await postBoardsRoute(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("Enterprise Client Alpha");
  });

  it("GET /api/tasks should return tasks with filtering", async () => {
    const req = new Request("http://localhost:3000/api/tasks?boardId=board-1");
    const res = await getTasksRoute(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.every((t: any) => t.boardId === "board-1")).toBe(true);
  });

  it("POST /api/tasks should create a work item with auto-generated code", async () => {
    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Setup automated invoices",
        boardId: "board-1",
        groupId: "group-1",
        priority: "urgent",
        status: "in_progress",
      }),
    });
    const res = await postTasksRoute(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe("Setup automated invoices");
    expect(json.data.status).toBe("in_progress");
    expect(json.data.priority).toBe("urgent");
  });

  it("POST /api/tasks/[id]/assign should delegate task and record notification", async () => {
    // Create a task first
    const createReq = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Security audit review",
        boardId: "board-1",
        groupId: "group-1",
      }),
    });
    const createRes = await postTasksRoute(createReq);
    const created = await createRes.json();
    const taskId = created.data.id;

    const params = Promise.resolve({ id: taskId });
    const req = new Request(`http://localhost:3000/api/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({
        assigneeId: "user-4", // Mike Torres
        actorId: "user-1",
      }),
    });
    const res = await assignTaskRoute(req, { params });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.assigneeId).toBe("user-4");
  });

  it("POST /api/tasks/[id]/comments should post discussion update", async () => {
    const createReq = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Design feedback",
        boardId: "board-1",
        groupId: "group-1",
      }),
    });
    const createRes = await postTasksRoute(createReq);
    const created = await createRes.json();
    const taskId = created.data.id;

    const params = Promise.resolve({ id: taskId });
    const req = new Request(`http://localhost:3000/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        authorId: "user-1",
        content: "@Mike Torres all assets are ready for review.",
      }),
    });
    const res = await postCommentRoute(req, { params });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.content).toBe("@Mike Torres all assets are ready for review.");
  });

  it("POST & PATCH /api/tasks/[id]/subtasks should manage checklist", async () => {
    const createReq = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: "Vendor contract negotiation",
        boardId: "board-1",
        groupId: "group-1",
      }),
    });
    const createRes = await postTasksRoute(createReq);
    const created = await createRes.json();
    const taskId = created.data.id;

    const params = Promise.resolve({ id: taskId });
    const postReq = new Request(`http://localhost:3000/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title: "Verify contract SLA" }),
    });
    const postRes = await postSubtaskRoute(postReq, { params });
    const postJson = await postRes.json();
    expect(postRes.status).toBe(201);
    expect(postJson.data.isCompleted).toBe(false);

    const patchReq = new Request("http://localhost:3000/api/tasks/task-1/subtasks", {
      method: "PATCH",
      body: JSON.stringify({ subtaskId: postJson.data.id }),
    });
    const patchRes = await patchSubtaskRoute(patchReq);
    const patchJson = await patchRes.json();
    expect(patchRes.status).toBe(200);
    expect(patchJson.data.isCompleted).toBe(true);
  });

  it("GET and POST /api/users should list and invite team members", async () => {
    const getRes = await getUsersRoute();
    const getJson = await getRes.json();
    expect(getRes.status).toBe(200);
    const countBefore = getJson.data.length;

    const postReq = new Request("http://localhost:3000/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: "Elena Rostova",
        email: "elena@workboard.io",
        role: "Head of Marketing",
      }),
    });
    const postRes = await postUserRoute(postReq);
    const postJson = await postRes.json();
    expect(postRes.status).toBe(201);
    expect(postJson.data.name).toBe("Elena Rostova");

    const getResAfter = await getUsersRoute();
    const getJsonAfter = await getResAfter.json();
    expect(getJsonAfter.data.length).toBe(countBefore + 1);
  });
});

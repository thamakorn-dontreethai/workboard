import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, readDb, writeDb, createBoard, createGroup } from "../lib/server/db";
import { SESSION_COOKIE, createSessionToken } from "../lib/server/session";
import { GET as getBoardsRoute, POST as postBoardsRoute } from "../app/api/boards/route";
import { PATCH as patchBoardRoute, DELETE as deleteBoardRoute } from "../app/api/boards/[id]/route";
import { GET as getTasksRoute, POST as postTasksRoute } from "../app/api/tasks/route";
import { PATCH as patchTaskRoute, DELETE as deleteTaskRoute } from "../app/api/tasks/[id]/route";
import { POST as assignTaskRoute } from "../app/api/tasks/[id]/assign/route";
import { POST as postCommentRoute } from "../app/api/tasks/[id]/comments/route";
import { POST as postGroupRoute } from "../app/api/groups/route";
import { PATCH as patchGroupRoute } from "../app/api/groups/[id]/route";
import { GET as getAttachmentRoute } from "../app/api/comments/[id]/attachments/[attId]/route";
import { PATCH as patchCommentRoute, DELETE as deleteCommentRoute } from "../app/api/comments/[id]/route";
import { POST as postSubtaskRoute, PATCH as patchSubtaskRoute } from "../app/api/tasks/[id]/subtasks/route";
import { GET as getUsersRoute, POST as postUserRoute } from "../app/api/users/route";
import { GET as getSessionRoute } from "../app/api/auth/session/route";

// Mock workspace "ws-1": Somchai is its owner (a leader); the other two are
// ordinary members.
const LEADER = "user-somchai";
const MEMBER = "user-thamakhorn";
const OTHER_MEMBER = "user-1789025805350";

const cookieFor = (userId: string) => `${SESSION_COOKIE}=${createSessionToken(userId)}`;

function call(
  url: string,
  method: string,
  as: string | null,
  body?: unknown
): Request {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: as ? { Cookie: cookieFor(as) } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("REST API Endpoints Integration Tests", () => {
  let boardId: string;
  let groupId: string;

  beforeEach(async () => {
    resetDb();
    const board = await createBoard({ name: "Test Board", ownerId: LEADER, workspaceId: "ws-1" });
    boardId = board.id;
    groupId = (await createGroup({ boardId, name: "To do" })).id;
  });

  // Creates a task as the leader; optionally assigned to someone.
  async function createTaskAs(as: string, extra: Record<string, unknown> = {}) {
    const res = await postTasksRoute(
      call("/api/tasks", "POST", as, { title: "Item", boardId, groupId, ...extra })
    );
    return { res, json: await res.json() };
  }

  it("GET /api/boards should return all active boards", async () => {
    const res = await getBoardsRoute();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/boards should create a new board for a workspace owner", async () => {
    const res = await postBoardsRoute(
      call("/api/boards", "POST", LEADER, {
        name: "Enterprise Client Alpha",
        description: "Onboarding deliverables",
        workspaceId: "ws-1",
      })
    );
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.name).toBe("Enterprise Client Alpha");
    // The owner comes from the session, not from the request body.
    expect(json.data.ownerId).toBe(LEADER);
  });

  it("GET /api/tasks should return tasks with filtering", async () => {
    await createTaskAs(LEADER);
    const res = await getTasksRoute(new Request(`http://localhost:3000/api/tasks?boardId=${boardId}`));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data.every((t: any) => t.boardId === boardId)).toBe(true);
  });

  it("POST /api/tasks should create a work item with auto-generated code", async () => {
    const { res, json } = await createTaskAs(LEADER, {
      title: "Setup automated invoices",
      priority: "urgent",
      status: "in_progress",
    });
    expect(res.status).toBe(201);
    expect(json.data.title).toBe("Setup automated invoices");
    expect(json.data.status).toBe("in_progress");
    expect(json.data.priority).toBe("urgent");
    expect(json.data.reporterId).toBe(LEADER);
  });

  it("POST /api/tasks/[id]/assign should delegate task", async () => {
    const { json: created } = await createTaskAs(LEADER);
    const taskId = created.data.id;
    const res = await assignTaskRoute(
      call(`/api/tasks/${taskId}/assign`, "POST", LEADER, { assigneeIds: [MEMBER] }),
      { params: Promise.resolve({ id: taskId }) }
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.assigneeIds).toContain(MEMBER);
  });

  it("POST /api/tasks/[id]/comments should post discussion update", async () => {
    const { json: created } = await createTaskAs(LEADER);
    const taskId = created.data.id;
    const res = await postCommentRoute(
      call(`/api/tasks/${taskId}/comments`, "POST", LEADER, {
        content: "@Thamakhorn all assets are ready for review.",
      }),
      { params: Promise.resolve({ id: taskId }) }
    );
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.content).toBe("@Thamakhorn all assets are ready for review.");
    expect(json.data.authorId).toBe(LEADER);
  });

  it("PATCH & DELETE /api/comments/[id] should enforce authorship", async () => {
    const { json: created } = await createTaskAs(LEADER);
    const taskId = created.data.id;
    const postRes = await postCommentRoute(
      call(`/api/tasks/${taskId}/comments`, "POST", LEADER, { content: "draft" }),
      { params: Promise.resolve({ id: taskId }) }
    );
    const commentId = (await postRes.json()).data.id;
    const params = Promise.resolve({ id: commentId });
    const patch = (as: string | null, content: string) =>
      patchCommentRoute(call(`/api/comments/${commentId}`, "PATCH", as, { content }), { params });
    const del = (as: string | null) =>
      deleteCommentRoute(call(`/api/comments/${commentId}`, "DELETE", as), { params });

    expect((await patch(null, "nope")).status).toBe(401);
    expect((await patch(MEMBER, "nope")).status).toBe(403);
    expect((await patch(LEADER, "   ")).status).toBe(400);
    const ok = await patch(LEADER, "final");
    expect(ok.status).toBe(200);
    const okJson = await ok.json();
    expect(okJson.data.content).toBe("final");
    expect(okJson.data.isEdited).toBe(true);

    expect((await del(MEMBER)).status).toBe(403);
    expect((await del(LEADER)).status).toBe(200);
    expect((await del(LEADER)).status).toBe(404);
  });

  it("should store comment attachments and serve them by URL, not inline", async () => {
    const { json: created } = await createTaskAs(LEADER);
    const taskId = created.data.id;
    const post = (body: object) =>
      postCommentRoute(call(`/api/tasks/${taskId}/comments`, "POST", LEADER, body), {
        params: Promise.resolve({ id: taskId }),
      });
    const png = "data:image/png;base64," + Buffer.from("PNGDATA").toString("base64");
    const svg = "data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)/>").toString("base64");

    // A files-only update (no text) is allowed.
    const res = await post({
      content: "",
      attachments: [
        { name: "shot.png", size: 7, mimeType: "image/png", url: png },
        { name: "evil.svg", size: 22, mimeType: "image/svg+xml", url: svg },
      ],
    });
    expect(res.status).toBe(201);
    const comment = (await res.json()).data;
    expect(comment.attachments).toHaveLength(2);
    // The response carries a download URL, never the base64 payload.
    expect(comment.attachments[0].url).toBe(`/api/comments/${comment.id}/attachments/${comment.attachments[0].id}`);
    expect(JSON.stringify(comment)).not.toContain("base64");

    const get = (attId: string, as: string | null = LEADER) =>
      getAttachmentRoute(call("/x", "GET", as), {
        params: Promise.resolve({ id: comment.id, attId }),
      });

    const img = await get(comment.attachments[0].id);
    expect(img.status).toBe(200);
    expect(img.headers.get("Content-Type")).toBe("image/png");
    expect(img.headers.get("Content-Disposition")).toContain("inline");
    expect(Buffer.from(await img.arrayBuffer()).toString()).toBe("PNGDATA");

    // SVG can carry script, so it must download rather than render on our origin.
    const evil = await get(comment.attachments[1].id);
    expect(evil.headers.get("Content-Type")).toBe("application/octet-stream");
    expect(evil.headers.get("Content-Disposition")).toContain("attachment");
    expect(evil.headers.get("X-Content-Type-Options")).toBe("nosniff");

    expect((await get("att-missing")).status).toBe(404);
    // Files are for signed-in users only.
    expect((await get(comment.attachments[0].id, null)).status).toBe(401);

    // Neither text nor files, and oversized files, are rejected.
    expect((await post({ content: "  ", attachments: [] })).status).toBe(400);
    const big = { name: "big.bin", size: 5 * 1024 * 1024, mimeType: "application/zip", url: "data:application/zip;base64,AA==" };
    expect((await post({ content: "x", attachments: [big] })).status).toBe(413);
  });

  it("POST & PATCH /api/tasks/[id]/subtasks should manage checklist", async () => {
    const { json: created } = await createTaskAs(LEADER);
    const taskId = created.data.id;

    const postRes = await postSubtaskRoute(
      call(`/api/tasks/${taskId}/subtasks`, "POST", LEADER, { title: "Verify contract SLA" }),
      { params: Promise.resolve({ id: taskId }) }
    );
    const postJson = await postRes.json();
    expect(postRes.status).toBe(201);
    expect(postJson.data.isCompleted).toBe(false);

    const patchRes = await patchSubtaskRoute(
      call(`/api/tasks/${taskId}/subtasks`, "PATCH", LEADER, { subtaskId: postJson.data.id })
    );
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).data.isCompleted).toBe(true);
  });

  it("GET and POST /api/users should list and invite team members", async () => {
    const getRes = await getUsersRoute();
    const countBefore = (await getRes.json()).data.length;

    const postRes = await postUserRoute(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Elena Rostova",
          email: "elena@workboard.io",
          role: "Head of Marketing",
        }),
      })
    );
    expect(postRes.status).toBe(201);
    expect((await postRes.json()).data.name).toBe("Elena Rostova");

    const getJsonAfter = await (await getUsersRoute()).json();
    expect(getJsonAfter.data.length).toBe(countBefore + 1);
  });
});

describe("Role-based permissions", () => {
  let boardId: string;
  let groupId: string;

  beforeEach(async () => {
    resetDb();
    boardId = (await createBoard({ name: "Perm Board", ownerId: LEADER, workspaceId: "ws-1" })).id;
    groupId = (await createGroup({ boardId, name: "To do" })).id;
  });

  async function newTask(extra: Record<string, unknown> = {}): Promise<string> {
    const res = await postTasksRoute(
      call("/api/tasks", "POST", LEADER, { title: "Item", boardId, groupId, ...extra })
    );
    return (await res.json()).data.id;
  }
  const patchTask = (id: string, as: string | null, body: object) =>
    patchTaskRoute(call(`/api/tasks/${id}`, "PATCH", as, body), { params: Promise.resolve({ id }) });

  it("rejects requests with no session, a forged token, or an expired one", async () => {
    const noSession = await postTasksRoute(call("/api/tasks", "POST", null, { title: "x", boardId, groupId }));
    expect(noSession.status).toBe(401);

    const forged = await postTasksRoute(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE}=${createSessionToken(MEMBER)}x` },
        body: JSON.stringify({ title: "x", boardId, groupId }),
      })
    );
    expect(forged.status).toBe(401);

    const expired = await postTasksRoute(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE}=${createSessionToken(LEADER, Date.now() - 1000 * 60 * 60 * 24 * 60)}`,
        },
        body: JSON.stringify({ title: "x", boardId, groupId }),
      })
    );
    expect(expired.status).toBe(401);
  });

  it("GET /api/auth/session reports who the cookie belongs to", async () => {
    expect((await getSessionRoute(call("/api/auth/session", "GET", null))).status).toBe(401);
    const res = await getSessionRoute(call("/api/auth/session", "GET", MEMBER));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe(MEMBER);
    expect(json.data.password).toBeUndefined();
  });

  it("lets only leaders create, delete and organise work", async () => {
    // Members can't create items, groups or boards.
    const create = await postTasksRoute(call("/api/tasks", "POST", MEMBER, { title: "x", boardId, groupId }));
    expect(create.status).toBe(403);
    const group = await postGroupRoute(call("/api/groups", "POST", MEMBER, { boardId, name: "Mine" }));
    expect(group.status).toBe(403);
    const board = await postBoardsRoute(call("/api/boards", "POST", MEMBER, { name: "B", workspaceId: "ws-1" }));
    expect(board.status).toBe(403);

    const taskId = await newTask({ assigneeIds: [MEMBER] });
    const del = await deleteTaskRoute(call(`/api/tasks/${taskId}`, "DELETE", MEMBER), {
      params: Promise.resolve({ id: taskId }),
    });
    expect(del.status).toBe(403);

    const renameBoard = await patchBoardRoute(call(`/api/boards/${boardId}`, "PATCH", MEMBER, { name: "Hi" }), {
      params: Promise.resolve({ id: boardId }),
    });
    expect(renameBoard.status).toBe(403);
    const dropBoard = await deleteBoardRoute(call(`/api/boards/${boardId}`, "DELETE", MEMBER), {
      params: Promise.resolve({ id: boardId }),
    });
    expect(dropBoard.status).toBe(403);

    // …but the leader can.
    expect((await postGroupRoute(call("/api/groups", "POST", LEADER, { boardId, name: "Doing" }))).status).toBe(201);
    const leaderDel = await deleteTaskRoute(call(`/api/tasks/${taskId}`, "DELETE", LEADER), {
      params: Promise.resolve({ id: taskId }),
    });
    expect(leaderDel.status).toBe(200);
  });

  it("lets only leaders assign people and set priority / due date / title", async () => {
    const taskId = await newTask({ assigneeIds: [MEMBER] });

    const assign = (as: string) =>
      assignTaskRoute(call(`/api/tasks/${taskId}/assign`, "POST", as, { assigneeIds: [OTHER_MEMBER] }), {
        params: Promise.resolve({ id: taskId }),
      });
    expect((await assign(MEMBER)).status).toBe(403);
    expect((await assign(LEADER)).status).toBe(200);

    // The member was just unassigned; put them back for the field checks.
    await assignTaskRoute(call(`/api/tasks/${taskId}/assign`, "POST", LEADER, { assigneeIds: [MEMBER] }), {
      params: Promise.resolve({ id: taskId }),
    });

    expect((await patchTask(taskId, MEMBER, { priority: "urgent" })).status).toBe(403);
    expect((await patchTask(taskId, MEMBER, { dueDate: "2030-01-01" })).status).toBe(403);
    expect((await patchTask(taskId, MEMBER, { title: "Renamed" })).status).toBe(403);
    // Mixing an allowed field with a forbidden one is still refused.
    expect((await patchTask(taskId, MEMBER, { status: "done", priority: "urgent" })).status).toBe(403);
    expect((await patchTask(taskId, LEADER, { priority: "urgent" })).status).toBe(200);
  });

  it("lets a member change status only on items assigned to them", async () => {
    const mine = await newTask({ assigneeIds: [MEMBER] });
    const notMine = await newTask({ assigneeIds: [OTHER_MEMBER] });

    const ok = await patchTask(mine, MEMBER, { status: "in_progress", groupId });
    expect(ok.status).toBe(200);
    expect((await ok.json()).data.status).toBe("in_progress");

    expect((await patchTask(notMine, MEMBER, { status: "done" })).status).toBe(403);
    // Moving a card between groups on its own (no status change) is leader-only.
    expect((await patchTask(mine, MEMBER, { groupId, order: 3 })).status).toBe(403);
  });

  it("lets members comment and use the checklist, but not viewers", async () => {
    const taskId = await newTask({ assigneeIds: [MEMBER] });
    const params = Promise.resolve({ id: taskId });
    const comment = (as: string) =>
      postCommentRoute(call(`/api/tasks/${taskId}/comments`, "POST", as, { content: "progress update" }), { params });
    const subtask = (as: string) =>
      postSubtaskRoute(call(`/api/tasks/${taskId}/subtasks`, "POST", as, { title: "step" }), { params });

    expect((await comment(MEMBER)).status).toBe(201);
    expect((await subtask(MEMBER)).status).toBe(201);

    // Downgrade the other member to a read-only viewer.
    const db = readDb();
    const membership = db.workspaces!.find((w) => w.id === "ws-1")!.members.find((m) => m.userId === OTHER_MEMBER)!;
    membership.role = "viewer";
    writeDb(db);

    expect((await comment(OTHER_MEMBER)).status).toBe(403);
    expect((await subtask(OTHER_MEMBER)).status).toBe(403);
  });

  it("lets anyone on the board collapse a group, but only leaders edit it", async () => {
    const patch = (as: string, body: object) =>
      patchGroupRoute(call(`/api/groups/${groupId}`, "PATCH", as, body), {
        params: Promise.resolve({ id: groupId }),
      });
    expect((await patch(MEMBER, { isCollapsed: true })).status).toBe(200);
    expect((await patch(MEMBER, { name: "Renamed" })).status).toBe(403);
    expect((await patch(MEMBER, { isCollapsed: true, name: "Renamed" })).status).toBe(403);
    expect((await patch(LEADER, { name: "Renamed" })).status).toBe(200);
  });
});

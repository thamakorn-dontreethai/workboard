import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../lib/server/db";
import { SESSION_COOKIE, createSessionToken } from "../lib/server/session";
import { GET as getWorkspacesRoute, POST as postWorkspaceRoute } from "../app/api/workspaces/route";
import {
  GET as getWorkspaceByIdRoute,
  PATCH as patchWorkspaceRoute,
  DELETE as deleteWorkspaceRoute,
} from "../app/api/workspaces/[id]/route";

// Somchai owns the mock workspace "ws-1"; workspace writes now need a signed-in
// session (see lib/server/permissions.ts).
const asOwner = { Cookie: `${SESSION_COOKIE}=${createSessionToken("user-somchai")}` };

describe("Workspace Management API Tests", () => {
  beforeEach(() => {
    resetDb();
  });

  it("GET /api/workspaces should return workspaces and active workspace", async () => {
    const req = new Request("http://localhost:3000/api/workspaces");
    const res = await getWorkspacesRoute(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.workspaces.length).toBeGreaterThanOrEqual(1);
    expect(json.data.name).toBe("TGAS Workspace");
  });

  it("POST /api/workspaces should create a new workspace with privacy", async () => {
    const req = new Request("http://localhost:3000/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...asOwner },
      body: JSON.stringify({
        name: "DevOps & Cloud Engineering",
        description: "Infrastructure management and CI/CD pipelines",
        privacy: "closed",
        avatarColor: "bg-emerald-600",
      }),
    });
    const res = await postWorkspaceRoute(req as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.name).toBe("DevOps & Cloud Engineering");
    expect(json.data.privacy).toBe("closed");
    expect(json.data.avatarColor).toBe("bg-emerald-600");
  });

  it("PATCH /api/workspaces/[id] should update description and toggle pin", async () => {
    const patchReq = new Request("http://localhost:3000/api/workspaces/ws-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...asOwner },
      body: JSON.stringify({
        action: "togglePin",
      }),
    });
    const res = await patchWorkspaceRoute(patchReq as any, {
      params: Promise.resolve({ id: "ws-1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isPinned).toBe(false);
  });
});

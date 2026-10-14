import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { resetDb } from "../lib/server/db";
import { SESSION_COOKIE, createSessionToken } from "../lib/server/session";
import { resolveBoardRole, roleCan } from "../lib/utils/permissions";
import { proxy } from "../proxy";
import { GET as getWorkspacesRoute } from "../app/api/workspaces/route";

// Someone who belongs to no workspace in the mock data.
const AUDITOR = "user-auditor";

const request = (path: string, method: string, readOnly: boolean) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      Cookie: `${SESSION_COOKIE}=${createSessionToken(AUDITOR, Date.now(), 3600, readOnly)}`,
    },
  });

describe("Read-only admin (auditor)", () => {
  beforeEach(() => {
    resetDb();
  });

  it("refuses every write from a read-only session", () => {
    for (const [path, method] of [
      ["/api/tasks", "POST"],
      ["/api/tasks/t1", "PATCH"],
      ["/api/tasks/t1", "DELETE"],
      ["/api/comments", "POST"],
      ["/api/workspaces/ws-1", "PATCH"],
    ]) {
      expect(proxy(request(path, method, true)).status).toBe(403);
    }
  });

  it("still lets a read-only session read, sign in and sign out", () => {
    const passes = (res: Response) => res.headers.get("x-middleware-next") === "1";
    expect(passes(proxy(request("/api/tasks", "GET", true)))).toBe(true);
    expect(passes(proxy(request("/api/auth/logout", "POST", true)))).toBe(true);
    expect(passes(proxy(request("/api/auth/login", "POST", true)))).toBe(true);
  });

  it("leaves normal sessions alone", () => {
    const res = proxy(request("/api/tasks", "POST", false));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("shows a read-only session every workspace", async () => {
    const asAuditor = await getWorkspacesRoute(request(`/api/workspaces?userId=${AUDITOR}`, "GET", true));
    const asNobody = await getWorkspacesRoute(request(`/api/workspaces?userId=${AUDITOR}`, "GET", false));
    expect((await asAuditor.json()).workspaces.length).toBeGreaterThan(0);
    expect((await asNobody.json()).workspaces).toEqual([]);
  });

  it("treats an auditor as a viewer even on boards they own", () => {
    const board = { ownerId: AUDITOR, memberIds: [] };
    const role = resolveBoardRole(AUDITOR, board, null, true);
    expect(role).toBe("viewer");
    expect(roleCan(role, "view")).toBe(true);
    expect(roleCan(role, "create")).toBe(false);
    expect(roleCan(role, "write")).toBe(false);
  });
});

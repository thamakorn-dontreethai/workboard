import { describe, it, expect } from "vitest";
import { prisma } from "../lib/server/prisma";

describe("Supabase PostgreSQL Cloud Database Live Connection", { timeout: 15000 }, () => {
  it("should connect to Supabase PostgreSQL and retrieve workspace", async () => {
    const workspace = await prisma.workspace.findFirst();
    expect(workspace).toBeDefined();
    expect(workspace?.name).toBe("Acme Global Ventures");
  });

  it("should retrieve seeded boards from Supabase Cloud", async () => {
    const boards = await prisma.board.findMany();
    expect(boards.length).toBeGreaterThanOrEqual(4);
    expect(boards.map((b) => b.id)).toContain("board-1");
  });

  it("should retrieve clean tasks list from Supabase Cloud", async () => {
    const tasks = await prisma.task.findMany();
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should perform a live cloud write and read transaction", async () => {
    const testTitle = `Cloud Integration Test Item ${Date.now()}`;
    const newTask = await prisma.task.create({
      data: {
        id: `task-cloud-${Date.now()}`,
        itemCode: "WB-999",
        boardId: "board-1",
        groupId: "group-1",
        title: testTitle,
        reporterId: "user-somchai",
        status: "in_progress",
        priority: "urgent",
      },
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe(testTitle);

    // Verify it exists in Supabase
    const fetched = await prisma.task.findUnique({
      where: { id: newTask.id },
    });
    expect(fetched?.title).toBe(testTitle);

    // Clean up
    await prisma.task.delete({
      where: { id: newTask.id },
    });
  });
});

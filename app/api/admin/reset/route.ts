import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { writeDb } from "@/lib/server/db";
import { MOCK_WORKSPACE, MOCK_USERS } from "@/lib/mock/data";

export async function POST() {
  const results: string[] = [];

  try {
    // Clear Supabase tables in dependency order
    try {
      await prisma.activity.deleteMany({});
      results.push("activities cleared");
    } catch (e: any) { results.push("activities: " + e.message); }

    try {
      await prisma.comment.deleteMany({});
      results.push("comments cleared");
    } catch (e: any) { results.push("comments: " + e.message); }

    try {
      await prisma.subtask.deleteMany({});
      results.push("subtasks cleared");
    } catch (e: any) { results.push("subtasks: " + e.message); }

    try {
      await prisma.task.deleteMany({});
      results.push("tasks cleared");
    } catch (e: any) { results.push("tasks: " + e.message); }

    try {
      await prisma.group.deleteMany({});
      results.push("groups cleared");
    } catch (e: any) { results.push("groups: " + e.message); }

    try {
      await prisma.board.deleteMany({});
      results.push("boards cleared");
    } catch (e: any) { results.push("boards: " + e.message); }

    try {
      await prisma.notification.deleteMany({});
      results.push("notifications cleared");
    } catch (e: any) { results.push("notifications: " + e.message); }

    // Clear invitation / member tables if they exist
    try { await (prisma as any).boardInvitation.deleteMany({}); results.push("invitations cleared"); } catch { }
    try { await (prisma as any).workspaceMember.deleteMany({}); results.push("workspaceMembers cleared"); } catch { }
    try { await (prisma as any).workspace.deleteMany({}); results.push("workspaces cleared"); } catch { }

    try {
      await prisma.user.deleteMany({});
      results.push("users cleared");
    } catch (e: any) { results.push("users: " + e.message); }

    // Also reset local JSON db
    writeDb({
      workspace: MOCK_WORKSPACE,
      users: [],
      boards: [],
      groups: [],
      tasks: [],
      subtasks: [],
      comments: [],
      activities: [],
      notifications: [],
      invitations: [],
    });
    results.push("local JSON db reset");

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, results },
      { status: 500 }
    );
  }
}

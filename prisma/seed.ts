import { PrismaClient } from "@prisma/client";
import {
  MOCK_WORKSPACE,
  MOCK_USERS,
  MOCK_BOARDS,
  MOCK_GROUPS,
  MOCK_TASKS,
  MOCK_SUBTASKS,
  MOCK_COMMENTS,
  MOCK_ACTIVITIES,
  MOCK_NOTIFICATIONS,
} from "../lib/mock/data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Supabase PostgreSQL database...");

  // 1. Create or upsert Workspace
  await prisma.workspace.upsert({
    where: { id: MOCK_WORKSPACE.id },
    update: {
      name: MOCK_WORKSPACE.name,
      plan: MOCK_WORKSPACE.plan,
    },
    create: {
      id: MOCK_WORKSPACE.id,
      name: MOCK_WORKSPACE.name,
      plan: MOCK_WORKSPACE.plan,
    },
  });

  // 2. Create or upsert Users
  for (const user of MOCK_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        avatarInitials: user.avatarInitials,
        avatarColor: user.avatarColor,
        role: user.role,
        isActive: user.isActive,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarInitials: user.avatarInitials,
        avatarColor: user.avatarColor,
        role: user.role,
        isActive: user.isActive,
      },
    });
  }

  // 3. Create or upsert Boards
  for (const board of MOCK_BOARDS) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: {
        name: board.name,
        description: board.description,
        type: board.type,
        color: board.color,
        ownerId: board.ownerId,
        isArchived: board.isArchived,
      },
      create: {
        id: board.id,
        workspaceId: board.workspaceId,
        name: board.name,
        description: board.description,
        type: board.type,
        color: board.color,
        ownerId: board.ownerId,
        isArchived: board.isArchived,
      },
    });
  }

  // 4. Create or upsert Groups
  for (const group of MOCK_GROUPS) {
    await prisma.group.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        color: group.color,
        order: group.order,
        isCollapsed: group.isCollapsed,
      },
      create: {
        id: group.id,
        boardId: group.boardId,
        name: group.name,
        color: group.color,
        order: group.order,
        isCollapsed: group.isCollapsed,
      },
    });
  }

  // 5. Create or upsert Tasks
  for (const task of MOCK_TASKS) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        reporterId: task.reporterId,
        dueDate: task.dueDate,
        category: task.category,
        order: task.order,
        isArchived: task.isArchived,
      },
      create: {
        id: task.id,
        itemCode: task.itemCode || `WB-${Math.floor(Math.random() * 900) + 100}`,
        boardId: task.boardId,
        groupId: task.groupId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        reporterId: task.reporterId,
        dueDate: task.dueDate,
        category: task.category,
        order: task.order,
        isArchived: task.isArchived,
      },
    });
  }

  // 6. Subtasks
  for (const sub of MOCK_SUBTASKS) {
    await prisma.subtask.upsert({
      where: { id: sub.id },
      update: {
        title: sub.title,
        isCompleted: sub.isCompleted,
        assigneeId: sub.assigneeId,
        dueDate: sub.dueDate,
      },
      create: {
        id: sub.id,
        taskId: sub.taskId,
        title: sub.title,
        isCompleted: sub.isCompleted,
        assigneeId: sub.assigneeId,
        dueDate: sub.dueDate,
      },
    });
  }

  // 7. Comments
  for (const comment of MOCK_COMMENTS) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        content: comment.content,
        isEdited: comment.isEdited,
      },
      create: {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        content: comment.content,
        isEdited: comment.isEdited,
      },
    });
  }

  // 8. Activities
  for (const act of MOCK_ACTIVITIES) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {
        description: act.description,
        type: act.type,
      },
      create: {
        id: act.id,
        taskId: act.taskId || null,
        boardId: act.boardId || null,
        actorId: act.actorId,
        type: act.type,
        description: act.description,
      },
    });
  }

  // 9. Notifications
  for (const notif of MOCK_NOTIFICATIONS) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {
        title: notif.title,
        body: notif.body,
        isRead: notif.isRead,
      },
      create: {
        id: notif.id,
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        taskId: notif.taskId || null,
        boardId: notif.boardId || null,
        isRead: notif.isRead,
      },
    });
  }

  console.log("✅ Supabase PostgreSQL seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

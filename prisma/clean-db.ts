import { PrismaClient } from "@prisma/client";
import {
  MOCK_WORKSPACE,
  MOCK_USERS,
  MOCK_BOARDS,
  MOCK_GROUPS,
} from "../lib/mock/data";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning mock tasks and resetting to pristine empty state...");

  // 1. Delete all tasks, subtasks, comments, activities, notifications
  await prisma.comment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.task.deleteMany({});

  console.log("✅ Wiped all dummy tasks, comments, and activities.");

  // 2. Ensure Workspace exists
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

  // 3. Ensure Default Users exist
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

  // 4. Ensure Clean Boards exist
  for (const board of MOCK_BOARDS) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: {
        name: board.name,
        description: board.description,
        type: board.type,
        color: board.color,
        ownerId: board.ownerId,
        isArchived: false,
      },
      create: {
        id: board.id,
        workspaceId: board.workspaceId,
        name: board.name,
        description: board.description,
        type: board.type,
        color: board.color,
        ownerId: board.ownerId,
        isArchived: false,
      },
    });
  }

  // 5. Ensure Clean Groups exist
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

  console.log("🎉 Database is now completely clean and ready for real data!");
}

main()
  .catch((e) => {
    console.error("❌ Clean DB error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "../lib/server/prisma";
import { readDb, writeDb } from "../lib/server/db";
import { DEFAULT_USER, MOCK_BOARDS, MOCK_WORKSPACE } from "../lib/mock/data";

async function cleanUp() {
  console.log("Cleaning up dummy users and assigning boards to Somchai...");

  // 1. Ensure Somchai user exists in Supabase PostgreSQL
  await prisma.user.upsert({
    where: { email: DEFAULT_USER.email },
    update: {
      id: DEFAULT_USER.id,
      name: DEFAULT_USER.name,
      role: DEFAULT_USER.role,
      isActive: true,
    },
    create: {
      id: DEFAULT_USER.id,
      name: DEFAULT_USER.name,
      email: DEFAULT_USER.email,
      avatarInitials: DEFAULT_USER.avatarInitials,
      avatarColor: DEFAULT_USER.avatarColor,
      role: DEFAULT_USER.role,
      isActive: true,
    },
  });

  // 2. Update boards in Supabase to belong to Somchai
  for (const b of MOCK_BOARDS) {
    await prisma.board.upsert({
      where: { id: b.id },
      update: {
        ownerId: DEFAULT_USER.id,
        memberIds: [DEFAULT_USER.id],
        isArchived: false,
      },
      create: {
        id: b.id,
        workspaceId: MOCK_WORKSPACE.id,
        name: b.name,
        description: b.description,
        type: b.type,
        color: b.color,
        ownerId: DEFAULT_USER.id,
        memberIds: [DEFAULT_USER.id],
        isArchived: false,
      },
    });
  }

  // 3. Remove dummy mock users from Supabase PostgreSQL
  const dummyIds = ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"];
  await prisma.user.deleteMany({
    where: { id: { in: dummyIds } },
  }).catch((e) => console.log("Delete note:", e.message));

  // 4. Update local workboard.json
  const db = readDb();
  db.users = [DEFAULT_USER];
  db.boards = MOCK_BOARDS;
  writeDb(db);

  console.log("✅ Successfully cleaned dummy users! Only real users remain.");
}

cleanUp()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

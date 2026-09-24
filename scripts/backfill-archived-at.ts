import { prisma } from "@/lib/server/prisma";

// Rows archived before the column existed have archivedAt = null. For an
// archived row, updatedAt IS the moment it was archived: the delete does an
// update, and nothing touches the row afterwards because every query filters
// it out. Seed archivedAt from it so those rows age out on the same clock as
// new ones instead of relying on the fallback forever.
async function main() {
  const dry = process.argv.includes("--dry");
  const tasks = await prisma.task.findMany({
    where: { isArchived: true, archivedAt: null },
    select: { id: true, updatedAt: true },
  });
  const boards = await prisma.board.findMany({
    where: { isArchived: true, archivedAt: null },
    select: { id: true, updatedAt: true },
  });
  console.log(`archived rows missing archivedAt -> tasks: ${tasks.length}, boards: ${boards.length}`);
  if (dry) {
    [...tasks.slice(0, 3)].forEach((t) => console.log(`  task ${t.id} would get ${t.updatedAt.toISOString()}`));
    return;
  }
  for (const t of tasks) {
    await prisma.task.update({ where: { id: t.id }, data: { archivedAt: t.updatedAt } });
  }
  for (const b of boards) {
    await prisma.board.update({ where: { id: b.id }, data: { archivedAt: b.updatedAt } });
  }
  const left = await prisma.task.count({ where: { isArchived: true, archivedAt: null } });
  const leftB = await prisma.board.count({ where: { isArchived: true, archivedAt: null } });
  console.log(`backfilled. remaining without archivedAt -> tasks: ${left}, boards: ${leftB}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

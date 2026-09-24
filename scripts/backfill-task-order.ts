import { prisma } from "@/lib/server/prisma";

/**
 * Gives every task a distinct `order` within its group.
 *
 * createTask used to derive the value from the local JSON file rather than
 * the database, so it kept handing out 0, 1 and 2 no matter how many tasks
 * a group already had. Rows that share an order value have no defined
 * position, which is why the board looked like it re-sorted itself.
 *
 * Existing sequence is preserved: tasks are renumbered in the order the
 * board already displays them (order, then createdAt), so nothing visibly
 * moves — the positions simply become stable.
 *
 * Run with `--dry` to see what it would change.
 */
async function main() {
  const dry = process.argv.includes("--dry");

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      tasks: {
        where: { isArchived: false },
        select: { id: true, title: true, order: true, createdAt: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  let groupsTouched = 0;
  let tasksTouched = 0;
  let collisionsBefore = 0;

  for (const g of groups) {
    const orders = g.tasks.map((t) => t.order);
    collisionsBefore += orders.length - new Set(orders).size;

    const renumbered = g.tasks
      .map((t, i) => ({ id: t.id, title: t.title, from: t.order, to: i }))
      .filter((t) => t.from !== t.to);
    if (renumbered.length === 0) continue;

    groupsTouched++;
    tasksTouched += renumbered.length;
    if (dry) {
      console.log(`group "${g.name}" — ${renumbered.length} task(s) to renumber`);
      for (const t of renumbered.slice(0, 5)) {
        console.log(`    ${t.from} -> ${t.to}   ${t.title.slice(0, 32)}`);
      }
      continue;
    }

    // One statement per group rather than per task: the database link is the
    // slow part, and a group is a handful of rows.
    await prisma.$transaction(
      renumbered.map((t) =>
        prisma.task.update({ where: { id: t.id }, data: { order: t.to } })
      )
    );
  }

  console.log(
    `\n${dry ? "[dry run] " : ""}groups: ${groups.length}, ` +
      `order collisions found: ${collisionsBefore}, ` +
      `groups renumbered: ${groupsTouched}, tasks renumbered: ${tasksTouched}`
  );

  if (!dry) {
    const after = await prisma.group.findMany({
      select: { tasks: { where: { isArchived: false }, select: { order: true } } },
    });
    const left = after.reduce((n, g) => {
      const o = g.tasks.map((t) => t.order);
      return n + (o.length - new Set(o).size);
    }, 0);
    console.log(`collisions remaining: ${left}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

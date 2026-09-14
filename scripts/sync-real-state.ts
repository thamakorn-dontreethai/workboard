import fs from "fs";
import path from "path";
import { prisma } from "../lib/server/prisma";

async function main() {
  console.log("=== Syncing Real User State & Purging Dummies ===");

  const dbFile = path.join(process.cwd(), ".data", "workboard.json");
  const raw = fs.readFileSync(dbFile, "utf-8");
  const data = JSON.parse(raw);

  // 1. Clean workspace
  data.workspace.name = "TGAS Workspace";
  data.workspace.members = [
    {
      userId: "user-somchai",
      workspaceId: "ws-1",
      role: "owner",
      joinedAt: new Date().toISOString(),
    },
  ];

  // 2. Ensure Somchai
  const somchai = {
    id: "user-somchai",
    name: "Somchai",
    email: "somchai@tgas.co.th",
    avatarInitials: "SC",
    avatarColor: "bg-emerald-600",
    role: "Project Manager",
    department: "Management",
    isActive: true,
  };

  // 3. Ensure Thamakhorn (invited by user earlier)
  let thamakhorn = data.users.find(
    (u: any) => u.email.toLowerCase() === "thamakhorn@gmail.com"
  );
  if (!thamakhorn) {
    thamakhorn = {
      id: "user-thamakhorn",
      name: "Thamakhorn",
      email: "thamakhorn@gmail.com",
      avatarInitials: "TH",
      avatarColor: "bg-teal-600",
      role: "Member",
      isActive: true,
    };
  }

  data.users = [somchai, thamakhorn];

  data.workspace.members.push({
    userId: thamakhorn.id,
    workspaceId: "ws-1",
    role: "member",
    joinedAt: new Date().toISOString(),
  });

  // 4. Update Board memberIds
  for (const board of data.boards) {
    board.ownerId = "user-somchai";
    board.memberIds = ["user-somchai", thamakhorn.id];
  }

  // 5. Update invitations
  for (const inv of data.invitations || []) {
    if (inv.email === "thamakhorn@gmail.com") {
      inv.status = "accepted";
      inv.acceptedAt = new Date().toISOString();
    }
  }

  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf-8");
  console.log("Updated .data/workboard.json successfully.");

  // 6. Sync with Supabase PostgreSQL
  try {
    // Delete any dummy users from PostgreSQL
    await prisma.user.deleteMany({
      where: {
        id: { in: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"] },
      },
    });

    // Upsert Somchai
    await prisma.user.upsert({
      where: { email: "somchai@tgas.co.th" },
      create: {
        id: "user-somchai",
        name: "Somchai",
        email: "somchai@tgas.co.th",
        password:
          "d3b235e7654c2f20279a34b361b79f56b129bea70d17219d26a78df53dae379d", // 123456
        avatarInitials: "SC",
        avatarColor: "bg-emerald-600",
        role: "Project Manager",
        isActive: true,
      },
      update: {
        id: "user-somchai",
        name: "Somchai",
        role: "Project Manager",
        avatarInitials: "SC",
        avatarColor: "bg-emerald-600",
      },
    });

    // Upsert Thamakhorn
    await prisma.user.upsert({
      where: { email: "thamakhorn@gmail.com" },
      create: {
        id: thamakhorn.id,
        name: "Thamakhorn",
        email: "thamakhorn@gmail.com",
        avatarInitials: "TH",
        avatarColor: "bg-teal-600",
        role: "Member",
        isActive: true,
      },
      update: {
        name: "Thamakhorn",
        avatarInitials: "TH",
        avatarColor: "bg-teal-600",
        role: "Member",
      },
    });

    // Update board memberIds in Postgres
    await prisma.board.updateMany({
      data: {
        memberIds: ["user-somchai", thamakhorn.id],
      },
    });

    console.log("Synchronized PostgreSQL in Supabase!");
    const dbUsers = await prisma.user.findMany();
    console.log(
      "Current DB Users in PostgreSQL:",
      dbUsers.map((u) => ({ id: u.id, name: u.name, email: u.email }))
    );
    const dbBoards = await prisma.board.findMany();
    console.log(
      "Current Board memberIds in PostgreSQL:",
      dbBoards.map((b) => ({ id: b.id, name: b.name, memberIds: b.memberIds }))
    );
  } catch (err) {
    console.error("Postgres sync error:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

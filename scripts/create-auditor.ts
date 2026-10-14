import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/auth";

/**
 * Creates (or upgrades) a read-only admin account: it sees every workspace
 * but cannot change anything (see proxy.ts). This script is the only way to
 * set User.isAuditor — there is no API or UI for it.
 *
 *   npx tsx --env-file=.env scripts/create-auditor.ts <email> <password> [name]
 *
 * If the email already belongs to someone, that account is turned into an
 * auditor (password left unchanged unless one is given). Sessions that were
 * already signed in keep write access until that person signs in again.
 */
async function main() {
  const [email, password, name = "Admin (read-only)"] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: scripts/create-auditor.ts <email> <password> [name]");
    process.exit(1);
  }
  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isAuditor: true, ...(password && { password: hashPassword(password.trim()) }) },
    });
    console.log(`${cleanEmail} is now a read-only admin.`);
    return;
  }

  if (!password) {
    console.error("A password is required when creating a new account.");
    process.exit(1);
  }
  await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      name,
      email: cleanEmail,
      password: hashPassword(password.trim()),
      avatarInitials: "AD",
      avatarColor: "bg-zinc-600",
      role: "Admin",
      isAuditor: true,
    },
  });
  console.log(`Created read-only admin ${cleanEmail}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

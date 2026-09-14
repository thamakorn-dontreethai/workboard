import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { readDb, writeDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/auth";
import type { User } from "@/types";

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-cyan-600",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, department } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user already exists in PostgreSQL
    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: "An account with this email already exists" },
            { status: 400 }
          );
        }
      } catch (e) {
        console.warn("Prisma check existing user fallback:", e);
      }
    }

    // Check in local db fallback
    const db = readDb();
    const existingLocal = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingLocal) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const initials = cleanName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    const avatarColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const hashedPassword = hashPassword(password);
    const userId = `user-${Date.now()}`;

    const newUser: User = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      avatarInitials: initials,
      avatarColor,
      role: role || "Project Manager",
      department: department || "General",
      isActive: true,
    };

    // Save to Supabase PostgreSQL
    if (process.env.DATABASE_URL) {
      try {
        await prisma.user.create({
          data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            password: hashedPassword,
            avatarInitials: newUser.avatarInitials,
            avatarColor: newUser.avatarColor,
            role: newUser.role,
            isActive: true,
          },
        });
      } catch (e) {
        console.warn("Prisma user create fallback:", e);
      }
    }

    // Save to local file store
    db.users.push(newUser);
    writeDb(db);

    // Return sanitized user (without password)
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: safeUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { readDb } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check in Supabase PostgreSQL first
    if (process.env.DATABASE_URL) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (user) {
          // MUST have a password stored — no password = account not fully set up
          if (!user.password) {
            return NextResponse.json(
              { success: false, error: "Invalid email or password" },
              { status: 401 }
            );
          }
          const isValid = verifyPassword(cleanPassword, user.password);
          if (!isValid) {
            return NextResponse.json(
              { success: false, error: "Invalid email or password" },
              { status: 401 }
            );
          }
          const { password: _, ...safeUser } = user;
          return NextResponse.json({
            success: true,
            message: "Login successful",
            data: safeUser,
          });
        }
      } catch (e) {
        console.warn("Prisma login check fallback:", e);
      }
    }

    // 2. Check in local JSON db fallback
    const db = readDb();
    const localUser = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!localUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // MUST have a hashed password — no password on account = refuse login
    if (!localUser.password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(cleanPassword, localUser.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = localUser;
    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: safeUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}

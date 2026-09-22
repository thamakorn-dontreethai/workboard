import { NextResponse } from "next/server";
import { changeUserPassword } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

export async function POST(request: Request) {
  const session = requireSession(request);
  if (!session.ok) return session.response;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current and new password are required" },
        { status: 400 }
      );
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = await changeUserPassword(session.userId, currentPassword, newPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to change password" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: "Password updated" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to change password" },
      { status: 500 }
    );
  }
}

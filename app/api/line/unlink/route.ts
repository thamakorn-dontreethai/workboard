import { NextResponse } from "next/server";
import { unlinkLineAccount } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

export async function POST(request: Request) {
  const session = requireSession(request);
  if (!session.ok) return session.response;

  const ok = await unlinkLineAccount(session.userId);
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Failed to unlink LINE" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

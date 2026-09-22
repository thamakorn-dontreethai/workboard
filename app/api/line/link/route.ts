import { NextResponse } from "next/server";
import { createLineLinkCode } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";
import { isLineConfigured } from "@/lib/server/line";

// Generates a short-lived link code for the signed-in user. They send this
// code as a message to the LINE Official Account; the webhook matches it
// back to this account and stores the LINE userId.
export async function POST(request: Request) {
  const session = requireSession(request);
  if (!session.ok) return session.response;

  if (!isLineConfigured()) {
    return NextResponse.json(
      { success: false, error: "LINE integration is not configured on this server yet" },
      { status: 503 }
    );
  }

  const code = await createLineLinkCode(session.userId);
  if (!code) {
    return NextResponse.json(
      { success: false, error: "Failed to generate a link code" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { code, expiresInSeconds: 600 },
  });
}

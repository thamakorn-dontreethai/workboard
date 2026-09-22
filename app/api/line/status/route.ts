import { NextResponse } from "next/server";
import { getLineLinkStatus } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";
import { isLineConfigured } from "@/lib/server/line";

export async function GET(request: Request) {
  const session = requireSession(request);
  if (!session.ok) return session.response;

  const status = await getLineLinkStatus(session.userId);
  return NextResponse.json({
    success: true,
    data: { ...status, configured: isLineConfigured() },
  });
}

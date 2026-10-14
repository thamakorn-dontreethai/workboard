import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";

// Read-only admin sessions (User.isAuditor, carried as `ro` in the signed
// session cookie) may look at everything but change nothing. Enforced here,
// once, for every API route — rather than trusting each of the ~50 write
// handlers to remember the check.
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Signing in and out are the only writes such a session may make.
const ALLOWED_WRITES = new Set(["/api/auth/login", "/api/auth/logout"]);

export function proxy(request: NextRequest) {
  if (READ_METHODS.has(request.method)) return NextResponse.next();
  if (ALLOWED_WRITES.has(request.nextUrl.pathname)) return NextResponse.next();
  if (!getSession(request)?.readOnly) return NextResponse.next();

  return NextResponse.json(
    { success: false, error: "This is a read-only admin account" },
    { status: 403 }
  );
}

export const config = {
  matcher: "/api/:path*",
};

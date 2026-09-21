import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/server/session";
import { getUsers } from "@/lib/server/db";

// Who the server believes is signed in (from the signed cookie). The client
// uses this to notice a stale browser-only login and send the user back to
// the sign-in page.
export async function GET(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { password: _password, ...safeUser } = user as typeof user & { password?: string };
  return NextResponse.json({ success: true, data: safeUser });
}

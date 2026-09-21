import { NextResponse } from "next/server";
import { updateNotificationPreferences } from "@/lib/server/db";

// Deliberately narrow: this only accepts the notification opt-out toggles,
// not a generic user-update endpoint — profile fields (name/email/avatar)
// go through their own dedicated flows.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, boolean> = {};
    if (typeof body.notifyPostLikes === "boolean") updates.notifyPostLikes = body.notifyPostLikes;
    if (typeof body.notifyPostComments === "boolean")
      updates.notifyPostComments = body.notifyPostComments;
    if (typeof body.notifyNewPosts === "boolean") updates.notifyNewPosts = body.notifyNewPosts;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid notification preference fields provided" },
        { status: 400 }
      );
    }

    const user = await updateNotificationPreferences(id, updates);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

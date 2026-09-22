import { NextResponse } from "next/server";
import { updateNotificationPreferences, updateUserProfile } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

// Accepts the notification opt-out toggles and basic profile fields
// (name/avatarColor). Email/password/role changes go through their own
// dedicated flows (login/register, change-password).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = requireSession(request);
    if (!session.ok) return session.response;
    if (session.userId !== id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const notificationUpdates: Record<string, boolean> = {};
    if (typeof body.notifyPostLikes === "boolean") notificationUpdates.notifyPostLikes = body.notifyPostLikes;
    if (typeof body.notifyPostComments === "boolean")
      notificationUpdates.notifyPostComments = body.notifyPostComments;
    if (typeof body.notifyNewPosts === "boolean") notificationUpdates.notifyNewPosts = body.notifyNewPosts;

    const profileUpdates: { name?: string; avatarColor?: string } = {};
    if (typeof body.name === "string" && body.name.trim()) profileUpdates.name = body.name;
    if (typeof body.avatarColor === "string" && body.avatarColor.trim())
      profileUpdates.avatarColor = body.avatarColor;

    if (
      Object.keys(notificationUpdates).length === 0 &&
      Object.keys(profileUpdates).length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided" },
        { status: 400 }
      );
    }

    let user = null;
    if (Object.keys(notificationUpdates).length > 0) {
      user = await updateNotificationPreferences(id, notificationUpdates);
    }
    if (Object.keys(profileUpdates).length > 0) {
      user = await updateUserProfile(id, profileUpdates);
    }

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

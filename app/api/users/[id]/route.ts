import { NextResponse } from "next/server";
import { updateNotificationPreferences, updateUserProfile } from "@/lib/server/db";
import { requireSession } from "@/lib/server/permissions";

const MAX_AVATAR_URL_LENGTH = 7 * 1024 * 1024; // ~5MB of image once base64-decoded

// Accepts the notification opt-out toggles and basic profile fields
// (name/avatarColor/avatarUrl). Email/password/role changes go through their
// own dedicated flows (login/register, change-password).
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

    const profileUpdates: { name?: string; avatarColor?: string; avatarUrl?: string | null } = {};
    if (typeof body.name === "string" && body.name.trim()) profileUpdates.name = body.name;
    if (typeof body.avatarColor === "string" && body.avatarColor.trim())
      profileUpdates.avatarColor = body.avatarColor;
    // Uploaded profile photo: a base64 image data URL, or null to drop it and
    // fall back to the color+initials avatar.
    if (body.avatarUrl === null) {
      profileUpdates.avatarUrl = null;
    } else if (typeof body.avatarUrl === "string") {
      if (!body.avatarUrl.startsWith("data:image/")) {
        return NextResponse.json(
          { success: false, error: "Profile photo must be an image" },
          { status: 400 }
        );
      }
      // Base64 inflates by ~4/3, so this tracks the 5MB cap applied client-side.
      if (body.avatarUrl.length > MAX_AVATAR_URL_LENGTH) {
        return NextResponse.json(
          { success: false, error: "Profile photo must be smaller than 5MB" },
          { status: 413 }
        );
      }
      profileUpdates.avatarUrl = body.avatarUrl;
    }

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

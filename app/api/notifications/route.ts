import { NextResponse } from "next/server";
import { getNotifications, markAllNotificationsRead } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const notifications = await getNotifications(userId);
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    await markAllNotificationsRead(body.userId);
    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

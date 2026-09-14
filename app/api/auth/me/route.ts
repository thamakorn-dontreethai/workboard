import { NextResponse } from "next/server";
import { getUsers } from "@/lib/server/db";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

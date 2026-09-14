import { NextResponse } from "next/server";
import { getWorkspace } from "@/lib/server/db";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    return NextResponse.json({ success: true, data: workspace });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

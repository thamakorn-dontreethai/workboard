import { NextResponse } from "next/server";
import { getDashboards, createDashboard } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const dashboards = await getDashboards(workspaceId);
    return NextResponse.json({ success: true, data: dashboards });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.workspaceId || !body.name?.trim() || !body.createdById) {
      return NextResponse.json(
        { success: false, error: "workspaceId, name and createdById are required" },
        { status: 400 }
      );
    }
    const dashboard = await createDashboard({
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      description: body.description || "",
      widgets: Array.isArray(body.widgets) ? body.widgets : undefined,
      createdById: body.createdById,
    });
    return NextResponse.json({ success: true, data: dashboard }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

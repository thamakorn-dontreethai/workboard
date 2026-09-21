import { NextResponse } from "next/server";
import { updateGroup, deleteGroup } from "@/lib/server/db";
import { authorizeGroup } from "@/lib/server/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    // Collapsing/expanding a group is a harmless per-board tweak anyone on the
    // board may do; every other change (name, colour, order) is leader-only.
    const keys = Object.keys(body);
    const onlyCollapse = keys.length > 0 && keys.every((k) => k === "isCollapsed");
    const auth = await authorizeGroup(request, id, onlyCollapse ? "view" : "manage");
    if (!auth.ok) return auth.response;

    const updated = await updateGroup(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeGroup(request, id, "manage");
    if (!auth.ok) return auth.response;

    const deleted = await deleteGroup(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

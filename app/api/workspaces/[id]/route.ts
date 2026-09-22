import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  togglePinWorkspace,
} from "@/lib/server/db";
import { authorizeWorkspace } from "@/lib/server/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ws = await getWorkspaceById(id);
    if (!ws) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: ws });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Recording "last viewed" and pinning are harmless per-person tweaks any
    // member may do; everything else (name, colours, cover, privacy,
    // members) is owner/admin only.
    const keys = Object.keys(body);
    const lightweight =
      keys.length > 0 &&
      (body.action === "togglePin"
        ? keys.every((k) => k === "action")
        : keys.every((k) => k === "lastViewedAt"));
    const auth = await authorizeWorkspace(req, id, lightweight ? "view" : "manage");
    if (!auth.ok) return auth.response;

    if (body.action === "togglePin") {
      const updated = await togglePinWorkspace(id);
      return NextResponse.json({ success: true, data: updated });
    }

    const updated = await updateWorkspace(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Only the owner may delete a workspace.
    const auth = await authorizeWorkspace(req, id, "owner");
    if (!auth.ok) return auth.response;

    await deleteWorkspace(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

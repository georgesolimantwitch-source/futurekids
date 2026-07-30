import { NextResponse } from "next/server";
import { requireParentFromRequest } from "@/lib/kids/auth";
import {
  isKidAppKey,
  KidApiError,
  manageKidAction,
  removeKidForParent,
  setKidAppEnabled,
} from "@/lib/kids/portal";

export async function POST(request: Request) {
  const auth = await requireParentFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error.message },
      { status: auth.error.status },
    );
  }
  const user = auth.user;

  let body: {
    action?: string;
    child_id?: string;
    app_key?: string;
    enabled?: boolean;
    allow_pending_plan?: boolean;
    transfer_from_child_id?: string;
    new_password?: string;
    new_username?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = (body.action ?? "").trim();
  const childId = (body.child_id ?? "").trim().toLowerCase();
  if (!action || !childId) {
    return NextResponse.json({ error: "Missing action or child." }, { status: 400 });
  }

  try {
    if (action === "set_app_access") {
      const appKey = (body.app_key ?? "").trim().toLowerCase();
      if (!isKidAppKey(appKey)) {
        return NextResponse.json({ error: "Unknown app." }, { status: 400 });
      }
      await setKidAppEnabled({
        parentId: user.id,
        childId,
        appKey,
        enabled: Boolean(body.enabled),
        allowPendingPlan: Boolean(body.allow_pending_plan),
        transferFromChildId: body.transfer_from_child_id,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_child") {
      await removeKidForParent({
        parentId: user.id,
        childId,
      });
      return NextResponse.json({ ok: true });
    }

    if (
      action === "reset_password" ||
      action === "change_username" ||
      action === "disable_login" ||
      action === "enable_login"
    ) {
      const result = await manageKidAction({
        parentId: user.id,
        childId,
        action,
        newPassword: body.new_password,
        newUsername: body.new_username,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof KidApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("manage kid", error);
    return NextResponse.json(
      { error: "Could not update the child account." },
      { status: 500 },
    );
  }
}

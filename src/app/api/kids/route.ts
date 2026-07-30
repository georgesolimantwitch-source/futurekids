import { NextResponse } from "next/server";
import { requireParentFromRequest } from "@/lib/kids/auth";
import {
  createKidForParent,
  getScholarsSeatLimit,
  isKidAppKey,
  KidApiError,
  listKidsForParent,
  type KidAppKey,
} from "@/lib/kids/portal";

export async function GET(request: Request) {
  const auth = await requireParentFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error.message },
      { status: auth.error.status },
    );
  }

  try {
    const [children, scholarsSeatLimit] = await Promise.all([
      listKidsForParent(auth.user.id),
      getScholarsSeatLimit(auth.user.id),
    ]);
    return NextResponse.json({ ok: true, children, scholarsSeatLimit });
  } catch (error) {
    console.error("list kids", error);
    return NextResponse.json({ error: "Could not load kids." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireParentFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error.message },
      { status: auth.error.status },
    );
  }

  let body: {
    full_name?: string;
    username?: string;
    password?: string;
    date_of_birth?: string;
    avatar_color?: string;
    enabled_apps?: string[];
    parent_manages_confirmed?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.parent_manages_confirmed) {
    return NextResponse.json(
      { error: "Confirm that you manage this child account." },
      { status: 400 },
    );
  }

  // An empty array means "no apps yet" — only an omitted field falls back to
  // unlocking everything the parent is subscribed to.
  const enabledApps = Array.isArray(body.enabled_apps)
    ? (body.enabled_apps
        .map((a) => a.trim().toLowerCase())
        .filter(isKidAppKey) as KidAppKey[])
    : undefined;

  try {
    const child = await createKidForParent({
      parentId: auth.user.id,
      parentEmail: auth.user.email ?? null,
      fullName: body.full_name ?? "",
      username: body.username ?? "",
      password: body.password ?? "",
      dateOfBirth: body.date_of_birth ?? "",
      avatarColor: body.avatar_color,
      enabledApps,
    });
    return NextResponse.json({ ok: true, child });
  } catch (error) {
    if (error instanceof KidApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("create kid", error);
    return NextResponse.json(
      { error: "Could not create the child account." },
      { status: 500 },
    );
  }
}

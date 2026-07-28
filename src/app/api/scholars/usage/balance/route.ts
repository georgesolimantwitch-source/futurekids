import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireBearerUser } from "@/lib/subscriptions/auth";
import { getScholarsCreditBalanceForChild } from "@/lib/scholars/credits";
import { parentOwnsChild } from "@/lib/kids/portal";

export const runtime = "nodejs";

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    try {
      const { user } = await requireBearerUser(request);
      return user.id;
    } catch {
      return null;
    }
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const childIdParam = request.nextUrl.searchParams.get("childId")?.trim();
  const wantPool = request.nextUrl.searchParams.get("pool") === "1";
  const childId = wantPool ? userId : childIdParam || userId;

  try {
    if (childId !== userId) {
      const owns = await parentOwnsChild(userId, childId);
      if (!owns) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const balance = await getScholarsCreditBalanceForChild(childId);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("[scholars/usage/balance]", error);
    return NextResponse.json(
      { error: "Could not load balance" },
      { status: 500 },
    );
  }
}

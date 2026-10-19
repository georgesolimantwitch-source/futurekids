import { NextRequest, NextResponse } from "next/server";
import { getCreatorByCode } from "@/lib/creators/store";
import { normalizeCreatorCode } from "@/config/creators";

export async function GET(request: NextRequest) {
  const code = normalizeCreatorCode(
    request.nextUrl.searchParams.get("code") ?? "",
  );
  if (!code) {
    return NextResponse.json({ valid: false });
  }
  const creator = await getCreatorByCode(code);
  if (!creator || (creator.status !== "active" && creator.status !== "onboarding")) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({
    valid: true,
    code: creator.code,
    displayName: creator.display_name,
  });
}

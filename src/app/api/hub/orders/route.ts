import { NextResponse } from "next/server";
import { listHubOrdersForUser } from "@/lib/hub/orders";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const orders = await listHubOrdersForUser(user.id);
  return NextResponse.json({ orders });
}

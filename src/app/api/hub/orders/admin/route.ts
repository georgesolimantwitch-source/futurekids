import { NextResponse } from "next/server";
import { isHubAdminEmail, listAllHubOrders } from "@/lib/hub/orders";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isHubAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await listAllHubOrders();
  return NextResponse.json({ orders });
}

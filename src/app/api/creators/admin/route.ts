import { NextResponse } from "next/server";
import {
  isCreatorAdminEmail,
  listAllCommissions,
  listAllCreators,
} from "@/lib/creators/store";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isCreatorAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [creators, commissions] = await Promise.all([
    listAllCreators(),
    listAllCommissions(),
  ]);

  return NextResponse.json({ creators, commissions });
}

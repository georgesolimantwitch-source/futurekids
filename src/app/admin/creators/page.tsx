import { redirect } from "next/navigation";
import { CreatorAdminDashboard } from "@/components/creators/CreatorAdminDashboard";
import { isCreatorAdminEmail } from "@/lib/creators/store";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Creators — Admin" };

export default async function AdminCreatorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/creators");
  if (!isCreatorAdminEmail(user.email)) redirect("/account");
  return <CreatorAdminDashboard />;
}

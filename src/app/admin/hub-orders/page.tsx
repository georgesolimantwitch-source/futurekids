import { redirect } from "next/navigation";
import { HubAdminOrders } from "@/components/hub/HubAdminOrders";
import { isHubAdminEmail } from "@/lib/hub/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Hub orders — Admin",
};

export default async function AdminHubOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/hub-orders");
  }
  if (!isHubAdminEmail(user.email)) {
    redirect("/account");
  }

  return <HubAdminOrders />;
}

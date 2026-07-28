import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { getOrRepairEcosystemAccount } from "@/lib/auth/account";

export default async function AccountPage() {
  const { account, user, error } = await getOrRepairEcosystemAccount();
  if (!user) redirect("/login?next=/account");

  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-[#fefbf6]" />}>
      <AccountDashboard
        initialAccount={account}
        authUser={user}
        emailVerified={Boolean(user.email_confirmed_at)}
        setupError={error}
      />
    </Suspense>
  );
}

import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Check your inbox" subtitle="Loading…">
          <div className="h-40 animate-pulse rounded-2xl bg-[#f7f8fc]" />
        </AuthShell>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}

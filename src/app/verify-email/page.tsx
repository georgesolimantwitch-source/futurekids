import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a confirmation link to your inbox. Please verify your email before signing in on a new device."
      footer={
        <>
          Already verified? <Link href="/login" className="font-medium underline underline-offset-4">Sign in</Link>
        </>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
        <p>Check your spam folder if you do not see the email within a few minutes.</p>
        <p>
          Once verified, your Genlyn account will work across Earnly, Scholars Notes, Ballr,
          and TinyPal.
        </p>
      </div>
    </AuthShell>
  );
}

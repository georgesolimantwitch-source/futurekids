import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#fafafa]" />}>
      <LoginForm />
    </Suspense>
  );
}

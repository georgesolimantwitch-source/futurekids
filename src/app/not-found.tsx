import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center lg:px-8">
      <h1 className="text-6xl font-semibold text-neutral-900">404</h1>
      <p className="mt-4 text-lg text-neutral-600">This page could not be found.</p>
      <div className="mt-8">
        <Button href="/" size="lg">
          Back to Home
        </Button>
      </div>
    </div>
  );
}

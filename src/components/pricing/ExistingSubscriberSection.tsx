import { existingSubscriberSection } from "@/config/pricing";
import { Button } from "@/components/ui/Button";

export function ExistingSubscriberSection() {
  return (
    <section className="border-y border-neutral-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {existingSubscriberSection.headline}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
          {existingSubscriberSection.text}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            href={existingSubscriberSection.signInHref}
            size="lg"
            className="w-full sm:w-auto"
          >
            Sign In
          </Button>
          <Button
            href={existingSubscriberSection.viewAppsHref}
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            View My Apps
          </Button>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          Authentication not connected yet — placeholder destinations only.
        </p>
      </div>
    </section>
  );
}

import { pricingCta } from "@/config/pricing";
import { Button } from "@/components/ui/Button";

export function PricingCTA() {
  return (
    <section className="bg-neutral-900 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          {pricingCta.headline}
        </h2>
        <p className="mt-4 text-base text-neutral-400 sm:text-lg">{pricingCta.supportingText}</p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            href={pricingCta.exploreAppsHref}
            size="lg"
            className="w-full bg-white text-neutral-900 hover:bg-neutral-100 sm:w-auto"
          >
            Explore Apps
          </Button>
          <Button
            href={pricingCta.comparePlansHref}
            variant="secondary"
            size="lg"
            className="w-full border-neutral-700 bg-transparent text-white hover:bg-neutral-800 sm:w-auto"
          >
            Compare Plans
          </Button>
        </div>
      </div>
    </section>
  );
}

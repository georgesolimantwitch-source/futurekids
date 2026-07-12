import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="bg-neutral-900 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Four apps. One growing ecosystem.
        </h2>
        <p className="mt-4 text-base text-neutral-400 sm:text-lg">
          Start exploring the apps built for every part of growing up.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            href="/#apps"
            size="lg"
            className="w-full bg-white text-neutral-900 hover:bg-neutral-100 sm:w-auto"
          >
            Explore Apps
          </Button>
          <Button
            href="/contact"
            variant="secondary"
            size="lg"
            className="w-full border-neutral-700 bg-transparent text-white hover:bg-neutral-800 sm:w-auto"
          >
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}

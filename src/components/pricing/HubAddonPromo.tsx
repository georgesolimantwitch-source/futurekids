import Image from "next/image";
import Link from "next/link";
import { hubSizes } from "@/config/hub";
import { Reveal } from "@/components/site/motion";
import { PillLink } from "@/components/site/ui";

export function HubAddonPromo() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal dir="scale">
          <div className="relative overflow-hidden rounded-[36px] bg-white shadow-[0_40px_90px_-50px_rgba(15,23,42,0.45)] ring-1 ring-ink/5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(124,58,237,0.12),transparent_40%),radial-gradient(circle_at_10%_80%,rgba(37,99,235,0.1),transparent_35%)]"
            />
            <div className="relative grid items-center gap-10 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7c3aed]">
                  Hardware add-on
                </p>
                <h2 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl">
                  Add a Genlyn Hub
                  <br />
                  to your home.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                  Put the family calendar on the wall. One-time purchase — works
                  alongside any Genlyn subscription.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {hubSizes.map((size) => (
                    <Link
                      key={size.id}
                      href={`/genlyn-hub/checkout?size=${size.id}`}
                      className="press rounded-full bg-[#f7f8fc] px-5 py-3 text-sm font-bold text-ink ring-1 ring-ink/5 transition hover:bg-white hover:ring-ink/15"
                    >
                      {size.inches} · {size.priceDisplay}
                    </Link>
                  ))}
                </div>
                <div className="mt-6">
                  <PillLink href="/genlyn-hub" variant="dark">
                    Explore Genlyn Hub
                  </PillLink>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] bg-[#f7f8fc] p-4 ring-1 ring-ink/5">
                <Image
                  src="/images/hub/genlyn-hub-hero.png"
                  alt="Genlyn Hub with Earnly family calendar on tablet and phone"
                  width={900}
                  height={700}
                  className="h-auto w-full rounded-[20px] object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

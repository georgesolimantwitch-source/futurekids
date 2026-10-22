"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  hubFeatures,
  hubProductGallery,
  hubSizePath,
  hubSizes,
  type HubSize,
} from "@/config/hub";
import { siteApps } from "@/config/site";
import { Icon } from "@/components/site/Icon";
import { Magnetic, Reveal } from "@/components/site/motion";
import {
  AppIcon,
  Container,
  Eyebrow,
  PillLink,
  SectionHeading,
} from "@/components/site/ui";
import { IconFeatureGrid, PageHero, Section } from "./shared";

export function HubProductDetailPage({ size }: { size: HubSize }) {
  const gallery = hubProductGallery(size);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const other = hubSizes.find((item) => item.id !== size.id)!;
  const shot = gallery[active] ?? gallery[0];

  useEffect(() => {
    setActive(0);
    setLightbox(false);
  }, [size.id]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") {
        setActive((current) => (current + 1) % gallery.length);
      }
      if (event.key === "ArrowLeft") {
        setActive((current) => (current - 1 + gallery.length) % gallery.length);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, gallery.length]);

  return (
    <>
      <PageHero intensity={0.55}>
        <Container className="pb-10 pt-6 sm:pb-14 sm:pt-10">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/genlyn-hub" className="font-semibold hover:text-ink">
                Genlyn Hub
              </Link>
              <Icon name="arrow-right" className="h-3.5 w-3.5 text-ink-faint" />
              <span className="font-bold text-ink">{size.inches}</span>
            </nav>
          </Reveal>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <Reveal dir="scale" delay={60}>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setLightbox(true)}
                  className="group relative w-full overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:rounded-[36px] sm:p-5"
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={1200}
                    height={1200}
                    priority
                    className="aspect-square h-auto w-full rounded-[22px] object-cover object-center sm:rounded-[28px]"
                  />
                  <span className="absolute bottom-6 right-6 rounded-full bg-ink/85 px-3.5 py-2 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100 sm:bottom-8 sm:right-8">
                    View full size
                  </span>
                </button>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-5 sm:overflow-visible">
                  {gallery.map((item, index) => {
                    const selected = index === active;
                    return (
                      <button
                        key={item.src}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={item.caption}
                        aria-pressed={selected}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 transition sm:h-auto sm:w-full sm:aspect-square ${
                          selected
                            ? "ring-ink"
                            : "ring-transparent opacity-80 hover:opacity-100 hover:ring-ink/20"
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          width={240}
                          height={240}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="px-1 text-sm font-medium text-ink-soft">{shot.caption}</p>
              </div>
            </Reveal>

            <div>
              <Reveal>
                <Eyebrow color="#7c3aed" icon="home">
                  {size.recommended ? "Most popular" : "Genlyn Hub"}
                </Eyebrow>
              </Reveal>
              <Reveal delay={80} dir="blur">
                <h1 className="font-display mt-5 text-[2.4rem] font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[3.4rem]">
                  {size.label}
                </h1>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  {size.description}
                </p>
              </Reveal>
              <Reveal delay={180}>
                <p className="mt-3 text-sm font-semibold text-ink-soft">
                  Best for {size.bestFor.toLowerCase()}.
                </p>
              </Reveal>

              <Reveal delay={220}>
                <div className="mt-8 flex flex-wrap items-end gap-4">
                  <p className="font-display text-5xl font-extrabold text-ink">
                    {size.priceDisplay}
                  </p>
                  <p className="pb-2 text-sm font-semibold text-ink-soft">
                    one-time · ships in the US
                  </p>
                </div>
              </Reveal>

              <Reveal delay={260}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Magnetic>
                    <PillLink
                      href={`/genlyn-hub/checkout?size=${size.id}`}
                      size="lg"
                      variant="dark"
                    >
                      Buy {size.inches} · {size.priceDisplay}
                    </PillLink>
                  </Magnetic>
                  <Link
                    href={hubSizePath(other)}
                    className="press inline-flex h-14 items-center rounded-full bg-white px-6 text-sm font-bold text-ink ring-1 ring-ink/10"
                  >
                    See {other.inches} instead
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={300}>
                <ul className="mt-10 space-y-3">
                  {size.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm font-medium text-ink"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f3efff] text-[#7c3aed]">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={340}>
                <dl className="mt-10 grid grid-cols-2 gap-3">
                  {size.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="rounded-[22px] bg-white/90 p-4 ring-1 ring-ink/5"
                    >
                      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                        {spec.label}
                      </dt>
                      <dd className="mt-2 text-sm font-bold text-ink">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </Container>
      </PageHero>

      <Section>
        <SectionHeading
          eyebrow="On the display"
          eyebrowColor="#f4511e"
          title="Every Genlyn app, up close."
          lead="Tap any photo above — or browse the full set here."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) => (
            <Reveal key={item.src} delay={index * 70}>
              <button
                type="button"
                onClick={() => {
                  setActive(index);
                  setLightbox(true);
                }}
                className="lift group w-full overflow-hidden rounded-[28px] bg-white p-3 text-left ring-1 ring-ink/5"
              >
                <div className="overflow-hidden rounded-[22px] bg-[#f7f8fc]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={1024}
                    height={1024}
                    className="aspect-square h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="px-2 py-4 text-sm font-bold text-ink">{item.caption}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="Built for home"
          eyebrowColor="#16a34a"
          title="What families use it for."
          lead="A calm always-on screen for the rhythms Genlyn already helps you build."
        />
        <div className="mt-14">
          <IconFeatureGrid
            columns={3}
            items={hubFeatures.map((feature) => ({
              ...feature,
              color: "#7c3aed",
              soft: "#f3efff",
            }))}
          />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Compare"
          eyebrowColor="#2563eb"
          title="Looking at the other size?"
          lead={`Switch to the ${other.inches} Hub anytime — same software, different footprint.`}
        />
        <div className="mt-10">
          <Reveal>
            <Link
              href={hubSizePath(other)}
              className="lift flex flex-col overflow-hidden rounded-[32px] bg-white ring-1 ring-ink/5 sm:flex-row"
            >
              <div className="bg-[#f7f8fc] p-4 sm:w-[42%]">
                <Image
                  src={other.image}
                  alt={other.imageAlt}
                  width={800}
                  height={800}
                  className="aspect-[4/3] h-auto w-full rounded-[22px] object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-7 sm:p-10">
                {other.recommended && (
                  <span className="mb-3 w-fit rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                    Popular
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
                  {other.inches} display
                </p>
                <h3 className="font-display mt-2 text-3xl font-extrabold text-ink">
                  {other.label}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                  {other.blurb}
                </p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="font-display text-3xl font-extrabold text-ink">
                    {other.priceDisplay}
                  </p>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f7f8fc] px-4 py-2 text-sm font-bold text-ink">
                    View details
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="Better together"
          eyebrowColor="#7c3aed"
          title="Pairs with every Genlyn app."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteApps.map((app, index) => (
            <Reveal key={app.slug} delay={index * 70}>
              <Link
                href={app.href}
                className="lift flex h-full items-center gap-3 rounded-[24px] p-5 ring-1 ring-ink/5"
                style={{
                  background: `linear-gradient(140deg, ${app.colorSoft}, #fff 70%)`,
                }}
              >
                <AppIcon src={app.iconPath} name={app.name} size={44} />
                <span>
                  <span className="block font-extrabold text-ink">{app.name}</span>
                  <span className="block text-xs text-ink-soft">{app.cardSubtitle}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="relative overflow-hidden rounded-[36px] bg-ink px-8 py-14 text-white sm:px-14">
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                Ready when you are
              </p>
              <h2 className="font-display mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
                Get the {size.inches} Hub.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                {size.priceDisplay} one-time. Secure checkout on Genlyn — then track
                shipping from your account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PillLink
                href={`/genlyn-hub/checkout?size=${size.id}`}
                variant="light"
                size="lg"
              >
                Buy {size.inches}
              </PillLink>
              <Link
                href="/genlyn-hub"
                className="press inline-flex h-14 items-center rounded-full bg-white/10 px-6 text-sm font-bold text-white ring-1 ring-white/20"
              >
                All sizes
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <p className="min-w-0 truncate text-sm font-bold text-white/80">
              {shot.caption}
            </p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20"
              aria-label="Close gallery"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-10">
            <button
              type="button"
              onClick={() =>
                setActive((current) => (current - 1 + gallery.length) % gallery.length)
              }
              className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 sm:left-6"
              aria-label="Previous photo"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
            </button>
            <Image
              src={shot.src}
              alt={shot.alt}
              width={1400}
              height={1400}
              className="max-h-[min(78vh,900px)] w-auto max-w-full rounded-[24px] object-contain"
              priority
            />
            <button
              type="button"
              onClick={() => setActive((current) => (current + 1) % gallery.length)}
              className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 sm:right-6"
              aria-label="Next photo"
            >
              <Icon name="arrow-right" className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto px-5 py-5 scrollbar-none">
            {gallery.map((item, index) => (
              <button
                key={item.src}
                type="button"
                onClick={() => setActive(index)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                  index === active ? "ring-white" : "ring-transparent opacity-60"
                }`}
              >
                <Image
                  src={item.src}
                  alt=""
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

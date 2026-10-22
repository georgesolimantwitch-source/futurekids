"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { hubFaqs, hubFeatures, hubGallery, hubSizes, type HubSizeId } from "@/config/hub";
import { siteApps } from "@/config/site";
import { Accordion } from "@/components/site/Accordion";
import { Magnetic, Reveal } from "@/components/site/motion";
import {
  AppIcon,
  Container,
  Eyebrow,
  PillLink,
  SectionHeading,
} from "@/components/site/ui";
import { IconFeatureGrid, PageHero, Section } from "./shared";

export function HubPage() {
  const [size, setSize] = useState<HubSizeId>("15.6");
  const selected = hubSizes.find((item) => item.id === size)!;

  return (
    <>
      <PageHero intensity={0.7}>
        <Container className="grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div>
            <Reveal>
              <Eyebrow color="#7c3aed" icon="home">
                Genlyn Hub
              </Eyebrow>
            </Reveal>
            <Reveal delay={80} dir="blur">
              <h1 className="font-display mt-6 text-[2.75rem] font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-[4.5rem]">
                Your family,
                <br />
                <span className="gradient-text">always on the wall.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                Genlyn Hub is the household tablet for Earnly, Scholars, Ballr, and
                Freshys — calendars, chores, school, fitness, and fresh food on one
                wall display that keeps everyone in sync.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <PillLink href={`/genlyn-hub/checkout?size=${size}`} size="lg" variant="dark">
                    Buy {selected.inches} · {selected.priceDisplay}
                  </PillLink>
                </Magnetic>
                <Link
                  href="#sizes"
                  className="press inline-flex h-14 items-center rounded-full bg-white px-6 text-sm font-bold text-ink ring-1 ring-ink/10"
                >
                  Compare sizes
                </Link>
              </div>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-5 text-sm font-semibold text-ink-soft">
                One-time hardware · Ships in the US · Track from your account
              </p>
            </Reveal>
          </div>

          <Reveal dir="scale" delay={120} className="relative mx-auto w-full max-w-[560px]">
            <div aria-hidden className="brand-glow absolute inset-[-6%] rounded-full opacity-55 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] bg-white p-4 shadow-[0_40px_90px_-44px_rgba(15,23,42,0.5)] ring-1 ring-ink/5 sm:p-6">
              <Image
                src="/images/hub/genlyn-hub-hero.png"
                alt="Genlyn Hub with Earnly family calendar on tablet and phone"
                width={1024}
                height={1024}
                priority
                className="h-auto w-full rounded-[24px] object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </PageHero>

      <Section id="sizes">
        <SectionHeading
          eyebrow="Choose your size"
          eyebrowColor="#2563eb"
          title="Two sizes. Same family brain."
          lead="Pick the display that fits your kitchen, entryway, or command center."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {hubSizes.map((item, index) => {
            const active = item.id === size;
            return (
              <Reveal key={item.id} delay={index * 90}>
                <button
                  type="button"
                  onClick={() => setSize(item.id)}
                  className={`lift relative w-full overflow-hidden rounded-[32px] text-left ring-1 transition ${
                    active
                      ? "bg-white ring-ink/20 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)]"
                      : "bg-white/70 ring-ink/5 hover:bg-white"
                  }`}
                >
                  {item.recommended && (
                    <span className="absolute right-4 top-4 z-10 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                      Popular
                    </span>
                  )}
                  <div className="bg-[#f7f8fc] p-3 sm:p-4">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      width={1024}
                      height={1024}
                      className="aspect-[4/3] h-auto w-full rounded-[22px] object-cover object-center"
                    />
                  </div>
                  <div className="p-7 pt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-faint">
                      {item.inches} display
                    </p>
                    <h3 className="font-display mt-3 text-3xl font-extrabold text-ink">
                      {item.label}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.blurb}</p>
                    <div className="mt-6 flex items-end justify-between gap-4">
                      <p className="font-display text-4xl font-extrabold text-ink">
                        {item.priceDisplay}
                      </p>
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          active ? "bg-ink text-white" : "bg-[#f7f8fc] text-ink-soft"
                        }`}
                      >
                        {active ? "Selected" : "Select"}
                      </span>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <PillLink href={`/genlyn-hub/checkout?size=${size}`} variant="dark" size="lg">
            Continue to checkout · {selected.priceDisplay}
          </PillLink>
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="Built for home"
          eyebrowColor="#16a34a"
          title="Everything the household needs to see."
          lead="A calm, always-on screen for the rhythms Genlyn already helps families build."
        />
        <div className="mt-14">
          <IconFeatureGrid columns={3} items={hubFeatures.map((feature) => ({
            ...feature,
            color: "#7c3aed",
            soft: "#f3efff",
          }))} />
        </div>
      </Section>

      <Section id="gallery">
        <SectionHeading
          eyebrow="Inside the Hub"
          eyebrowColor="#f4511e"
          title="Every Genlyn app, on one display."
          lead="Earnly, Scholars, Ballr, and Freshys — tablet on the wall, phone in your pocket."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hubGallery.map((shot, index) => (
            <Reveal key={`${shot.caption}-${index}`} delay={index * 90}>
              <figure className="overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] ring-1 ring-ink/5">
                <div className="overflow-hidden rounded-[22px] bg-[#f7f8fc]">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    width={1024}
                    height={1024}
                    className="aspect-square h-auto w-full object-cover object-center"
                  />
                </div>
                <figcaption className="px-2 py-4 text-sm font-bold text-ink">
                  {shot.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="Better together"
          eyebrowColor="#7c3aed"
          title="Pairs with every Genlyn app."
          lead="Hub keeps the household visible while Freshys, Ballr, Scholars Notes, and Earnly handle the day-to-day."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteApps.map((app, index) => (
            <Reveal key={app.slug} delay={index * 70}>
              <Link
                href={app.href}
                className="lift flex h-full items-center gap-3 rounded-[24px] p-5 ring-1 ring-ink/5"
                style={{ background: `linear-gradient(140deg, ${app.colorSoft}, #fff 70%)` }}
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

      <Section id="faq">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            eyebrowColor="#2563eb"
            title="Questions, answered."
            lead="Still deciding? Reach out from Contact — or jump straight to checkout."
          />
          <Reveal>
            <Accordion items={hubFaqs} color="#7c3aed" />
          </Reveal>
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
                Bring Genlyn Hub home.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                {selected.inches} for {selected.priceDisplay}. Checkout stays on Genlyn —
                pay securely, then track shipping from your account.
              </p>
            </div>
            <PillLink
              href={`/genlyn-hub/checkout?size=${size}`}
              variant="light"
              size="lg"
            >
              Buy {selected.inches}
            </PillLink>
          </div>
        </div>
      </Section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { siteApps, type FeaturedSlug, type SiteApp } from "@/config/site";
import { AppProductPricing } from "@/components/apps/product/AppProductPricing";
import { Accordion } from "@/components/site/Accordion";
import { Icon, type IconName } from "@/components/site/Icon";
import { CountUp, Magnetic, Parallax, Reveal, Tilt } from "@/components/site/motion";
import { StoreBadges, hasStoreLinks } from "@/components/site/StoreBadges";
import {
  AppIcon,
  Container,
  FeatureStrip,
  FloatChip,
  PillLink,
  PlayLink,
  SectionHeading,
} from "@/components/site/ui";
import { appLifePhotos, realPhotos } from "@/config/photos";
import { PageHero, Section } from "./shared";

const featureIcons: Record<FeaturedSlug, IconName[]> = {
  fresher: ["map-pin", "basket", "home", "apple", "users", "heart"],
  ballr: ["route", "map-pin", "trophy", "dumbbell", "flame", "apple", "heart-pulse", "trending-up"],
  scholars: ["file-text", "sparkles", "layers", "clipboard-check", "calendar", "message", "book"],
  earnly: ["clipboard-check", "wallet", "target", "graduation-cap", "shield", "layout-dashboard", "bar-chart"],
};

export function AppPage({ app }: { app: SiteApp }) {
  const others = siteApps.filter((other) => other.slug !== app.slug);
  // Pricing block reads accent colors from the app config; give it the site palette.
  const pricingApp = { ...app.config, accentColor: app.color, accentColorLight: app.colorSoft };

  return (
    <>
      <PageHero intensity={0.75}>
        <Container className="grid items-center gap-14 pb-14 pt-10 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
          <div>
            <Reveal>
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-ink-soft ring-1 ring-ink/5 backdrop-blur transition hover:text-ink"
              >
                <Icon name="arrow-left" className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Back to Products
              </Link>
            </Reveal>
            <Reveal delay={70}>
              <div className="mt-7 flex items-center gap-3">
                <AppIcon src={app.iconPath} name={app.name} size={44} />
                <span className="text-2xl font-extrabold" style={{ color: app.colorDeep }}>
                  {app.name}
                </span>
              </div>
            </Reveal>
            <Reveal delay={140} dir="blur">
              <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1] text-ink sm:text-6xl lg:text-7xl">
                {app.heroTitle[0]}
                <br />
                {app.heroTitle[1]}
              </h1>
            </Reveal>
            <Reveal delay={220}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{app.heroLead}</p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {hasStoreLinks(app.config) ? (
                  <StoreBadges app={app.config} />
                ) : (
                  <Magnetic>
                    <PillLink href={app.ctaHref} external={app.ctaExternal} color={app.color} size="lg">
                      Get the app
                    </PillLink>
                  </Magnetic>
                )}
                <PlayLink href="#screens">See it in action</PlayLink>
              </div>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-6 text-sm font-semibold text-ink-soft">
                {app.priceFrom} · Included in{" "}
                <Link href="/pricing" className="underline decoration-ink/20 underline-offset-4 transition hover:decoration-ink">
                  Genlyn All Access
                </Link>
              </p>
            </Reveal>
          </div>

          <HeroVisual app={app} />
        </Container>
        <Container className="pb-20">
          <FeatureStrip items={app.highlights} color={app.color} colorSoft={app.colorSoft} />
        </Container>
      </PageHero>

      <section id="screens" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Inside the app"
            eyebrowColor={app.color}
            title={`See ${app.name} in action.`}
            lead={app.config.description}
          />
        </Container>
        <ScreenshotMarquee app={app} />
      </section>

      <Section className="bg-white/70">
        <SectionHeading eyebrow="Features" eyebrowColor={app.color} title="Everything in one place." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {app.config.productFeatures.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 90}>
              <Tilt max={5} className="h-full rounded-[26px]">
                <div className="group h-full rounded-[26px] bg-white p-7 ring-1 ring-ink/5">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                    style={{ background: app.colorSoft, color: app.color }}
                  >
                    <Icon name={featureIcons[app.slug][index % featureIcons[app.slug].length]} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.description}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              align="left"
              eyebrow="How it works"
              eyebrowColor={app.color}
              title="Up and running in minutes."
              lead={app.config.positioning}
            />
          </div>
          <ol className="relative space-y-4">
            <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-px bg-ink/10" />
            {app.config.howItWorks.map((step, index) => (
              <Reveal key={step.step} as="li" delay={index * 110} dir="right">
                <div className="lift relative flex gap-5 rounded-[26px] bg-white p-6 ring-1 ring-ink/5">
                  <span
                    className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-lg"
                    style={{ background: app.gradient }}
                  >
                    {step.step}
                  </span>
                  <span>
                    <span className="block text-lg font-extrabold text-ink">{step.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{step.description}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      <AppProductPricing app={pricingApp} />

      <Section id="faq">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            eyebrowColor={app.color}
            title="Questions, answered."
            lead={
              <>
                Still curious?{" "}
                <Link href="/contact" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4">
                  Talk to our team
                </Link>
                .
              </>
            }
          />
          <Reveal>
            <Accordion items={app.config.faqs} color={app.color} />
          </Reveal>
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading eyebrow="Better together" eyebrowColor="#7c3aed" title="Explore the rest of Genlyn." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {others.map((other, index) => (
            <Reveal key={other.slug} delay={index * 100}>
              <Link
                href={other.href}
                className="lift group flex h-full items-center gap-4 rounded-[26px] p-6 ring-1 ring-ink/5"
                style={{ background: `linear-gradient(120deg, ${other.colorSoft}, #fff 75%)` }}
              >
                <AppIcon src={other.iconPath} name={other.name} size={52} className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="flex-1">
                  <span className="block text-lg font-extrabold text-ink">{other.name}</span>
                  <span className="block text-sm text-ink-soft">{other.cardSubtitle}</span>
                </span>
                <Icon name="arrow-right" className="h-5 w-5 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}

function HeroVisual({ app }: { app: SiteApp }) {
  const photo = appLifePhotos[app.slug] ?? realPhotos.kidsField;

  return (
    <Reveal dir="scale" delay={120} className="relative mx-auto w-full max-w-[540px]">
      <div aria-hidden className="brand-glow absolute inset-[6%] rounded-full opacity-35 blur-3xl" />
      <div className="relative aspect-[1/1.15]">
        <div className="absolute inset-x-[4%] inset-y-[6%] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)] ring-4 ring-white/70">
          <Parallax speed={-0.05} className="h-full">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={1536}
              height={1024}
              priority
              className="h-full w-full scale-110 object-cover"
            />
          </Parallax>
        </div>

        {app.slug === "ballr" && (
          <FloatChip className="bottom-[2%] right-[6%] flex items-center gap-2" delay={-4}>
            <Icon name="trophy" className="h-4 w-4" style={{ color: app.color }} />
            <span className="text-xs font-bold">New badge: Rookie I</span>
          </FloatChip>
        )}
        {app.slug === "earnly" && (
          <FloatChip className="bottom-[2%] right-[6%] flex items-center gap-2" delay={-4}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#16a34a]">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="text-xs font-bold">Parent approved · +$5.00</span>
          </FloatChip>
        )}
        {app.slug === "fresher" && (
          <FloatChip className="bottom-[6%] right-0 flex items-center gap-2" delay={-3}>
            <Icon name="map-pin" className="h-4 w-4" style={{ color: app.color }} />
            <span className="text-xs font-bold">
              <CountUp value={14} /> farms within 10 miles
            </span>
          </FloatChip>
        )}
        {app.slug === "scholars" && (
          <FloatChip className="bottom-[4%] left-[4%] flex items-center gap-2.5" delay={-2}>
            <span className="text-xs font-bold leading-tight">
              Study smarter
              <br />
              with AI
            </span>
          </FloatChip>
        )}
      </div>
    </Reveal>
  );
}

function ScreenshotMarquee({ app }: { app: SiteApp }) {
  const photo = appLifePhotos[app.slug] ?? realPhotos.kidsField;
  const captions = app.config.screenshots.map((s) => s.caption).filter(Boolean);
  const frames = captions.length
    ? captions.map((caption) => ({ ...photo, caption }))
    : [{ ...photo, caption: undefined as string | undefined }];

  return (
    <div className="marquee marquee-mask mt-14 overflow-hidden">
      <div className="marquee-track gap-5 py-6" style={{ "--marquee-speed": `${Math.max(frames.length, 3) * 9}s` } as CSSProperties}>
        {[...frames, ...frames, ...frames].map((shot, index) => (
          <figure
            key={`${shot.src}-${index}`}
            className="group w-[280px] shrink-0 sm:w-[320px]"
            aria-hidden={index >= frames.length}
          >
            <div className="aspect-[4/3] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.5)] ring-1 ring-ink/5 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]">
              <Image
                src={shot.src}
                alt={index < frames.length ? shot.alt : ""}
                width={640}
                height={480}
                className="h-full w-full object-cover"
              />
            </div>
            {shot.caption ? (
              <figcaption className="mt-3 text-center text-sm font-semibold text-ink-soft">{shot.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}

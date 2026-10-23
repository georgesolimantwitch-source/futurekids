import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { siteApps, type FeaturedSlug, type SiteApp } from "@/config/site";
import { AppProductPricing } from "@/components/apps/product/AppProductPricing";
import { Accordion } from "@/components/site/Accordion";
import { AppPreview } from "@/components/site/AppPreview";
import { EmojiTile } from "@/components/site/EmojiTile";
import { Icon, type IconName } from "@/components/site/Icon";
import { CountUp, Magnetic, Parallax, Reveal, Tilt } from "@/components/site/motion";
import { StoreBadges, hasStoreLinks } from "@/components/site/StoreBadges";

const G = "/images/graphics/3d";
import {
  AppIcon,
  Container,
  FeatureStrip,
  FloatChip,
  PillLink,
  PlayLink,
  SectionHeading,
} from "@/components/site/ui";
import { PageHero, Section } from "./shared";

const featureIcons: Record<FeaturedSlug, IconName[]> = {
  fresher: ["map-pin", "basket", "home", "apple", "users", "heart"],
  ballr: ["route", "map-pin", "users", "smile", "star", "trending-up", "trophy"],
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
  if (app.slug === "scholars") return <ScholarsVisual />;

  const photo: Partial<Record<FeaturedSlug, { src: string; alt: string }>> = {
    ballr: { src: "/images/about/ballr-family.jpg", alt: "Kids playing a soccer game while a parent finds the field in Ballr" },
    earnly: { src: "/images/about/earnly-family.jpg", alt: "A parent and daughter saving coins together" },
  };
  const backdrop = photo[app.slug];

  return (
    <Reveal dir="scale" delay={120} className="relative mx-auto w-full max-w-[540px]">
      <div aria-hidden className="brand-glow absolute inset-[6%] rounded-full opacity-35 blur-3xl" />
      <div className="relative aspect-[1/1.3] sm:aspect-[1/1.05]">
        {backdrop ? (
          <div className="absolute bottom-[8%] left-0 w-[70%] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)] ring-4 ring-white/70">
            <Parallax speed={-0.05}>
              <Image src={backdrop.src} alt={backdrop.alt} width={1536} height={1024} priority className="aspect-[4/3.6] w-full scale-110 object-cover" />
            </Parallax>
          </div>
        ) : (
          <div aria-hidden className="absolute inset-x-[8%] bottom-[4%] top-[14%] rounded-[44px] bg-gradient-to-br from-[#dcfce7] via-white to-[#fef9c3] ring-1 ring-ink/5" />
        )}

        <ConceptOrbit slug={app.slug} />

        <div
          className={`absolute top-0 z-10 scale-[0.8] sm:scale-100 ${
            backdrop ? "right-0 origin-top-right" : "left-1/2 origin-top -translate-x-1/2"
          }`}
        >
          <div className="float" style={{ "--float-speed": "7s" } as CSSProperties}>
            <AppPreview
              slug={app.slug}
              width={backdrop ? 250 : 270}
              priority
            />
          </div>
        </div>

        {app.slug === "ballr" && (
          <FloatChip className="bottom-[2%] right-[6%] flex items-center gap-2.5" delay={-4}>
            <EmojiTile src={`${G}/trophy.png`} size={36} />
            <span className="text-xs font-bold">New badge: Rookie I</span>
          </FloatChip>
        )}
        {app.slug === "earnly" && (
          <FloatChip className="bottom-[2%] right-[6%] flex items-center gap-2.5" delay={-4}>
            <EmojiTile src={`${G}/check-mark.png`} size={36} />
            <span className="text-xs font-bold">Parent approved · +$5.00</span>
          </FloatChip>
        )}
        {app.slug === "fresher" && (
          <FloatChip className="bottom-[6%] right-0 flex items-center gap-2.5" delay={-3}>
            <EmojiTile src={`${G}/round-pushpin.png`} size={36} />
            <span className="text-xs font-bold">
              <CountUp value={14} /> farms within 10 miles
            </span>
          </FloatChip>
        )}
      </div>
    </Reveal>
  );
}

type OrbitItem = { src: string; style: CSSProperties; size?: number };

/** 3D category-style tiles — matches Freshys category chip look. */
const orbitBySlug: Record<Exclude<FeaturedSlug, "scholars">, OrbitItem[]> = {
  fresher: [
    { src: `${G}/basket.png`, style: { left: "18%", top: "2%" }, size: 72 },
    { src: `${G}/red-apple.png`, style: { left: "2%", top: "18%" } },
    { src: `${G}/carrot.png`, style: { right: "2%", top: "24%" } },
    { src: `${G}/milk.png`, style: { right: "8%", top: "4%" } },
    { src: `${G}/leaf.png`, style: { left: "6%", bottom: "14%" } },
    { src: `${G}/tomato.png`, style: { right: "14%", bottom: "22%" }, size: 56 },
    { src: `${G}/cut-of-meat.png`, style: { left: "42%", bottom: "6%" }, size: 52 },
    { src: `${G}/egg.png`, style: { right: "40%", top: "8%" }, size: 50 },
  ],
  ballr: [
    { src: `${G}/soccer-ball.png`, style: { left: "2%", top: "8%" }, size: 60 },
    { src: `${G}/trophy.png`, style: { right: "4%", top: "4%" }, size: 56 },
    { src: `${G}/fire.png`, style: { left: "8%", bottom: "30%" }, size: 54 },
  ],
  earnly: [
    { src: `${G}/money-bag.png`, style: { left: "2%", top: "6%" }, size: 60 },
    { src: `${G}/coin.png`, style: { right: "2%", top: "12%" }, size: 54 },
    { src: `${G}/glowing-star.png`, style: { left: "10%", bottom: "28%" }, size: 52 },
  ],
};

function ConceptOrbit({ slug }: { slug: FeaturedSlug }) {
  if (slug === "scholars") return null;
  return (
    <>
      {orbitBySlug[slug].map((item, index) => (
        <EmojiTile
          key={item.src}
          src={item.src}
          size={item.size ?? 64}
          float
          delay={index * -1.05}
          speed={5 + (index % 4)}
          className="absolute z-20"
          style={item.style}
        />
      ))}
    </>
  );
}

function ScholarsVisual() {
  return (
    <Reveal dir="scale" delay={120} className="relative mx-auto w-full max-w-[560px]">
      <div aria-hidden className="brand-glow absolute inset-[4%] rounded-full opacity-30 blur-3xl" />
      <div className="relative aspect-[1/0.95]">
        <div className="absolute inset-x-[6%] inset-y-[8%] overflow-hidden rounded-[36px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)] ring-4 ring-white/70">
          <Parallax speed={-0.05} className="h-full">
            <Image
              src="/images/about/scholars-family.jpg"
              alt="A parent helping her son study with flashcards and a laptop"
              width={1536}
              height={1024}
              priority
              className="h-full w-full scale-110 object-cover"
            />
          </Parallax>
        </div>
        <EmojiTile
          src={`${G}/memo.png`}
          size={68}
          float
          delay={-1}
          className="absolute left-0 top-[2%] z-20"
        />
        <EmojiTile
          src={`${G}/books.png`}
          size={64}
          float
          delay={-3}
          speed={7}
          className="absolute right-0 top-[12%] z-20"
        />
        <EmojiTile
          src={`${G}/graduation-cap.png`}
          size={60}
          float
          delay={-2}
          speed={5.5}
          className="absolute bottom-[20%] left-[-2%] z-20"
        />
        <EmojiTile
          src={`${G}/glowing-star.png`}
          size={56}
          float
          delay={-4}
          speed={6}
          className="absolute bottom-[6%] right-[2%] z-20"
        />
        <FloatChip className="left-[14%] top-[18%] flex items-center gap-2.5" delay={-1.5}>
          <span className="text-xs font-bold leading-tight">
            Create notes
            <br />
            from any content
          </span>
        </FloatChip>
        <FloatChip className="bottom-[4%] right-[18%] flex items-center gap-2.5" delay={-3.5} speed={5.5}>
          <span className="text-xs leading-tight">
            <span className="block font-bold">Practice test</span>
            <span className="text-ink-soft">
              <CountUp value={85} suffix="%" />
            </span>
          </span>
        </FloatChip>
      </div>
    </Reveal>
  );
}

function ScreenshotMarquee({ app }: { app: SiteApp }) {
  const shots = app.config.screenshots;
  const aspect = app.config.screenshotAspect ?? "9/16";
  return (
    <div className="marquee marquee-mask mt-14 overflow-hidden">
      <div className="marquee-track gap-5 py-6" style={{ "--marquee-speed": `${shots.length * 9}s` } as CSSProperties}>
        {[...shots, ...shots].map((shot, index) => (
          <figure
            key={`${shot.path}-${index}`}
            className="group w-[230px] shrink-0 sm:w-[260px]"
            aria-hidden={index >= shots.length}
          >
            <div
              className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.5)] ring-1 ring-ink/5 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]"
              style={{ aspectRatio: aspect }}
            >
              <Image src={shot.path} alt={index < shots.length ? shot.alt : ""} width={520} height={1040} className="h-full w-full object-cover" />
            </div>
            {shot.caption && (
              <figcaption className="mt-3 text-center text-sm font-semibold text-ink-soft">{shot.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

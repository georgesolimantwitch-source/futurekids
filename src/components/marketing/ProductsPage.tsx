import Link from "next/link";
import type { CSSProperties } from "react";
import { siteApps } from "@/config/site";
import { Icon } from "@/components/site/Icon";
import { Reveal, Tilt } from "@/components/site/motion";
import { AppIcon, Container, Eyebrow, PillLink, SectionHeading } from "@/components/site/ui";
import { PageHero, ProductGrid, Section, StepCards } from "./shared";

export function ProductsPage() {
  return (
    <>
      <PageHero colors={["#ddd6fe", "#bbf7d0", "#fed7aa", "#bfdbfe"]} intensity={0.6}>
        <Container className="pb-16 pt-14 text-center sm:pt-20">
          <Reveal>
            <Eyebrow color="#7c3aed">Our products</Eyebrow>
          </Reveal>
          <Reveal delay={90} dir="blur">
            <h1 className="font-display mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              Four powerful apps.
              <br />
              One connected ecosystem.
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Each Genlyn app helps kids build essential skills for real life, with personalized recommendations and
              guidance — all managed from one family account.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {siteApps.map((app) => (
                <a
                  key={app.slug}
                  href={`#${app.slug}`}
                  className="press flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 text-sm font-bold text-ink ring-1 ring-ink/5 backdrop-blur transition hover:-translate-y-0.5"
                >
                  <AppIcon src={app.iconPath} name={app.name} size={26} />
                  {app.name}
                </a>
              ))}
            </div>
          </Reveal>
        </Container>
        <Container className="pb-24">
          <ProductGrid apps={siteApps} />
        </Container>
      </PageHero>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="Up close"
          eyebrowColor="#2563eb"
          title="What each app is built for."
          lead="Jump into any app to see features, screens, and pricing."
        />
        <div className="mt-14 space-y-5">
          {siteApps.map((app, index) => (
            <Reveal key={app.slug} delay={index * 60}>
              <Tilt max={3} className="rounded-[30px]">
                <Link
                  id={app.slug}
                  href={app.href}
                  className="group relative grid scroll-mt-28 items-center gap-6 overflow-hidden rounded-[30px] p-7 ring-1 ring-ink/5 sm:p-9 lg:grid-cols-[1.1fr_1.4fr_auto]"
                  style={{ background: `linear-gradient(110deg, ${app.colorSoft}, #ffffff 70%)` }}
                >
                  <span
                    aria-hidden
                    className="blob"
                    style={{ left: "-10%", top: "-40%", width: 280, height: 280, background: app.glow[1], opacity: 0.5 } as CSSProperties}
                  />
                  <div className="relative flex items-center gap-4">
                    <AppIcon src={app.iconPath} name={app.name} size={60} className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110" />
                    <div>
                      <p className="text-2xl font-extrabold text-ink">{app.name}</p>
                      <p className="text-sm font-semibold" style={{ color: app.colorDeep }}>
                        {app.priceFrom}
                      </p>
                    </div>
                  </div>
                  <p className="relative text-base leading-relaxed text-ink-soft">{app.config.description}</p>
                  <span
                    className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-500 group-hover:translate-x-1 group-hover:scale-110"
                    style={{ background: app.color }}
                  >
                    <Icon name="arrow-up-right" className="h-5 w-5" />
                  </span>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Better together"
          eyebrowColor="#16a34a"
          title="Use one app or all four."
          lead="Every app works on its own. Together, they give your family one connected picture of how your kids are growing."
        />
        <div className="mt-14">
          <StepCards
            accent="#16a34a"
            steps={[
              { icon: "users", title: "One family login", description: "Parents and kids share one Genlyn account across every app." },
              { icon: "layers", title: "Pick your apps", description: "Subscribe to a single app, or unlock everything with All Access." },
              { icon: "shield", title: "Parent controls everywhere", description: "Turn apps on or off for each child, any time, from your account." },
            ]}
          />
        </div>
        <Reveal className="mt-12 flex justify-center">
          <PillLink href="/pricing" variant="dark" size="lg">
            Compare plans
          </PillLink>
        </Reveal>
      </Section>
    </>
  );
}

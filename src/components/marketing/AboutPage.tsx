import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { cinematicHero, ecosystemCircle } from "@/config/about";
import { siteApps } from "@/config/site";
import { Icon } from "@/components/site/Icon";
import { CountUp, Magnetic, Parallax, Reveal } from "@/components/site/motion";
import { AppIcon, Container, Eyebrow, PillLink, SectionHeading } from "@/components/site/ui";
import { EcosystemOrbit } from "./interactive";
import { IconFeatureGrid, PageHero, Section } from "./shared";

const outcomes = cinematicHero.outcomes.filter((outcome) => outcome !== "Safe messaging");

export function AboutPage() {
  return (
    <>
      <PageHero colors={["#bfdbfe", "#ddd6fe", "#bbf7d0", "#ffffff"]}>
        <Container className="grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div>
            <Reveal>
              <Eyebrow color="#2563eb" icon="sparkles">
                About Genlyn
              </Eyebrow>
            </Reveal>
            <Reveal delay={90} dir="blur">
              <h1 className="font-display mt-6 text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-[68px]">
                Healthy kids.
                <br />
                Capable kids.
                <br />
                <span className="gradient-text">Ready for anything.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{cinematicHero.subtext}</p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <PillLink href="/products" variant="dark" size="lg">
                    Meet the apps
                  </PillLink>
                </Magnetic>
                <PillLink href="/mission" variant="light" size="lg" arrow={false}>
                  Our mission
                </PillLink>
              </div>
            </Reveal>
          </div>
          <Reveal dir="scale" delay={150}>
            <EcosystemOrbit />
          </Reveal>
        </Container>

        <div className="marquee marquee-mask overflow-hidden pb-20">
          <div className="marquee-track gap-3" style={{ "--marquee-speed": "30s" } as CSSProperties}>
            {[...outcomes, ...outcomes, ...outcomes, ...outcomes].map((outcome, index) => (
              <span
                key={`${outcome}-${index}`}
                aria-hidden={index >= outcomes.length}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 text-sm font-bold text-ink ring-1 ring-ink/5 backdrop-blur"
              >
                <Icon name="sparkles" className="h-4 w-4 text-[#7c3aed]" />
                {outcome}
              </span>
            ))}
          </div>
        </div>
      </PageHero>

      <Section className="bg-white/70">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal dir="left" className="relative">
            <div className="relative h-[460px]">
              <div className="absolute left-0 top-0 w-[74%] overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.5)] ring-4 ring-white">
                <Parallax speed={-0.05}>
                  <Image
                    src="/images/home/hero-kids.jpg"
                    alt="Three kids laughing on a soccer field at sunset"
                    width={1536}
                    height={1024}
                    className="aspect-[4/3.3] w-full scale-110 object-cover"
                  />
                </Parallax>
              </div>
              <div className="absolute bottom-0 right-0 w-[56%] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(15,23,42,0.5)] ring-4 ring-white">
                <Parallax speed={0.05}>
                  <Image
                    src="/images/about/scholars-family.jpg"
                    alt="A parent helping her son study"
                    width={1536}
                    height={1024}
                    className="aspect-[4/3] w-full scale-110 object-cover"
                  />
                </Parallax>
              </div>
            </div>
          </Reveal>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our story"
              eyebrowColor="#f4511e"
              title="Technology that helps kids grow — not just scroll."
            />
            <Reveal delay={120}>
              <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-ink-soft">
                <p>
                  Kids are growing up surrounded by screens. We think those screens should give something back — better
                  habits, real skills, and more time outside, at the table, and with friends.
                </p>
                <p>
                  So we built Genlyn: a family of focused apps for money, learning, sport, and food. Each one solves a real
                  part of growing up, and they all share one parent account so you never lose track.
                </p>
              </div>
            </Reveal>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { value: siteApps.length, label: "Focused apps" },
                { value: 1, label: "Family account" },
                { value: 1, label: "Login per child" },
              ].map((stat, index) => (
                <Reveal key={stat.label} delay={200 + index * 90}>
                  <div className="rounded-2xl bg-white p-5 text-center ring-1 ring-ink/5">
                    <p className="font-display text-4xl font-extrabold text-ink">
                      <CountUp value={stat.value} />
                    </p>
                    <p className="mt-1 text-xs font-semibold text-ink-soft">{stat.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="What guides us" eyebrowColor="#7c3aed" title="Built on a few simple beliefs." />
        <div className="mt-14">
          <IconFeatureGrid
            columns={4}
            items={[
              { icon: "target", title: "Purpose over screen time", description: "Every feature should leave kids better off than before they opened the app.", color: "#2563eb", soft: "#eef4ff" },
              { icon: "shield", title: "Parents in control", description: "You decide which apps each child uses and approve what matters.", color: "#7c3aed", soft: "#f3efff" },
              { icon: "globe", title: "Real-world results", description: "Money saved, grades earned, games played, and real food on the table.", color: "#16a34a", soft: "#ecfdf3" },
              { icon: "layers", title: "Better together", description: "Start with one app, then unlock the whole ecosystem as your family grows.", color: "#f4511e", soft: "#fff1eb" },
            ]}
          />
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading eyebrow="The ecosystem" eyebrowColor="#16a34a" title={ecosystemCircle.headline} lead={ecosystemCircle.subtext} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteApps.map((app, index) => (
            <Reveal key={app.slug} delay={index * 90}>
              <Link
                href={app.href}
                className="lift group flex h-full flex-col rounded-[26px] p-6 ring-1 ring-ink/5"
                style={{ background: `linear-gradient(160deg, ${app.colorSoft}, #fff 75%)` }}
              >
                <AppIcon src={app.iconPath} name={app.name} size={52} className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="mt-5 text-lg font-extrabold text-ink">{app.name}</span>
                <span className="mt-1 flex-1 text-sm text-ink-soft">{app.cardTitle}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: app.colorDeep }}>
                  Learn more
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}

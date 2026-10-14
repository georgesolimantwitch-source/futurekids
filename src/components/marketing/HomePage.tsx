import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { siteApps } from "@/config/site";
import { EarnlyScreen } from "@/components/site/AppScreens";
import { Icon } from "@/components/site/Icon";
import { CountUp, Magnetic, Parallax, Reveal } from "@/components/site/motion";
import {
  AppIcon,
  Container,
  Eyebrow,
  FloatChip,
  PhoneFrame,
  PillLink,
  PlayLink,
  SectionHeading,
} from "@/components/site/ui";
import { IconFeatureGrid, PageHero, ProductGrid, Section, StepCards } from "./shared";

const pillars = [
  "Healthy eating",
  "Active lifestyles",
  "Smarter learning",
  "Financial responsibility",
  "Confident kids",
  "Connected families",
];

export function HomePage() {
  const [freshys, ballr, scholars, earnly] = siteApps;

  return (
    <>
      <PageHero intensity={0.7}>
        <Container className="grid items-center gap-14 pb-16 pt-12 lg:grid-cols-[1.02fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <Reveal>
              <Eyebrow color="#7c3aed" icon="sparkles">
                Four powerful apps. One connected ecosystem.
              </Eyebrow>
            </Reveal>
            <Reveal delay={90} dir="blur">
              <h1 className="font-display mt-6 text-[3.1rem] font-extrabold leading-[0.98] text-ink sm:text-7xl lg:text-[5.1rem]">
                Raise Kids
                <br />
                Ready for{" "}
                <span className="gradient-text">Life.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                Healthy eating. Active lifestyles. Smarter learning. Financial responsibility. Genlyn brings together
                the tools and guidance to help kids build better habits and brighter futures.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <PillLink href="/signup" size="lg">
                    Get started
                  </PillLink>
                </Magnetic>
                <PlayLink href="#how-it-works">See how it works</PlayLink>
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {siteApps.map((app, index) => (
                <Reveal key={app.slug} delay={340 + index * 80} dir="up">
                  <Link
                    href={app.href}
                    className="lift group flex flex-col items-start gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-ink/5 backdrop-blur"
                  >
                    <AppIcon
                      src={app.iconPath}
                      name={app.name}
                      size={36}
                      className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                    />
                    <span>
                      <span className="block text-sm font-extrabold text-ink">{app.homeChip.label}</span>
                      <span className="block text-xs text-ink-soft">{app.homeChip.sub}</span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          <HeroCollage />
        </Container>
      </PageHero>

      <div className="marquee marquee-mask overflow-hidden border-y border-ink/[0.05] bg-white/60 py-5">
        <div className="marquee-track gap-10" style={{ "--marquee-speed": "36s" } as CSSProperties}>
          {[...pillars, ...pillars].map((pillar, index) => (
            <span key={`${pillar}-${index}`} className="flex items-center gap-10 text-lg font-extrabold text-ink/80">
              {pillar}
              <Icon name="sparkles" className="h-4 w-4 text-[#7c3aed]" />
            </span>
          ))}
        </div>
      </div>

      <Section id="apps">
        <SectionHeading
          eyebrow="Our products"
          eyebrowColor="#2563eb"
          title={
            <>
              Four powerful apps.
              <br className="hidden sm:block" /> One connected ecosystem.
            </>
          }
          lead="Each Genlyn app helps kids build essential skills for real life — with personalized recommendations and guidance for every family."
        />
        <div className="mt-14">
          <ProductGrid apps={siteApps} />
        </div>
      </Section>

      <Section id="how-it-works" className="bg-white/70">
        <SectionHeading
          eyebrow="How it works"
          eyebrowColor="#16a34a"
          title="One account. Every app."
          lead="Set up your family once and turn on the apps that fit your kids — Genlyn keeps everything connected."
        />
        <div className="mt-14">
          <StepCards
            accent="#2563eb"
            steps={[
              {
                icon: "users",
                title: "Create your family",
                description: "Sign up as a parent and add a profile for each of your kids in minutes.",
              },
              {
                icon: "layout-dashboard",
                title: "Turn on the right apps",
                description: "Choose Freshys, Ballr, Scholars Notes, or Earnly — or unlock everything with All Access.",
              },
              {
                icon: "trending-up",
                title: "Watch them grow",
                description: "Kids sign in with their own login while you follow progress across every app.",
              },
            ]}
          />
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal dir="left" className="relative">
            <div className="relative overflow-hidden rounded-[36px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.5)]">
              <Parallax speed={-0.06}>
                <Image
                  src="/images/about/earnly-family.jpg"
                  alt="A parent and daughter saving coins together while tracking chores on a tablet"
                  width={1536}
                  height={1024}
                  className="h-[440px] w-full scale-110 object-cover"
                />
              </Parallax>
            </div>
            <FloatChip className="-right-3 top-8 sm:-right-6" delay={-1}>
              <p className="text-[11px] font-semibold text-ink-soft">Saved this month</p>
              <p className="text-xl font-extrabold" style={{ color: earnly.color }}>
                <CountUp value={86.5} decimals={2} prefix="$" />
              </p>
            </FloatChip>
            <FloatChip className="-left-3 bottom-10 flex items-center gap-2.5 sm:-left-6" delay={-3}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#16a34a]">
                <Icon name="check" className="h-4 w-4" strokeWidth={3} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">Chore approved</span>
                <span className="block text-xs text-ink-soft">Unload dishwasher · +$3</span>
              </span>
            </FloatChip>
          </Reveal>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Built for parents"
              eyebrowColor="#7c3aed"
              title="You stay in the loop on everything."
              lead="Genlyn is designed with parents at the center — so kids get freedom to grow inside the boundaries you set."
            />
            <ul className="mt-8 space-y-4">
              {[
                { icon: "shield" as const, title: "Parent approvals", text: "Spending, contacts, and access stay under your control." },
                { icon: "lock" as const, title: "Private by design", text: "We collect only what each app needs and never sell your data." },
                { icon: "layout-dashboard" as const, title: "One family account", text: "Manage every child and every app from one place." },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 100} dir="right">
                  <li className="lift flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3efff] text-[#7c3aed]">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-bold text-ink">{item.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{item.text}</span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow="What kids build"
          eyebrowColor="#f4511e"
          title="Skills that last a lifetime."
          lead="Every app focuses on one part of growing up well — together they cover the whole picture."
        />
        <div className="mt-14">
          <IconFeatureGrid
            columns={4}
            items={[
              { icon: "leaf", title: "Healthier kids", description: "Fresh, local food and better nutrition habits.", color: freshys.color, soft: freshys.colorSoft },
              { icon: "activity", title: "More active lives", description: "Confidence, discipline, and teamwork through sport.", color: ballr.color, soft: ballr.colorSoft },
              { icon: "graduation-cap", title: "Stronger education", description: "Smarter learning and greater opportunities.", color: scholars.color, soft: scholars.colorSoft },
              { icon: "trending-up", title: "Brighter futures", description: "Real-world money skills and responsibility.", color: earnly.color, soft: earnly.colorSoft },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

function HeroCollage() {
  const [freshys, ballr, scholars, earnly] = siteApps;
  return (
    <Reveal dir="scale" delay={150} className="relative mx-auto w-full max-w-[560px]">
      <div aria-hidden className="brand-glow absolute inset-[-8%] rounded-full opacity-60 blur-3xl" />
      <div className="relative aspect-[1/1.02]">
        <div className="absolute left-0 top-[6%] w-[72%] overflow-hidden rounded-[34px] shadow-[0_40px_80px_-35px_rgba(15,23,42,0.55)] ring-4 ring-white/70">
          <Parallax speed={-0.05}>
            <Image
              src="/images/home/hero-kids.jpg"
              alt="Three kids laughing on a soccer field at sunset"
              width={1536}
              height={1024}
              priority
              className="aspect-[4/4.4] w-full scale-110 object-cover object-[62%_center]"
            />
          </Parallax>
        </div>

        <div className="absolute bottom-0 right-0 w-[42%] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(15,23,42,0.55)] ring-4 ring-white/70">
          <Image
            src="/images/about/scholars-family.jpg"
            alt="A parent helping her son study with notes and a laptop"
            width={1536}
            height={1024}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div className="float absolute right-[2%] top-0 z-10" style={{ "--float-speed": "7s" } as CSSProperties}>
          <PhoneFrame width={168}>
            <EarnlyScreen />
          </PhoneFrame>
        </div>

        <FloatChip className="left-[-4%] top-[44%] flex items-center gap-2.5" delay={-2}>
          <AppIcon src={freshys.iconPath} name={freshys.name} size={30} />
          <span className="text-xs font-bold leading-tight">
            Fresh, local food for
            <br />
            healthier families.
          </span>
        </FloatChip>
        <FloatChip className="right-[34%] top-[2%] flex items-center gap-2.5" delay={-4} speed={7}>
          <AppIcon src={ballr.iconPath} name={ballr.name} size={30} />
          <span className="text-xs font-bold leading-tight">
            Train, compete,
            <br />
            get better.
          </span>
        </FloatChip>
        <FloatChip className="bottom-[32%] right-[30%] flex items-center gap-2.5" delay={-1} speed={5.5}>
          <AppIcon src={scholars.iconPath} name={scholars.name} size={30} />
          <span className="text-xs font-bold leading-tight">
            Study smarter
            <br />
            with AI.
          </span>
        </FloatChip>
        <FloatChip className="bottom-[4%] left-[8%] flex items-center gap-2.5" delay={-3} speed={6.5}>
          <AppIcon src={earnly.iconPath} name={earnly.name} size={30} />
          <span className="text-xs font-bold leading-tight">
            Build real
            <br />
            money skills.
          </span>
        </FloatChip>
      </div>
    </Reveal>
  );
}

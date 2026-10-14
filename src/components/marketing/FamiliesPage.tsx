import Image from "next/image";
import type { CSSProperties } from "react";
import { getSiteApp, siteApps } from "@/config/site";
import { Icon, type IconName } from "@/components/site/Icon";
import { CountUp, Magnetic, Parallax, Reveal } from "@/components/site/motion";
import { AppIcon, Container, Eyebrow, FloatChip, PillLink, PlayLink, SectionHeading } from "@/components/site/ui";
import { FamilyDashboardDemo } from "./interactive";
import { IconFeatureGrid, PageHero, Section, StepCards } from "./shared";

const day: { time: string; slug: "scholars" | "ballr" | "earnly" | "fresher"; title: string; text: string }[] = [
  { time: "After school", slug: "scholars", title: "Homework clicks faster", text: "Notes turn into study guides and practice quizzes — with a tutor ready when they’re stuck." },
  { time: "Before dinner", slug: "earnly", title: "Chores become paychecks", text: "Kids check off chores, you approve, and the money lands in their account to save or spend." },
  { time: "Evening", slug: "ballr", title: "Find tonight’s game", text: "Nearby runs and pickup games on a map — so kids get outside and meet their local community." },
  { time: "Weekend", slug: "fresher", title: "A trip to the farm stand", text: "Discover farms and farmers markets near home and shop real, local food together." },
];

export function FamiliesPage() {
  const earnly = getSiteApp("earnly")!;

  return (
    <>
      <PageHero colors={["#c4b5fd", "#93c5fd", "#fbcfe8", "#ffffff"]}>
        <Container className="grid items-center gap-14 pb-24 pt-10 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
          <div>
            <Reveal>
              <Eyebrow color="#7c3aed" icon="users">
                For families
              </Eyebrow>
            </Reveal>
            <Reveal delay={90} dir="blur">
              <h1 className="font-display mt-6 text-5xl font-extrabold leading-[1] text-ink sm:text-6xl lg:text-7xl">
                Built for families.
                <br />
                <span className="gradient-text">Designed for growth.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                One Genlyn account for the whole household. Add each child, choose the apps they can use, and watch
                them build real-life skills — with you in the loop the whole way.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <PillLink href="/signup" variant="dark" size="lg">
                    Create a family account
                  </PillLink>
                </Magnetic>
                <PlayLink href="#dashboard">Try the parent controls</PlayLink>
              </div>
            </Reveal>
          </div>

          <Reveal dir="scale" delay={120} className="relative mx-auto w-full max-w-[560px]">
            <div aria-hidden className="absolute inset-[-6%] rounded-full bg-[conic-gradient(from_200deg,#ddd6fe,#bfdbfe,#fbcfe8,#ddd6fe)] opacity-70 blur-3xl" />
            <div className="relative overflow-hidden rounded-[36px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.55)] ring-4 ring-white/70">
              <Parallax speed={-0.05}>
                <Image
                  src="/images/about/earnly-family.jpg"
                  alt="A parent and daughter saving coins together"
                  width={1536}
                  height={1024}
                  priority
                  className="aspect-[5/4.2] w-full scale-110 object-cover"
                />
              </Parallax>
            </div>
            <FloatChip className="-left-4 top-10 flex items-center gap-2.5" delay={-1}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3efff] text-[#7c3aed]">
                <Icon name="shield" className="h-4 w-4" />
              </span>
              <span className="text-xs leading-tight">
                <span className="block font-bold">Parent approved</span>
                <span className="text-ink-soft">You set the rules</span>
              </span>
            </FloatChip>
            <FloatChip className="-right-4 bottom-12" delay={-3}>
              <p className="text-[11px] font-semibold text-ink-soft">Savings goal</p>
              <p className="text-xl font-extrabold" style={{ color: earnly.color }}>
                <CountUp value={124.5} decimals={2} prefix="$" />
              </p>
              <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-[#f3efff]">
                <div className="h-full w-[68%] rounded-full" style={{ background: earnly.gradient }} />
              </div>
            </FloatChip>
            <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/90 p-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.4)] ring-1 ring-ink/5 backdrop-blur">
              {siteApps.map((app, index) => (
                <span key={app.slug} className="float" style={{ "--float-delay": `${index * -0.6}s`, "--float-distance": "4px" } as CSSProperties}>
                  <AppIcon src={app.iconPath} name={app.name} size={40} />
                </span>
              ))}
            </div>
          </Reveal>
        </Container>
      </PageHero>

      <Section id="dashboard" className="bg-white/70">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Parent controls"
              eyebrowColor="#2563eb"
              title="Every kid. Every app. One switch."
              lead="Turn an app on for a child and their login works right away — as long as your plan covers it. Turn it off and access pauses instantly."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Each child gets their own login and space",
                "Choose exactly which apps each child can use",
                "Approve spending and money moves in Earnly",
                "Manage plans and billing in one Genlyn account",
              ].map((item, index) => (
                <Reveal key={item} as="li" delay={index * 80} dir="right" className="flex items-center gap-3 text-[15px] font-semibold text-ink">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {item}
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal dir="left">
            <FamilyDashboardDemo />
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="A day with Genlyn"
          eyebrowColor="#f4511e"
          title="Fits into real family life."
          lead="Small moments, every day, that add up to kids who are healthier, smarter, and more capable."
        />
        <div className="relative mt-16">
          <span aria-hidden className="absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent lg:block" />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {day.map((moment, index) => {
              const app = getSiteApp(moment.slug)!;
              return (
                <Reveal key={moment.title} as="li" delay={index * 110}>
                  <div className="relative flex justify-center lg:justify-start">
                    <span
                      className="relative z-10 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg"
                      style={{ background: app.gradient }}
                    >
                      {moment.time}
                    </span>
                  </div>
                  <div
                    className="lift group mt-6 h-[calc(100%-4rem)] rounded-[26px] p-6 ring-1 ring-ink/5"
                    style={{ background: `linear-gradient(160deg, ${app.colorSoft}, #fff 70%)` }}
                  >
                    <AppIcon src={app.iconPath} name={app.name} size={44} className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
                    <h3 className="mt-5 text-lg font-extrabold text-ink">{moment.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{moment.text}</p>
                    <p className="mt-4 text-xs font-bold" style={{ color: app.colorDeep }}>
                      with {app.name}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading eyebrow="Peace of mind" eyebrowColor="#16a34a" title="Safe by design." />
        <div className="mt-14">
          <IconFeatureGrid
            columns={4}
            items={[
              { icon: "shield" as IconName, title: "Parent-controlled access", description: "Kids only get the apps you switch on for them.", color: "#7c3aed", soft: "#f3efff" },
              { icon: "lock" as IconName, title: "Private by default", description: "Each child has a separate, secure login.", color: "#2563eb", soft: "#eef4ff" },
              { icon: "wallet" as IconName, title: "Approvals for money", description: "Spending and transfers in Earnly wait for you.", color: "#16a34a", soft: "#ecfdf3" },
              { icon: "heart" as IconName, title: "Real-world first", description: "Apps that push kids outside, to the table, and to their goals.", color: "#f4511e", soft: "#fff1eb" },
            ]}
          />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Getting started" eyebrowColor="#7c3aed" title="Set up in four steps." />
        <div className="mt-14">
          <StepCards
            accent="#7c3aed"
            steps={[
              { icon: "users", title: "Create your account", description: "Sign up as the parent — it takes a minute." },
              { icon: "plus", title: "Add your kids", description: "Give each child their own profile and login." },
              { icon: "zap", title: "Turn on apps", description: "Pick an app plan or All Access, then switch apps on per child." },
              { icon: "trending-up", title: "Grow together", description: "Follow progress and celebrate the wins." },
            ]}
          />
        </div>
      </Section>
    </>
  );
}

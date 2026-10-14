import Image from "next/image";
import { familyChallenges, missionSection } from "@/config/about";
import { getSiteApp, type FeaturedSlug } from "@/config/site";
import { Icon, type IconName } from "@/components/site/Icon";
import { Magnetic, Parallax, Reveal, Tilt } from "@/components/site/motion";
import { AppScreen } from "@/components/site/AppScreens";
import { AppIcon, Container, Eyebrow, PhoneFrame, PillLink, SectionHeading } from "@/components/site/ui";
import { ScrollWords } from "./interactive";
import { PageHero, Section } from "./shared";

const cardSlug: Record<string, FeaturedSlug> = {
  money: "earnly",
  school: "scholars",
  activity: "ballr",
  food: "fresher",
};

const commitmentStyle: { icon: IconName; gradient: string }[] = [
  { icon: "heart-pulse", gradient: "linear-gradient(140deg,#22c55e,#0ea5e9)" },
  { icon: "trophy", gradient: "linear-gradient(140deg,#6366f1,#a855f7)" },
  { icon: "compass", gradient: "linear-gradient(140deg,#f97316,#ec4899)" },
];

export function MissionPage() {
  return (
    <>
      <PageHero colors={["#a7f3d0", "#c4b5fd", "#fed7aa", "#ffffff"]}>
        <Container className="pb-24 pt-14 text-center lg:pt-20">
          <Reveal>
            <Eyebrow color="#16a34a" icon="compass">
              Our mission
            </Eyebrow>
          </Reveal>
          <Reveal delay={90} dir="blur">
            <h1 className="font-display mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              Helping kids grow into
              <br />
              <span className="gradient-text">capable young people.</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{missionSection.headline}</p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-8 flex justify-center">
              <Magnetic>
                <PillLink href="/products" variant="dark" size="lg">
                  Explore the apps
                </PillLink>
              </Magnetic>
            </div>
          </Reveal>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
            {(["fresher", "ballr", "scholars", "earnly"] as const).map((slug, index) => {
              const app = getSiteApp(slug)!;
              return (
                <Reveal key={slug} delay={300 + index * 90} dir="up">
                  <div
                    className="lift flex flex-col items-center gap-3 rounded-[26px] bg-white/80 p-5 ring-1 ring-ink/5 backdrop-blur"
                  >
                    <AppIcon src={app.iconPath} name={app.name} size={48} />
                    <span className="text-center leading-tight">
                      <span className="block text-sm font-extrabold text-ink">{app.homeChip.sub}</span>
                      <span className="block text-xs text-ink-faint">{app.name}</span>
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </PageHero>

      <Section className="bg-white/70">
        <div className="mx-auto max-w-4xl">
          <ScrollWords
            text={missionSection.paragraphs.join(" ")}
            className="font-display text-3xl font-extrabold leading-[1.25] text-ink sm:text-4xl lg:text-[44px]"
          />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="What we stand for" eyebrowColor="#7c3aed" title="Three promises to every family." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {missionSection.commitments.map((item, index) => (
            <Reveal key={item.title} delay={index * 110}>
              <Tilt max={6} className="h-full rounded-[30px]">
                <div
                  className="relative h-full overflow-hidden rounded-[30px] p-8 text-white"
                  style={{ background: commitmentStyle[index].gradient }}
                >
                  <span aria-hidden className="blob absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <Icon name={commitmentStyle[index].icon} className="h-6 w-6" />
                  </span>
                  <h3 className="relative mt-10 text-3xl font-extrabold">{item.title}</h3>
                  <p className="relative mt-3 text-[15px] leading-relaxed text-white/85">{item.description}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-white/70">
        <SectionHeading
          eyebrow={familyChallenges.eyebrow}
          eyebrowColor="#2563eb"
          title={familyChallenges.headline}
          lead={familyChallenges.subtext}
        />
        <div className="mt-16 space-y-20">
          {familyChallenges.cards.map((card, index) => {
            const app = getSiteApp(cardSlug[card.id])!;
            const flipped = index % 2 === 1;
            return (
              <div key={card.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <Reveal dir={flipped ? "right" : "left"} className={flipped ? "lg:order-2" : ""}>
                  <div className="relative">
                    <div aria-hidden className="absolute inset-[6%] rounded-[40px] blur-3xl" style={{ background: app.gradient, opacity: 0.3 }} />
                    {card.id === "food" ? (
                      <div
                        className="relative flex aspect-[4/3] items-end justify-center overflow-hidden rounded-[32px] ring-1 ring-ink/5"
                        style={{ background: `linear-gradient(160deg, ${app.colorSoft}, #fefce8)` }}
                      >
                        <div className="float translate-y-[22%]">
                          <PhoneFrame width={230}>
                            <AppScreen slug="fresher" />
                          </PhoneFrame>
                        </div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.5)] ring-4 ring-white/70">
                        <Parallax speed={-0.05}>
                          <Image
                            src={card.illustration}
                            alt={card.illustrationAlt}
                            width={1536}
                            height={1024}
                            className="aspect-[4/3] w-full scale-110 object-cover"
                          />
                        </Parallax>
                      </div>
                    )}
                  </div>
                </Reveal>
                <div>
                  <Reveal>
                    <div className="flex items-center gap-3">
                      <AppIcon src={app.iconPath} name={app.name} size={40} />
                      <span className="text-lg font-extrabold" style={{ color: app.colorDeep }}>
                        {app.name}
                      </span>
                    </div>
                  </Reveal>
                  <Reveal delay={80}>
                    <h3 className="font-display mt-5 text-3xl font-extrabold text-ink sm:text-4xl">{card.title}</h3>
                  </Reveal>
                  <Reveal delay={140}>
                    <p className="mt-4 text-lg leading-relaxed text-ink-soft">{card.description}</p>
                  </Reveal>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "For parents", text: card.parentBenefit, icon: "shield" as IconName },
                      { label: "For kids", text: card.childBenefit, icon: "smile" as IconName },
                    ].map((benefit, i) => (
                      <Reveal key={benefit.label} delay={200 + i * 80}>
                        <div className="h-full rounded-2xl p-4 ring-1 ring-ink/5" style={{ background: app.colorSoft }}>
                          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: app.colorDeep }}>
                            <Icon name={benefit.icon} className="h-4 w-4" />
                            {benefit.label}
                          </span>
                          <p className="mt-2 text-sm font-semibold text-ink">{benefit.text}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                  <Reveal delay={320}>
                    <div className="mt-7">
                      <PillLink href={app.href} color={app.color} variant="soft">
                        Explore {app.name}
                      </PillLink>
                    </div>
                  </Reveal>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

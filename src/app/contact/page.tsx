import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brand, getAppBySlug } from "@/config/brand";
import { siteApps } from "@/config/site";
import { Icon, type IconName } from "@/components/site/Icon";
import { Reveal } from "@/components/site/motion";
import { Container, Eyebrow } from "@/components/site/ui";
import { ContactForm } from "@/components/marketing/ContactForm";
import { PageHero } from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${brand.companyName} team.`,
  openGraph: {
    title: `Contact | ${brand.companyName}`,
    description: `Contact ${brand.companyName}.`,
  },
  twitter: {
    card: "summary",
    title: `Contact | ${brand.companyName}`,
    description: `Contact ${brand.companyName}.`,
  },
};

interface ContactPageProps {
  searchParams: Promise<{ app?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { app: appSlug } = await searchParams;
  const app = appSlug ? getAppBySlug(appSlug) : undefined;
  const isWaitlist = app?.availability === "waitlist";

  const cards: { icon: IconName; title: string; text: string; href: string; cta: string; color: string; soft: string; external?: boolean }[] = [
    { icon: "life-buoy", title: "Help Center", text: "Answers to common questions about the apps and your account.", href: "/support", cta: "Visit Help Center", color: "#2563eb", soft: "#eef4ff" },
    { icon: "mail", title: "Email us", text: "Write to our team directly — we reply as soon as we can.", href: `mailto:${brand.supportEmail}`, cta: brand.supportEmail, color: "#7c3aed", soft: "#f3efff", external: true },
    { icon: "wallet", title: "Plans & billing", text: "Manage subscriptions, kids, and app access from your account.", href: "/account", cta: "Go to my account", color: "#16a34a", soft: "#ecfdf3" },
  ];

  return (
    <>
      <PageHero colors={["#bfdbfe", "#c4b5fd", "#a7f3d0", "#ffffff"]} intensity={0.7}>
        <Container className="pb-14 pt-14 text-center lg:pt-20">
          <Reveal>
            <Eyebrow color="#2563eb" icon="message">
              {isWaitlist ? "Waitlist" : "Contact & Support"}
            </Eyebrow>
          </Reveal>
          <Reveal delay={90} dir="blur">
            <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              {isWaitlist && app ? (
                <>
                  Join the
                  <br />
                  <span className="gradient-text">{app.name} waitlist.</span>
                </>
              ) : (
                <>
                  We’re here
                  <br />
                  <span className="gradient-text">to help.</span>
                </>
              )}
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              {isWaitlist && app
                ? `Be the first to know when ${app.name} launches. Send us a note and we’ll add you to the list.`
                : "Questions about an app, your account, or a partnership? Reach out — a real person will get back to you."}
            </p>
          </Reveal>
        </Container>
      </PageHero>

      <Container className="pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 90}>
              <Link
                href={card.href}
                className="lift group flex h-full flex-col rounded-[28px] bg-white p-7 ring-1 ring-ink/5"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  style={{ background: card.soft, color: card.color }}
                >
                  <Icon name={card.icon} className="h-5 w-5" />
                </span>
                <span className="mt-5 text-lg font-extrabold text-ink">{card.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{card.text}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 break-all text-sm font-bold" style={{ color: card.color }}>
                  {card.cta}
                  <Icon name="arrow-right" className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <Reveal>
              <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Talk to the team behind Genlyn.</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                Pick a topic so your message lands with the right person. For app issues, tell us which app and what device you’re using.
              </p>
            </Reveal>
            <ul className="mt-8 space-y-3">
              {siteApps.map((item, index) => (
                <Reveal key={item.slug} as="li" delay={index * 70} dir="right">
                  <Link href={`${item.href}#faq`} className="lift group flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 ring-1 ring-ink/5">
                    <Image src={item.iconPath} alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
                    <span className="flex-1 text-sm font-bold text-ink">{item.name} FAQ</span>
                    <Icon name="arrow-up-right" className="h-4 w-4 text-ink-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={320}>
              <div className="mt-8 flex gap-3">
                {[
                  { label: "Instagram", href: brand.social.instagram },
                  { label: "TikTok", href: brand.social.tiktok },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:ring-ink/25"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal dir="left">
            <ContactForm
              email={brand.supportEmail}
              appNames={siteApps.map((item) => item.name)}
              defaultTopic={isWaitlist ? "General question" : app ? "App support" : undefined}
              defaultApp={app?.name}
            />
          </Reveal>
        </div>
      </Container>
    </>
  );
}

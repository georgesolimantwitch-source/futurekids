import type { CSSProperties, ReactNode } from "react";
import type { SiteApp } from "@/config/site";
import { AppPreview } from "@/components/site/AppPreview";
import { Icon, type IconName } from "@/components/site/Icon";
import { Reveal, Tilt } from "@/components/site/motion";
import {
  AppIcon,
  Blobs,
  CheckItem,
  Container,
  PillLink,
} from "@/components/site/ui";

/** Hero wrapper that slides under the transparent sticky header. */
export function PageHero({
  children,
  className = "",
  intensity,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  return (
    <section className={`relative -mt-[68px] overflow-hidden pt-[68px] ${className}`}>
      <Blobs intensity={intensity} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function ProductCard({ app, index = 0 }: { app: SiteApp; index?: number }) {
  return (
    <Reveal delay={index * 110} className="h-full">
      <Tilt max={6} className="h-full rounded-[30px]">
        <article
          className="relative flex h-full flex-col overflow-hidden rounded-[30px] p-6 ring-1 ring-ink/5"
          style={{ background: `linear-gradient(180deg, ${app.colorSoft} 0%, #ffffff 62%)` }}
        >
          <span
            aria-hidden
            className="blob"
            style={
              {
                top: "-30%",
                right: "-30%",
                width: 260,
                height: 260,
                background: app.glow[0],
                opacity: 0.7,
                "--blob-speed": `${14 + index * 3}s`,
              } as CSSProperties
            }
          />
          <div className="relative flex items-center gap-2.5">
            <AppIcon src={app.iconPath} name={app.name} size={34} />
            <span className="text-base font-extrabold" style={{ color: app.colorDeep }}>
              {app.name}
            </span>
          </div>

          <div className="relative mt-6 flex justify-center">
            <div className="float" style={{ "--float-delay": `${index * -1.3}s`, "--float-distance": "-10px" } as CSSProperties}>
              <AppPreview slug={app.slug} width={206} />
            </div>
          </div>

          <h3 className="font-display relative mt-7 text-xl font-extrabold leading-tight text-ink">
            {app.cardTitle}
          </h3>
          <ul className="relative mt-4 space-y-2.5">
            {app.bullets.map((bullet) => (
              <CheckItem key={bullet} color={app.color}>
                {bullet}
              </CheckItem>
            ))}
          </ul>
          <div className="relative mt-auto pt-7">
            <PillLink href={app.href} color={app.color} className="w-full">
              Explore {app.name}
            </PillLink>
          </div>
        </article>
      </Tilt>
    </Reveal>
  );
}

export function ProductGrid({ apps }: { apps: SiteApp[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {apps.map((app, index) => (
        <ProductCard key={app.slug} app={app} index={index} />
      ))}
    </div>
  );
}

export function StepCards({
  steps,
  accent = "#2563eb",
}: {
  steps: { icon: IconName; title: string; description: string }[];
  accent?: string;
}) {
  return (
    <div className="relative grid gap-5 md:grid-cols-3">
      <div
        aria-hidden
        className="absolute left-[16%] right-[16%] top-[52px] hidden h-px md:block"
        style={{ background: `repeating-linear-gradient(90deg, ${accent}55 0 8px, transparent 8px 16px)` }}
      />
      {steps.map((step, index) => (
        <Reveal key={step.title} delay={index * 140}>
          <div className="lift group relative h-full rounded-[28px] bg-white p-7 ring-1 ring-ink/5">
            <div className="flex items-center justify-between">
              <span
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                style={{ background: accent }}
              >
                <Icon name={step.icon} className="h-6 w-6" />
              </span>
              <span className="font-display text-5xl font-extrabold text-ink/[0.06]">0{index + 1}</span>
            </div>
            <h3 className="mt-6 text-lg font-extrabold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function IconFeatureGrid({
  items,
  columns = 3,
}: {
  items: { icon: IconName; title: string; description: string; color: string; soft: string }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
  return (
    <div className={`grid gap-5 ${cols[columns]}`}>
      {items.map((item, index) => (
        <Reveal key={item.title} delay={(index % 4) * 90}>
          <div className="lift group h-full rounded-[26px] p-7 ring-1 ring-ink/5" style={{ background: `linear-gradient(180deg, ${item.soft}, #fff 70%)` }}>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
              style={{ color: item.color }}
            >
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-extrabold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

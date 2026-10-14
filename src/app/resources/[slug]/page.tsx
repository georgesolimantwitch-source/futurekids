import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { formatResourceDate, getResource, resources } from "@/config/resources";
import { getSiteApp } from "@/config/site";
import { Icon } from "@/components/site/Icon";
import { Reveal } from "@/components/site/motion";
import { AppIcon, Container, PillLink } from "@/components/site/ui";
import { CategoryTag, ResourceCard } from "@/components/marketing/ResourcesIndex";
import { PageHero } from "@/components/marketing/shared";

interface ResourcePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) return { title: "Article Not Found" };
  const url = `${brand.siteUrl}/resources/${resource.slug}`;
  return {
    title: resource.title,
    description: resource.excerpt,
    openGraph: {
      title: resource.title,
      description: resource.excerpt,
      url,
      siteName: brand.companyName,
      type: "article",
      publishedTime: resource.publishedAt,
      images: [{ url: resource.cover, alt: resource.coverAlt }],
    },
    alternates: { canonical: url },
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const app = resource.app ? getSiteApp(resource.app) : undefined;
  const related = resources
    .filter((other) => other.slug !== resource.slug)
    .sort((a, b) => Number(b.category === resource.category) - Number(a.category === resource.category))
    .slice(0, 3);

  return (
    <>
      <PageHero colors={app ? [...app.glow, "#ffffff"] : ["#fbcfe8", "#c4b5fd", "#bfdbfe", "#ffffff"]} intensity={0.6}>
        <Container className="max-w-4xl! pb-12 pt-10 lg:pt-14">
          <Reveal>
            <Link
              href="/resources"
              className="group inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-ink-soft ring-1 ring-ink/5 backdrop-blur transition hover:text-ink"
            >
              <Icon name="arrow-left" className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              All resources
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8">
              <CategoryTag category={resource.category} />
            </div>
          </Reveal>
          <Reveal delay={140} dir="blur">
            <h1 className="font-display mt-5 text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              {resource.title}
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft sm:text-xl">{resource.excerpt}</p>
            <p className="mt-6 flex items-center gap-3 text-sm font-semibold text-ink-faint">
              <span>{brand.productName} Team</span>
              <span className="h-1 w-1 rounded-full bg-ink/20" />
              <span>{formatResourceDate(resource.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-ink/20" />
              <span>{resource.readMinutes} min read</span>
            </p>
          </Reveal>
        </Container>
      </PageHero>

      <Container className="max-w-5xl!">
        <Reveal dir="scale">
          <div className="overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.5)]">
            <Image src={resource.cover} alt={resource.coverAlt} width={1536} height={1024} priority className="aspect-[16/8] w-full object-cover" />
          </div>
        </Reveal>
      </Container>

      <Container className="max-w-3xl! py-16 sm:py-20">
        <article className="space-y-12">
          {resource.sections.map((section, index) => (
            <Reveal key={section.heading} as="section" delay={index === 0 ? 0 : 40}>
              <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="mt-4 text-[17px] leading-[1.8] text-ink-soft">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-5 space-y-3">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[16px] font-semibold text-ink">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: app?.colorSoft ?? "#eef4ff", color: app?.color ?? "#2563eb" }}
                      >
                        <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </article>

        {app && (
          <Reveal className="mt-16">
            <div
              className="flex flex-col items-start gap-5 rounded-[28px] p-7 ring-1 ring-ink/5 sm:flex-row sm:items-center"
              style={{ background: `linear-gradient(120deg, ${app.colorSoft}, #fff 80%)` }}
            >
              <AppIcon src={app.iconPath} name={app.name} size={56} />
              <div className="flex-1">
                <p className="text-lg font-extrabold text-ink">Put it into practice with {app.name}</p>
                <p className="mt-1 text-sm text-ink-soft">{app.cardTitle}</p>
              </div>
              <PillLink href={app.href} color={app.color}>
                Explore {app.name}
              </PillLink>
            </div>
          </Reveal>
        )}
      </Container>

      <section className="border-t border-ink/[0.05] bg-white/70 py-20">
        <Container>
          <h2 className="font-display text-3xl font-extrabold text-ink">Keep reading</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <Reveal key={item.slug} delay={index * 90}>
                <ResourceCard resource={item} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

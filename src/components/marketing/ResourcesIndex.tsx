"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  categoryColor,
  formatResourceDate,
  resourceCategories,
  type Resource,
  type ResourceCategory,
} from "@/config/resources";
import { Icon } from "@/components/site/Icon";
import { Reveal } from "@/components/site/motion";

export function ResourcesIndex({ resources }: { resources: Resource[] }) {
  const [category, setCategory] = useState<ResourceCategory | "All">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (category === "All" || resource.category === category) &&
        (!q || `${resource.title} ${resource.excerpt} ${resource.category}`.toLowerCase().includes(q)),
    );
  }, [category, query, resources]);

  const showFeatured = category === "All" && !query;
  const [featured, ...rest] = filtered;
  const grid = showFeatured ? rest : filtered;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {(["All", ...resourceCategories] as const).map((item) => {
            const selected = category === item;
            const tint = item === "All" ? undefined : categoryColor[item];
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(item)}
                className={`press rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  selected ? "text-white shadow-[0_12px_24px_-12px_rgba(11,16,32,0.6)]" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:-translate-y-0.5 hover:text-ink"
                }`}
                style={selected ? { background: tint?.color ?? "#0b1020" } : undefined}
              >
                {item}
              </button>
            );
          })}
        </div>
        <label className="group relative block w-full lg:w-80">
          <span className="sr-only">Search articles</span>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-ink" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles"
            className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none ring-1 ring-ink/10 transition-shadow placeholder:text-ink-faint focus:ring-2 focus:ring-brand/40"
          />
        </label>
      </div>

      {showFeatured && featured && (
        <Reveal className="mt-10">
          <Link
            href={`/resources/${featured.slug}`}
            className="lift group grid overflow-hidden rounded-[32px] bg-white ring-1 ring-ink/5 lg:grid-cols-[1.15fr_1fr]"
          >
            <div className="relative overflow-hidden">
              <Image
                src={featured.cover}
                alt={featured.coverAlt}
                width={1536}
                height={1024}
                className="aspect-[16/10] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-ink backdrop-blur">
                Featured
              </span>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <CategoryTag category={featured.category} />
              <h2 className="font-display mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{featured.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{featured.excerpt}</p>
              <Meta resource={featured} className="mt-6" />
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-ink">
                Read article
                <Icon name="arrow-right" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {grid.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((resource, index) => (
            <Reveal key={resource.slug} delay={(index % 3) * 90}>
              <ResourceCard resource={resource} />
            </Reveal>
          ))}
        </div>
      ) : (
        !featured && (
          <div className="mt-14 rounded-[28px] bg-white p-12 text-center ring-1 ring-ink/5">
            <Icon name="search" className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-4 text-lg font-bold text-ink">No articles found</p>
            <p className="mt-1 text-sm text-ink-soft">Try a different search or category.</p>
          </div>
        )
      )}
    </div>
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="lift group flex h-full flex-col overflow-hidden rounded-[28px] bg-white ring-1 ring-ink/5"
    >
      <div className="overflow-hidden">
        <Image
          src={resource.cover}
          alt={resource.coverAlt}
          width={900}
          height={600}
          className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <CategoryTag category={resource.category} />
        <h3 className="mt-3 text-xl font-extrabold leading-snug text-ink">{resource.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{resource.excerpt}</p>
        <Meta resource={resource} className="mt-5" />
      </div>
    </Link>
  );
}

export function CategoryTag({ category }: { category: ResourceCategory }) {
  const tint = categoryColor[category];
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em]"
      style={{ background: tint.soft, color: tint.color }}
    >
      {category}
    </span>
  );
}

function Meta({ resource, className = "" }: { resource: Resource; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-semibold text-ink-faint ${className}`}>
      <span className="flex items-center gap-1.5">
        <Icon name="calendar" className="h-3.5 w-3.5" />
        {formatResourceDate(resource.publishedAt)}
      </span>
      <span className="h-1 w-1 rounded-full bg-ink/20" />
      <span className="flex items-center gap-1.5">
        <Icon name="clock" className="h-3.5 w-3.5" />
        {resource.readMinutes} min read
      </span>
    </p>
  );
}

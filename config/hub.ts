import type { IconName } from "@/components/site/Icon";

export type HubSizeId = "10.1" | "15.6";

export interface HubGalleryShot {
  src: string;
  alt: string;
  caption: string;
}

export interface HubSize {
  id: HubSizeId;
  /** URL segment, e.g. `10-1` */
  slug: string;
  label: string;
  inches: string;
  priceCents: number;
  priceDisplay: string;
  blurb: string;
  /** Longer product story for the detail page */
  description: string;
  image: string;
  imageAlt: string;
  recommended?: boolean;
  lookupKey: string;
  envPriceId: "STRIPE_HUB_10_PRICE_ID" | "STRIPE_HUB_15_PRICE_ID";
  bestFor: string;
  specs: { label: string; value: string }[];
  highlights: string[];
}

export const HUB_CURRENCY = "usd";
export const HUB_KIND = "genlyn_hub";

export const hubGallery: HubGalleryShot[] = [
  {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
    caption: "Earnly — chores & family calendar on the wall.",
  },
  {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
    caption: "Earnly — parent funds and kid balances.",
  },
  {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
    caption: "Scholars — classes, grades, and study streaks.",
  },
  {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
    caption: "Ballr — sports, workouts, calories & diet plans.",
  },
  {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
    caption: "Freshys — local farm orders at a glance.",
  },
];

export const hubSizes: HubSize[] = [
  {
    id: "10.1",
    slug: "10-1",
    label: "Genlyn Hub 10.1″",
    inches: "10.1″",
    priceCents: 19900,
    priceDisplay: "$199",
    blurb: "Perfect for a kitchen counter or desk — the compact family command center.",
    description:
      "The compact Hub sits on a counter, shelf, or desk and keeps Earnly chores, Scholars school, Ballr fitness, and Freshys meals in view without taking over the room. Ideal when you want the family brain close at hand.",
    image: "/images/home/hero-kids.jpg",
    imageAlt: "Kids laughing together on a soccer field at sunset",
    lookupKey: "com.genlyn.hub.10_1",
    envPriceId: "STRIPE_HUB_10_PRICE_ID",
    bestFor: "Kitchen counters, desks, and smaller spaces",
    specs: [
      { label: "Display", value: "10.1″ IPS" },
      { label: "Placement", value: "Stand or shelf" },
      { label: "Apps", value: "Earnly · Scholars · Ballr · Freshys" },
      { label: "Purchase", value: "One-time · ships in the US" },
    ],
    highlights: [
      "Compact footprint for counters and desks",
      "Same Genlyn family software as the 15.6″",
      "Color-coded calendars, chores, and meal plans",
      "Pairs with the phone apps you already use",
    ],
  },
  {
    id: "15.6",
    slug: "15-6",
    label: "Genlyn Hub 15.6″",
    inches: "15.6″",
    priceCents: 24900,
    priceDisplay: "$249",
    blurb: "Wall-ready display for the whole household schedule at a glance.",
    description:
      "The larger Hub is built to live on the wall — readable from across the kitchen or entryway so everyone can see the week, chores, school, and meals without crowding around a phone. Same Genlyn brain, bigger presence.",
    image: "/images/home/hero-kids.jpg",
    imageAlt: "Kids laughing together on a soccer field at sunset",
    recommended: true,
    lookupKey: "com.genlyn.hub.15_6",
    envPriceId: "STRIPE_HUB_15_PRICE_ID",
    bestFor: "Wall mounts, entryways, and open kitchens",
    specs: [
      { label: "Display", value: "15.6″ IPS" },
      { label: "Placement", value: "Wall or stand" },
      { label: "Apps", value: "Earnly · Scholars · Ballr · Freshys" },
      { label: "Purchase", value: "One-time · ships in the US" },
    ],
    highlights: [
      "Larger wall-readable display for the whole family",
      "Same Genlyn software as the 10.1″",
      "School, sports, chores, and meals in one glance",
      "Designed to look like home décor, not clutter",
    ],
  },
];

export function hubSizePath(size: Pick<HubSize, "slug">): string {
  return `/genlyn-hub/${size.slug}`;
}

export function getHubSize(id: string | null | undefined): HubSize | undefined {
  if (!id) return undefined;
  return hubSizes.find((size) => size.id === id || size.slug === id);
}

export function getHubSizeBySlug(slug: string): HubSize | undefined {
  return hubSizes.find((size) => size.slug === slug);
}

export function hubStripePriceId(size: HubSize): string | undefined {
  const value = process.env[size.envPriceId]?.trim();
  return value || undefined;
}

/** Product photos with the size hero first, then the shared app gallery. */
export function hubProductGallery(size: HubSize): HubGalleryShot[] {
  const hero: HubGalleryShot = {
    src: size.image,
    alt: size.imageAlt,
    caption: `${size.inches} Hub — ${size.blurb}`,
  };
  const rest = hubGallery.filter((shot) => shot.src !== size.image);
  return [hero, ...rest];
}

export const hubFeatures: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "calendar",
    title: "Family calendar",
    description: "Everyone’s week on one screen — school, sports, chores, and appointments.",
  },
  {
    icon: "users",
    title: "Built for the household",
    description: "Color-coded family members so kids and parents always know who’s doing what.",
  },
  {
    icon: "clipboard-check",
    title: "Chores & meals",
    description: "Track tasks and meal plans from the wall without digging through phones.",
  },
  {
    icon: "home",
    title: "Home-ready design",
    description: "A clean white frame that looks like décor — mounts on the wall or sits on a stand.",
  },
  {
    icon: "sparkles",
    title: "Works with Genlyn",
    description: "Designed to sit alongside Earnly, Freshys, Ballr, and Scholars Notes.",
  },
  {
    icon: "shield",
    title: "Parent-first",
    description: "One place for the family rhythm, managed from your Genlyn account.",
  },
];

export const hubFaqs: { question: string; answer: string }[] = [
  {
    question: "What is Genlyn Hub?",
    answer:
      "Genlyn Hub is a wall or counter tablet that shows your family’s calendar, chores, meals, and day-to-day plans in one place — branded for Genlyn households.",
  },
  {
    question: "Which size should I get?",
    answer:
      "Choose 10.1″ for a compact countertop or desk setup. Choose 15.6″ when you want a larger wall display the whole family can read from across the room.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Hub is a one-time hardware purchase. Genlyn app subscriptions are separate and managed under Plans & Billing.",
  },
  {
    question: "How do I track my order?",
    answer:
      "After checkout, open Account → Orders for status, carrier, and tracking when your Hub ships.",
  },
  {
    question: "Where do you ship?",
    answer:
      "We currently ship within the United States. Enter your shipping address at checkout.",
  },
];

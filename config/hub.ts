import type { IconName } from "@/components/site/Icon";

export type HubSizeId = "10.1" | "15.6";

export interface HubSize {
  id: HubSizeId;
  label: string;
  inches: string;
  priceCents: number;
  priceDisplay: string;
  blurb: string;
  image: string;
  imageAlt: string;
  recommended?: boolean;
  lookupKey: string;
  envPriceId: "STRIPE_HUB_10_PRICE_ID" | "STRIPE_HUB_15_PRICE_ID";
}

export const HUB_CURRENCY = "usd";
export const HUB_KIND = "genlyn_hub";

export const hubSizes: HubSize[] = [
  {
    id: "10.1",
    label: "Genlyn Hub 10.1″",
    inches: "10.1″",
    priceCents: 19900,
    priceDisplay: "$199",
    blurb: "Perfect for a kitchen counter or desk — the compact family command center.",
    image: "/images/hub/hub-earnly-family.png",
    imageAlt: "Genlyn Hub 10.1″ showing Earnly family calendar on tablet and phone",
    lookupKey: "com.genlyn.hub.10_1",
    envPriceId: "STRIPE_HUB_10_PRICE_ID",
  },
  {
    id: "15.6",
    label: "Genlyn Hub 15.6″",
    inches: "15.6″",
    priceCents: 24900,
    priceDisplay: "$249",
    blurb: "Wall-ready display for the whole household schedule at a glance.",
    image: "/images/hub/hub-scholars.png",
    imageAlt: "Genlyn Hub 15.6″ showing Scholars school dashboard on tablet and phone",
    recommended: true,
    lookupKey: "com.genlyn.hub.15_6",
    envPriceId: "STRIPE_HUB_15_PRICE_ID",
  },
];

export function getHubSize(id: string | null | undefined): HubSize | undefined {
  return hubSizes.find((size) => size.id === id);
}

export function hubStripePriceId(size: HubSize): string | undefined {
  const value = process.env[size.envPriceId]?.trim();
  return value || undefined;
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

export const hubGallery = [
  {
    src: "/images/hub/hub-earnly-family.png",
    alt: "Genlyn Hub Earnly view with family chore calendar on tablet and phone",
    caption: "Earnly — chores & family calendar on the wall.",
  },
  {
    src: "/images/hub/hub-earnly-balance.png",
    alt: "Genlyn Hub Earnly balance dashboard with parent funds and kid wallets",
    caption: "Earnly — parent funds and kid balances.",
  },
  {
    src: "/images/hub/hub-scholars.png",
    alt: "Genlyn Hub Scholars school dashboard with classes, GPA, and study stats",
    caption: "Scholars — classes, grades, and study streaks.",
  },
  {
    src: "/images/hub/hub-ballr.png",
    alt: "Genlyn Hub Ballr fitness dashboard with player cards and fuel tracking",
    caption: "Ballr — sports, workouts, calories & diet plans.",
  },
  {
    src: "/images/hub/hub-freshys.png",
    alt: "Genlyn Hub Freshys healthy eating dashboard with farm orders",
    caption: "Freshys — local farm orders at a glance.",
  },
];

/**
 * Marketing-site presentation for the four featured apps.
 * Names, icons, links, and plan data stay sourced from `brand.ts` / `pricing.ts`.
 */
import { getAppBySlug, getAppCtaHref, type AppConfig, type AppSlug } from "./brand";
import { getPricingPlan } from "./pricing";
import type { IconName } from "@/components/site/Icon";

export type FeaturedSlug = Extract<AppSlug, "fresher" | "ballr" | "scholars" | "earnly">;

export interface SiteApp {
  slug: FeaturedSlug;
  name: string;
  iconPath: string;
  href: string;
  ctaHref: string;
  ctaExternal: boolean;
  priceFrom: string;
  /** Site palette for this app */
  color: string;
  colorDeep: string;
  colorSoft: string;
  gradient: string;
  glow: [string, string, string];
  heroTitle: [string, string];
  heroLead: string;
  cardTitle: string;
  cardSubtitle: string;
  bullets: string[];
  highlights: { icon: IconName; label: string; description: string }[];
  homeChip: { label: string; sub: string };
  config: AppConfig;
}

const presentation: Record<
  FeaturedSlug,
  Omit<SiteApp, "slug" | "name" | "iconPath" | "href" | "ctaHref" | "ctaExternal" | "priceFrom" | "config">
> = {
  fresher: {
    color: "#16a34a",
    colorDeep: "#15803d",
    colorSoft: "#ecfdf3",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    glow: ["#bbf7d0", "#d9f99d", "#a7f3d0"],
    heroTitle: ["Fresh food for", "healthier families."],
    heroLead:
      "Find nearby farms, farm stores, and farmers markets on one map — then order pickup, delivery, or weekly subscriptions so your kids eat real food from real growers.",
    cardTitle: "Fresh food from local farmers.",
    cardSubtitle: "Real food, closer to home.",
    bullets: [
      "Local farms & markets on a map",
      "Pickup, delivery & weekly subscribe",
      "In-season produce & farm meats",
      "Freshys Verified growers",
      "Healthier meals for the whole family",
      "Support farms in your community",
    ],
    highlights: [
      { icon: "sprout", label: "Local Farmers", description: "Meet the growers behind your food." },
      { icon: "apple", label: "Fresh Food", description: "Produce, dairy, meat, and eggs nearby." },
      { icon: "heart-pulse", label: "Healthy Choices", description: "Better meals without the research." },
      { icon: "heart", label: "Stronger Communities", description: "Put your dollars into local farms." },
    ],
    homeChip: { label: "Freshys", sub: "Eat better" },
  },
  ballr: {
    color: "#f4511e",
    colorDeep: "#dc3d0b",
    colorSoft: "#fff1eb",
    gradient: "linear-gradient(135deg, #fb923c, #f4511e)",
    glow: ["#fed7aa", "#fecaca", "#fde68a"],
    heroTitle: ["Train. Compete.", "Get better."],
    heroLead:
      "Sports and fitness in one app — pickup games near you, player cards & ratings, personalized workouts, calorie and macro tracking, diet and meal plans, and habits that keep kids moving.",
    cardTitle: "Train. Compete. Get better.",
    cardSubtitle: "Sports, fitness & fuel for kids.",
    bullets: [
      "Pickup games & local parks",
      "Player cards, XP & ratings",
      "Personalized workout plans",
      "Calorie, macro & water tracking",
      "Diet plans & meal logging",
      "Physique goals & progress photos",
    ],
    highlights: [
      { icon: "activity", label: "Sports & Games", description: "Pickup runs, parks, and player cards." },
      { icon: "dumbbell", label: "Workouts", description: "Personalized training between games." },
      { icon: "flame", label: "Calorie Tracking", description: "Calories, macros, and daily fuel goals." },
      { icon: "apple", label: "Diet & Meals", description: "Meal plans and simple food logging." },
    ],
    homeChip: { label: "Ballr", sub: "Train & fuel" },
  },
  scholars: {
    color: "#2563eb",
    colorDeep: "#1d4ed8",
    colorSoft: "#eef4ff",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    glow: ["#bfdbfe", "#c7d2fe", "#bae6fd"],
    heroTitle: ["Study smarter", "with AI."],
    heroLead:
      "A full study workspace parents trust — classes, AI notes, study guides, quizzes, a live tutor, podcasts from notes, and tools that help kids keep up without the late-night scramble.",
    cardTitle: "Study smarter with AI.",
    cardSubtitle: "Everything school in one place.",
    bullets: [
      "All classes organized in one app",
      "AI notes & instant study guides",
      "Practice quizzes from their material",
      "Live AI tutor when they're stuck",
      "Study podcasts generated from notes",
      "Road-to-college planning tools",
    ],
    highlights: [
      { icon: "file-text", label: "AI Notes", description: "Organized notes that study with them." },
      { icon: "clipboard-check", label: "Practice Quizzes", description: "Tests built from their material." },
      { icon: "layers", label: "Study Guides", description: "Summaries generated in seconds." },
      { icon: "sparkles", label: "Live AI Tutor", description: "Help whenever homework gets hard." },
    ],
    homeChip: { label: "Scholars", sub: "Learn smarter" },
  },
  earnly: {
    color: "#7c3aed",
    colorDeep: "#6d28d9",
    colorSoft: "#f3efff",
    gradient: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    glow: ["#ddd6fe", "#fbcfe8", "#c7d2fe"],
    heroTitle: ["Build real", "money skills."],
    heroLead:
      "Kids earn through chores, save toward goals, and learn spending habits that stick — while you approve every payout and see the whole family's balances in one place.",
    cardTitle: "Build real money skills.",
    cardSubtitle: "Earn, save & grow together.",
    bullets: [
      "Chores that pay real rewards",
      "Allowances & savings goals",
      "Separate account for each kid",
      "School rewards for good grades",
      "You approve every money move",
      "Family net worth you can watch grow",
    ],
    highlights: [
      { icon: "wallet", label: "Learn to Earn", description: "Chores that pay real rewards." },
      { icon: "piggy-bank", label: "Save & Spend", description: "Balances kids can see grow." },
      { icon: "target", label: "Financial Goals", description: "Targets that make saving tangible." },
      { icon: "star", label: "Parent Control", description: "Approve payouts before money moves." },
    ],
    homeChip: { label: "Earnly", sub: "Earn responsibly" },
  },
};

export const featuredOrder: FeaturedSlug[] = ["fresher", "ballr", "scholars", "earnly"];

/**
 * Soft pastels of the four logo colors — Freshys green, Ballr orange,
 * Scholars blue, Earnly purple. Every page background uses this same mix.
 */
export const brandWash = ["#bfdbfe", "#fed7aa", "#ddd6fe", "#bbf7d0"] as const;

function priceFromLabel(slug: FeaturedSlug): string {
  const plan = getPricingPlan(slug);
  if (!plan) return "";
  const display = plan.monthlyPrice.display;
  return display.toLowerCase().startsWith("from") ? display : `From ${display}`;
}

export const siteApps: SiteApp[] = featuredOrder.map((slug) => {
  const config = getAppBySlug(slug);
  if (!config) throw new Error(`Missing app config for ${slug}`);
  const ctaHref = getAppCtaHref(config);
  return {
    slug,
    name: config.name,
    iconPath: config.iconPath,
    href: config.learnMorePath,
    ctaHref,
    ctaExternal: ctaHref.startsWith("http"),
    priceFrom: priceFromLabel(slug),
    config,
    ...presentation[slug],
  };
});

export function getSiteApp(slug: string): SiteApp | undefined {
  return siteApps.find((app) => app.slug === slug);
}

export const mainNav = [
  { label: "Families", href: "/families" },
  { label: "Our Mission", href: "/mission" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

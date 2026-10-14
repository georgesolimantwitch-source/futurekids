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
      "Find nearby farms, farm stores, and farmers markets on one map — and make healthier choices while supporting your community.",
    cardTitle: "Fresh food from local farmers.",
    cardSubtitle: "Real food, closer to home.",
    bullets: ["Local farms & markets", "Healthier choices", "Support local growers"],
    highlights: [
      { icon: "sprout", label: "Local Farmers", description: "Meet the growers behind your food." },
      { icon: "apple", label: "Fresh Food", description: "Produce, dairy, and more nearby." },
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
      "Find pickup games near you, build your player card, follow personalized workouts, and join a community of athletes.",
    cardTitle: "Train. Compete. Get better.",
    cardSubtitle: "For every young athlete.",
    bullets: ["Pickup games near you", "Personalized workouts", "Player cards & ratings"],
    highlights: [
      { icon: "activity", label: "Performance Tracking", description: "Log sessions and watch progress." },
      { icon: "dumbbell", label: "Personalized Training", description: "Workouts built around your goals." },
      { icon: "trophy", label: "Player Ratings", description: "Community-driven, fair match-ups." },
      { icon: "shield", label: "Build Discipline", description: "Habits that carry beyond the game." },
    ],
    homeChip: { label: "Ballr", sub: "Move more" },
  },
  scholars: {
    color: "#2563eb",
    colorDeep: "#1d4ed8",
    colorSoft: "#eef4ff",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    glow: ["#bfdbfe", "#c7d2fe", "#bae6fd"],
    heroTitle: ["Study smarter", "with AI."],
    heroLead:
      "AI-powered notes, study guides, practice quizzes, and a live tutor — everything a student needs in one workspace.",
    cardTitle: "Study smarter with AI.",
    cardSubtitle: "Notes, quizzes & a live tutor.",
    bullets: ["AI notes & study guides", "Practice quizzes", "Live AI tutor"],
    highlights: [
      { icon: "file-text", label: "AI Notes", description: "Organized notes that study with you." },
      { icon: "clipboard-check", label: "Practice Quizzes", description: "Tests built from your material." },
      { icon: "layers", label: "Study Guides", description: "Summaries generated in seconds." },
      { icon: "sparkles", label: "Live AI Tutor", description: "Explanations whenever you're stuck." },
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
      "Kids learn to earn, save, and spend responsibly through chores, allowances, and savings goals — with parents approving every move.",
    cardTitle: "Build real money skills.",
    cardSubtitle: "Earn, save & grow.",
    bullets: ["Learn to earn & save", "Set savings goals", "Parent approvals"],
    highlights: [
      { icon: "wallet", label: "Learn to Earn", description: "Chores that pay real rewards." },
      { icon: "piggy-bank", label: "Save & Spend", description: "Balances kids can see grow." },
      { icon: "target", label: "Financial Goals", description: "Targets that make saving tangible." },
      { icon: "star", label: "Good Habits", description: "Responsibility that sticks." },
    ],
    homeChip: { label: "Earnly", sub: "Earn responsibly" },
  },
};

export const featuredOrder: FeaturedSlug[] = ["fresher", "ballr", "scholars", "earnly"];

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

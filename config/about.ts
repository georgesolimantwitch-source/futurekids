/**
 * Cinematic About page — all story content & asset paths.
 * Update copy and illustration paths here only.
 */

import { apps, brand, type AppSlug } from "./brand";

export const aboutPageMeta = {
  title: "Our Story",
  description: `Why ${brand.companyName} exists — cinematic storytelling for families raising the next generation.`,
};

/* ── Section 1: Hero ── */
export const cinematicHero = {
  headline: "The next generation deserves better.",
  subtext: "Technology that helps kids grow — not just scroll.",
  illustration: "/images/about/hero-four-stages.svg",
};

/* ── Section 2: World changed ── */
export const worldChanged = {
  headline: "The world has changed.",
  eras: [
    {
      year: "1995",
      themes: ["Playgrounds", "Allowances", "Neighborhood games"],
      shift: "Childhood was mostly offline.",
      illustration: "/images/about/era-1995.svg",
    },
    {
      year: "2005",
      themes: ["Early internet", "Video games", "Digital homework"],
      shift: "Screens entered daily life.",
      illustration: "/images/about/era-2005.svg",
    },
    {
      year: "2015",
      themes: ["Social media", "Mobile everything", "Always connected"],
      shift: "Childhood moved into pockets.",
      illustration: "/images/about/era-2015.svg",
    },
    {
      year: "2025",
      themes: ["AI learning", "Parent burnout", "Digital childhood"],
      shift: "Families need better tools.",
      illustration: "/images/about/era-2025.svg",
    },
  ],
  forces: [
    { label: "Money", note: "Less real-world practice" },
    { label: "School", note: "More digital, less depth" },
    { label: "Sports", note: "Participation declining" },
    { label: "Friendships", note: "Harder to stay safe online" },
    { label: "Technology", note: "More screen time" },
  ],
};

/* ── Section 3: Challenges ── */
export const familyChallenges = {
  headline: "The challenges every family faces.",
  cards: [
    {
      id: "money",
      title: "Money",
      illustration: "/images/about/challenge-money.svg",
      accent: "#059669",
      accentLight: "#ecfdf5",
    },
    {
      id: "school",
      title: "School",
      illustration: "/images/about/challenge-school.svg",
      accent: "#6366f1",
      accentLight: "#eef2ff",
    },
    {
      id: "activity",
      title: "Activity",
      illustration: "/images/about/challenge-activity.svg",
      accent: "#ea580c",
      accentLight: "#fff7ed",
    },
    {
      id: "communication",
      title: "Communication",
      illustration: "/images/about/challenge-communication.svg",
      accent: "#0ea5e9",
      accentLight: "#e0f2fe",
    },
  ],
};

/* ── Section 4: Ecosystem circle ── */
export const ecosystemCircle = {
  headline: "One ecosystem.",
  apps: ["earnly", "scholars", "ballr", "tinypal"] as AppSlug[],
};

export function getEcosystemCircleApps() {
  return ecosystemCircle.apps.map((slug) => apps.find((a) => a.slug === slug)!);
}

/* ── Section 5: Child growth ── */
export const childGrowth = {
  headline: "Growing with your child.",
  stages: [
    { age: 6, apps: ["TinyPal", "Earnly"], note: "Safe start" },
    { age: 9, apps: ["Earnly", "Scholars Notes"], note: "Habits form" },
    { age: 12, apps: ["Scholars Notes", "Ballr"], note: "Independence grows" },
    { age: 15, apps: ["Ballr", "Scholars Notes", "Earnly"], note: "Community matters" },
    { age: 18, apps: ["Earnly", "Scholars Notes", "Ballr"], note: "Ready for adulthood" },
  ],
};

/* ── Section 6: Pillars ── */
export const valuePillars = {
  headline: "Built for who they become.",
  pillars: [
    { label: "Responsibility", illustration: "/images/about/pillar-responsibility.svg", accent: "#059669" },
    { label: "Curiosity", illustration: "/images/about/pillar-curiosity.svg", accent: "#6366f1" },
    { label: "Confidence", illustration: "/images/about/pillar-confidence.svg", accent: "#8b5cf6" },
    { label: "Friendship", illustration: "/images/about/pillar-friendship.svg", accent: "#0ea5e9" },
    { label: "Health", illustration: "/images/about/pillar-health.svg", accent: "#ea580c" },
    { label: "Growth", illustration: "/images/about/pillar-growth.svg", accent: "#10b981" },
  ],
};

/* ── Section 7: Vision ── */
export const visionSection = {
  eyebrow: "Our vision.",
  headline:
    "We're building technology that helps families raise stronger, smarter, healthier kids.",
};

/* ── Section 8: Future ── */
export const futureEcosystem = {
  headline: "This is only the beginning.",
  placeholderCount: 3,
};

/* ── Section 9: CTA ── */
export const aboutFinalCta = {
  headline: ["Better technology.", "Better childhoods.", "Better futures."],
  illustration: "/images/about/cta-families.svg",
  primary: { label: "Explore Apps", href: "/#apps" },
  secondary: { label: "Plans & Pricing", href: "/pricing" },
};

export { brand };

/**
 * About page — short, Genlyn-focused story.
 */

import { apps, brand, type AppSlug } from "./brand";

export const aboutPageMeta = {
  title: "About Genlyn",
  description: `${brand.productName} helps parents raise healthy, capable kids with apps for money skills, studying, sports, and local food.`,
};

export const cinematicHero = {
  headline: "Healthy kids. Capable kids. Ready for everything ahead.",
  subtext:
    "Genlyn is a family of apps that help kids earn, learn, play, and eat well — with parents in control.",
  outcomes: [
    "Money skills",
    "Smarter studying",
    "Local runs",
    "Safe messaging",
    "Real food nearby",
  ],
};

export const missionSection = {
  eyebrow: "Our mission",
  headline: "Give families practical tools for real-world growth.",
  paragraphs: [
    "Parents don’t need another distraction. They need apps that teach responsibility, build confidence, keep kids active, and make healthier food easier to find.",
    "That’s what Genlyn is built for — four focused apps, one shared account, and a clear purpose: help kids grow into capable young people.",
  ],
  commitments: [
    {
      title: "Healthy",
      description: "Encourage balance, activity, and wellbeing — not endless scrolling.",
    },
    {
      title: "Active",
      description: "Get kids moving with real games, training, and teammates close to home.",
    },
    {
      title: "Successful",
      description: "Build money skills, study habits, and confidence that lasts.",
    },
    {
      title: "Experienced",
      description: "Give them practice in the real world — saving, studying, and showing up.",
    },
  ],
};

export const familyChallenges = {
  eyebrow: "The Genlyn apps",
  headline: "Four apps. One mission for your family.",
  subtext:
    "Each product solves a real part of growing up — and they work better together.",
  cards: [
    {
      id: "money",
      title: "Earn, save, and grow",
      description:
        "Earnly turns chores and allowances into money lessons kids can practice every week — with parents approving the important moves.",
      app: "Earnly",
      illustration: "/images/home/hero-kids.jpg",
      illustrationAlt: "Kids laughing together on a soccer field at sunset",
      parentBenefit: "You set the rules and approve spending",
      childBenefit: "They learn to earn, save, and stay accountable",
      accent: "#24C0FC",
      accentLight: "#E6F7FE",
    },
    {
      id: "school",
      title: "Study smarter with AI",
      description:
        "Scholars Notes helps students capture notes, get AI tutoring, build study guides, and quiz themselves — so studying feels clearer and more doable.",
      app: "Scholars Notes",
      illustration: "/images/home/hero-kids.jpg",
      illustrationAlt: "Kids laughing together on a soccer field at sunset",
      parentBenefit: "You support progress without doing the work for them",
      childBenefit: "They study with focus and confidence",
      accent: "#009CFC",
      accentLight: "#E6F5FF",
    },
    {
      id: "activity",
      title: "Train, play, and fuel up",
      description:
        "Ballr helps athletes find nearby pickup games and parks, build a player card, follow workout plans, track calories and macros, and stick to diet plans that support performance.",
      app: "Ballr",
      illustration: "/images/home/hero-kids.jpg",
      illustrationAlt: "Kids laughing together on a soccer field at sunset",
      parentBenefit: "You see training, fuel, and games in one place",
      childBenefit: "They play more, train smarter, and eat with a plan",
      accent: "#E8B400",
      accentLight: "#FFF6D6",
    },
    {
      id: "food",
      title: "Find real food nearby",
      description:
        "Freshys helps families discover nearby farms, farm stores, farmers markets, and locally produced food on an interactive map.",
      app: "Freshys",
      illustration: "/images/home/hero-kids.jpg",
      illustrationAlt: "Kids laughing together on a soccer field at sunset",
      parentBenefit: "You find local food without the research rabbit hole",
      childBenefit: "They grow up closer to real, local food",
      accent: "#248A45",
      accentLight: "#EDF7EF",
    },
  ],
};

export const ecosystemCircle = {
  headline: "One account. Four apps that work together.",
  subtext: "Start with one product, or unlock the ecosystem as your family grows.",
  apps: ["earnly", "scholars", "ballr", "fresher"] as AppSlug[],
};

export function getEcosystemCircleApps() {
  return ecosystemCircle.apps.map((slug) => apps.find((a) => a.slug === slug)!);
}

export const aboutFinalCta = {
  headline: ["Healthy kids.", "Capable kids.", "Ready for what’s next."],
  subtext: `Explore the Genlyn apps and pick the plan that fits your family.`,
  illustration: "/images/home/hero-kids.jpg",
  primary: { label: "Explore Apps", href: "/#apps" },
  secondary: { label: "Plans & Pricing", href: "/pricing" },
};

export { brand };

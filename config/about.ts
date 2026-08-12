/**
 * About page — short, Genlyn-focused story.
 */

import { apps, brand, type AppSlug } from "./brand";

export const aboutPageMeta = {
  title: "About Genlyn",
  description: `${brand.productName} helps parents raise healthy, capable kids with apps for money skills, studying, sports, safe connection, and local food.`,
};

export const cinematicHero = {
  headline: "Healthy kids. Capable kids. Ready for everything ahead.",
  subtext:
    "Genlyn is a family of apps that help kids earn, learn, play, and connect — with parents in control.",
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
    "Parents don’t need another distraction. They need apps that teach responsibility, build confidence, keep kids active, protect how they connect online, and make healthier food easier to find.",
    "That’s what Genlyn is built for — five focused products, one shared account, and a clear purpose: help kids grow into capable young people.",
  ],
  commitments: [
    {
      title: "Healthy",
      description: "Encourage balance, activity, and wellbeing — not endless scrolling.",
    },
    {
      title: "Successful",
      description: "Build money skills, study habits, and confidence that lasts.",
    },
    {
      title: "Experienced",
      description: "Get kids into real games, real practice, and real communities.",
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
      illustration: "/images/about/earnly-family.jpg",
      illustrationAlt: "A parent helping their child manage allowance and savings",
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
      illustration: "/images/about/scholars-family.jpg",
      illustrationAlt: "A student studying with notes and digital tools",
      parentBenefit: "You support progress without doing the work for them",
      childBenefit: "They study with focus and confidence",
      accent: "#009CFC",
      accentLight: "#E6F5FF",
    },
    {
      id: "activity",
      title: "Find local runs",
      description:
        "Ballr helps athletes find nearby pickup games and runs, join the local community, and build a player card that shows who they are on the field.",
      app: "Ballr",
      illustration: "/images/about/ballr-family.jpg",
      illustrationAlt: "Kids playing a neighborhood sports game",
      parentBenefit: "You help them get outside and involved",
      childBenefit: "They find games and grow their player card",
      accent: "#E8B400",
      accentLight: "#FFF6D6",
    },
    {
      id: "food",
      title: "Find real food nearby",
      description:
        "Freshys helps families discover nearby farms, farm stores, farmers markets, and locally produced food on an interactive map.",
      app: "Freshys",
      illustration: "/images/apps/fresher/screenshot.png",
      illustrationAlt: "Freshys map highlighting nearby farms and markets",
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
  illustration: "/images/about/earnly-family.jpg",
  primary: { label: "Explore Apps", href: "/#apps" },
  secondary: { label: "Plans & Pricing", href: "/pricing" },
};

export { brand };

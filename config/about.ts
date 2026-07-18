/**
 * About page — mission-focused content.
 */

import { apps, brand, type AppSlug } from "./brand";

export const aboutPageMeta = {
  title: "Our Mission",
  description: `${brand.companyName} helps parents raise healthy, successful, experienced kids through apps built for real-world growth.`,
};

/* ── Hero ── */
export const cinematicHero = {
  headline: "Helping parents raise healthy, successful, experienced kids.",
  subtext:
    "We build apps that prepare children for real life — with tools for earning, learning, playing, and connecting safely.",
  illustration: "/images/about/hero-four-stages.svg",
};

/* ── Mission statement ── */
export const missionSection = {
  eyebrow: "Our mission",
  headline: "Give every child the skills, habits, and experiences they need to thrive.",
  paragraphs: [
    "Parents want more than entertainment. They want kids who understand money, love learning, stay active, and build real friendships — safely.",
    "Future Brand exists to support that journey. Our ecosystem gives families practical tools at every stage, from first allowance to teenage independence.",
    "We believe technology should help kids grow up prepared — not keep them stuck on a screen.",
  ],
  commitments: [
    {
      title: "Healthy",
      description: "Encourage balance, activity, and wellbeing — not endless scrolling.",
    },
    {
      title: "Successful",
      description: "Build money skills, academic confidence, and habits that last.",
    },
    {
      title: "Experienced",
      description: "Get kids into sports, communities, and real-world practice early.",
    },
  ],
};

/* ── How we help (mapped to apps) ── */
export const familyChallenges = {
  eyebrow: "Built for real family life",
  headline: "Four apps. One purpose: helping you raise capable kids.",
  subtext:
    "Each app gives parents a practical way to teach, guide, and protect — while children build skills they can use in the real world.",
  cards: [
    {
      id: "money",
      title: "Money & responsibility",
      description:
        "Turn everyday chores into early money lessons. Parents guide the routine while kids practice earning, saving, spending, and giving.",
      app: "Earnly",
      illustration: "/images/about/earnly-family.jpg",
      illustrationAlt:
        "A parent helping their child sort allowance into saving, spending, and giving jars",
      parentBenefit: "You set the structure",
      childBenefit: "They build responsibility",
      accent: "#059669",
      accentLight: "#ecfdf5",
    },
    {
      id: "school",
      title: "Learning & academics",
      description:
        "Give students support that builds independence instead of doing the work for them. Better study habits make school feel manageable.",
      app: "Scholars Notes",
      illustration: "/images/about/scholars-family.jpg",
      illustrationAlt: "A parent encouraging their child while they study with notes and a laptop",
      parentBenefit: "You encourage progress",
      childBenefit: "They learn with confidence",
      accent: "#6366f1",
      accentLight: "#eef2ff",
    },
    {
      id: "activity",
      title: "Sports & activity",
      description:
        "Help kids find opportunities to play, practice, and belong. Activity becomes a source of confidence, friendship, and healthy routine.",
      app: "Ballr",
      illustration: "/images/about/ballr-family.jpg",
      illustrationAlt: "A parent cheering as children play a neighborhood soccer game",
      parentBenefit: "You help them participate",
      childBenefit: "They get active together",
      accent: "#ea580c",
      accentLight: "#fff7ed",
    },
    {
      id: "communication",
      title: "Safe connection",
      description:
        "Introduce digital communication with guardrails from the beginning. Kids connect with trusted people while parents stay involved.",
      app: "TinyPal",
      illustration: "/images/about/tinypal-family.jpg",
      illustrationAlt: "A parent and child using devices together for safe family messaging",
      parentBenefit: "You choose trusted connections",
      childBenefit: "They communicate safely",
      accent: "#0ea5e9",
      accentLight: "#e0f2fe",
    },
  ],
};

/* ── Ecosystem ── */
export const ecosystemCircle = {
  headline: "One ecosystem. Every part of growing up.",
  subtext: "Four apps designed to work together — one account, one mission.",
  apps: ["earnly", "scholars", "ballr", "tinypal"] as AppSlug[],
};

export function getEcosystemCircleApps() {
  return ecosystemCircle.apps.map((slug) => apps.find((a) => a.slug === slug)!);
}

/* ── Child growth ── */
export const childGrowth = {
  headline: "Growing with your child.",
  subtext: "The right tools at the right age — from first chores to college prep.",
  stages: [
    { age: 6, apps: ["TinyPal", "Earnly"], note: "Safe communication and first money lessons" },
    { age: 9, apps: ["Earnly", "Scholars Notes"], note: "Habits form — saving, studying, responsibility" },
    { age: 12, apps: ["Scholars Notes", "Ballr"], note: "Independence grows — school, sports, friends" },
    { age: 15, apps: ["Ballr", "Scholars Notes", "Earnly"], note: "Real-world skills for teenage life" },
    { age: 18, apps: ["Earnly", "Scholars Notes", "Ballr"], note: "Prepared for adulthood" },
  ],
};

/* ── Values we build toward ── */
export const valuePillars = {
  headline: "What we help kids become.",
  subtext: "Every app in our ecosystem supports a different part of a well-rounded childhood.",
  pillars: [
    {
      label: "Responsible",
      description: "Kids who understand earning, saving, and accountability.",
      illustration: "/images/about/pillar-responsibility.svg",
      accent: "#059669",
    },
    {
      label: "Curious",
      description: "Learners who ask questions and love discovering new things.",
      illustration: "/images/about/pillar-curiosity.svg",
      accent: "#6366f1",
    },
    {
      label: "Confident",
      description: "Students who believe they can tackle hard subjects.",
      illustration: "/images/about/pillar-confidence.svg",
      accent: "#8b5cf6",
    },
    {
      label: "Active",
      description: "Kids who play, train, and show up for their community.",
      illustration: "/images/about/pillar-health.svg",
      accent: "#ea580c",
    },
    {
      label: "Connected",
      description: "Children who build safe, meaningful friendships.",
      illustration: "/images/about/pillar-friendship.svg",
      accent: "#0ea5e9",
    },
    {
      label: "Prepared",
      description: "Young adults ready for money, school, and life on their own.",
      illustration: "/images/about/pillar-growth.svg",
      accent: "#10b981",
    },
  ],
};

/* ── Vision ── */
export const visionSection = {
  eyebrow: "Why we exist",
  headline:
    "Parents shouldn't have to choose between technology and a healthy childhood. We're building both.",
};

/* ── CTA ── */
export const aboutFinalCta = {
  headline: ["Healthy kids.", "Successful kids.", "Experienced kids."],
  subtext: "Join families using Future Brand to raise the next generation — for real.",
  illustration: "/images/about/cta-families.svg",
  primary: { label: "Explore Apps", href: "/#apps" },
  secondary: { label: "Plans & Pricing", href: "/pricing" },
};

export { brand };

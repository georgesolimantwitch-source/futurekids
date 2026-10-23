import type { FeaturedSlug } from "./site";

export type ResourceCategory = "Money" | "Learning" | "Sports" | "Food" | "Parenting";

export interface ResourceSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface Resource {
  slug: string;
  title: string;
  excerpt: string;
  category: ResourceCategory;
  app?: FeaturedSlug;
  readMinutes: number;
  publishedAt: string;
  cover: string;
  coverAlt: string;
  sections: ResourceSection[];
}

export const resourceCategories: ResourceCategory[] = ["Money", "Learning", "Sports", "Food", "Parenting"];

export const categoryColor: Record<ResourceCategory, { color: string; soft: string }> = {
  Money: { color: "#7c3aed", soft: "#f3efff" },
  Learning: { color: "#2563eb", soft: "#eef4ff" },
  Sports: { color: "#f4511e", soft: "#fff1eb" },
  Food: { color: "#16a34a", soft: "#ecfdf3" },
  Parenting: { color: "#db2777", soft: "#fdf2f8" },
};

export const resources: Resource[] = [
  {
    slug: "teach-kids-money-with-chores",
    title: "How to teach kids about money with chores",
    excerpt: "Turn everyday chores into a simple system that teaches earning, saving, and responsibility.",
    category: "Money",
    app: "earnly",
    readMinutes: 5,
    publishedAt: "2026-09-22",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "Kids laughing together on a soccer field at sunset",
    sections: [
      {
        heading: "Start with the why",
        paragraphs: [
          "Kids learn money best when they can connect effort to reward. Paying for chores turns an abstract idea — money — into something they can earn, see, and decide what to do with.",
          "Before you set amounts, talk about why it matters: money is a tool, and learning to use it well is a skill they’ll practice for life.",
        ],
      },
      {
        heading: "Separate expected chores from paid chores",
        paragraphs: [
          "Some jobs are just part of living in a family — making the bed, clearing their plate. Keep those unpaid. Add a short list of extra jobs that earn money, so kids learn that extra effort creates extra value.",
        ],
        list: ["Expected: tidy room, help with dinner, pack school bag", "Paid: wash the car, rake leaves, deep-clean the fridge"],
      },
      {
        heading: "Split every payday",
        paragraphs: [
          "A simple rule like save some, spend some, share some gives kids a framework they can repeat every week. Over time they’ll see their savings grow toward a real goal.",
        ],
        list: ["Save — for a goal they choose", "Spend — on small things they want now", "Share — for gifts or causes they care about"],
      },
      {
        heading: "Stay in the loop",
        paragraphs: [
          "Approving chores and purchases together creates natural moments to talk about choices. In Earnly, kids check off chores and you approve them before money moves — so every payday is also a conversation.",
        ],
      },
    ],
  },
  {
    slug: "study-habits-that-stick",
    title: "5 study habits that actually stick",
    excerpt: "Simple routines that help students remember more and stress less — without studying longer.",
    category: "Learning",
    app: "scholars",
    readMinutes: 6,
    publishedAt: "2026-09-15",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "Kids laughing together on a soccer field at sunset",
    sections: [
      {
        heading: "Study in short, focused blocks",
        paragraphs: [
          "Attention fades fast. Twenty to thirty minutes of focused work followed by a short break beats an hour of distracted reading. Put the phone in another room for each block.",
        ],
      },
      {
        heading: "Test yourself instead of re-reading",
        paragraphs: [
          "Re-reading notes feels productive, but pulling information out of your memory is what makes it stick. Flashcards and practice quizzes are some of the most effective study tools there are.",
        ],
      },
      {
        heading: "Space it out",
        paragraphs: [
          "Reviewing material a little each day over a week works far better than one long session the night before a test. Put review sessions on the calendar like any other commitment.",
        ],
      },
      {
        heading: "Explain it out loud",
        paragraphs: [
          "If you can teach a concept to someone else — a parent, a friend, or even an AI tutor — you understand it. If you get stuck, you’ve found exactly what to review next.",
        ],
      },
      {
        heading: "Turn notes into tools",
        paragraphs: [
          "Good notes are the starting point, not the finish line. Scholars Notes can turn what a student already wrote into study guides, flashcards, and practice quizzes in seconds.",
        ],
      },
    ],
  },
  {
    slug: "benefits-of-youth-sports",
    title: "The lasting benefits of youth sports",
    excerpt: "Why getting kids into regular games builds confidence, friendships, and healthy habits.",
    category: "Sports",
    app: "ballr",
    readMinutes: 4,
    publishedAt: "2026-09-08",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "Kids playing a neighborhood soccer game",
    sections: [
      {
        heading: "More than exercise",
        paragraphs: [
          "Regular play keeps kids active, but the bigger wins are often off the scoreboard: learning to win and lose well, communicating with teammates, and showing up when they said they would.",
        ],
      },
      {
        heading: "Confidence through progress",
        paragraphs: [
          "Every practice is a chance to get a little better. Tracking that progress — new skills, more games played, personal bests — helps kids see that effort pays off.",
        ],
      },
      {
        heading: "Community close to home",
        paragraphs: [
          "Pickup games and local runs connect kids with neighbors and friends outside of school. Ballr helps families find nearby games and parks — and pairs that with workouts, calorie tracking, and meal plans so fitness sticks beyond game day.",
        ],
        list: [
          "Find games and runs near you",
          "Follow workouts and track calories",
          "Build a player card that grows with every game",
        ],
      },
    ],
  },
  {
    slug: "why-local-food-matters",
    title: "Why local food matters for your family",
    excerpt: "Shopping at farms and farmers markets is a simple way to eat better and teach kids where food comes from.",
    category: "Food",
    app: "fresher",
    readMinutes: 4,
    publishedAt: "2026-08-30",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "Kids laughing outside on a sunny day",
    sections: [
      {
        heading: "Fresher food, better habits",
        paragraphs: [
          "Produce from nearby farms is often picked closer to when you buy it. Kids who help choose fruit and vegetables at a market are more likely to want to try them at home.",
        ],
      },
      {
        heading: "A real-world lesson",
        paragraphs: [
          "Meeting the people who grow your food makes it real. A farm visit teaches seasons, effort, and where meals actually come from — lessons that are hard to get from a grocery aisle.",
        ],
      },
      {
        heading: "Make it a family ritual",
        paragraphs: [
          "Pick one weekend morning a month to visit a farm stand or market. Give each child a small budget to choose something for a family meal.",
        ],
        list: ["Find a market or farm nearby with Freshys", "Let kids pick one new item to try", "Cook it together that week"],
      },
    ],
  },
  {
    slug: "screen-time-that-builds-skills",
    title: "Screen time that builds real skills",
    excerpt: "Not all screen time is equal. Here’s how to tell the difference — and steer kids toward the good kind.",
    category: "Parenting",
    readMinutes: 5,
    publishedAt: "2026-08-21",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "A parent and child using a laptop together",
    sections: [
      {
        heading: "Ask what the screen leads to",
        paragraphs: [
          "A useful test: when the app closes, is your child better off? Apps that lead to saved money, finished homework, a game at the park, or a meal cooked together are doing their job.",
        ],
      },
      {
        heading: "Make it shared",
        paragraphs: [
          "Screen time is more valuable when parents are part of it. Approving a chore, reviewing a quiz score, or planning a market trip together turns solo screen time into family time.",
        ],
      },
      {
        heading: "Set clear boundaries",
        paragraphs: [
          "Decide which apps each child can use and keep that consistent. With a Genlyn family account you can turn each app on or off per child at any time.",
        ],
      },
    ],
  },
  {
    slug: "setting-savings-goals-with-kids",
    title: "Setting savings goals your kids will stick to",
    excerpt: "How to pick goals that motivate kids, track progress, and celebrate when they get there.",
    category: "Money",
    app: "earnly",
    readMinutes: 4,
    publishedAt: "2026-08-12",
    cover: "/images/home/hero-kids.jpg",
    coverAlt: "A girl dropping a coin into a savings jar",
    sections: [
      {
        heading: "Let them choose the goal",
        paragraphs: [
          "Kids save harder for something they picked. Help them name a specific goal — a game, a new ball, a gift for a sibling — and write down the price.",
        ],
      },
      {
        heading: "Make progress visible",
        paragraphs: [
          "A progress bar, a jar, or a chart on the fridge turns waiting into a game. Seeing the bar move after each payday is a powerful motivator.",
        ],
      },
      {
        heading: "Celebrate the finish",
        paragraphs: [
          "When they reach the goal, make a moment of it. Then talk about what worked — and what the next goal should be.",
        ],
      },
    ],
  },
];

export function getResource(slug: string) {
  return resources.find((resource) => resource.slug === slug);
}

export function formatResourceDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

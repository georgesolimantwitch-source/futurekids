/**
 * Central brand configuration.
 * Update company name, links, and app details here — changes propagate site-wide.
 */

export const brand = {
  companyName: "Future Brand",
  /** Shared parent account product name (user-facing). */
  productName: "Genlyn",
  tagline: "Raise kids ready for everything.",
  description:
    "Experienced, healthy, smart, fit, and safe — with every app parents need in one place.",
  /** Canonical production site URL */
  siteUrl: "https://genlyn.app",
  supportEmail: "support@futurebrand.com",
  logo: {
    /** Text fallback when an image logo is unavailable */
    text: "Genlyn",
    /**
     * Wordmark for light UI surfaces (nav, footer, auth).
     * Use wordmarkLight on dark backgrounds.
     */
    imagePath: "/images/brand/wordmark-dark.png",
    wordmarkDark: "/images/brand/wordmark-dark.png",
    wordmarkLight: "/images/brand/wordmark-light.png",
    /** Symbol mark — dark for light Chrome tabs, light for dark tabs */
    markDark: "/images/brand/mark-dark.png",
    markLight: "/images/brand/mark-light.png",
  },
  social: {
    instagram: "https://instagram.com/futurebrand",
    tiktok: "https://tiktok.com/@futurebrand",
  },
  links: {
    appStore: "https://apps.apple.com",
    googlePlay: "https://play.google.com/store",
  },
} as const;

export type AppSlug = "earnly" | "scholars" | "ballr" | "tinypal" | "fresher";
export type AppAvailability = "live" | "waitlist";
export type AppCtaType = "download" | "waitlist";

export interface ProductFeature {
  title: string;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface SafetySection {
  title: string;
  description: string;
  items: string[];
}

export interface Screenshot {
  /** Replace with final asset path */
  path: string;
  alt: string;
  caption?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AppConfig {
  slug: AppSlug;
  name: string;
  tagline: string;
  description: string;
  /** Short tags shown on homepage cards */
  features: string[];
  accentColor: string;
  accentColorLight: string;
  /** App icon — replace with final asset */
  iconPath: string;
  /** Primary product screenshot — replace with final asset */
  screenshotPath: string;
  /** Device frame for screenshots (Scholars Notes uses iPad) */
  screenshotDevice?: "phone" | "tablet";
  /** Editable App Store / iOS download URL (empty for waitlist apps) */
  appStoreUrl: string;
  /** Editable Google Play / Android URL when available */
  playStoreUrl?: string;
  learnMorePath: string;

  /* ── Product page fields ── */
  positioning: string;
  audience: string;
  availability: AppAvailability;
  cta: {
    type: AppCtaType;
    label: string;
    href: string;
  };
  productFeatures: ProductFeature[];
  howItWorks: HowItWorksStep[];
  benefits: Benefit[];
  safety?: SafetySection;
  screenshots: Screenshot[];
  faqs: FaqItem[];
  /** Ballr only — list supported sports */
  supportedSports?: string[];
}

export const apps: AppConfig[] = [
  {
    slug: "earnly",
    name: "Earnly",
    tagline: "Learn to earn, save, and grow.",
    description:
      "Helps parents teach children how to earn, save, and manage money through chores, allowances, savings goals, and school rewards.",
    features: ["Chores", "Allowances", "Savings Goals", "School Rewards"],
    accentColor: "#24C0FC",
    accentColorLight: "#E6F7FE",
    iconPath: "/images/apps/earnly/icon.png",
    screenshotPath: "/images/apps/earnly/screenshot.png",
    screenshotDevice: "phone",
    appStoreUrl: "https://apps.apple.com/us/app/earnly-family/id6761389561",
    learnMorePath: "/apps/earnly",
    positioning: "Teach kids how to earn, save, and build responsible money habits",
    audience: "Parents and children",
    availability: "live",
    cta: {
      type: "download",
      label: "Download Earnly",
      href: "https://apps.apple.com/us/app/earnly-family/id6761389561",
    },
    productFeatures: [
      {
        title: "Chores",
        description: "Assign tasks, set rewards, and track completion in one place.",
      },
      {
        title: "Allowances",
        description: "Automate weekly or monthly allowances tied to chores or goals.",
      },
      {
        title: "Savings goals",
        description: "Help kids set targets and watch their progress grow over time.",
      },
      {
        title: "School rewards",
        description: "Celebrate academic achievements with earned rewards.",
      },
      {
        title: "Parent approvals",
        description: "Review and approve transactions before money moves.",
      },
      {
        title: "Family dashboard",
        description: "See every child's balance, activity, and goals at a glance.",
      },
      {
        title: "Transaction history",
        description: "Full visibility into earning, spending, and saving patterns.",
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: "Set up your family",
        description: "Create profiles for each child and connect your parent account.",
      },
      {
        step: 2,
        title: "Assign chores and allowances",
        description: "Define tasks, set pay rates, and configure automatic allowances.",
      },
      {
        step: 3,
        title: "Kids earn and save",
        description: "Children complete chores, earn money, and work toward savings goals.",
      },
      {
        step: 4,
        title: "Parents stay in control",
        description: "Approve spending, monitor progress, and guide financial decisions.",
      },
    ],
    benefits: [
      {
        title: "Build real money skills",
        description: "Kids learn earning, saving, and spending through hands-on practice — not lectures.",
      },
      {
        title: "Less nagging, more accountability",
        description: "Chore tracking and automated allowances reduce daily back-and-forth.",
      },
      {
        title: "Full parental oversight",
        description: "Every transaction requires approval. You always know where money goes.",
      },
      {
        title: "Goals that motivate",
        description: "Savings targets turn abstract concepts into tangible achievements kids can see.",
      },
    ],
    safety: {
      title: "Safe by design",
      description: "Earnly is built for families with privacy and parental control at the core.",
      items: [
        "Parent approval required for all transactions",
        "No in-app purchases or hidden fees",
        "Designed with children's privacy laws in mind — final compliance language pending legal review",
        "Account and family data protected with industry-standard security practices",
      ],
    },
    screenshots: [
      {
        path: "/images/apps/earnly/screenshot.png",
        alt: "Earnly linked child dashboard with balance and quick actions",
        caption: "Family dashboard",
      },
      {
        path: "/images/apps/earnly/screenshot-2.png",
        alt: "Earnly chore manager with assign and review workflow",
        caption: "Chores & rewards",
      },
      {
        path: "/images/apps/earnly/screenshot-3.png",
        alt: "Earnly send money screen for simulated allowance",
        caption: "Send allowance",
      },
    ],
    faqs: [
      {
        question: "What age is Earnly designed for?",
        answer:
          "Earnly works best for children ages 6–16, with parent-managed accounts for younger kids and more independence for teens.",
      },
      {
        question: "Do I need a bank account to use Earnly?",
        answer:
          "No. Earnly uses an in-app balance system. Parents fund accounts and approve all transactions.",
      },
      {
        question: "Can I customize chore rewards?",
        answer:
          "Yes. Set individual pay rates per chore, create recurring tasks, and adjust rewards anytime.",
      },
      {
        question: "Is my family's data secure?",
        answer:
          "We take privacy seriously and use industry-standard security practices. We do not sell personal data. Specific certifications and legal commitments will be confirmed before launch.",
      },
    ],
  },
  {
    slug: "scholars",
    name: "Scholars Notes",
    tagline: "Study smarter with AI.",
    description:
      "An AI-powered notes and studying app with notes, an AI tutor, study guides, quizzes, assignments, podcasts generated from notes, and handwriting practice.",
    features: ["AI Tutor", "Study Guides", "Quizzes", "Podcasts"],
    accentColor: "#009CFC",
    accentColorLight: "#E6F5FF",
    iconPath: "/images/apps/scholars/icon.png",
    screenshotPath: "/images/apps/scholars/screenshot.png",
    screenshotDevice: "tablet",
    appStoreUrl: "https://apps.apple.com/us/app/scholars-notes/id6763737199",
    learnMorePath: "/apps/scholars",
    positioning: "A complete AI-powered study workspace",
    audience: "High school and college students",
    availability: "live",
    cta: {
      type: "download",
      label: "Download Scholars Notes",
      href: "https://apps.apple.com/us/app/scholars-notes/id6763737199",
    },
    productFeatures: [
      {
        title: "Notes",
        description: "Rich, organized notes with folders, tags, and quick search.",
      },
      {
        title: "AI tutor",
        description: "Get instant explanations, examples, and follow-up questions on any topic.",
      },
      {
        title: "AI study guides",
        description: "Auto-generated summaries and study sheets from your notes.",
      },
      {
        title: "Quizzes",
        description: "Practice tests built from your material to reinforce what you've learned.",
      },
      {
        title: "Assignments",
        description: "Track due dates, break down projects, and stay on top of coursework.",
      },
      {
        title: "Podcasts from notes",
        description: "Turn your notes into audio study sessions for learning on the go.",
      },
      {
        title: "Handwriting practice",
        description: "Digital handwriting tools that help retention and note-taking skills.",
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: "Capture your notes",
        description: "Write, type, or import material into your personal study workspace.",
      },
      {
        step: 2,
        title: "Let AI organize",
        description: "Scholars generates study guides, summaries, and key concepts automatically.",
      },
      {
        step: 3,
        title: "Practice and quiz",
        description: "Test yourself with AI-generated quizzes tailored to your notes.",
      },
      {
        step: 4,
        title: "Review anywhere",
        description: "Listen to podcast versions of your notes or review on any device.",
      },
    ],
    benefits: [
      {
        title: "One workspace for everything",
        description: "Notes, assignments, quizzes, and AI tools — no more switching between apps.",
      },
      {
        title: "Study smarter, not longer",
        description: "AI identifies what matters and helps you focus on weak areas.",
      },
      {
        title: "Built for how students learn",
        description: "Visual summaries, audio reviews, and interactive quizzes match real study habits.",
      },
      {
        title: "Always improving",
        description: "The more you use Scholars, the better it understands your subjects and style.",
      },
    ],
    screenshots: [
      {
        path: "/images/apps/scholars/screenshot.png",
        alt: "Scholars Notes Biology 101 class hub with notes and AI tools",
        caption: "Class workspace",
      },
      {
        path: "/images/apps/scholars/screenshot-2.png",
        alt: "Scholars Notes AI study podcast with synced transcript",
        caption: "Study podcasts",
      },
      {
        path: "/images/apps/scholars/screenshot-3.png",
        alt: "Scholars Notes dashboard with course cards and progress",
        caption: "Course dashboard",
      },
    ],
    faqs: [
      {
        question: "Is Scholars free to use?",
        answer:
          "Scholars offers a free tier with core features. Premium plans unlock advanced AI tools and unlimited storage.",
      },
      {
        question: "Does the AI tutor replace a real teacher?",
        answer:
          "No. Scholars supplements your learning — it helps explain concepts, but isn't a substitute for classroom instruction.",
      },
      {
        question: "Can I import existing notes?",
        answer:
          "Yes. Import from common formats or paste content directly into your workspace.",
      },
      {
        question: "Does it work offline?",
        answer:
          "Notes and study guides are available offline. AI features require an internet connection.",
      },
    ],
  },
  {
    slug: "ballr",
    name: "Ballr",
    tagline: "Discover pickup games near you and build your personal player card.",
    description:
      "A social sports app that helps you find local pickup games and runs, nearby parks, friends, training sessions, and build your own player card with ratings in your community.",
    features: ["Local Runs", "Player Cards", "Nearby Parks", "Communities"],
    accentColor: "#E8B400",
    accentColorLight: "#FFF6D6",
    iconPath: "/images/apps/ballr/icon.png",
    screenshotPath: "/images/apps/ballr/screenshot.png",
    screenshotDevice: "phone",
    appStoreUrl: "https://apps.apple.com/app/ballr",
    /** Update when Android launches */
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.ballr.app",
    learnMorePath: "/apps/ballr",
    positioning: "Find local runs, build your player card, and grow your sports community",
    audience: "Athletes and sports enthusiasts of all ages",
    availability: "live",
    cta: {
      type: "download",
      label: "Download Ballr",
      href: "https://apps.apple.com/app/ballr",
    },
    supportedSports: ["Soccer", "Basketball", "Football", "Tennis", "Pickleball"],
    productFeatures: [
      {
        title: "Find pickup games",
        description: "Discover open games near you and join with one tap.",
      },
      {
        title: "Discover nearby parks",
        description: "Explore courts, fields, and facilities with ratings and amenities.",
      },
      {
        title: "Join sports communities",
        description: "Connect with local groups organized by sport and skill level.",
      },
      {
        title: "Add friends",
        description: "Build your network and get notified when friends are playing.",
      },
      {
        title: "Player ratings",
        description: "Fair, community-driven ratings that help match skill levels.",
      },
      {
        title: "Training progress",
        description: "Log sessions, track improvement, and set athletic goals.",
      },
      {
        title: "Sports profiles",
        description: "Showcase your sports, positions, stats, and achievements.",
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: "Create your profile",
        description: "Set up your sports, skill level, and preferred locations.",
      },
      {
        step: 2,
        title: "Find games and parks",
        description: "Browse nearby pickup games, courts, and fields on the map.",
      },
      {
        step: 3,
        title: "Join and play",
        description: "RSVP to games, meet players, and build your local network.",
      },
      {
        step: 4,
        title: "Track and grow",
        description: "Log training, earn ratings, and watch your progress over time.",
      },
    ],
    benefits: [
      {
        title: "Never play alone",
        description: "Find pickup games and players at your skill level, any day of the week.",
      },
      {
        title: "Discover new places",
        description: "Uncover parks and courts you didn't know existed in your area.",
      },
      {
        title: "Build your reputation",
        description: "Player ratings and profiles help you find the right match-ups.",
      },
      {
        title: "Stay active and connected",
        description: "Training logs and friend notifications keep you motivated.",
      },
    ],
    screenshots: [
      {
        path: "/images/apps/ballr/screenshot.png",
        alt: "Ballr player profile card with overall rating and OVR progress",
        caption: "Player profile",
      },
      {
        path: "/images/apps/ballr/screenshot-2.png",
        alt: "Ballr map showing nearby parks, courts, and fields",
        caption: "Find parks & games",
      },
    ],
    faqs: [
      {
        question: "What sports does Ballr support?",
        answer:
          "Ballr currently supports soccer, basketball, football, tennis, and pickleball — with more sports coming soon.",
      },
      {
        question: "Is Ballr free?",
        answer:
          "Yes. Core features like finding games and parks are free. Premium features include advanced stats and community tools.",
      },
      {
        question: "How do player ratings work?",
        answer:
          "After games, players rate each other on sportsmanship and skill. Ratings are averaged over time for fairness.",
      },
      {
        question: "Can parents use Ballr for their kids?",
        answer:
          "Yes. Parents can manage accounts for younger athletes and control who their children connect with.",
      },
    ],
  },
  {
    slug: "tinypal",
    name: "TinyPal",
    tagline: "Safe messaging for kids.",
    description:
      "A safe messaging and social app for kids with parent-controlled setup, verified family information, secure communication, and child-safety protections.",
    features: ["Parent Controls", "Verified Family", "Safe Messaging", "Child Safety"],
    accentColor: "#FC6C0C",
    accentColorLight: "#FFF1E6",
    iconPath: "/images/apps/tinypal/icon.png",
    screenshotPath: "/images/apps/tinypal/screenshot.svg",
    appStoreUrl: "",
    learnMorePath: "/apps/tinypal",
    positioning: "Safe communication designed for kids and controlled by parents",
    audience: "Kids and parents",
    availability: "waitlist",
    cta: {
      type: "waitlist",
      label: "Join the TinyPal Waitlist",
      href: "/contact?app=tinypal",
    },
    productFeatures: [
      {
        title: "Parent-managed setup",
        description: "Parents create and configure every aspect of their child's account.",
      },
      {
        title: "Verified family information",
        description: "Contacts are verified through family connections — no strangers allowed.",
      },
      {
        title: "Safe messaging",
        description: "Text, voice, and media sharing within a closed, monitored network.",
      },
      {
        title: "Family controls",
        description: "Set time limits, approve contacts, and review activity from your dashboard.",
      },
      {
        title: "Child-focused privacy",
        description: "Minimal data collection with no ads and no third-party tracking.",
      },
      {
        title: "Age-appropriate social features",
        description: "Stickers, reactions, and groups designed for young users.",
      },
      {
        title: "Secure profiles",
        description: "Real-name verification for families with encrypted communications.",
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: "Parent creates the account",
        description: "Set up your child's profile with age-appropriate settings and controls.",
      },
      {
        step: 2,
        title: "Verify family contacts",
        description: "Invite trusted family members and friends through parent approval.",
      },
      {
        step: 3,
        title: "Kids connect safely",
        description: "Children message approved contacts within a protected environment.",
      },
      {
        step: 4,
        title: "Parents stay informed",
        description: "Review activity, manage permissions, and adjust controls anytime.",
      },
    ],
    benefits: [
      {
        title: "Peace of mind for parents",
        description: "Know exactly who your child communicates with and when.",
      },
      {
        title: "Independence for kids",
        description: "Children get their own space to connect — within boundaries you set.",
      },
      {
        title: "No strangers, ever",
        description: "Every contact is verified and approved by a parent before connecting.",
      },
      {
        title: "Built for young users",
        description: "Simple, friendly interface designed for children — not scaled-down adult apps.",
      },
    ],
    safety: {
      title: "Safety first, always",
      description: "TinyPal is designed from the ground up to protect children online.",
      items: [
        "Parent approval required for all contacts",
        "No public profiles or discoverability",
        "Reporting and blocking tools for families",
        "Designed for children's privacy — compliance details pending legal review",
        "Secure messaging with industry-standard protections",
      ],
    },
    screenshots: [
      {
        path: "/images/apps/tinypal/screenshot.svg",
        alt: "TinyPal messaging interface",
        caption: "Safe messaging",
      },
      {
        path: "/images/apps/tinypal/screenshot-2.svg",
        alt: "TinyPal parent dashboard",
        caption: "Parent dashboard",
      },
      {
        path: "/images/apps/tinypal/screenshot-3.svg",
        alt: "TinyPal family contacts",
        caption: "Family contacts",
      },
    ],
    faqs: [
      {
        question: "When will TinyPal launch?",
        answer:
          "TinyPal is currently in development. Join the waitlist to be notified when we launch in your area.",
      },
      {
        question: "What age is TinyPal for?",
        answer:
          "TinyPal is designed for children ages 6–13, with parent-managed accounts required for all users under 13.",
      },
      {
        question: "Can my child talk to strangers?",
        answer:
          "No. Every contact must be verified and approved by a parent. There is no public search or discovery.",
      },
      {
        question: "How is TinyPal different from other messaging apps?",
        answer:
          "TinyPal is built exclusively for kids with parent controls, verified contacts, and zero ads — not adapted from an adult platform.",
      },
    ],
  },
  {
    slug: "fresher",
    name: "Freshys",
    tagline: "Find real food near your family.",
    description:
      "Freshys helps families discover nearby farms, farm stores, farmers markets, and locally produced food using an interactive map.",
    features: ["Local Farms", "Farmers Markets", "Farm Stores", "Interactive Map"],
    accentColor: "#248A45",
    accentColorLight: "#EDF7EF",
    iconPath: "/images/apps/fresher/icon.png",
    screenshotPath: "/images/apps/fresher/screenshot.png",
    screenshotDevice: "phone",
    appStoreUrl: "",
    playStoreUrl: "",
    learnMorePath: "/apps/fresher",
    positioning: "Find real food near your family on an interactive map",
    audience: "Parents and families",
    availability: "live",
    cta: {
      type: "download",
      label: "Get Freshys",
      href: "/pricing?app=fresher",
    },
    productFeatures: [
      {
        title: "Interactive local map",
        description: "See farms, farm stores, and markets near your family in one place.",
      },
      {
        title: "Farmers markets",
        description: "Discover market days, locations, and what’s growing nearby.",
      },
      {
        title: "Farm stores",
        description: "Find roadside stands and farm shops with fresh, local products.",
      },
      {
        title: "Locally produced food",
        description: "Filter for produce, dairy, meat, and more from nearby producers.",
      },
      {
        title: "Family-friendly discovery",
        description: "Built for parents who want healthier food choices without the research rabbit hole.",
      },
      {
        title: "Save favorites",
        description: "Bookmark the farms and markets your family returns to again and again.",
      },
    ],
    howItWorks: [
      {
        step: 1,
        title: "Open the map",
        description: "See local food sources around your home or wherever you are.",
      },
      {
        step: 2,
        title: "Explore what’s nearby",
        description: "Browse farms, farm stores, and farmers markets with clear details.",
      },
      {
        step: 3,
        title: "Pick real food",
        description: "Choose places that fit your family’s routine and preferences.",
      },
      {
        step: 4,
        title: "Come back anytime",
        description: "Save favorites and return when you need the next fresh haul.",
      },
    ],
    benefits: [
      {
        title: "Fresh food, closer to home",
        description: "Skip the guesswork and find real local sources quickly.",
      },
      {
        title: "Built for families",
        description: "Simple discovery that fits busy parent schedules.",
      },
      {
        title: "Support local producers",
        description: "Put your dollars toward nearby farms and markets.",
      },
      {
        title: "One clear map",
        description: "Everything you need in a single, easy-to-use view.",
      },
    ],
    screenshots: [
      {
        path: "/images/apps/fresher/screenshot.png",
        alt: "Freshys map showing nearby farms and markets",
        caption: "Local food map",
      },
    ],
    faqs: [
      {
        question: "What is Freshys?",
        answer:
          "Freshys helps families find nearby farms, farm stores, farmers markets, and locally produced food on an interactive map.",
      },
      {
        question: "How much does Freshys cost?",
        answer:
          "Freshys is $1.50 per month or $9.99 per year. Yearly is the best value. It’s also included with Genlyn All Access.",
      },
      {
        question: "Does Freshys deliver food?",
        answer:
          "No. Freshys helps you discover local sources — you visit or buy directly from the farm, store, or market.",
      },
      {
        question: "Is Freshys included in All Access?",
        answer:
          "Yes. An active Genlyn All Access subscription unlocks Freshys along with the rest of the ecosystem.",
      },
    ],
  },
];

export const ecosystemPillars = [
  {
    title: "Money",
    description: "Earnly teaches financial literacy through real-world earning and saving habits.",
    appSlug: "earnly" as AppSlug,
    icon: "💰",
  },
  {
    title: "Education",
    description: "Scholars Notes powers smarter studying with AI tools built for how kids actually learn.",
    appSlug: "scholars" as AppSlug,
    icon: "📚",
  },
  {
    title: "Sports",
    description: "Ballr connects young athletes to games, parks, and communities near them.",
    appSlug: "ballr" as AppSlug,
    icon: "⚽",
  },
  {
    title: "Communication",
    description: "TinyPal keeps kids connected safely with family-verified, parent-controlled messaging.",
    appSlug: "tinypal" as AppSlug,
    icon: "💬",
  },
  {
    title: "Family Health",
    description: "Freshys helps families find real food nearby — farms, markets, and local producers.",
    appSlug: "fresher" as AppSlug,
    icon: "🌿",
  },
];

export const trustFeatures = [
  {
    title: "Parent-first design",
    description:
      "Every app is built with parents in the loop — clear dashboards, easy setup, and full visibility.",
  },
  {
    title: "Privacy and safety",
    description:
      "We collect only what's needed, protect data with industry-standard encryption, and never sell personal information.",
  },
  {
    title: "Age-appropriate experiences",
    description:
      "Content, features, and interactions are designed for the developmental stage of each app's audience.",
  },
  {
    title: "Secure accounts",
    description:
      "Family accounts use secure authentication and verification to keep identities protected.",
  },
  {
    title: "Transparent controls",
    description:
      "Parents set the rules. Kids get the freedom to explore within boundaries you define.",
  },
];

/** Top-level nav links (Apps is rendered as a dropdown separately) */
export const navigationLinks = [
  { label: "About", href: "/about" },
  { label: "Plans & Pricing", href: "/pricing" },
  { label: "Safety", href: "/safety" },
  { label: "Support", href: "/support" },
];

/** In-page section anchors used on product pages */
export const productPageSections = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "benefits", label: "Benefits" },
  { id: "faq", label: "FAQ" },
] as const;

/** Safety page sections — use careful, non-binding placeholder language */
export const safetyPageSections = [
  {
    title: "Parent-first design",
    description:
      "Parents and guardians are intended to stay involved. Product experiences are designed with family dashboards, setup flows, and visibility into how children use each app.",
  },
  {
    title: "Child privacy",
    description:
      "We aim to collect only what is needed to operate the products and to give families meaningful control over information. Exact data practices, retention periods, and legal bases will be documented in our Privacy Policy after compliance review.",
  },
  {
    title: "Account controls",
    description:
      "Where applicable, parents can manage child accounts, permissions, contacts, and feature access. Control sets may vary by app and age group.",
  },
  {
    title: "Reporting and blocking",
    description:
      "Apps that include social or messaging features are designed to include tools for reporting concerns and blocking unwanted interactions. Response processes will be finalized before public launch.",
  },
  {
    title: "Data protection",
    description:
      "We plan to use industry-standard security practices to protect accounts and data. Specific technical and organizational measures will be confirmed with security and legal review.",
  },
  {
    title: "Age-appropriate experiences",
    description:
      "Features, content, and communication patterns are intended to match the developmental stage of each app’s audience — from younger children with parent oversight to older students and athletes.",
  },
];

export const supportCategories = apps.map((app) => ({
  slug: app.slug,
  name: app.name,
  accentColor: app.accentColor,
  accentColorLight: app.accentColorLight,
  iconPath: app.iconPath,
  href: app.learnMorePath,
  description: app.tagline,
  topics: app.faqs.slice(0, 2).map((f) => f.question),
}));

export const supportFaqs = [
  {
    question: "How do I contact support?",
    answer: `Email us at ${brand.supportEmail}. Please include the app name, device type, and a short description of the issue.`,
  },
  {
    question: "How do I manage a child’s account?",
    answer:
      "Account management is handled in each app’s parent or family settings. Steps may differ by product — check the app’s Learn More page or email support for guidance.",
  },
  {
    question: "Where can I find privacy information?",
    answer:
      "See our Privacy Policy and Safety pages. Product-specific practices may also appear in each app’s settings once launched.",
  },
  {
    question: "Is TinyPal available yet?",
    answer:
      "TinyPal is on a waitlist. Join from the TinyPal product page or contact page, and we will notify you when it becomes available.",
  },
];

export const footerLinks = {
  apps: apps.map((app) => ({
    label: app.name,
    href: app.learnMorePath,
  })),
  company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Safety", href: "/safety" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  support: [{ label: "Support", href: "/support" }],
};

/** Readable text/icon color on top of an app accent fill. */
export function accentForegroundColor(accent: string): string {
  const hex = accent.replace("#", "").trim();
  if (hex.length !== 6) return "#ffffff";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1d1d1f" : "#ffffff";
}

export function getAppBySlug(slug: string): AppConfig | undefined {
  return apps.find((app) => app.slug === slug);
}

export function isAppLive(app: AppConfig): boolean {
  return app.availability === "live";
}

/** Primary CTA href — App Store for live apps, waitlist path otherwise */
export function getAppCtaHref(app: AppConfig): string {
  if (app.availability === "waitlist") return app.cta.href;
  return app.appStoreUrl || app.cta.href;
}

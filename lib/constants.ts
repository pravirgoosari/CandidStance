// Core political issues for analysis
export const POLITICAL_ISSUES = [
  {
    id: "economy",
    name: "Economy & Taxes",
    description: "Economic policies, tax reform, and fiscal responsibility",
    category: "economic"
  },
  {
    id: "healthcare",
    name: "Healthcare & Insurance",
    description: "Healthcare reform, insurance, and medical policies",
    category: "social"
  },
  {
    id: "abortion",
    name: "Abortion & Reproductive Rights",
    description: "Abortion policy, reproductive rights, and family planning",
    category: "social"
  },
  {
    id: "climate",
    name: "Climate & Environment",
    description: "Climate change, environmental protection, and energy policy",
    category: "environmental"
  },
  {
    id: "elections",
    name: "Elections & Voting Rights",
    description: "Voting rights, election integrity, and democratic processes",
    category: "democratic"
  },
  {
    id: "gun-control",
    name: "Gun Control & Public Safety",
    description: "Gun policy, public safety, and Second Amendment rights",
    category: "security"
  },
  {
    id: "israel-palestine",
    name: "Israel-Palestine Conflict",
    description: "Middle East policy, Israel-Palestine relations, and peace process",
    category: "foreign-policy"
  },
  {
    id: "russia-ukraine",
    name: "Russia-Ukraine War",
    description: "Ukraine support, Russia policy, and international relations",
    category: "foreign-policy"
  },
  {
    id: "technology",
    name: "Technology & Privacy",
    description: "Tech regulation, privacy rights, and digital policy",
    category: "technology"
  },
  {
    id: "immigration",
    name: "Immigration & Border Security",
    description: "Border security, immigration reform, and citizenship policy",
    category: "social"
  },
  {
    id: "lgbtq",
    name: "LGBTQ+ Rights",
    description: "LGBTQ+ equality, civil rights, and anti-discrimination",
    category: "social"
  },
  {
    id: "education",
    name: "Education",
    description: "Education reform, funding, and policy",
    category: "social"
  }
] as const;

// Issue categories
export const ISSUE_CATEGORIES = ["economic", "social", "environmental", "democratic", "security", "foreign-policy", "technology"] as const;

// Confidence levels
export const CONFIDENCE_LEVELS = {
  LOW: 0-30,
  MEDIUM: 31-70,
  HIGH: 71-100
} as const;

/**
 * The real people who write and review The Digital Dude's content. Every byline, author card and schema.org "author" comes from here,
 * so a profile link or job title is changed in one place.
 */
export interface ContentAuthor {
  /** The exact string stored in a post's `author` field. */
  name: string;
  slug: string;
  initials: string;
  role: string;
  /** Short line under the name on article pages. */
  expertise: string;
  bio: string;
  linkedin: string;
}

export const AUTHORS: Record<string, ContentAuthor> = {
  "Farhad Hossain": {
    name: "Farhad Hossain",
    slug: "farhad-hossain",
    initials: "FH",
    role: "Founder & Solutions Architect",
    expertise: "Custom software, CRM and marketplace architecture",
    bio: "Farhad founded The Digital Dude and scopes and architects every client system: data models, access control and security first, then the build. He writes about custom CRMs, marketplaces, AI features and the real cost and trade-offs of building software.",
    linkedin: "https://www.linkedin.com/in/neiloy-farhad/",
  },
  "Tanvir Ahmed Shuvo": {
    name: "Tanvir Ahmed Shuvo",
    slug: "tanvir-ahmed-shuvo",
    initials: "TA",
    role: "Digital Marketing, SEO & Google Ads",
    expertise: "Search marketing, paid search and growth",
    bio: "Tanvir leads search and paid-media work at The Digital Dude: technical SEO, programmatic landing pages, Google Ads structure and measurement. He writes about how software businesses turn search demand into qualified leads.",
    linkedin: "https://www.linkedin.com/in/tanvir-ahmed-shuvo/",
  },
};

export const AUTHOR_NAMES = Object.keys(AUTHORS);

/** The generic names older posts used. They are never shown as a person. */
const GENERIC = new Set(["The Digital Dude Team", "The Digital Dude", "The Digital Dude Engineering Team", ""]);

export function findAuthor(name: string | null | undefined): ContentAuthor | null {
  const n = (name ?? "").trim();
  if (GENERIC.has(n)) return null;
  return AUTHORS[n] ?? null;
}

/** schema.org Person for an article author (a link to their profile as `sameAs`). */
export function authorSchema(name: string | null | undefined, siteUrl: string) {
  const a = findAuthor(name);
  if (!a) return { "@type": "Organization", name: "The Digital Dude", url: siteUrl };
  return { "@type": "Person", name: a.name, jobTitle: a.role, url: a.linkedin, sameAs: [a.linkedin], worksFor: { "@type": "Organization", name: "The Digital Dude", url: siteUrl } };
}

/** Who writes about what, used to credit existing and new posts by topic. */
export function authorForCategory(category: string | null | undefined): string {
  const c = (category ?? "").toLowerCase();
  if (/seo|ppc|google ads|e-?commerce growth|marketing|working with us|growth/.test(c)) return "Tanvir Ahmed Shuvo";
  return "Farhad Hossain";
}

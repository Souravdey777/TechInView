/** Shared SEO helpers (JSON-LD builders, OG image path, site constants). */

export const SITE_NAME = "TechInView";

/**
 * Served by `src/app/opengraph-image.tsx`. `/og-image.png` (referenced by older
 * pages) is rewritten to the same route in next.config.mjs.
 */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

/** Square brand mark (1254x1254) for schema.org `logo`. */
export const SITE_LOGO_PATH = "/images/techinview-logo.png";

export const LINKEDIN_URL = "https://www.linkedin.com/company/techinview";

export function absoluteUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * JSON for a <script type="application/ld+json"> tag. JSON.stringify leaves
 * `<` raw, so a literal "</script>" in content would close the tag early.
 */
export function serializeJsonLd(jsonLd: unknown): string {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

/**
 * Organization node shared by every JSON-LD graph. The `@id` matches the full
 * node emitted on the home page, so crawlers can join them.
 */
export function buildOrganizationNode(baseUrl: string) {
  return {
    "@type": "Organization",
    "@id": absoluteUrl(baseUrl, "/#organization"),
    name: SITE_NAME,
    url: absoluteUrl(baseUrl, "/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(baseUrl, SITE_LOGO_PATH),
      width: 1254,
      height: 1254,
    },
    sameAs: [LINKEDIN_URL],
  };
}

/** BreadcrumbList from ordered [name, path] pairs (first is usually Home). */
export function buildBreadcrumbListNode(
  id: string,
  baseUrl: string,
  items: readonly { name: string; path: string }[]
) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: absoluteUrl(baseUrl, entry.path),
    })),
  };
}

/** FAQPage node from question/answer pairs already rendered on the page. */
export function buildFaqPageNode(
  id: string,
  faq: readonly { question: string; answer: string }[]
) {
  return {
    "@type": "FAQPage",
    "@id": id,
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

export function wordCountFromMarkdownBody(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

export function buildBlogPostingAndBreadcrumbJsonLd(input: {
  baseUrl: string;
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  keywords: string[];
  wordCount: number;
  readingTimeMinutes?: number;
  /** Rendered FAQ pairs from the post body, if it has an FAQ section. */
  faq?: { question: string; answer: string }[];
}) {
  const pageUrl = absoluteUrl(input.baseUrl, `/blog/${input.slug}`);
  const imageUrl = absoluteUrl(input.baseUrl, DEFAULT_OG_IMAGE_PATH);
  const organization = buildOrganizationNode(input.baseUrl);

  const blogPosting: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": `${pageUrl}#article`,
    headline: input.title,
    description: input.description,
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: organization,
    publisher: organization,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    url: pageUrl,
    inLanguage: "en-US",
    articleSection: "Interview preparation",
    keywords: input.keywords.join(", "),
    wordCount: input.wordCount,
    ...(input.readingTimeMinutes && {
      timeRequired: `PT${input.readingTimeMinutes}M`,
    }),
    isPartOf: {
      "@type": "Blog",
      "@id": absoluteUrl(input.baseUrl, "/blog#blog"),
      name: "TechInView Interview Prep Blog",
      publisher: organization,
    },
  };

  const breadcrumb = buildBreadcrumbListNode(
    `${pageUrl}#breadcrumb`,
    input.baseUrl,
    [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: input.title, path: `/blog/${input.slug}` },
    ]
  );

  const graph: Record<string, unknown>[] = [blogPosting, breadcrumb];

  if (input.faq && input.faq.length > 0) {
    graph.push(buildFaqPageNode(`${pageUrl}#faq`, input.faq));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildBlogIndexJsonLd(input: {
  baseUrl: string;
  posts: { slug: string; title: string; description: string; date: string }[];
}) {
  const blogUrl = absoluteUrl(input.baseUrl, "/blog");

  const itemListElement = input.posts.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.title,
    description: p.description,
    item: absoluteUrl(input.baseUrl, `/blog/${p.slug}`),
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        name: "TechInView Interview Prep Blog",
        description:
          "Practical guides on coding interview prep and DSA problem patterns.",
        url: blogUrl,
        inLanguage: "en-US",
        publisher: buildOrganizationNode(input.baseUrl),
        blogPost: input.posts.map((p) => ({
          "@id": absoluteUrl(input.baseUrl, `/blog/${p.slug}#article`),
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${blogUrl}#itemlist`,
        name: "All articles",
        numberOfItems: input.posts.length,
        itemListElement,
      },
      buildBreadcrumbListNode(`${blogUrl}#breadcrumb`, input.baseUrl, [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ],
  };
}

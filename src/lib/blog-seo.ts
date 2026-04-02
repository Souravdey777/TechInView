/** Shared SEO helpers for blog routes (JSON-LD, OG image path). */

export const DEFAULT_OG_IMAGE_PATH = "/og-image.png";

export function absoluteUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
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
}) {
  const pageUrl = absoluteUrl(input.baseUrl, `/blog/${input.slug}`);
  const imageUrl = absoluteUrl(input.baseUrl, DEFAULT_OG_IMAGE_PATH);

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
    author: {
      "@type": "Organization",
      name: "TechInView",
      url: input.baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TechInView",
      url: input.baseUrl,
      logo: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    },
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
      publisher: {
        "@type": "Organization",
        name: "TechInView",
        url: input.baseUrl,
      },
    },
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: input.baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl(input.baseUrl, "/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: input.title,
        item: pageUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [blogPosting, breadcrumb],
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
          "Long-form guides on coding interviews, DSA, communication, FAANG-style prep, and AI mock interviews.",
        url: blogUrl,
        inLanguage: "en-US",
        publisher: {
          "@type": "Organization",
          name: "TechInView",
          url: input.baseUrl,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl(input.baseUrl, DEFAULT_OG_IMAGE_PATH),
          },
        },
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
      {
        "@type": "BreadcrumbList",
        "@id": `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: input.baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: blogUrl,
          },
        ],
      },
    ],
  };
}

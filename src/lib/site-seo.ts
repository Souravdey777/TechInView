/** Site-level SEO constants and structured data for the marketing home page. */

import { CREDIT_PACKS, PACK_IDS } from "@/lib/constants";
import {
  SITE_NAME,
  absoluteUrl,
  buildFaqPageNode,
  buildOrganizationNode,
} from "@/lib/blog-seo";

/** Canonical origin. Mirrors the fallback used across the app. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev").replace(
    /\/$/,
    ""
  );
}

/** Default title, used on the home page and any route without its own title. */
export const SITE_DEFAULT_TITLE = "TechInView: AI Mock Interviews for Software Engineers";

/** Default meta description. Keep under ~160 characters. */
export const SITE_DEFAULT_DESCRIPTION =
  "Mock interviews with a voice AI interviewer. Talk through DSA problems in a live code editor, then get a scorecard and transcript of the round. Practice mode is free.";

/** Shorter variant for Open Graph and X cards. */
export const SITE_SOCIAL_DESCRIPTION =
  "Talk through DSA problems with a voice AI interviewer in a live code editor, then get a scorecard and transcript of the round.";

/** Matches `--brand-deep` (7 8 10) in globals.css. */
export const SITE_THEME_COLOR = "#07080a";

const APPLICATION_DESCRIPTION =
  "Voice AI mock interviews for software engineers. Coding rounds run in a live editor with Python and JavaScript test execution and are scored on problem solving, code quality, communication, technical knowledge, and testing. Technical Q&A, behavioral, and engineering manager rounds are also available.";

/**
 * Organization + WebSite + SoftwareApplication for the home page, plus the
 * FAQ pairs already rendered on it.
 *
 * Deliberately omits SearchAction (there is no site-wide search endpoint),
 * sameAs (no published social profiles), and aggregateRating/review (no real
 * review data) rather than asserting any of them.
 */
export function buildHomeJsonLd(input: {
  baseUrl: string;
  faq: readonly { question: string; answer: string }[];
}) {
  const organization = buildOrganizationNode(input.baseUrl);
  const homeUrl = absoluteUrl(input.baseUrl, "/");
  const websiteId = absoluteUrl(input.baseUrl, "/#website");
  const pricingUrl = absoluteUrl(input.baseUrl, "/#pricing");

  // Prices are shown per region in the UI; USD is the canonical listing.
  const offers = [
    {
      "@type": "Offer",
      name: "Free Practice Mode",
      description:
        "Solo DSA practice with code execution and saved progress.",
      price: 0,
      priceCurrency: "USD",
      url: absoluteUrl(input.baseUrl, "/practice"),
      availability: "https://schema.org/InStock",
    },
    ...PACK_IDS.map((packId) => {
      const pack = CREDIT_PACKS[packId];
      return {
        "@type": "Offer",
        name: pack.label,
        description: `${pack.credits} scored AI interview round${pack.credits === 1 ? "" : "s"} with voice, live coding, and feedback.`,
        price: pack.displayPrices.usd,
        priceCurrency: "USD",
        url: pricingUrl,
        availability: "https://schema.org/InStock",
      };
    }),
  ];

  const graph: Record<string, unknown>[] = [
    { ...organization, description: APPLICATION_DESCRIPTION },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: homeUrl,
      inLanguage: "en-US",
      publisher: { "@id": organization["@id"] },
    },
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl(input.baseUrl, "/#application"),
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Interview preparation",
      operatingSystem: "Web browser",
      url: homeUrl,
      description: APPLICATION_DESCRIPTION,
      inLanguage: "en-US",
      publisher: { "@id": organization["@id"] },
      isPartOf: { "@id": websiteId },
      featureList: [
        "Voice AI interviewer calibrated to a FAANG-level bar",
        "Live code editor with Python and JavaScript test execution",
        "Five-dimension scoring and hire recommendation for coding rounds",
        "Full transcript and per-dimension feedback",
        "Technical Q&A rounds on your own stack",
        "Behavioral and engineering manager rounds with a competency report",
      ],
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: 0,
        highPrice: Math.max(
          ...PACK_IDS.map((packId) => CREDIT_PACKS[packId].displayPrices.usd)
        ),
        offerCount: offers.length,
        offers,
      },
    },
  ];

  if (input.faq.length > 0) {
    graph.push(buildFaqPageNode(absoluteUrl(input.baseUrl, "/#faq"), input.faq));
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

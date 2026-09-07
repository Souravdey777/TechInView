/** Site-level structured data for the marketing home page. */

import { CREDIT_PACKS, PACK_IDS } from "@/lib/constants";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/blog-seo";

const APPLICATION_DESCRIPTION =
  "Voice-first AI mock interviews for software engineers: live coding rounds with a real-time AI interviewer, code execution against tests, and FAANG-calibrated scoring across five dimensions.";

/**
 * Organization + WebSite + SoftwareApplication for the home page, plus the
 * FAQ pairs already rendered on it.
 *
 * Deliberately omits SearchAction (there is no site-wide search endpoint) and
 * sameAs (no published social profiles) rather than asserting either.
 */
export function buildHomeJsonLd(input: {
  baseUrl: string;
  faq: readonly { question: string; answer: string }[];
}) {
  const organizationId = `${input.baseUrl}#organization`;
  const websiteId = `${input.baseUrl}#website`;
  const logoUrl = absoluteUrl(input.baseUrl, DEFAULT_OG_IMAGE_PATH);

  // Prices are shown per region in the UI; USD is the canonical listing.
  const offers = [
    {
      "@type": "Offer",
      name: "Free Practice Mode",
      description:
        "Unlimited solo DSA practice with code execution and saved progress.",
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
        url: absoluteUrl(input.baseUrl, "/signup"),
        availability: "https://schema.org/InStock",
      };
    }),
  ];

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "TechInView",
      url: input.baseUrl,
      description: APPLICATION_DESCRIPTION,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
        width: 1200,
        height: 630,
      },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "TechInView",
      url: input.baseUrl,
      inLanguage: "en-US",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${input.baseUrl}#application`,
      name: "TechInView",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Interview preparation",
      operatingSystem: "Web browser",
      url: input.baseUrl,
      description: APPLICATION_DESCRIPTION,
      inLanguage: "en-US",
      publisher: { "@id": organizationId },
      isPartOf: { "@id": websiteId },
      featureList: [
        "Voice AI interviewer with company-specific personas",
        "Live code editor with test execution",
        "Five-dimension scoring and hire recommendation",
        "Full transcript and per-dimension feedback",
        "Technical Q&A rounds on your own stack",
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
    graph.push({
      "@type": "FAQPage",
      "@id": `${input.baseUrl}#faq`,
      mainEntity: input.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

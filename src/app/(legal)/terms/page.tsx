import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "@/components/legal/LegalPageShell";
import { SUPPORT_EMAIL, createLegalMetadata, createSupportMailto } from "@/lib/legal";

export const metadata: Metadata = createLegalMetadata({
  path: "/terms",
  title: "Terms of Service",
  description:
    "Rules for using TechInView, including accounts, interview credits, acceptable use, AI output limits, and support or refund references.",
});

const sections: LegalSection[] = [
  {
    title: "Using TechInView",
    content: (
      <>
        <p>
          By accessing or using TechInView, you agree to these Terms of
          Service. If you do not agree, do not use the product.
        </p>
        <p>
          TechInView is designed to help software engineers practice
          interviews. The service may change over time, including product
          features, problem sets, interview formats, pricing, and availability.
        </p>
      </>
    ),
  },
  {
    title: "Accounts and access",
    content: (
      <>
        <p>
          You are responsible for maintaining the security of your account and
          for activity that occurs under it. Use accurate account information
          and keep your login credentials private.
        </p>
        <p>
          We may suspend or restrict access if we believe an account is being
          used in violation of these Terms, in a way that harms the service, or
          in connection with abuse, fraud, or illegal conduct.
        </p>
      </>
    ),
  },
  {
    title: "Interview packs, credits, and payments",
    content: (
      <>
        <p>
          TechInView sells one-time interview packs. Credits are used for paid
          AI interview sessions and are not a subscription. Practice mode may be
          offered separately with different limits or pricing.
        </p>
        <p>
          Credits have no cash value, are not redeemable for money, and may be
          changed, limited, or discontinued for future purchases. If a payment
          succeeds but credits do not appear correctly, contact{" "}
          <a href={createSupportMailto({ subject: "Missing TechInView credits" })}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p>
          Refund handling is described on the <a href="/refunds">Refunds
          page</a>, which is incorporated into these Terms.
        </p>
      </>
    ),
  },
  {
    title: "Acceptable use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the service for unlawful, abusive, or deceptive purposes;</li>
          <li>attempt to reverse engineer, scrape, or overload the platform;</li>
          <li>interfere with rate limits, payment flows, or security controls;</li>
          <li>
            upload content that infringes intellectual property or violates the
            rights of others;
          </li>
          <li>
            use automated methods to access the product in ways that bypass the
            intended experience or pricing model.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Your content and our license to operate",
    content: (
      <>
        <p>
          You retain ownership of the code, prompts, profile content, and other
          material you submit to TechInView. To operate the service, you grant
          TechInView a limited license to host, process, store, reproduce, and
          analyze that content as needed to provide interviews, generate
          feedback, troubleshoot issues, improve reliability, and maintain
          product security.
        </p>
        <p>
          That license is limited to operating and improving TechInView and does
          not transfer ownership of your content to us.
        </p>
      </>
    ),
  },
  {
    title: "AI-generated feedback and product limitations",
    content: (
      <>
        <p>
          TechInView uses AI systems to simulate interviews, score responses,
          and generate feedback. Those outputs are provided for practice and
          educational purposes only. They may be incomplete, approximate, or
          occasionally incorrect.
        </p>
        <p>
          TechInView does not guarantee job outcomes, hiring decisions, or the
          accuracy of every interview evaluation. You should use your own
          judgment when acting on AI-generated feedback.
        </p>
      </>
    ),
  },
  {
    title: "Termination, disclaimers, and liability limits",
    content: (
      <>
        <p>
          We may suspend or terminate access to the service at any time if
          needed to protect users, comply with law, or address misuse. You may
          stop using TechInView at any time.
        </p>
        <p>
          To the fullest extent permitted by law, TechInView is provided "as
          is" and "as available" without warranties of any kind. To the fullest
          extent permitted by law, TechInView will not be liable for indirect,
          incidental, special, consequential, or punitive damages arising from
          your use of the service.
        </p>
      </>
    ),
  },
  {
    title: "Changes and contact",
    content: (
      <>
        <p>
          We may update these Terms when the product, pricing, or risk profile
          changes. Continued use of TechInView after updated Terms are posted
          means you accept the revised Terms.
        </p>
        <p>
          For questions about these Terms, billing, or account access, contact{" "}
          <a href={createSupportMailto({ subject: "Question about TechInView terms" })}>
            {SUPPORT_EMAIL}
          </a>{" "}
          or visit <a href="/contact">/contact</a>.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      currentPath="/terms"
      title="Terms of Service"
      description="The ground rules for using TechInView, including accounts, credits, acceptable use, AI output limitations, and support."
      sections={sections}
    />
  );
}

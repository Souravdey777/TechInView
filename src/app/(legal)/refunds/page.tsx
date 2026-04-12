import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "@/components/legal/LegalPageShell";
import { SUPPORT_EMAIL, createLegalMetadata, createSupportMailto } from "@/lib/legal";

export const metadata: Metadata = createLegalMetadata({
  path: "/refunds",
  title: "Refund Policy",
  description:
    "How TechInView reviews duplicate charges, missing credits, unused interview packs, and exceptions caused by platform errors or legal requirements.",
});

const sections: LegalSection[] = [
  {
    title: "How refund review works",
    content: (
      <>
        <p>
          TechInView sells one-time interview packs rather than a recurring
          subscription. Refund requests are reviewed case by case based on the
          payment status, whether credits were delivered, and whether any of the
          purchased interview credits were already used.
        </p>
      </>
    ),
  },
  {
    title: "Duplicate charges or missing credits",
    content: (
      <>
        <p>
          If you believe you were charged twice, or a successful payment did not
          add the expected interview credits, email{" "}
          <a href={createSupportMailto({ subject: "Duplicate charge or missing credits" })}>
            {SUPPORT_EMAIL}
          </a>{" "}
          as soon as possible.
        </p>
        <p>
          Include the payment email, order ID, payment ID, pack purchased, and
          any screenshots that help us verify the issue. If TechInView confirms
          a duplicate charge or fulfillment error, we will correct the credits
          or issue a refund for the affected payment.
        </p>
      </>
    ),
  },
  {
    title: "Unused packs requested within 7 days",
    content: (
      <>
        <p>
          We may review refund requests for unused interview packs submitted
          within 7 days of purchase. "Unused" means none of the credits from the
          relevant purchase were consumed.
        </p>
        <p>
          Approval is not automatic. We may consider account history, payment
          risk, abuse signals, and whether the pack has already been partially
          consumed, transferred, or exhausted.
        </p>
      </>
    ),
  },
  {
    title: "Used credits and non-refundable cases",
    content: (
      <>
        <p>
          Except where required by law or caused by a verified TechInView
          platform error, interview credits that have already been used are not
          refundable.
        </p>
        <p>Refunds may also be declined when:</p>
        <ul>
          <li>the purchase was already substantially used or consumed;</li>
          <li>the request relates to dissatisfaction with interview outcomes alone;</li>
          <li>
            there is evidence of abuse, policy violations, or chargeback fraud.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How to request a refund",
    content: (
      <>
        <p>
          Send your request to{" "}
          <a href={createSupportMailto({ subject: "TechInView refund request" })}>
            {SUPPORT_EMAIL}
          </a>{" "}
          with your account email, payment details, the reason for the request,
          and any relevant screenshots.
        </p>
        <p>
          We may ask for additional information before making a decision. If a
          refund is approved, processing times will depend on the payment
          provider and your bank.
        </p>
      </>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPageShell
      currentPath="/refunds"
      title="Refund Policy"
      description="A practical refund policy for duplicate charges, missing credits, and unused interview packs purchased on TechInView."
      sections={sections}
    />
  );
}

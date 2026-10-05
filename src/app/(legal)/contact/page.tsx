import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "@/components/legal/LegalPageShell";
import { BODY, CELL, GRID, LINK_ARROW } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL, createLegalMetadata, createSupportMailto } from "@/lib/legal";

export const metadata: Metadata = createLegalMetadata({
  path: "/contact",
  title: "Contact Support",
  description:
    "Email TechInView support about billing, missing credits, account access, bugs, or privacy and legal requests, and see what details to include so we can help quickly.",
});

const shortcuts = [
  {
    title: "Billing and credits",
    description: "Orders, duplicate charges, missing credits, or refund questions.",
    href: createSupportMailto({ subject: "TechInView billing support" }),
  },
  {
    title: "Account access",
    description: "Login issues, auth problems, or account recovery requests.",
    href: createSupportMailto({ subject: "TechInView account access help" }),
  },
  {
    title: "Bug report",
    description: "Broken flows, code runner issues, voice problems, or UI errors.",
    href: createSupportMailto({ subject: "TechInView bug report" }),
  },
  {
    title: "Privacy or legal",
    description: "Data requests, policy questions, or legal notices.",
    href: createSupportMailto({ subject: "TechInView privacy or legal request" }),
  },
] as const;

const sections: LegalSection[] = [
  {
    title: "Fastest way to reach us",
    content: (
      <>
        <p>
          Email is the fastest way to reach us. Write to{" "}
          <a href={createSupportMailto({ subject: "TechInView support request" })}>
            {SUPPORT_EMAIL}
          </a>
          , or use one of the links below to start an email with the subject
          line already filled in.
        </p>
        <div className={cn("not-prose mt-8 sm:grid-cols-2", GRID)}>
          {shortcuts.map(({ title, description, href }) => (
            <a
              key={title}
              href={href}
              className={cn(CELL, "group flex flex-col p-6 transition-colors hover:bg-white/[0.02]")}
            >
              <span className="text-[17px] tracking-[-0.01em] text-brand-text">{title}</span>
              <span className={cn(BODY, "mt-2 flex-1")}>{description}</span>
              <span className={cn(LINK_ARROW, "mt-5 group-hover:text-brand-text")}>Email this request →</span>
            </a>
          ))}
        </div>
      </>
    ),
  },
  {
    title: "What to include in your email",
    content: (
      <>
        <p>
          Tell us the email address on your TechInView account, what went
          wrong, and any IDs or screenshots that show it. That usually saves a
          round of back and forth.
        </p>
        <ul>
          <li>For billing: payment ID, order ID, pack name, and charge date.</li>
          <li>For bugs: the page URL, your browser and device, and the steps that trigger the problem.</li>
          <li>For account access: the email address tied to the affected account.</li>
          <li>For privacy requests: the specific request and the relevant account email.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Response expectations",
    content: (
      <>
        <p>
          We work through requests in the order they arrive, with billing
          issues, access problems, and privacy or security concerns handled
          first.
        </p>
        <p>
          For refunds or missing credits, the <a href="/refunds">Refund
          Policy</a> explains what we can do. For questions about your data,
          see the <a href="/privacy">Privacy Policy</a>.
        </p>
      </>
    ),
  },
];

export default function ContactPage() {
  return (
    <LegalPageShell
      currentPath="/contact"
      title="Contact Support"
      description="Email us about billing, missing credits, account access, bugs, or privacy and legal requests. Here is what to include so we can sort it out quickly."
      summary="Email is the fastest way to reach us. Include the account email you used on TechInView plus any order, payment, or page details so we can reproduce the issue. Requests are reviewed in the order they arrive, with billing, access, and privacy or security concerns handled first."
      sections={sections}
    />
  );
}

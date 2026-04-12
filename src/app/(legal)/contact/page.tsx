import type { Metadata } from "next";
import { Bug, CreditCard, LockKeyhole, Mail, UserRoundX } from "lucide-react";
import { LegalPageShell, type LegalSection } from "@/components/legal/LegalPageShell";
import { SUPPORT_EMAIL, createLegalMetadata, createSupportMailto } from "@/lib/legal";

export const metadata: Metadata = createLegalMetadata({
  path: "/contact",
  title: "Contact Support",
  description:
    "Contact TechInView support by email for billing issues, missing credits, account access, bug reports, and privacy or legal requests.",
});

const shortcuts = [
  {
    title: "Billing and credits",
    description: "Orders, duplicate charges, missing credits, or refund questions.",
    href: createSupportMailto({ subject: "TechInView billing support" }),
    icon: CreditCard,
  },
  {
    title: "Account access",
    description: "Login issues, auth problems, or account recovery requests.",
    href: createSupportMailto({ subject: "TechInView account access help" }),
    icon: UserRoundX,
  },
  {
    title: "Bug report",
    description: "Broken flows, code runner issues, voice problems, or UI errors.",
    href: createSupportMailto({ subject: "TechInView bug report" }),
    icon: Bug,
  },
  {
    title: "Privacy or legal",
    description: "Data requests, policy questions, or legal notices.",
    href: createSupportMailto({ subject: "TechInView privacy or legal request" }),
    icon: LockKeyhole,
  },
] as const;

const sections: LegalSection[] = [
  {
    title: "Fastest way to reach us",
    content: (
      <>
        <p>
          The fastest support channel is email. Send your request to{" "}
          <a href={createSupportMailto({ subject: "TechInView support request" })}>
            {SUPPORT_EMAIL}
          </a>
          , and use one of the quick links below if you want a pre-filled
          subject line.
        </p>
        <div className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
          {shortcuts.map(({ title, description, href, icon: Icon }) => (
            <a
              key={title}
              href={href}
              className="rounded-xl border border-brand-border bg-brand-surface/70 p-4 transition-colors hover:border-brand-cyan/30 hover:bg-brand-card"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-cyan/10 p-2 text-brand-cyan">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-text">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                    {description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-cyan">
                    Email this request
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </div>
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
          To help us resolve your request faster, include the account email you
          used on TechInView, a short description of the issue, and any useful
          IDs or screenshots.
        </p>
        <ul>
          <li>For billing: payment ID, order ID, pack name, and charge date.</li>
          <li>For bugs: page URL, browser/device details, and repro steps.</li>
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
          We review support requests in the order they arrive and prioritize
          billing issues, access problems, and privacy or security concerns
          first.
        </p>
        <p>
          If your request is about refunds or missing credits, you can also read
          the <a href="/refunds">Refund Policy</a>. For privacy-related
          questions, see the <a href="/privacy">Privacy Policy</a>.
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
      description="Email TechInView for billing help, missing credits, account access, bug reports, and privacy or legal requests."
      sections={sections}
    />
  );
}

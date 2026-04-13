import "server-only";

import { absoluteUrl } from "@/lib/blog-seo";
import {
  BETA_CREDITS,
  CREDIT_PACKS,
  type CreditPackId,
} from "@/lib/constants";
import { SUPPORT_EMAIL } from "@/lib/legal";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";
const RESEND_API_URL = "https://api.resend.com/emails";
const SIGNATURE_IMAGE_PATH = "/images/sourav-signature-light.png";

type LifecycleEmail = {
  subject: string;
  html: string;
  text: string;
};

type Recipient = {
  email: string;
  name?: string | null;
};

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type PaidEmailInput = {
  userId: string;
  credits: number;
  pack: string;
  amount: number;
  currency: string;
};

function getSenderEmail() {
  return process.env.RESEND_FROM_EMAIL;
}

function getReplyToEmail() {
  return process.env.RESEND_REPLY_TO_EMAIL ?? SUPPORT_EMAIL;
}

function getFeedbackMailto() {
  const params = new URLSearchParams({
    subject: "TechInView feedback",
  });

  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}

function getFirstName(name: string | null | undefined, email: string) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  const fallback = email.split("@")[0]?.trim();
  return fallback || "there";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCredits(count: number) {
  return `${count} mock interview credit${count === 1 ? "" : "s"}`;
}

function isCreditPackId(value: string): value is CreditPackId {
  return value in CREDIT_PACKS;
}

function getPackLabel(pack: string) {
  return isCreditPackId(pack) ? CREDIT_PACKS[pack].label : pack;
}

function formatAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${normalizedCurrency}`;
  }
}

function buildEmailShell(input: {
  preview: string;
  eyebrow: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaHref: string;
}) {
  const signatureUrl = absoluteUrl(DEFAULT_SITE_URL, SIGNATURE_IMAGE_PATH);
  const feedbackUrl = getFeedbackMailto();
  const preview = escapeHtml(input.preview);
  const eyebrow = escapeHtml(input.eyebrow);
  const title = escapeHtml(input.title);
  const greeting = escapeHtml(input.greeting);
  const paragraphs = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.7;">${paragraph}</p>`
    )
    .join("");

  const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preview}
    </div>
    <div style="margin:0;background:#f8fafc;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="margin:0 auto;max-width:640px;overflow:hidden;border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;">
        <div style="height:6px;background:linear-gradient(90deg,#22d3ee 0%,#34d399 100%);"></div>
        <div style="padding:36px 32px 12px;">
          <p style="margin:0 0 12px;color:#0891b2;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
            ${eyebrow}
          </p>
          <h1 style="margin:0 0 18px;color:#020617;font-size:30px;line-height:1.2;">
            ${title}
          </h1>
          <p style="margin:0 0 16px;color:#0f172a;font-size:16px;line-height:1.7;">
            ${greeting}
          </p>
          ${paragraphs}
          <div style="margin:28px 0 24px;">
            <a
              href="${escapeHtml(input.ctaHref)}"
              style="display:inline-block;border-radius:999px;background:#0f172a;padding:14px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;"
            >
              ${escapeHtml(input.ctaLabel)}
            </a>
          </div>
          <p style="margin:0 0 12px;color:#334155;font-size:16px;line-height:1.7;">
            Warmly,
          </p>
          <img
            src="${escapeHtml(signatureUrl)}"
            alt="Sourav Dey signature"
            width="144"
            height="100"
            style="display:block;width:144px;height:auto;margin:0 0 8px;"
          />
          <p style="margin:0;color:#0f172a;font-size:15px;font-weight:700;">Sourav Dey</p>
          <p style="margin:4px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
            Founder, TechInView
          </p>
        </div>
        <div style="border-top:1px solid #e2e8f0;padding:20px 32px 28px;background:#f8fafc;">
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
            Reply to this email or send feedback anytime at
            <a href="${escapeHtml(feedbackUrl)}" style="color:#0891b2;text-decoration:none;">${escapeHtml(
              SUPPORT_EMAIL
            )}</a>.
          </p>
        </div>
      </div>
    </div>
  `.trim();

  const text = [
    input.preview,
    "",
    input.greeting,
    "",
    ...input.paragraphs.map((paragraph) => paragraph.replace(/<[^>]+>/g, "")),
    "",
    `${input.ctaLabel}: ${input.ctaHref}`,
    "",
    `Reply to this email or email ${SUPPORT_EMAIL} with feedback.`,
    "",
    "Warmly,",
    "Sourav Dey",
    "Founder, TechInView",
  ].join("\n");

  return { html, text };
}

function createWelcomeEmail(recipient: Recipient): LifecycleEmail {
  const firstName = getFirstName(recipient.name, recipient.email);
  const dashboardUrl = absoluteUrl(DEFAULT_SITE_URL, "/onboarding");

  const paragraphs = [
    "Thanks for joining TechInView. I’m excited to have you here.",
    "You can start with free practice right away, plus your 5-minute voice interview preview with Tia once your setup is done.",
    `I’d love your feedback as you explore the product. If anything feels unclear, rough, or especially useful, just reply to this email or reach me at <a href="${escapeHtml(
      getFeedbackMailto()
    )}" style="color:#0891b2;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.`,
  ];

  const { html, text } = buildEmailShell({
    preview: "Thanks for joining TechInView.",
    eyebrow: "Welcome",
    title: "Thanks for joining TechInView",
    greeting: `Hi ${firstName},`,
    paragraphs,
    ctaLabel: "Complete setup",
    ctaHref: dashboardUrl,
  });

  return {
    subject: "Thanks for joining TechInView",
    html,
    text,
  };
}

function createBetaWelcomeEmail(recipient: Recipient): LifecycleEmail {
  const firstName = getFirstName(recipient.name, recipient.email);
  const dashboardUrl = absoluteUrl(DEFAULT_SITE_URL, "/onboarding");
  const betaCredits = formatCredits(BETA_CREDITS);

  const paragraphs = [
    "Thanks a ton for supporting the TechInView beta.",
    `Your ${betaCredits} are now waiting on your account, so you can jump straight into full mock interviews once you finish setup.`,
    `Because this is still early, your feedback matters a lot. Reply to this email with anything you notice, want improved, or want added next, or email <a href="${escapeHtml(
      getFeedbackMailto()
    )}" style="color:#0891b2;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.`,
  ];

  const { html, text } = buildEmailShell({
    preview: `Thanks for supporting the beta. Your ${betaCredits} are ready.`,
    eyebrow: "Beta Access",
    title: "Thanks for supporting the beta",
    greeting: `Hi ${firstName},`,
    paragraphs,
    ctaLabel: "Use your beta credits",
    ctaHref: dashboardUrl,
  });

  return {
    subject: `Your ${BETA_CREDITS} beta interview credits are ready`,
    html,
    text,
  };
}

function createPaidSupportEmail(recipient: Recipient, input: {
  credits: number;
  pack: string;
  amount: number;
  currency: string;
}): LifecycleEmail {
  const firstName = getFirstName(recipient.name, recipient.email);
  const dashboardUrl = absoluteUrl(DEFAULT_SITE_URL, "/dashboard");
  const packLabel = getPackLabel(input.pack);
  const creditCopy = formatCredits(input.credits);
  const total = formatAmount(input.amount, input.currency);

  const paragraphs = [
    "Thanks for supporting TechInView. That kind of early trust means a lot.",
    `Your purchase of <strong>${escapeHtml(packLabel)}</strong> has been confirmed for <strong>${escapeHtml(
      total
    )}</strong>, and ${escapeHtml(creditCopy)} have been added to your account.`,
    `If anything feels off with the experience or if there’s a feature you want next, just reply to this email or reach me at <a href="${escapeHtml(
      getFeedbackMailto()
    )}" style="color:#0891b2;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.`,
  ];

  const { html, text } = buildEmailShell({
    preview: `Thanks for your support. ${creditCopy} have been added to your TechInView account.`,
    eyebrow: "Purchase Confirmed",
    title: "Thanks for supporting TechInView",
    greeting: `Hi ${firstName},`,
    paragraphs,
    ctaLabel: "Start your next mock interview",
    ctaHref: dashboardUrl,
  });

  return {
    subject: "Thanks for supporting TechInView",
    html,
    text,
  };
}

async function sendEmail(args: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getSenderEmail();

  if (!apiKey || !from) {
    console.warn("[email] Skipping lifecycle email because RESEND_API_KEY or RESEND_FROM_EMAIL is missing.");
    return false;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      reply_to: getReplyToEmail(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }

  return true;
}

async function getRecipientForUserId(userId: string): Promise<Recipient | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    console.error("[email] Failed to load auth user for lifecycle email:", error);
    return null;
  }

  const user = data.user;
  const email = user.email;
  if (!email) {
    return null;
  }

  return {
    email,
    name:
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      null,
  };
}

async function deliverLifecycleEmail(recipient: Recipient, email: LifecycleEmail) {
  try {
    await sendEmail({
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("[email] Failed to send lifecycle email:", error);
  }
}

export async function sendWelcomeEmail(recipient: Recipient) {
  if (!recipient.email) {
    return;
  }

  await deliverLifecycleEmail(recipient, createWelcomeEmail(recipient));
}

export async function sendBetaWelcomeEmail(recipient: Recipient) {
  if (!recipient.email) {
    return;
  }

  await deliverLifecycleEmail(recipient, createBetaWelcomeEmail(recipient));
}

export async function sendPaidSupportEmail(input: PaidEmailInput) {
  const recipient = await getRecipientForUserId(input.userId);
  if (!recipient) {
    return;
  }

  await deliverLifecycleEmail(
    recipient,
    createPaidSupportEmail(recipient, {
      credits: input.credits,
      pack: input.pack,
      amount: input.amount,
      currency: input.currency,
    })
  );
}

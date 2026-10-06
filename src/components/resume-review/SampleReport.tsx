import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CountUp, MarginNotes, PAGE_H, PAGE_W } from "./ReportViewer";

/*
 * A complete sample report for a fictional candidate. Structure follows the
 * resume-review skill (cover, marked-up resume, written review, Do This First);
 * styling is the light TechInView system: grey canvas, white resume sheet, ink
 * text, Geist / Geist Mono, cyan accent. Brand cyan fails contrast on light
 * grounds, so it marks and rules only; accent text uses ACCENT (#0E7490).
 */

const MUTED = "text-[#5B6068]";
const BODY = "text-[#3F434A]";
const ACCENT = "text-[#0E7490]";
const LABEL = "font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#5B6068]";
const RULE = "border-black/[0.12]";
const RULE_LT = "border-black/[0.07]";
const NOTE = cn("font-mono text-[11px] leading-[1.45]", ACCENT);
const CYAN = "#06B6D4";

export const SAMPLE_PAGE_COUNT = 6;

function Page({
  n,
  children,
  className,
  width = PAGE_W,
  height = PAGE_H,
}: {
  n: number;
  children: ReactNode;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{ width, height }}
      className={cn("relative flex flex-col overflow-hidden bg-[#F4F5F7] font-sans text-[12.3px] leading-[1.62] text-[#0A0B0D]", className ?? "px-[83px] pt-[76px]")}
    >
      <div className="flex-1">{children}</div>
      <div className={cn(LABEL, "flex justify-between pb-[26px] pt-3 text-[9px] tracking-[0.1em]")}>
        <span>techinview.dev</span>
        <span>
          Resume review · {n} / {SAMPLE_PAGE_COUNT}
        </span>
        <span>techinview.dev/resume-review</span>
      </div>
    </div>
  );
}

/* ── Cover ─────────────────────────────────────────────────────────────── */

const STATS = [
  { num: "6.5", label: "Overall score", sub: "out of 10, for Senior backend" },
  { num: "Software Engineer II", sm: true, label: "Current role", sub: "Acme Pay, since 2024" },
  { num: "4 yrs", label: "Experience", sub: "all of it in payments" },
  { num: "4", label: "Critical issues", sub: "about two hours of work" },
];

export function CoverPage() {
  return (
    <Page n={1}>
      <div className="flex h-full flex-col">
        <div className={cn(LABEL, "flex justify-between")}>
          <span>[ Resume review ]</span>
          <span>Tuesday, October 6 2026</span>
        </div>
        <h3 className="mt-11 text-[40px] font-normal leading-[1.08] tracking-[-0.04em]">
          Resume review:
          <br />
          Alex Rivera
        </h3>
        <div className="mt-6 h-[2px] w-12 bg-[#22D3EE]" />
        <p className={cn("mt-7 text-[12.6px] leading-[1.7]", BODY)}>
          <strong className="font-medium text-[#0A0B0D]">Good engineer, undersold.</strong> Four years in payments, and
          the two strongest things you have sit under a duty bullet and on page two: a monolith migration that cut p95
          latency from 900ms to 240ms, and an open-source ledger library with 1.2k GitHub stars. Above them are six
          bullets describing duties: responsible for, worked on, participated in. A recruiter skimming for thirty
          seconds meets the duties first and never reaches the evidence. Against the Senior Payments Platform job you
          sent, the domain fit is strong and the ownership evidence is thin. Almost everything here is cutting and
          reordering, plus a handful of numbers only you have.
        </p>
        <div className={cn("mt-9 grid grid-cols-2 border", RULE)}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn("px-5 py-6 text-center", i % 2 === 0 && "border-r", i > 1 && "border-t", RULE_LT)}
            >
              <div
                className={cn(
                  "leading-[1.1] tracking-[-0.03em]",
                  s.sm ? "pt-1.5 text-[18px] font-normal" : "text-[30px] font-light"
                )}
              >
                {s.label === "Overall score" ? <CountUp to={Number(s.num)} decimals={1} /> : s.num}
              </div>
              <div className={cn("mt-2 text-[11.5px]", BODY)}>{s.label}</div>
              <div className={cn("mt-0.5 text-[10.5px]", MUTED)}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div className={cn("mt-auto border-t pb-8 pt-4 text-[11.2px] leading-[1.6]", RULE, MUTED)}>
          <strong className={cn("font-medium", BODY)}>How to read this.</strong> The next two pages are your own resume
          with marks on the page and notes in the margin; that is where the line-by-line detail lives. The written review
          after it explains the four things that matter most, checks you against the job, answers your two questions and
          ends with what to do first.
        </div>
      </div>
    </Page>
  );
}

/* ── Marked-up resume ──────────────────────────────────────────────────── */

/*
 * Like the skill's markup.py: the resume sits at native US Letter size (816 x
 * 1056 at 96dpi) as a white sheet on the canvas, with a notes gutter to its
 * right. That is wider than A4, so these pages have their own, near-square size.
 */
export const MARKUP_W = 1157;
export const MARKUP_H = 1214;
const SHEET_W = 816;
const SHEET_H = 1056;
const SHEET_PAD = 21;

type MarkKind = "circle" | "underline" | "strike" | "box";

/** A pen mark on a phrase. `a` makes it an anchor a margin note can sit level with. */
function M({ k, a, children }: { k: MarkKind; a?: string; children: ReactNode }) {
  const overlay =
    k === "strike" ? (
      <span data-mark className="rr-wipe absolute inset-x-[-2px] top-[52%] h-[1.6px] bg-[#06B6D4]" />
    ) : k === "underline" ? (
      <span data-mark className="rr-wipe absolute inset-x-0 bottom-[-1px] h-[1.6px] bg-[#06B6D4]" />
    ) : k === "box" ? (
      <span data-mark className="rr-wipe absolute -inset-x-[5px] -inset-y-[3px] border-[1.4px] border-[#06B6D4]" />
    ) : (
      <svg data-mark aria-hidden viewBox="0 0 100 40" preserveAspectRatio="none" className="rr-wipe absolute -inset-x-[7px] -inset-y-[5px] h-[calc(100%+10px)] w-[calc(100%+14px)] overflow-visible">
        <path d="M6 22 C 4 6, 92 2, 96 18 C 99 34, 14 40, 4 26" fill="none" stroke={CYAN} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  return (
    <span data-anchor={a} className="relative inline-block">
      {children}
      {overlay}
    </span>
  );
}

/** An anchor for a note that has no mark of its own. */
function A({ a, children }: { a: string; children: ReactNode }) {
  return <span data-anchor={a}>{children}</span>;
}

/** A tick in the left margin of a bullet worth keeping. */
function Tick({ a }: { a?: string }) {
  return (
    <svg data-mark data-anchor={a} aria-hidden viewBox="0 0 12 12" className="rr-wipe absolute -left-[44px] top-[2px] h-[15px] w-[15px]">
      <path d="M1 6.5 L4.5 10 L11 1.5" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function H({ children }: { children: ReactNode }) {
  return <div className="mb-[5px] mt-[12px] border-b border-[#8a8a8a] pb-[2px] text-[15.5px] tracking-[0.01em]">{children}</div>;
}

function Role({ org, title, when }: { org: string; title: string; when: string }) {
  return (
    <div className="mt-[7px]">
      <div className="text-[14.6px]">
        {org} | {title}
      </div>
      <div className="text-[12.8px] text-[#666]">{when}</div>
    </div>
  );
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="mt-[3px] list-disc space-y-[3px] pl-[18px] marker:text-[#444]">{children}</ul>;
}

function Li({ children }: { children: ReactNode }) {
  return <li className="relative pl-[2px]">{children}</li>;
}

function Awards({ children }: { children: ReactNode }) {
  return <div className="mt-[5px] text-[12.3px] text-[#555]">{children}</div>;
}

const LINK = "text-[#1a56db] underline decoration-[#1a56db]/60";

const SHEET_1 = (
  <>
    <div className="text-center">
      <div className="text-[31px] tracking-[0.01em]">ALEX RIVERA</div>
      <div className="mt-[2px] text-[15px] tracking-[0.06em] text-[#444]">SOFTWARE ENGINEER II | BACKEND + PAYMENTS</div>
      <div className="mt-[5px] text-[12.8px] text-[#444]">
        Austin, TX (Hybrid) • <span className={LINK}>alex.rivera@example.com</span> • +1 512 555 0142
      </div>
      <div className="text-[12.8px]">
        <span className={LINK}>linkedin.com/in/alexrivera</span> • <span className={LINK}>github.com/alexrivera</span> •{" "}
        <span className={LINK}>alexrivera.dev</span>
      </div>
    </div>

    <H>PROFESSIONAL SUMMARY</H>
    <p>
      Software Engineer with{" "}
      <M k="circle" a="years">
        5+ years
      </M>{" "}
      of experience building scalable, high-performance web applications and distributed backend systems.{" "}
      <M k="underline" a="passion">
        Passionate about clean code
      </M>
      , system design and learning new technologies. Proven track record of delivering features end to end in
      fast-paced Agile teams and collaborating with cross-functional stakeholders.
    </p>

    <H>SKILLS</H>
    <div className="space-y-[2px]">
      <div>
        <M k="box" a="skills">
          Languages:
        </M>{" "}
        Java, Python, TypeScript, JavaScript, Go, SQL, HTML5, CSS3, Bash
      </div>
      <div>Backend: Spring Boot, Node.js, Express.js, Django, REST APIs, GraphQL, gRPC, Microservices</div>
      <div>
        Frontend: React.js, Next.js, Redux, Tailwind CSS,{" "}
        <M k="circle" a="jquery">
          jQuery
        </M>
        , Bootstrap
      </div>
      <div>Data &amp; Infra: PostgreSQL, MySQL, Redis, Kafka, RabbitMQ, AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes</div>
      <div>
        Tools &amp; Practices:{" "}
        <M k="circle" a="tools">
          Git
        </M>
        , GitHub Actions, Jenkins, Jira, Confluence, Postman,{" "}
        <M k="circle">VS Code</M>, Agile/Scrum, TDD
      </div>
    </div>

    <H>PROFESSIONAL EXPERIENCE</H>
    <Role org="Acme Pay" title="Software Engineer II" when="January 2024 – Present | Austin, TX" />
    <Ul>
      <Li>
        Checkout Service:{" "}
        <M k="circle" a="checkout">
          Responsible for
        </M>{" "}
        the checkout service used by customers across web and mobile, working closely with product and QA to deliver
        new payment features every sprint.
      </Li>
      <Li>
        <Tick a="migration" />
        Payments Re-platforming (0-to-1): Migrated payments from a Java monolith to event-driven microservices on Kafka,
        cutting p95 checkout latency from 900ms to 240ms and ending weekly release freezes.
      </Li>
      <Li>
        Fraud Rules Engine:{" "}
        <M k="strike" a="fraud">
          Worked on various features
        </M>{" "}
        for the fraud rules engine across the frontend and backend, including rule configuration screens and APIs.
      </Li>
      <Li>
        Idempotent Retries: Designed idempotency keys and retry logic for card authorizations, reducing duplicate
        charges by{" "}
        <M k="circle" a="decimal">
          93.7%
        </M>{" "}
        and related support tickets by 41%.
      </Li>
      <Li>
        <Tick a="mentor" />
        Mentored 3 new hires through onboarding and their first on-call rotation; ran the team&apos;s weekly code
        review sync.
      </Li>
      <Li>
        <M k="underline" a="agile">
          Participated in
        </M>{" "}
        sprint planning, retrospectives and code reviews as part of a cross-functional Agile team.
      </Li>
    </Ul>
    <Awards>Awards: Spot Award, Q3 2024 (Re-platforming) | Winner, Acme Pay Hack Week 2024</Awards>

    <Role org="Acme Pay" title="Software Engineer I" when="July 2022 – December 2023 | Austin, TX" />
    <Ul>
      <Li>
        Refunds Dashboard: Built an internal refunds dashboard in React and Spring Boot{" "}
        <M k="underline" a="refunds">
          used by the support team
        </M>{" "}
        to issue and track refunds.
      </Li>
      <Li>Payouts Module: Wrote unit and integration tests, raising code coverage of the payouts module from 48% to 85%.</Li>
      <Li>
        Legacy Services:{" "}
        <M k="circle" a="legacy">
          Fixed bugs and improved performance
        </M>{" "}
        of legacy billing services written in Java 8.
      </Li>
      <Li>On-call: Participated in a 1-in-6 on-call rotation for the payment authorization APIs.</Li>
    </Ul>

    <Role org="Brightwave Labs" title="Software Engineering Intern" when="May 2021 – August 2021 | Remote" />
    <Ul>
      <Li>
        <A a="intern">Built a Python ETL job that loaded merchant transactions into PostgreSQL for the analytics team.</A>
      </Li>
      <Li>Created REST endpoints in Flask for an internal reporting tool used by the finance team.</Li>
    </Ul>
  </>
);

const NOTES_1 = [
  { at: "years", text: "Started 2022: that's four.\nSay four." },
  { at: "passion", text: "Adjectives, no evidence.\nName the migration instead." },
  { at: "skills", text: "~45 skills. Keep the 12\nyou'd defend in an interview." },
  { at: "jquery", text: "Dated. Cut jQuery\nand Bootstrap." },
  { at: "checkout", text: "Duty, not result.\nHow many payments a day?" },
  { at: "migration", text: "Best line on the page.\nMake it bullet one." },
  { at: "fraud", text: "Says nothing. What did\nthe engine catch?" },
  { at: "decimal", text: "93.7% reads as invented.\nSay 94%." },
  { at: "mentor", text: "Senior signal. Add time\nto solo on-call." },
  { at: "legacy", text: "Which bugs? How much\nfaster? Or cut it." },
];

const SHEET_2 = (
  <>
    <H>
      <A a="projects">NOTABLE SIDE PROJECTS</A>
    </H>
    <Ul>
      <Li>
        <Tick a="ledger" />
        Ledgerline (Go, PostgreSQL | 2023): Open-source double-entry ledger library with idempotent posting and
        multi-currency support; 1.2k GitHub stars and 30+ contributors. <span className={LINK}>GitHub</span>
      </Li>
      <Li>
        <M k="strike" a="portfolio">
          Personal Portfolio Website
        </M>{" "}
        (React, Tailwind, Vercel | 2022): My personal site with a blog, dark mode and a contact form.{" "}
        <span className={LINK}>Website</span>
      </Li>
      <Li>
        <M k="strike" a="weather">
          Weather App
        </M>{" "}
        (JavaScript, OpenWeather API | 2021): Fetches and displays a 7-day forecast for any city.
      </Li>
    </Ul>

    <H>EDUCATION</H>
    <div>B.S. Computer Science | State University, Austin, TX | GPA 3.4 | 2022</div>
    <div className="mt-[2px]">
      <M k="strike" a="coursework">
        Relevant Coursework
      </M>
      : Data Structures, Algorithms, Operating Systems, Databases, Computer Networks, Software Engineering
    </div>

    <H>
      <M k="box" a="achievements">
        ACHIEVEMENTS &amp; CERTIFICATIONS
      </M>
    </H>
    <Ul>
      <Li>
        AWS Certified{" "}
        <M k="circle" a="cert">
          Cloud Practitioner
        </M>{" "}
        (2023)
      </Li>
      <Li>
        <M k="underline" a="dupe">
          Winner, Acme Pay Hack Week 2024
        </M>
      </Li>
      <Li>Dean&apos;s List, State University (2019, 2020)</Li>
      <Li>2nd Place, HackTX 2020 (fintech track)</Li>
    </Ul>

    <H>INTERESTS</H>
    <div>
      <M k="box" a="interests">
        Hiking, photography, chess, travel, cooking
      </M>
    </div>
  </>
);

const NOTES_2 = [
  { at: "projects", text: "Page two at four years.\nIt all fits on page one." },
  { at: "ledger", text: "1.2k stars in your domain.\nMove it under Experience." },
  { at: "portfolio", text: "Everyone has one. Cut." },
  { at: "weather", text: "Tutorial project. Cut." },
  { at: "coursework", text: "Drop coursework after\nyour first job." },
  { at: "achievements", text: "Four items, two from\ncollege. Keep one." },
  { at: "cert", text: "Entry-level. Keep only if\nthe job asks for it." },
  { at: "dupe", text: "Already in Awards on\npage one. Listed twice." },
  { at: "interests", text: "Space you need for\nevidence. Cut." },
];

const FOOTNOTE =
  "Overall: a good payments engineer, undersold. Four fixes: (1) give every Acme Pay bullet a result and round the decimals, (2) lead with the migration and move Ledgerline to page one, (3) cut to one page, (4) settle the years and halve the skills. Target: a real number in the top half of page one.";

/** The resume as a white sheet on the canvas, notes down the gutter level with what they mark. */
function MarkupPage({
  n,
  sheet,
  notes,
  footnote,
}: {
  n: number;
  sheet: ReactNode;
  notes: { at: string; text: string }[];
  footnote?: string;
}) {
  return (
    <Page n={n} width={MARKUP_W} height={MARKUP_H} className="px-[21px] pt-[21px]">
      <div className="relative" style={{ height: SHEET_H }}>
        <div
          data-sheet
          style={{ width: SHEET_W, height: SHEET_H }}
          className="absolute left-0 top-0 overflow-hidden border border-[#D2D4D9] bg-white px-[72px] py-[50px] font-[Arial,Helvetica,sans-serif] text-[13.4px] leading-[1.4] text-[#1a1a1a]"
        >
          {sheet}
        </div>
        <MarginNotes
          notes={notes}
          sheetWidth={SHEET_W}
          left={SHEET_W + SHEET_PAD}
          className={cn(NOTE, "whitespace-pre-line border-l-2 border-[#22D3EE] pl-3 text-[14px] leading-[1.45]")}
        />
      </div>
      {footnote && (
        <div className={cn("rr-note mt-6 border-t-2 border-[#22D3EE] px-1 pt-3", NOTE, "text-[14px] leading-[1.55]")}>{footnote}</div>
      )}
    </Page>
  );
}

/* ── Written review ────────────────────────────────────────────────────── */

function Section({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h4 className={cn("mb-5 flex items-baseline gap-3 border-b pb-2.5 text-[17px] font-normal tracking-[-0.02em]", RULE)}>
      <span className={cn("font-mono text-[12px]", ACCENT)}>{n}</span>
      {children}
    </h4>
  );
}

function Item({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-1.5 text-[12px] font-semibold">{title}</div>
      {lead && <p className={cn("mb-2 pl-4", BODY)}>{lead}</p>}
      {children}
    </div>
  );
}

function B({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-[#0A0B0D]">{children}</strong>;
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className={cn("space-y-1.5 pl-8", BODY)}>
      {items.map((t, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-4 text-[#22D3EE]">•</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Rewrite({ before, after, why }: { before: string; after: string; why: string }) {
  return (
    <div className="mb-4 ml-4 border-l-[1.5px] border-[#22D3EE] py-0.5 pl-4">
      <div className={cn(LABEL, "text-[8.5px]")}>Before</div>
      <p className={cn("mb-2.5 mt-0.5", MUTED)}>{before}</p>
      <div className={cn(LABEL, "text-[8.5px]")}>After</div>
      <p className="mb-2 mt-0.5">
        {after.split(/(\[[^\]]+\])/).map((part, j) =>
          part.startsWith("[") ? (
            <code key={j} className={cn("font-mono text-[11.5px]", ACCENT)}>
              {part}
            </code>
          ) : (
            part
          )
        )}
      </p>
      <p className={cn("text-[11px] italic", BODY)}>Why: {why}</p>
    </div>
  );
}

const FIT_ROWS = [
  ["Payments domain", "Strong. Checkout, refunds and a ledger library."],
  ["Owning services end to end", "Weak. “Responsible for” with no scale or outcome."],
  ["Reliability and idempotency", "Strong. Idempotency keys and retries, with numbers."],
  ["Mentoring", "Present. Add time to independent on-call."],
  ["Design docs", "Missing. Add one if you wrote the migration doc."],
];

function ReviewPage1() {
  return (
    <Page n={4}>
      <Section n="I.">The thirty-second read</Section>
      <Item
        title="1. Your best evidence is below the fold"
        lead={
          <>
            <B>The migration sits under a duty bullet, and Ledgerline is on page two.</B> A screener reading the top third learns
            your stack and that you were responsible for checkout. That is all they keep.
          </>
        }
      >
        <Bullets
          items={[
            "Make the migration bullet one of the Acme Pay role.",
            "Move Ledgerline directly under Experience, on page one.",
            "Target: one real number in the top half of the page.",
          ]}
        />
      </Item>
      <Item
        title="2. Six of ten bullets are duties"
        lead={
          <>
            <B>Responsible for, worked on, participated in.</B> These describe what anyone in your seat would do. They
            have no scope and no result, so they read as a job description rather than a record.
          </>
        }
      >
        <Bullets
          items={[
            "The migration bullet is your template: an owning verb, then a before and after.",
            "No exact number? An honest range beats no number at all.",
          ]}
        />
      </Item>
      <div className={cn("mb-7 border px-5 py-3.5 text-[12px]", RULE)}>
        <B>The pattern to apply everywhere:</B> verb, scope, mechanism, result.
      </div>

      <Section n="II.">Fit for Senior Payments Platform</Section>
      <Item
        title="3. Domain fit is strong, ownership is thin"
        lead={
          <>
            <B>You have the payments depth this job wants.</B> What it asks for most, owning services end to end, the
            resume leaves the reader to assume.
          </>
        }
      >
        <table className="ml-4 mt-3 w-[calc(100%-16px)] border-collapse text-[11.5px]">
          <thead>
            <tr className={cn("border-b text-left", RULE)}>
              <th className={cn(LABEL, "pb-2 font-normal")}>The job asks for</th>
              <th className={cn(LABEL, "pb-2 font-normal")}>Your resume</th>
            </tr>
          </thead>
          <tbody>
            {FIT_ROWS.map(([a, b]) => (
              <tr key={a} className={cn("border-b align-top", RULE_LT)}>
                <td className="w-[38%] py-2 pr-3">{a}</td>
                <td className={cn("py-2", BODY)}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Item>
    </Page>
  );
}

function ReviewPage2() {
  return (
    <Page n={5}>
      <Section n="III.">Bullets</Section>
      <Item title="4. The current role">
        <Rewrite
          before="Checkout Service: Responsible for the checkout service used by customers across web and mobile, working closely with product and QA to deliver new payment features every sprint."
          after="Checkout Service: Owned the checkout service handling [N] payments a day across web and mobile, raising payment success from [X]% to [Y]%."
          why="“Responsible for” describes a job. Scale and an outcome are what make a backend bullet read as Senior. The numbers are yours, not mine to invent."
        />
        <Rewrite
          before="Payments Re-platforming (0-to-1): Migrated payments from a Java monolith to event-driven microservices on Kafka, cutting p95 checkout latency from 900ms to 240ms and ending weekly release freezes."
          after="Payments Re-platforming (0-to-1): Led the move from a Java monolith to [N] Kafka-based services, cutting p95 checkout latency from 900ms to 240ms and ending weekly release freezes."
          why="Your strongest line, moved to position one. Say “Led” only if you did; “Drove” is honest if you shared it."
        />
      </Item>
      <Item title="5. People work and the side project">
        <Rewrite
          before="Mentored 3 new hires through onboarding and their first on-call rotation; ran the team’s weekly code review sync."
          after="Mentored 3 new hires to their first solo on-call rotation within [N] weeks."
          why="Time to independence is the number engineering managers track. It turns a nice line into evidence of leverage."
        />
        <Rewrite
          before="Ledgerline (Go, PostgreSQL | 2023): Open-source double-entry ledger library with idempotent posting and multi-currency support; 1.2k GitHub stars and 30+ contributors."
          after="Ledgerline: open-source double-entry ledger library in Go, with 1.2k GitHub stars and 30+ contributors, adopted by [N] teams in production."
          why="It proves payments depth outside your day job. It belongs on page one, under Experience."
        />
      </Item>
    </Page>
  );
}

const PRIORITIES = [
  ["Give every Acme Pay bullet a result.", "Use the rewrites in section III. Three need numbers from your dashboards."],
  ["Reorder.", "The migration becomes bullet one, and Ledgerline moves onto page one under Experience."],
  ["Cut to one page.", "Delete the portfolio site, the weather app, coursework and interests."],
  ["Fix the small trust leaks.", "Change 5+ years to four, round 93.7% to 94%, halve the skills, list the Hack Week win once, and keep the AWS cert only if the job asks."],
];

function ReviewPage3() {
  return (
    <Page n={6}>
      <Section n="IV.">Your questions</Section>
      <Item
        title="6. “Should my resume be one page?”"
        lead={
          <>
            <B>Yes, at four years.</B> Two pages tells a reader you didn&apos;t choose. Everything on your page two except
            Ledgerline and education can go, and both of those fit on page one once the duty bullets are rewritten.
          </>
        }
      />
      <Item
        title="7. “Is a GitHub project worth listing?”"
        lead={
          <>
            <B>This one is, and it is underplayed.</B> A ledger library with 1.2k stars is direct evidence for a payments
            role. Projects without traction, like the weather app, cost you space and credibility. Keep the one that has
            users.
          </>
        }
      />
      <h4 className={cn("mb-4 mt-8 border-b pb-2.5 text-[17px] font-normal tracking-[-0.02em]", RULE)}>Do this first</h4>
      <ol>
        {PRIORITIES.map(([lead, body], i) => (
          <li key={lead} className={cn("flex gap-4 border-b py-3 last:border-b-0", i === 0 && "border-t", RULE_LT)}>
            <span className={cn("w-8 flex-none pt-0.5 font-mono text-[10.5px] tracking-[0.08em]", ACCENT)}>P{i + 1}</span>
            <span className={BODY}>
              <span className="font-semibold text-[#0A0B0D]">{lead}</span> {body}
            </span>
          </li>
        ))}
      </ol>
      <div className={cn("mt-8 border-t pt-4 text-[11.2px] leading-[1.6]", RULE, MUTED)}>
        Three of these need numbers only you have. When you&apos;ve made the edits, upload the new version for a second
        pass at <span className="border-b border-[#22D3EE] text-[#0A0B0D]">techinview.dev/resume-review</span>, then
        practice the Senior payments interview at <span className="border-b border-[#22D3EE] text-[#0A0B0D]">techinview.dev</span>.
      </div>
    </Page>
  );
}

/** All six pages, in order, with each page's size for the viewer. */
export function sampleReportPages(): { node: ReactNode; width: number; height: number }[] {
  const a4 = { width: PAGE_W, height: PAGE_H };
  const wide = { width: MARKUP_W, height: MARKUP_H };
  return [
    { node: <CoverPage />, ...a4 },
    { node: <MarkupPage n={2} sheet={SHEET_1} notes={NOTES_1} />, ...wide },
    { node: <MarkupPage n={3} sheet={SHEET_2} notes={NOTES_2} footnote={FOOTNOTE} />, ...wide },
    { node: <ReviewPage1 />, ...a4 },
    { node: <ReviewPage2 />, ...a4 },
    { node: <ReviewPage3 />, ...a4 },
  ];
}

export { ReviewPage1 as SampleReviewPage, ReviewPage2 as SampleReviewPage2 };

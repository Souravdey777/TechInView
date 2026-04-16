<p align="center">
  <strong>TechInView</strong>
</p>

<p align="center">
  Voice-first AI interview prep for software engineers.
  <br />
  Practice DSA, simulate realistic mock interviews, and prepare for broader interview loops with persona-aware AI interviewers.
</p>

<p align="center">
  <a href="https://techinview.dev">Website</a> &middot;
  <a href="#what-is-techinview">Overview</a> &middot;
  <a href="#current-scope">Current Scope</a> &middot;
  <a href="#getting-started">Getting Started</a>
</p>

---

## What Is TechInView?

TechInView is a voice-first AI interview prep platform for software engineers.
It started as a DSA mock interview product and is now evolving into a broader
prep system that covers:

- free DSA practice
- voice-based DSA interviews
- company-style interviewer personas
- targeted loop generation from company + role + JD
- Technical Q&A rounds
- Engineering Manager / hiring-manager rounds

The goal is simple: help candidates practice the interview format they are
actually about to face, then turn that session into useful feedback and a clear
next step.

## Current Scope

| Area | Status | Notes |
| --- | --- | --- |
| DSA Practice Mode | Live | Solo problem solving with saved attempts and test runs |
| DSA AI Interview Mode | Live | Voice-based coding interview with live editor and scoring |
| Interviewer personas | Live | `tia`, `google`, `meta`, `amazon`, `apple`, `netflix` |
| Technical Q&A | Live | Stack-depth, no-code voice interview |
| Engineering Manager | Live | Leadership, prioritization, and role-fit interview |
| Targeted loop generation | Live | Company + role + JD -> likely interview loop |
| Prep Plans | Partial | Generator logic exists; full product surface is still being finished |
| Behavioral | Beta shell | Placeholder setup exists |
| System Design | Beta shell | Placeholder setup exists |
| Machine Coding | Planned shell | Placeholder setup exists |

## Highlights

**Voice-first interviews**
- Deepgram Voice Agent powers the real-time interview loop
- Mic input, streamed audio responses, interruption handling, and text fallback
- Company-style personas change tone, probing style, and scoring emphasis

**Multiple interview formats**
- DSA coding rounds with a live editor
- Technical Q&A for stack depth, debugging, and tradeoffs
- Engineering Manager rounds for leadership and execution judgment
- JD-driven targeted loops that shape likely round sequences

**Practice + simulation**
- Free DSA practice library
- AI Interview Mode for realistic pressure
- Problem history, progress tracking, and result reviews

**Actionable feedback**
- Scorecards and hire recommendation
- Transcript-backed review
- Persona-aware, round-aware evaluation

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | Custom components + Radix primitives |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| ORM | Drizzle ORM |
| AI | Anthropic |
| Voice | Deepgram Voice Agent |
| Code editor | Monaco Editor |
| Code execution | Piston API |
| Payments | Razorpay |
| Analytics | PostHog |
| Deployment | Vercel |

## Architecture

```text
Browser Mic / Speaker
        |
        v
Deepgram Voice Agent
        |
        +--> Anthropic prompts + scoring
        +--> client-side tool calls (current code, tests, interview state)
        |
        v
Interview runtime + Monaco editor + Piston + Supabase
```

For coding rounds, the AI interviewer can inspect current code, run tests, and
adapt its behavior based on interview phase and round type.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase project
- Anthropic API key
- Deepgram API key
- Razorpay credentials if you want to test checkout

### Setup

```bash
git clone https://github.com/Souravdey777/TechInView.git
cd TechInView
pnpm install
```

Create `.env.local` with the variables you need for local development:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

ANTHROPIC_API_KEY=...
DEEPGRAM_API_KEY=...

PISTON_API_URL=https://emkc.org/api/v2/piston

NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...

NEXT_PUBLIC_RAZORPAY_KEY_ID=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
RESEND_REPLY_TO_EMAIL=...
```

Then run the app:

```bash
pnpm db:generate
pnpm db:push
pnpm seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema changes |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm seed` | Seed the DSA problem bank |
| `pnpm seed:historical-questions` | Import historical question data |
| `pnpm verify:problems` | Validate seeded problem data |

## Notes

- Voice interviews now run through the browser-based Deepgram Voice Agent flow.
  The app mints a short-lived token from `/api/voice/deepgram-token`.
- Python and JavaScript execution are the most complete code-run paths today.
  Java and C++ are still being finished end to end.
- If `ANTHROPIC_API_KEY` is missing, local scoring routes can fall back to mock
  scores instead of crashing. That is useful for development, but not a
  production substitute.
- `voice-server/` is legacy leftover material, not the main runtime path.

## Roadmap Direction

- Finish Prep Plans as a first-class product surface
- Ship full System Design and Behavioral betas
- Start the Machine Coding MVP
- Keep expanding targeted-loop prep and role-aware interview coverage

## License

All rights reserved. &copy; 2026 TechInView.

---

<p align="center">
  Built by <a href="https://github.com/Souravdey777">Sourav Dey</a>
</p>

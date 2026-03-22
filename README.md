<p align="center">
  <strong>TechInView<span>.</span></strong>
</p>

<p align="center">
  Voice-powered AI mock interviews for software engineers.
  <br />
  Practice DSA with a real-time AI interviewer, live code editor, and FAANG-calibrated scoring.
</p>

<p align="center">
  <a href="https://techinview.ai">Website</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#getting-started">Getting Started</a>
</p>

---

## What is TechInView?

TechInView is an AI-powered mock interview platform that simulates realistic DSA coding interviews using voice. An AI interviewer named **Alex** speaks with you in real-time while you solve problems in a live code editor — just like a real phone screen.

After each interview, a 5-dimension scoring engine evaluates your performance and tells you whether you'd get a Hire or No-Hire, with detailed, actionable feedback.

## Features

**Voice-First Interview Experience**
- Real-time speech-to-text (Deepgram Nova-2) and text-to-speech (ElevenLabs) for natural conversation
- Sub-1.5s voice response latency with sentence-level streaming
- Interruption handling — start talking and the AI stops immediately

**Live Code Editor**
- Monaco Editor with syntax highlighting, autocompletion, and multi-language support
- Instant code execution via sandboxed Piston API
- Supports Python, JavaScript, Java, and C++

**FAANG-Calibrated Scoring**
- 5-dimension evaluation: Problem Solving, Code Quality, Communication, Technical Knowledge, Testing
- Hire / No-Hire recommendation with score breakdown
- Full conversation transcript and code diff against optimal solution

**Structured Interview Flow**
- 9-phase interview state machine (Intro → Problem → Clarification → Approach → Coding → Testing → Complexity → Follow-up → Wrap-up)
- AI adapts behavior per phase — pushes back on suboptimal approaches, stays quiet during coding, asks follow-ups when done

**Progress Tracking**
- Score trends over time
- Category heatmap showing strengths and weaknesses
- Interview history with full replay

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (Google + GitHub OAuth) |
| Database | Supabase PostgreSQL + Drizzle ORM |
| AI / LLM | Claude Sonnet 4 (Anthropic) |
| Speech-to-Text | Deepgram Nova-2 (streaming) |
| Text-to-Speech | ElevenLabs Turbo v2.5 (streaming) |
| Code Editor | Monaco Editor |
| Code Execution | Piston API (sandboxed) |
| Payments | Stripe |
| Voice Transport | WebSocket + Web Audio API |
| Deployment | Vercel (frontend) + Railway (WebSocket server) |

## Architecture

```
Browser Mic → WebSocket → Deepgram STT → Claude LLM → ElevenLabs TTS → WebSocket → Speaker
                                ↕
                    Monaco Editor + Piston Code Execution
```

The voice pipeline streams at every stage — Deepgram returns interim transcripts, Claude streams tokens, and ElevenLabs returns audio chunks at sentence boundaries. This keeps perceived latency under 1.5 seconds.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- API keys for: Supabase, Anthropic, Deepgram, ElevenLabs, Stripe

### Setup

```bash
# Clone the repo
git clone https://github.com/Souravdey777/TechInView.git
cd TechInView

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in your API keys in .env.local

# Set up the database
pnpm db:generate
pnpm db:push
pnpm seed

# Start the development server
pnpm dev
```

For the voice pipeline, start the WebSocket server in a separate terminal:

```bash
cd voice-server
pnpm install
pnpm dev
```

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm seed` | Seed DSA problem bank |
| `pnpm test:voice` | Test voice pipeline (CLI) |

## Scoring System

| Dimension | Weight | Evaluates |
|---|---|---|
| Problem Solving | 30% | Clarification, approach, edge cases |
| Code Quality | 25% | Readability, naming, idioms |
| Communication | 20% | Thinking aloud, structured explanations |
| Technical Knowledge | 15% | Complexity analysis, trade-offs |
| Testing | 10% | Proactive testing, bug fixing |

**Score → Recommendation:** 85-100 Strong Hire, 70-84 Hire, 55-69 Lean Hire, 40-54 Lean No Hire, 0-39 No Hire

## Roadmap

- [x] Voice-powered DSA interviews
- [x] Live code execution (Python, JS, Java, C++)
- [x] 5-dimension scoring with Hire/No-Hire
- [ ] Company-specific interviewer personas (Google, Meta, Amazon)
- [ ] Problem bank expansion (100+ problems)
- [ ] System Design interview mode
- [ ] Machine Coding (multi-file IDE)
- [ ] Peer matching for mock interviews

## License

All rights reserved. &copy; 2024 TechInView.

---

<p align="center">
  Built by <a href="https://github.com/Souravdey777">Sourav Dey</a>
</p>

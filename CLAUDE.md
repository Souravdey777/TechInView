# CLAUDE.md — TechInView.ai

> Voice-powered AI mock interview platform for software engineers.
> DSA rounds with real-time voice interaction, live code execution, and FAANG-calibrated scoring.

---

## Project Overview

**TechInView.ai** is a solo-built AI mock interview platform that conducts realistic DSA coding interviews using voice. An AI interviewer (named "Tia") speaks with candidates in real-time while they solve problems in a live code editor. Post-interview, a 5-dimension scoring engine evaluates performance and provides actionable feedback.

**Target users:** Software engineers preparing for FAANG/top-tier tech interviews.
**V1 scope:** DSA interviews only. Voice-based. Public launch + demand validation.
**Domain:** techinview.ai

---

## Tech Stack

| Layer              | Technology                          | Version    |
|--------------------|-------------------------------------|------------|
| Framework          | Next.js (App Router)                | 14.x       |
| Language           | TypeScript                          | 5.x        |
| Styling            | Tailwind CSS                        | 3.4.x      |
| UI Components      | shadcn/ui                           | latest     |
| Auth               | Supabase Auth (Google + GitHub OAuth) | latest   |
| Database           | Supabase PostgreSQL                 | latest     |
| ORM                | Drizzle ORM                         | latest     |
| STT (Speech→Text)  | Deepgram Nova-2 (streaming)         | latest     |
| LLM (AI Brain)     | Claude Sonnet 4 (Anthropic API)     | claude-sonnet-4-20250514 |
| TTS (Text→Speech)  | Deepgram Aura 2 (streaming)            | latest     |
| Code Editor        | Monaco Editor (@monaco-editor/react) | latest    |
| Code Execution     | Piston API (self-hosted or public)  | latest     |
| Payments           | Razorpay (Inline Checkout + Webhooks) | latest   |
| Analytics          | PostHog                             | latest     |
| Voice Transport    | WebSocket (native) + Web Audio API  | -          |
| Deployment         | Vercel (frontend + API) + Railway (WebSocket server) | - |
| Package Manager    | pnpm                                | 9.x        |

---

## Project Structure

```
techinview/
├── CLAUDE.md                          # This file — project bible
├── .env.local                         # Local env vars (NEVER commit)
├── .env.example                       # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── package.json
│
├── public/
│   ├── fonts/                         # Self-hosted fonts
│   ├── images/                        # Static assets
│   └── sounds/                        # UI sound effects (interview start, timer warning)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout: providers, fonts, metadata
│   │   ├── page.tsx                   # Landing page (marketing)
│   │   ├── globals.css                # Tailwind base + CSS variables
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         # Login page
│   │   │   ├── signup/page.tsx        # Signup page
│   │   │   └── callback/route.ts      # OAuth callback handler
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout (sidebar + auth guard)
│   │   │   ├── dashboard/page.tsx     # Home — recent interviews, quick stats
│   │   │   ├── problems/page.tsx      # Problem browser with filters
│   │   │   ├── progress/page.tsx      # Score trends, category heatmap
│   │   │   └── settings/page.tsx      # Profile, preferences, billing
│   │   │
│   │   ├── interview/
│   │   │   ├── setup/page.tsx         # Pre-interview config (difficulty, language, category)
│   │   │   └── [id]/page.tsx          # THE interview room (core experience)
│   │   │
│   │   ├── results/
│   │   │   └── [id]/page.tsx          # Post-interview feedback + scoring
│   │   │
│   │   └── api/
│   │       ├── interview/
│   │       │   ├── start/route.ts     # POST: Create interview session
│   │       │   ├── complete/route.ts  # POST: Mark interview complete, trigger scoring
│   │       │   └── run-code/route.ts  # POST: Execute code via Piston
│   │       │
│   │       ├── voice/
│   │       │   └── route.ts           # WebSocket upgrade for voice pipeline
│   │       │                          # NOTE: If Vercel WS limits hit, move to Railway
│   │       │
│   │       ├── scoring/
│   │       │   └── route.ts           # POST: Run AI scoring on completed interview
│   │       │
│   │       ├── payment/
│   │       │   ├── create-order/route.ts  # POST: Create Razorpay order
│   │       │   └── verify/route.ts        # POST: Verify Razorpay payment
│   │       │
│   │       └── webhooks/
│   │           └── razorpay/route.ts  # Razorpay webhook handler
│   │
│   ├── components/
│   │   ├── interview/
│   │   │   ├── InterviewRoom.tsx      # Main split-pane layout orchestrator
│   │   │   ├── VoicePanel.tsx         # AI avatar + live transcript + voice controls
│   │   │   ├── CodeEditor.tsx         # Monaco wrapper with language switching
│   │   │   ├── ProblemPanel.tsx       # Problem statement (collapsible sidebar)
│   │   │   ├── TestRunner.tsx         # Test case results (pass/fail badges)
│   │   │   ├── InterviewTimer.tsx     # Countdown timer with warning states
│   │   │   └── VoiceVisualizer.tsx    # Audio waveform / speaking indicator
│   │   │
│   │   ├── results/
│   │   │   ├── ScoreRadar.tsx         # 5-axis radar chart (recharts)
│   │   │   ├── ScoreCard.tsx          # Individual dimension score + feedback
│   │   │   ├── TranscriptReview.tsx   # Timestamped conversation log
│   │   │   ├── CodeDiff.tsx           # User code vs optimal (diff view)
│   │   │   └── HireRecommendation.tsx # Hire/No-Hire badge with reasoning
│   │   │
│   │   ├── dashboard/
│   │   │   ├── RecentInterviews.tsx   # Interview history list
│   │   │   ├── ProgressChart.tsx      # Score over time (line chart)
│   │   │   ├── CategoryHeatmap.tsx    # Strengths/weaknesses grid
│   │   │   └── QuickActions.tsx       # "Start Interview" CTA cards
│   │   │
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── DemoPreview.tsx        # Animated mock of the interview room
│   │   │   ├── Pricing.tsx
│   │   │   └── Testimonials.tsx
│   │   │
│   │   └── ui/                        # shadcn/ui components (auto-generated)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useVoiceInterview.ts       # Mic capture → WebSocket → audio playback
│   │   ├── useInterviewState.ts       # Interview phase state machine
│   │   ├── useCodeExecution.ts        # Piston API code runner
│   │   ├── useInterviewTimer.ts       # Countdown with pause/resume
│   │   ├── useAudioVisualizer.ts      # Waveform data from audio stream
│   │   └── useSupabase.ts            # Supabase client hook
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── interviewer.ts         # Claude system prompts + conversation manager
│   │   │   ├── scorer.ts             # Post-interview scoring prompts
│   │   │   ├── prompts.ts            # All prompt templates (centralized)
│   │   │   └── context-builder.ts    # Build dynamic context from interview state
│   │   │
│   │   ├── voice/
│   │   │   ├── deepgram.ts           # Deepgram streaming STT client
│   │   │   ├── deepgram-tts.ts       # Deepgram Aura 2 streaming TTS client
│   │   │   └── pipeline.ts           # Voice orchestrator: STT → LLM → TTS
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts             # Drizzle schema definitions
│   │   │   ├── queries.ts            # Typed query helpers
│   │   │   └── migrations/           # Drizzle migrations
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server-side Supabase client
│   │   │   └── middleware.ts          # Auth middleware for protected routes
│   │   │
│   │   ├── piston.ts                 # Code execution API client
│   │   ├── razorpay.ts               # Razorpay helpers
│   │   ├── utils.ts                  # General utilities
│   │   └── constants.ts              # App-wide constants
│   │
│   ├── types/
│   │   ├── interview.ts              # Interview, Message, Problem types
│   │   ├── scoring.ts                # Score dimensions, rubric types
│   │   ├── voice.ts                  # Voice pipeline types
│   │   └── database.ts               # DB row types (inferred from Drizzle)
│   │
│   └── data/
│       └── problems/                  # Seed data (JSON files)
│           ├── _seed.ts               # Seed script runner
│           ├── two-sum.json
│           ├── valid-parentheses.json
│           ├── merge-intervals.json
│           ├── lru-cache.json
│           └── ... (20 problems total)
│
├── voice-server/                      # Separate WebSocket server (Railway)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                   # WS server entrypoint
│   │   ├── voice-handler.ts           # Per-connection voice pipeline
│   │   ├── deepgram-stream.ts         # Deepgram streaming integration
│   │   ├── deepgram-tts-stream.ts     # Deepgram Aura 2 streaming TTS integration
│   │   └── claude-stream.ts           # Claude streaming integration
│   └── Dockerfile                     # For Railway deployment
│
└── scripts/
    ├── seed-problems.ts               # Seed problem bank to Supabase
    ├── generate-problem.ts            # AI-assisted problem generation
    └── test-voice-pipeline.ts         # CLI tool to test STT→LLM→TTS
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Deepgram (STT)
DEEPGRAM_API_KEY=...

# Deepgram (shared key for both STT and TTS)
# DEEPGRAM_API_KEY already set above — used for both Nova-2 STT and Aura TTS
DEEPGRAM_VOICE_MODEL=aura-2-asteria-en   # Pre-selected voice for "Tia"

# Piston (Code Execution)
PISTON_API_URL=https://emkc.org/api/v2/piston  # Public, or self-hosted URL

# Razorpay
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Voice Server (Railway)
NEXT_PUBLIC_VOICE_WS_URL=wss://techinview-voice.up.railway.app

# App
NEXT_PUBLIC_APP_URL=https://techinview.ai
```

---

## Database Schema (Drizzle ORM)

All tables live in Supabase PostgreSQL. Use Drizzle for type-safe queries.

### Core Tables

**profiles** — extends Supabase auth.users
- `id` (UUID, PK, references auth.users)
- `display_name`, `avatar_url`
- `target_company` (text) — "google", "meta", "amazon", etc.
- `experience_level` (enum) — "junior", "mid", "senior", "staff"
- `preferred_language` (text) — "python", "javascript", "java", "cpp"
- `interview_credits` (int, default 1) — remaining paid interview credits
- `has_used_free_trial` (boolean, default false)
- `razorpay_customer_id`
- `country_code` (text) — for PPP pricing (detected via IP)
- `interviews_completed` (int, default 0)
- `created_at`

**problems** — DSA problem bank
- `id` (UUID, PK)
- `title`, `slug` (unique)
- `difficulty` (enum) — "easy", "medium", "hard"
- `category` (text) — "arrays", "strings", "trees", "graphs", "dp", "linked-lists", "stacks-queues", "binary-search", "heap", "backtracking"
- `company_tags` (text array)
- `description` (markdown text)
- `examples` (JSONB) — `[{input, output, explanation}]`
- `constraints` (text array)
- `starter_code` (JSONB) — `{python: "...", javascript: "...", java: "...", cpp: "..."}`
- `test_cases` (JSONB) — `[{input, expected_output, is_hidden}]`
- `solution_approach` (text) — for AI interviewer context
- `hints` (text array) — progressive hints
- `optimal_complexity` (JSONB) — `{time: "O(n)", space: "O(n)"}`
- `follow_up_questions` (text array)

**interviews** — session records
- `id` (UUID, PK)
- `user_id` (FK → profiles)
- `problem_id` (FK → problems)
- `status` (enum) — "in_progress", "completed", "abandoned"
- `language` (text) — selected coding language
- `duration_seconds` (int)
- `max_duration_seconds` (int, default 2700 = 45 min)
- `final_code` (text)
- `code_passed_tests` (boolean)
- `tests_passed` (int), `tests_total` (int)
- `overall_score` (int, 0-100)
- `scores` (JSONB) — detailed dimension breakdown
- `feedback_summary` (text)
- `hire_recommendation` (enum) — "strong_hire", "hire", "lean_hire", "lean_no_hire", "no_hire"
- `started_at`, `completed_at`

**messages** — conversation log
- `id` (UUID, PK)
- `interview_id` (FK → interviews)
- `role` (enum) — "interviewer", "candidate", "system"
- `content` (text)
- `audio_url` (text, nullable) — stored audio clip URL
- `timestamp_ms` (int) — ms from interview start
- `metadata` (JSONB) — `{type: "hint" | "follow_up" | "code_review" | "intro" | "wrap_up"}`

**progress** — aggregated stats per user per category
- `id` (UUID, PK)
- `user_id` (FK → profiles)
- `category` (text)
- `problems_attempted`, `problems_solved` (int)
- `avg_score` (float)
- unique constraint on `(user_id, category)`

---

## AI Interviewer Architecture

### Interview State Machine

```
INTRO → PROBLEM_PRESENTED → CLARIFICATION → APPROACH_DISCUSSION → CODING → TESTING → COMPLEXITY_ANALYSIS → FOLLOW_UP → WRAP_UP
```

State transitions are managed by `useInterviewState.ts` hook. The AI interviewer receives the current phase as context and adjusts behavior accordingly:

- **INTRO** (0-1 min): AI introduces itself, asks about experience. Keep warm.
- **PROBLEM_PRESENTED** (1-2 min): AI reads problem aloud, shares on screen.
- **CLARIFICATION** (2-5 min): Candidate asks questions. AI answers truthfully based on problem constraints.
- **APPROACH_DISCUSSION** (5-12 min): AI evaluates proposed approach. Pushes back if suboptimal.
- **CODING** (12-32 min): AI is mostly silent. Short responses only. Watches code via periodic context updates.
- **TESTING** (32-37 min): AI asks candidate to trace through examples. Points out untested edge cases.
- **COMPLEXITY_ANALYSIS** (37-40 min): AI asks time/space complexity. Challenges incorrect analysis.
- **FOLLOW_UP** (40-43 min): If time permits, AI asks a harder variant.
- **WRAP_UP** (43-45 min): AI summarizes, thanks candidate, ends interview.

### Prompt Engineering Principles

1. **Keep AI responses SHORT during coding phase** — max 1-2 sentences.
2. **Pass current code as context every 3-4 turns** — not every message (saves tokens).
3. **Use the solution_approach field** so the AI knows the optimal path and can guide toward it.
4. **Separate the interviewer prompt from the scorer prompt** — different system prompts, different calls.
5. **Stream everything** — Claude streaming, Deepgram TTS streaming. Never wait for full responses.

### Context Window Management

Each Claude call includes:
- System prompt (~800 tokens, static)
- Problem description + solution approach (~500 tokens, static)
- Last 10 conversation turns (~2000 tokens, rolling window)
- Current code snapshot (~500 tokens, updated every 3 turns)
- Interview state metadata (~100 tokens)

**Total per call: ~4000 tokens input, ~150 tokens output**
**Estimated 15-20 Claude calls per 45-min interview**

---

## Voice Pipeline Architecture

### Flow (Cascaded STT → LLM → TTS)

```
[Browser Mic]
    │ MediaRecorder (audio/webm;codecs=opus, 16kHz)
    │ send binary frames every 100ms
    ▼
[WebSocket Server — Railway]
    │
    ├──→ [Deepgram Streaming STT]
    │        Nova-2 model, smart_format, utterance_end_ms=1500
    │        VAD (Voice Activity Detection) enabled
    │        Returns interim + final transcripts
    │
    │    On final transcript:
    ├──→ [Claude Streaming API]
    │        Conversation history + current code + interview state
    │        max_tokens=300 (keep short for voice)
    │        Stream response token by token
    │
    │    On sentence boundary detected:
    ├──→ [Deepgram Aura Streaming TTS]
    │        Aura 2 model (e.g. aura-2-asteria-en/aura-2-juno-en), pre-selected "Tia" voice
    │        Stream audio chunks back immediately
    │
    │    Audio chunks:
    ▼
[WebSocket → Browser]
    │ AudioContext → buffer queue → speaker playback
    │ Interrupt: if user starts speaking, flush queue + stop playback
    ▼
[Speaker Output]
```

### Latency Budget

| Stage                    | Target    | Max Acceptable |
|--------------------------|-----------|----------------|
| Mic → Deepgram STT       | 100ms     | 300ms          |
| Deepgram processing      | 200ms     | 500ms          |
| Claude first token       | 300ms     | 800ms          |
| Deepgram TTS first byte  | 200ms     | 500ms          |
| **Total perceived delay** | **~800ms** | **<2000ms**   |

### Critical Implementation Details

1. **Sentence-level TTS**: Don't wait for Claude's full response. Detect sentence boundaries and send each sentence to Deepgram Aura 2 immediately.
2. **Interruption handling**: When Deepgram VAD detects user speech, immediately stop TTS playback and flush the audio buffer.
3. **Silence detection**: If no speech for >90s during CODING phase, AI offers encouragement. If >120s in APPROACH phase, AI offers a hint.
4. **Echo cancellation**: Enable `echoCancellation: true` in `getUserMedia` constraints.
5. **Reconnection**: Auto-reconnect WebSocket on drop. Persist state to DB every 30 seconds.

---

## Code Execution (Piston API)

### Supported Languages (V1)

| Language   | Piston Runtime | Version |
|------------|----------------|---------|
| Python     | python         | 3.12.x  |
| JavaScript | javascript     | Node 20 |
| Java       | java           | 21.x    |
| C++        | cpp            | 17      |

### Execution Flow

1. User clicks "Run Code" or presses `Ctrl+Enter`
2. Frontend sends `{language, code, stdin}` to `/api/interview/run-code`
3. Backend calls Piston API with 10s timeout, 256MB memory limit
4. Return `{stdout, stderr, exit_code, execution_time}`
5. Compare stdout against test cases
6. Display pass/fail badges in TestRunner component

### Security

- Piston sandboxed containers — no filesystem, no network
- 10-second execution timeout
- 256MB memory limit
- Rate limit: max 10 executions per minute per user

---

## Scoring System

### 5 Dimensions (Weighted)

| Dimension            | Weight | What It Evaluates |
|----------------------|--------|-------------------|
| Problem Solving      | 30%    | Clarification, approach selection, edge case handling |
| Code Quality         | 25%    | Readability, naming, idioms, no unnecessary complexity |
| Communication        | 20%    | Thinking aloud, structured explanation, response to hints |
| Technical Knowledge  | 15%    | Complexity analysis, data structure trade-offs |
| Testing              | 10%    | Proactive testing, edge case identification, bug fixing |

### Hire Recommendation Mapping

| Score Range | Recommendation |
|-------------|----------------|
| 85-100      | Strong Hire    |
| 70-84       | Hire           |
| 55-69       | Lean Hire      |
| 40-54       | Lean No Hire   |
| 0-39        | No Hire        |

---

## Coding Conventions

### TypeScript
- Strict mode enabled (`"strict": true`)
- Use `type` over `interface` for object shapes
- No `any` — use `unknown` with type guards
- Barrel exports from feature directories

### React / Next.js
- Server Components by default. `"use client"` only when needed.
- Use `loading.tsx` and `error.tsx` for every route segment
- Prefer server actions for mutations where applicable
- Use `Suspense` boundaries for data fetching

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Variables/functions: `camelCase`
- Types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- DB columns: `snake_case`

### Styling
- Tailwind utility classes only — no custom CSS except `globals.css`
- Use `cn()` helper (from shadcn) for conditional classes
- Dark theme by default. No light theme in V1.

### Color Palette (Brand)

```css
--bg-deep: #07080a;
--bg-surface: #0d1017;
--bg-card: #111820;
--border: #1a2332;
--text-primary: #e2e8f0;
--text-secondary: #7a8ba3;
--accent-primary: #22d3ee;     /* Cyan — brand color */
--accent-secondary: #34d399;   /* Green — success */
--accent-warning: #fbbf24;     /* Amber */
--accent-danger: #f472b6;      /* Rose */
```

### Error Handling
- API routes: always return `{ success: boolean, data?: T, error?: string }`
- `try/catch` on every external API call
- Voice pipeline errors: fall back to text input gracefully
- Toast notifications for user-facing errors

### Commit Convention
```
feat: add voice pipeline with Deepgram STT
fix: handle WebSocket reconnection on network drop
ui: interview room split-pane layout
data: seed 20 DSA problems
perf: sentence-level TTS streaming
deploy: Railway voice server config
```

---

## Development Workflow

### Setup
```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:push
pnpm seed
pnpm dev                              # port 3000

# Separate terminal for voice:
cd voice-server && pnpm install && pnpm dev  # port 8080
```

### Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "seed": "tsx scripts/seed-problems.ts",
  "test:voice": "tsx scripts/test-voice-pipeline.ts"
}
```

### Branch Strategy
- `main` — production (auto-deploys to Vercel)
- `dev` — working branch
- Direct push to `dev`, merge to `main` for deploys

---

## API Routes

| Method | Path                       | Description                         |
|--------|----------------------------|-------------------------------------|
| POST   | `/api/interview/start`     | Create session, return problem data |
| POST   | `/api/interview/run-code`  | Execute code via Piston             |
| POST   | `/api/interview/complete`  | End interview, trigger scoring      |
| POST   | `/api/scoring`             | Run AI scoring (async)              |
| WS     | `wss://voice-server/voice` | Bidirectional audio streaming       |
| POST   | `/api/payment/create-order`| Create Razorpay order               |
| POST   | `/api/payment/verify`      | Verify Razorpay payment             |
| POST   | `/api/webhooks/razorpay`   | Razorpay payment webhooks           |

---

## Deployment

### Vercel (Frontend + API)
- GitHub auto-deploy on push to `main`
- Edge Runtime for voice route if needed
- ISR for landing page (revalidate: 3600)

### Railway (Voice WebSocket Server)
- Deploy `voice-server/` with Dockerfile
- Enable WebSocket support
- 1 instance handles ~50 concurrent interviews

### Supabase
- Free tier: 500MB DB, 1GB storage
- RLS enabled on all tables

---

## Performance Targets

| Metric                        | Target      |
|-------------------------------|-------------|
| Landing page LCP              | < 1.5s      |
| Interview room TTI            | < 3s        |
| Voice response latency        | < 1.5s      |
| Code execution round-trip     | < 3s        |
| Lighthouse score (landing)    | > 90        |

---

## V1 Launch Checklist

- [ ] 20 DSA problems seeded (5 easy, 10 medium, 5 hard)
- [ ] Voice pipeline working: Chrome + Safari
- [ ] Code execution: Python + JavaScript minimum
- [ ] Scoring generates valid results
- [ ] Razorpay checkout for credit packs (1 interview $8, 3-pack $18, 5-pack $24) with PPP pricing
- [ ] Landing page with demo video/GIF
- [ ] Error boundaries on every route
- [ ] PostHog tracking (interview_started, completed, code_run, payment)
- [ ] Mobile-responsive landing (interview room = desktop-only)
- [ ] OG images for social sharing
- [ ] 404 and error pages styled

---

## Post-V1 Roadmap

| Phase | Feature                              | Timeline  |
|-------|--------------------------------------|-----------|
| 2     | Company-specific interviewer personas | Week 3-5  |
| 2     | Problem bank expansion (100+)        | Week 3-5  |
| 2     | Spaced repetition queue              | Week 3-5  |
| 3     | System Design mode (Excalidraw)      | Week 6-8  |
| 4     | Machine Coding (multi-file IDE)      | Week 9-11 |
| 5     | Full interview loop simulation       | Week 12+  |
| 5     | Peer matching (viral loop)           | Week 12+  |
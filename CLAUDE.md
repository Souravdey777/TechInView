# CLAUDE.md - TechInView

_Last refreshed: 2026-04-16_

## Product Snapshot

TechInView is a voice-first AI interview prep platform for software engineers.
The repo started as a DSA-only mock interview app and now spans a broader
multi-round prep surface:

- DSA Practice Mode
- DSA AI Interview Mode
- company-specific interviewer personas
- targeted loop generation from company + role + JD
- Technical Q&A rounds
- Engineering Manager / hiring-manager rounds
- prep plans
- practice history, public profiles, and SEO/content surfaces

The core promise is still the same: simulate the interview format candidates
will actually face, then turn that session into useful feedback and repeatable
prep.

## Current Product State

| Area | Status | Notes |
| --- | --- | --- |
| Landing, pricing, SEO, blog | Live | Marketing site, blog, legal pages, and practice index are all in-repo. |
| DSA Practice Mode | Live | `/practice` + `/practice/[slug]`, persisted attempts, solo coding workflow. |
| DSA AI Interview Mode | Live | `/interview/setup` -> `/interview/[id]` -> `/results/[id]`. |
| Interviewer personas | Live | `tia`, `google`, `meta`, `amazon`, `apple`, `netflix`. |
| Technical Q&A | Live | Dedicated setup, runtime, and results routes exist. |
| Engineering Manager | Live | Dedicated setup, runtime, and results routes exist. |
| Targeted loop generation | Live | JD-driven loop generation API and storage are implemented. |
| Prep plans | Partial | Generator + local persistence exist, but UI still presents the feature as "coming soon". |
| Public profiles | Live | Username-based public profile routes and profile settings exist. |
| Behavioral rounds | Beta shell | Setup placeholder exists, full runtime not shipped. |
| System Design rounds | Beta shell | Setup placeholder exists, full runtime not shipped. |
| Machine coding rounds | Planned shell | Setup placeholder only. |

## Source-of-Truth Notes

- Prefer the codebase over older docs. `README.md` and `AGENTS.md` still
  reflect an earlier DSA-only shape in a few places.
- `voice-server/` is legacy leftover material, not the current primary runtime
  path. Voice now goes through Deepgram Voice Agent from the Next.js app.
- Dashboard and prep-plan labels are not fully aligned with what is actually
  implemented. Trust route/component behavior over marketing chips.

## Architecture Truths

### App and platform

- Framework: Next.js 14 App Router
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui-style primitives
- Auth + data: Supabase
- ORM/schema: Drizzle
- Analytics: PostHog
- Payments: Razorpay
- Email/lifecycle: Resend hooks exist

### AI and voice

- LLM/scoring: Anthropic via `@anthropic-ai/sdk`
- Voice transport: Deepgram Voice Agent
- Token minting: `src/app/api/voice/deepgram-token/route.ts`
- Core room wiring: `src/components/interview/InterviewRoom.tsx`
- Voice hook: `src/hooks/useDeepgramVoiceAgent.ts`
- Text fallback exists in the voice panel for cases where mic access is denied
  or unsupported.

### Code execution

- DSA code execution goes through Piston via `src/lib/piston.ts` and
  `src/lib/code-execution.ts`.
- Python and JavaScript execute end-to-end today.
- Java and C++ still present in selectors, but execution currently returns a
  "coming soon" message instead of real runs.

### Scoring

- Scoring entry point: `src/app/api/interview/score/route.ts`
- Real scoring requires `ANTHROPIC_API_KEY`.
- If the key is missing, the API intentionally falls back to mock scores so dev
  flows do not crash. That is useful locally, but should not be treated as
  production-complete behavior.

## Route Map

### Public routes

- `/` - landing page
- `/practice` and `/practice/[slug]` - DSA practice surfaces
- `/blog`, `/blog/[slug]`, `/blog/rss.xml`
- `/how-ai-evaluates`
- `/[username]` and `/u/[username]` - public profiles
- legal pages under `src/app/(legal)`

### Auth routes

- `/login`
- `/signup`
- `/onboarding`
- `/callback`

### Logged-in app routes

- `/dashboard`
- `/problems`
- `/progress`
- `/settings`
- `/prep-plans`

### Interview flows

- DSA alias: `/interviews/dsa/setup`
- DSA setup: `/interview/setup`
- DSA runtime: `/interview/[id]`
- DSA results: `/results/[id]`
- Technical Q&A:
  - `/interviews/technical-qa/setup`
  - `/interviews/technical-qa/[id]`
  - `/interviews/technical-qa/results/[id]`
- Engineering Manager:
  - `/interviews/engineering-manager/setup`
  - `/interviews/engineering-manager/[id]`
  - `/interviews/engineering-manager/results/[id]`
- Placeholder/beta setup shells:
  - `/interviews/behavioral/setup`
  - `/interviews/system-design/setup`
  - `/interviews/machine-coding/setup`

### Important API routes

- `/api/interview/start`
- `/api/interview/chat`
- `/api/interview/run-code`
- `/api/interview/score`
- `/api/interview/complete`
- `/api/interview/feedback`
- `/api/interview/submit`
- `/api/voice/deepgram-token`
- `/api/loops/generate`
- `/api/jd/parse`
- `/api/prep-plans/generate`
- `/api/practice/attempts`
- `/api/payment/create-order`
- `/api/payment/verify`
- `/api/webhooks/razorpay`

## Files That Matter Most

- `src/app/interview/setup/page.tsx`
  - The central DSA setup experience. Handles Practice vs AI interview, free
    trial logic, targeted loops, persona selection, and problem selection.
- `src/components/interview/InterviewRoom.tsx`
  - The main runtime for coding interviews. Wires Deepgram events, editor
    state, agent tools, transcript updates, and resume behavior.
- `src/hooks/useDeepgramVoiceAgent.ts`
  - Voice Agent transport, event handling, injected context, and function-call
    handling.
- `src/app/api/interview/start/route.ts`
  - Canonical place where interview mode, round type, persona, free-trial
    rules, and persistence come together.
- `src/lib/ai/interviewer-system-prompt.ts`
  - Round-aware prompt generation for voice interviews.
- `src/lib/ai/scorer.ts`
  - Interview scoring orchestration.
- `src/lib/loops/generator.ts`
  - Company + role + JD -> targeted loop generation.
- `src/lib/dashboard/prep-plan-generator.ts`
  - Current heuristic prep-plan builder.
- `src/hooks/usePrepPlans.ts`
  - Prep plans are currently localStorage-backed here.
- `src/lib/db/schema.ts` and `src/lib/db/queries.ts`
  - Primary data-model and query layer.

## Data Model Summary

The core tables are:

- `profiles`
  - Auth-adjacent user profile, plan, credits, onboarding fields, and public
    profile settings.
- `problems`
  - DSA catalog, starter code, hidden/public tests, hints, and metadata.
- `interviews`
  - Stores every interview session across DSA and targeted-loop round types.
- `messages`
  - Transcript log for interview sessions.
- `generated_loops`
  - Stored company/role/JD loop summaries.
- `generated_loop_rounds`
  - Child rounds for a generated loop.
- `historical_questions`
  - Clustered question bank for targeted-loop generation.
- `progress`
  - Aggregated DSA progress by category.
- `practice_attempts`
  - Solo practice persistence for code + test progress.
- `interview_feedback`
  - Post-round user feedback.
- `payments`
  - Razorpay capture and credit attribution records.

## Environment Variables

### Required for core local development

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` for privileged server work
- `ANTHROPIC_API_KEY`
- `DEEPGRAM_API_KEY`
- `PISTON_API_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### Optional / secondary

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`
- `DATABASE_URL` for direct DB scripts and migrations outside the normal app flow

## Product Guardrails

- Do not treat TechInView as DSA-only anymore. New work should fit the
  multi-round product shape.
- Do not assume all rounds share the same runtime. Coding rounds, Technical
  Q&A, and Engineering Manager have different context builders and expectations.
- Keep voice-first behavior as the default experience. Text input is a fallback,
  not the main path.
- If you touch round availability, update both route-level setup pages and any
  status/config surfaces like `src/lib/dashboard/models.ts`.
- If you touch prep plans, remember the current storage model is client-side.
  Do not accidentally document or code against a DB-backed prep-plan system
  unless you build it.
- If you add a new round type, expect to update constants, setup UI, prompts,
  results routing, storage schema, and dashboard modeling together.

## Known Gaps and Sharp Edges

- `src/components/prep-plans/PrepPlansIndex.tsx` and
  `src/components/prep-plans/PrepPlanBuilder.tsx` still present Prep Plans as
  "coming soon" even though the generator and local storage hooks exist.
- `src/lib/dashboard/models.ts` still marks several surfaces as
  `coming_soon` even though Technical Q&A and Engineering Manager routes are
  implemented.
- `src/app/api/interview/submit/route.ts` is still a stub.
- Java and C++ execution are not fully supported in practice mode / code run.
- Behavioral, System Design, and Machine Coding are not full end-to-end
  interview products yet.
- Production health still depends on env completeness:
  missing Anthropic key -> mock scoring,
  missing Deepgram key -> no voice token,
  missing Razorpay keys -> no checkout.

## Practical Advice For Future Work

- Start with `src/app/api/interview/start/route.ts` when debugging why a round
  launches with the wrong mode, persona, duration, or gating behavior.
- Start with `src/components/interview/InterviewRoom.tsx` when debugging runtime
  voice, code, or tool-call issues.
- Start with `src/lib/dashboard/models.ts` when dashboard cards and route
  availability do not match.
- Start with `src/hooks/usePrepPlans.ts` and
  `src/lib/dashboard/prep-plan-generator.ts` for any prep-plan work.
- Start with `src/lib/db/schema.ts` + migrations before adding any new persisted
  round metadata.

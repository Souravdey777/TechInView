# PRD - TechInView

_Last updated: 2026-04-16_

## 1. Summary

TechInView is building a voice-first AI interview prep platform for software
engineers. The product began as a DSA mock interview experience and is now
expanding into a fuller interview-prep system that mirrors real hiring loops:
coding, stack-depth interviews, leadership-style interviews, and eventually
behavioral, system-design, and machine-coding rounds.

The product should help candidates practice the exact format they are about to
face, not just solve detached coding problems in silence.

## 2. Problem

Most interview-prep tools still break the real interview into isolated pieces:

- coding platforms help candidates solve problems but do not pressure-test
  communication
- mock interviews are expensive, inconsistent, and hard to repeat
- candidates preparing for full loops need more than DSA: they also need stack
  depth, leadership judgment, and company-shaped calibration
- generic feedback rarely tells candidates what to fix next

Candidates do not just fail because they cannot solve problems. They fail
because they cannot explain tradeoffs clearly, recover under pressure, answer
follow-up questions, or adapt to the style of the round.

## 3. Product Vision

TechInView should become the interview-prep operating system for software
engineers:

- free solo practice for repetition
- realistic voice interviews for pressure
- multi-round prep mapped to company + role + JD
- persona-calibrated interviewer behavior
- scorecards that tell the user what to improve next

## 4. Target Users

### Primary

- software engineers preparing for FAANG or top-tier product-company interviews
- candidates who already use LeetCode-style tools but want a more realistic
  simulation

### Secondary

- mid-level and senior engineers preparing for role-specific loops
- candidates preparing for targeted interviews at a known company and role
- engineers who want a reusable prep plan across multiple interview formats

## 5. Jobs To Be Done

When I am preparing for a software engineering interview, I want to:

- practice DSA questions in a normal coding environment
- switch that same problem into a realistic mock interview when I want pressure
- rehearse company-style interviewer behavior and follow-up questions
- prepare for non-coding rounds like Technical Q&A and Engineering Manager
- convert a job description into a focused prep plan instead of guessing what
  to study
- review a scorecard that tells me where I am weak and what to work on next

## 6. Product Goals

### Business goals

- convert free users into paid interview-pack buyers
- grow organic acquisition through practice pages, blog SEO, and shareable
  public profiles
- build repeat usage across many sessions rather than one-time novelty

### User goals

- reduce the gap between silent practice and real interview performance
- give clear, actionable feedback after every round
- let users rehearse the rounds that actually matter for their level and role

## 7. Non-Goals For The Current Phase

- monthly subscription as the primary pricing model
- mobile-first interview runtime
- human interviewer marketplace
- peer matching as a core part of the MVP
- full recruiting CRM / ATS functionality

## 8. Current Scope Matrix

| Experience | Status | Purpose |
| --- | --- | --- |
| DSA Practice Mode | Live | Free solo problem-solving with saved attempts and test runs |
| DSA AI Interview Mode | Live | Voice-based coding interview with live editor and scoring |
| Persona-based interviews | Live | Generalist + company-style interviewer flavors |
| Technical Q&A | Live | Stack-depth, no-code voice interview |
| Engineering Manager | Live | Leadership, role-fit, and prioritization interview |
| Targeted loop generation | Live | Company + role + JD -> likely interview loop |
| Prep Plans | Partial | Generator logic exists; full product surface not launched |
| Behavioral | Beta shell | Placeholder setup exists |
| System Design | Beta shell | Placeholder setup exists |
| Machine Coding | Planned shell | Placeholder setup exists |

## 9. Core Product Requirements

### 9.1 Accounts, onboarding, and pricing

- Support Supabase auth with Google and GitHub login
- Collect onboarding basics:
  - display name
  - target company
  - experience level
  - preferred language
- Every user should be able to access free DSA practice on a curated subset
- Every account should get one short audio preview round
- Paid interview access should be sold through one-time interview packs, not a
  subscription
- Pricing should support region-aware display for USD, INR, and PPP buckets

### 9.2 DSA Practice Mode

- Users can browse a catalog of interview problems
- Users can filter/search by difficulty, category, and company tags
- Users can open a problem in a solo coding environment
- Users can run tests and see pass/fail feedback
- Users can save progress and resume later
- Practice mode should feel like a normal coding platform, not an interview

### 9.3 DSA AI Interview Mode

- Users can take a full 45-minute coding interview or a shorter preview round
- Interview should be voice-first, with text input as fallback
- AI interviewer should adapt across interview phases:
  - intro
  - problem presentation
  - clarification
  - approach discussion
  - coding
  - testing
  - complexity
  - wrap-up
- AI should be able to inspect current code and test results during the round
- Results page must show:
  - overall score
  - hire recommendation
  - five-dimension breakdown
  - feedback summary
  - transcript review

### 9.4 Interviewer personas

- Users can choose between a generalist persona and company-style personas
- Personas must affect interviewer tone, probing style, and scoring emphasis
- Free preview rounds may restrict persona access
- Persona selection should stay consistent from setup through results

### 9.5 Technical Q&A

- Users can choose a primary language and frameworks
- Round should focus on stack depth, debugging, runtime behavior, and tradeoffs
- No coding should be required
- Round should use the same voice-first interaction model and result structure
- Results should emphasize technical depth, communication, execution, and judgment

### 9.6 Engineering Manager / hiring-manager rounds

- Users can optionally specify company and role title
- Users can choose focus areas such as leadership, prioritization, stakeholder
  management, and execution
- Round should probe resume-grounded examples and decision quality
- No coding should be required
- Results should feel like leadership-signal feedback, not DSA feedback

### 9.7 Targeted loop generation

- Users can provide:
  - company
  - role title
  - experience level
  - JD text
- System should infer likely interview loop composition
- System should recommend the most relevant round types instead of assuming
  everyone needs the same prep sequence
- Historical question clusters should support loop quality where available
- Generated loops should be persistable and re-openable

### 9.8 Prep Plans

- Prep Plans should turn company + role + JD input into a multi-round prep path
- A plan should show:
  - likely round types
  - rationale
  - suggested question counts / workload
  - next recommended action
  - progress by round type
- Users should be able to launch directly from the plan into the right setup page
- Plans should be durable across devices and sessions

### 9.9 Future round types

Behavioral:

- structured story workspace
- persona-aware follow-up questions
- coaching around clarity, ownership, and outcomes

System Design:

- system prompt and workspace tailored for architecture rounds
- scaling, tradeoff, and prioritization feedback
- eventual diagram-friendly workflow

Machine Coding:

- scoped FE / BE / FS build-round setup
- stack-aware prompts
- multi-file workspace in a later phase

### 9.10 Growth and trust surfaces

- Blog should attract organic search traffic
- Public profiles should provide shareable proof of progress
- Practice pages should act as top-of-funnel acquisition
- "How AI evaluates" content should build trust in the scoring model

## 10. User Experience Principles

- Voice-first by default for interview modes
- Fast to start: users should reach a meaningful session quickly
- Honest feedback over empty encouragement
- Clear mode separation:
  - Practice Mode should feel calm and utilitarian
  - Interview Mode should feel structured and high-pressure
- Desktop-first interview runtime; mobile can browse and read, but full voice +
  code flows are optimized for desktop

## 11. Technical / Quality Requirements

- Perceived voice response latency should stay comfortably under 2 seconds
- Interview setup should survive reloads and reconnects
- Missing environment configuration should fail gracefully with actionable errors
- Payments and credit attribution must be idempotent and auditable
- Analytics should track activation, conversion, interview starts/completions,
  and payment events
- Results pages must not break when scoring falls back locally

## 12. Success Metrics

### Activation

- % of signed-up users who start a practice session
- % of signed-up users who start an AI interview
- time from signup to first completed round

### Engagement

- weekly active users
- rounds completed per active user
- repeat interview usage after first scorecard
- prep-plan revisit rate

### Monetization

- free -> paid conversion rate
- pack purchase conversion from preview round
- credits consumed per purchaser

### Quality

- session completion rate
- scoring/report view rate
- user feedback rating on completed rounds
- qualitative realism feedback

## 13. Risks and Dependencies

- Voice quality depends on Deepgram reliability and token-minting health
- Scoring quality depends on Anthropic prompt calibration and cost discipline
- Placeholder or stale UI labels can confuse users when product status changes
- Java/C++ execution gap can undermine trust if surfaced as supported too early
- Prep Plans will feel incomplete until persistence and launch paths are real
- Multi-round expansion increases the risk of docs and UI drifting from actual
  capability if statuses are not maintained centrally

## 14. Recommended Near-Term Sequence

1. Launch Prep Plans properly
2. Align status labels across the app
3. Close persistence, scoring, and execution gaps in the live interview flows
4. Productize targeted loops as the bridge between discovery and practice
5. Ship System Design and Behavioral as the next true beta products
6. Begin Machine Coding MVP after the loop/prep-plan architecture is solid

## 15. Product Thesis

TechInView wins if it becomes more than a talking LeetCode clone. The durable
product is a role-aware interview-prep system where candidates can move from
free repetition to realistic simulation to targeted multi-round plans - all in
one place.

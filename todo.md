# TechInView TODO

_Last refreshed: 2026-04-16_

This list is intentionally current-state focused. Older completed milestones
were removed so the file stays useful as an execution roadmap instead of a
launch diary.

## Now

- [ ] Ship Prep Plans as a real product surface
  - Replace the "coming soon" placeholders in `PrepPlansIndex` and `PrepPlanBuilder`
  - Wire `/prep-plans/new` into actual loop generation
  - Persist plans somewhere durable instead of localStorage-only
  - Let users launch directly from a plan into the matching interview setup page
  - Track round progress back into the plan

- [ ] Align availability and messaging across the app
  - Mark Technical Q&A and Engineering Manager as live everywhere they already work
  - Audit landing, dashboard, nav, and CTA copy for stale "coming soon" labels
  - Clearly distinguish beta shells from fully shipped interview products

- [ ] Finish the remaining persistence gaps in interview completion
  - Implement the real DB write in `/api/interview/submit`
  - Verify final code, timestamps, and round metadata always persist correctly
  - Make resume/reload behavior consistent across DSA, Technical Q&A, and Engineering Manager

- [ ] Close execution and scoring gaps before broader promotion
  - Either ship Java/C++ execution or hide/lock those run-code paths
  - Make sure production cannot silently rely on mock scoring
  - QA score output and result-page parity across all live round types

- [ ] Harden production reliability for voice interviews
  - Stress-test reconnect/resume behavior for reloads and flaky networks
  - Add better observability around Deepgram token minting, agent failures, and scoring failures
  - Polish the mic-denied / text-fallback experience

## Next

- [ ] Launch targeted-loop prep end to end
  - Expose generated loops more clearly in the dashboard
  - Add review workflow for staged historical questions
  - Turn company + role + JD input into a visible multi-round prep plan, not just a hidden intermediate

- [ ] Ship System Design beta
  - Real setup
  - Real workspace
  - Real scoring/results flow

- [ ] Ship Behavioral beta
  - Story workspace
  - Persona-aware prompting
  - Results and coaching loop

- [ ] Start Machine Coding MVP
  - Decide FE / BE / FS entry points
  - Define stack selection and scoped prompts
  - Reuse as much of the targeted-loop architecture as possible

- [ ] Improve monetization and growth loops
  - Referral program
  - Lifecycle email flows through Resend
  - Public-profile polish and shareability
  - Continue blog/SEO expansion around interview prep search terms

## Later

- [ ] Personalized prep-plan recommendations based on recent interview performance
- [ ] Better persona calibration by company and level band
- [ ] System-design diagramming support
- [ ] Machine-coding multi-file workspace
- [ ] More robust analytics around activation -> paid conversion -> repeat usage

## Already Shipped

- [x] DSA Practice Mode and DSA AI Interview Mode
- [x] Deepgram Voice Agent integration with tool-calling and text fallback
- [x] Company-specific interviewer personas
- [x] Technical Q&A setup, runtime, and results flow
- [x] Engineering Manager setup, runtime, and results flow
- [x] Practice library, onboarding, payments, analytics, blog, and public profiles

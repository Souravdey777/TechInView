# TechInView — Development TODO (Execution Order)

## Phase 1: Complete the Core Interview Loop
_Goal: One full interview from start to scored results_

- [x] 1. Seed 15 problems into Supabase DB — wire `scripts/seed-problems.ts` to real DB insert
- [x] 2. Wire `/api/interview/start` to select random problem from DB based on difficulty/category
- [x] 3. Load test cases dynamically from the selected problem (not hardcoded Two Sum)
- [x] 4. Timer actually counts down during interview
- [x] 5. Phase transitions — Alex advances through INTRO → PROBLEM → CODING → etc. based on time/conversation
- [x] 6. Wire real AI scoring on "End Interview" — call `scoreInterview()` from `src/lib/ai/scorer.ts`
- [x] 7. Results page reads from Zustand store + displays real AI-generated scores, radar chart, feedback
- [x] 8. Save completed interview + scores to DB (interviews table)

## Phase 2: Data-Driven Pages
_Goal: Dashboard, problems, progress all pull real data_

- [x] 9. Problems page loads from DB with working filters (difficulty, category, search)
- [x] 10. Setup page "Choose specific" option lists real problems from DB
- [x] 11. Dashboard shows real interview history from DB
- [x] 12. Dashboard stats (total interviews, avg score, problems solved) from DB queries
- [x] 13. Progress page shows real score trends and category breakdown
- [x] 14. Settings page saves profile updates to DB (target company, preferred language, experience level)

## Phase 3: Polish & UX
_Goal: Feel like a real product_

- [x] 15. Loading skeletons on all data-fetching pages
- [x] 16. Error boundaries on every route segment
- [x] 17. Toast notifications for user-facing errors
- [x] 18. Mobile responsive landing page (interview room stays desktop-only)
- [x] 19. Landing page demo preview (dynamic OG image)
- [x] 20. OG images for social sharing

## Phase 4: Deploy MVP
_Goal: Live on the internet, shareable link_

- [x] 21. Push to GitHub
- [x] 22. Deploy frontend to Vercel
- [x] 23. Set up production env vars on Vercel
- [x] 24. Update Supabase auth redirect URLs to production domain
- [ ] 25. Configure custom domain (techinview.ai)
- [ ] 26. Smoke test full flow on production

## Phase 5: Monetization
_Goal: Accept payments_

- [x] 27. Razorpay checkout for credit packs:
  - Free trial: 1 interview, $0 (hook & convert)
  - Single interview: $8 (₹349 India, $4 Brazil/SEA)
  - 3-pack (Popular): $18 (₹799 India, $9 Brazil/SEA) — 25% off per interview
  - 5-pack (Best Value): $24 (₹1099 India, $18 Brazil/SEA) — 40% off per interview
- [x] 28. PPP pricing — detect country via Vercel `x-vercel-ip-country` header, show localized prices
- [x] 29. Wire Razorpay webhook to credit user's interview balance in DB
- [x] 30. Implement freemium tier restrictions:
  - No advanced report (basic score only, no detailed feedback breakdown)
  - No advanced persona (default "Alex" only, no FAANG-specific voices)
  - 20-min interview cap (instead of 45 min)
  - Only 2 easy problems available (randomly picks one at runtime)
  - Enforce in `/api/interview/start` + interview room UI

## Phase 6: Analytics & Growth
_Goal: Understand usage, iterate_

- [x] 31. PostHog integration (interview_started, completed, code_run, payment events)
- [x] 32. Track conversion funnel: landing → signup → first interview → payment

## Phase 7: Onboarding

- [ ] 33. User onboarding flow — first-time setup wizard (name, target company, experience level, preferred language)

## Phase 8: Beta Launch (March 30)

- [ ] 34. FAANG-specific AI interviewer voices — unique voice persona per company (Google, Meta, Amazon, Apple, Netflix) similar to "Alex", each with distinct personality and interview style
- [ ] 35. Post-interview review prompt — collect user feedback after every interview (rating, what went well, what didn't)
- [ ] 36. Problem bank expansion (50+ problems)
- [ ] 37. Sales and Marketing Plan

## Phase 9: Voice Upgrade
_Goal: Replace browser APIs with production-quality voice_

- [ ] 38. Integrate Deepgram Nova-2 for server-side STT (replace browser SpeechRecognition)
- [ ] 39. Integrate Deepgram Aura 2 for TTS (replace browser SpeechSynthesis)
- [ ] 40. Deploy voice-server to Railway
- [ ] 41. Wire WebSocket voice pipeline: Browser → Railway → Deepgram STT/Claude/Deepgram TTS → Browser
- [ ] 42. Interruption handling — stop Alex when user starts speaking

## Pre-V1 Launch
_Ship before going live_

- [ ] 43. Referral program for influencers — custom referral links, tracking, commission/credit payouts

## Post-V1 Roadmap
_After launch & initial traction_

- [ ] Other Company-specific interviewer personas
- [ ] Problem bank expansion (100+ problems)
- [ ] Spaced repetition queue
- [ ] System Design mode (Excalidraw)
- [ ] Machine Coding (multi-file IDE)
- [ ] Peer matching (viral loop)
- [ ] LeaderBoard & Challenges

# TechInView — Development TODO (Execution Order)

## Phase 1: Complete the Core Interview Loop
_Goal: One full interview from start to scored results_

- [x] 1. Seed 15 problems into Supabase DB — wire `scripts/seed-problems.ts` to real DB insert
- [x] 2. Wire `/api/interview/start` to select random problem from DB based on difficulty/category
- [x] 3. Load test cases dynamically from the selected problem (not hardcoded Two Sum)
- [x] 4. Timer actually counts down during interview
- [x] 5. Phase transitions — Tia advances through INTRO → PROBLEM → CODING → etc. based on time/conversation
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
- [x] 25. Configure custom domain (techinview.dev)
- [x] 26. Smoke test full flow on production

## Phase 5: Monetization
_Goal: Accept payments_

- [x] 27. Razorpay checkout for interview packs:
  - Free trial: 1 x 5-minute voice trial, $0 (hook & convert)
  - Single interview: $19 (₹799 India, $9 regional)
  - 3-pack (Popular): $49 (₹1,999 India, $22 regional)
  - 6-pack (Best Value): $89 (₹3,699 India, $40 regional)
- [x] 28. PPP pricing — detect country via Vercel `x-vercel-ip-country` header, show localized prices
- [x] 29. Wire Razorpay webhook to credit user's interview balance in DB
- [x] 30. Implement freemium tier restrictions:
  - No advanced report (basic score only, no detailed feedback breakdown)
  - No advanced persona (default "Tia" only, no FAANG-specific voices)
  - 20-min interview cap (instead of 45 min)
  - Only 2 easy problems available (randomly picks one at runtime)
  - Enforce in `/api/interview/start` + interview room UI

## Phase 6: Analytics & Growth
_Goal: Understand usage, iterate_

- [x] 31. PostHog integration (interview_started, completed, code_run, payment events)
- [x] 32. Track conversion funnel: landing → signup → first interview → payment

## Phase 7: Onboarding

- [x] 33. User onboarding flow — first-time setup wizard (name, target company, experience level, preferred language)

## Phase 8: Pre-Beta Launch

- [x] 34. Problems & Progress pages should be locked for non-paid users
- [x] 35. Problem bank expansion (70+ problems)
- [x] 36. Post-interview review prompt — collect user feedback after every interview (rating, what went well, what didn't)

## Phase 8: Beta Launch (March 30)

- [ ] 37. Sales and Marketing Plan
- [ ] 38. FAANG-specific AI interviewer voices — unique voice persona per company (Google, Meta, Amazon, Apple, Netflix) similar to "Tia", each with distinct personality and interview style

## Phase 9: Voice Upgrade (Deepgram Voice Agent API)
_Goal: Replace browser APIs with production Deepgram Voice Agent — single WebSocket, built-in STT + LLM + TTS (Tia), function calling for code context_

### 9A. Voice Agent Core Setup
- [ ] 39. Set up Deepgram Voice Agent WebSocket connection (`wss://agent.deepgram.com/agent`)
- [ ] 40. Configure agent Settings message:
  - `agent.listen` → Deepgram Nova-2 / Flux STT
  - `agent.think` → LLM provider (OpenAI or Anthropic) with interviewer system prompt
  - `agent.speak` → Deepgram Aura 2 (Tia voice)
- [ ] 41. Stream browser mic audio → Voice Agent WebSocket (replace browser SpeechRecognition)
- [ ] 42. Receive and play agent audio response → browser AudioContext (replace browser SpeechSynthesis)
- [ ] 43. Handle `ConversationText` events to update live transcript UI for both user and AI messages

### 9B. Function Calling — Code Context
- [ ] 44. Define `get_current_code` function in agent.think.functions config — returns Monaco editor content
- [ ] 45. Handle `FunctionCallRequest` (client_side: true) → read `editor.getValue()` → send `FunctionCallResponse` back
- [ ] 46. Define `run_tests` function — executes code via Piston API, returns pass/fail results to agent
- [ ] 47. Define `get_interview_state` function — returns time remaining, hints given, current phase, tests passed
- [ ] 48. Test: user says "check my code" → agent calls `get_current_code` → responds with code-specific feedback

### 9C. Background Context Injection
- [ ] 49. On every "Run Code" click → inject code + test results via `InjectAgentMessage`
- [ ] 50. Every 60s during coding phase → inject latest code snapshot via `InjectAgentMessage`
- [ ] 51. On phase transition → update interviewer prompt via `UpdatePrompt` message
- [ ] 52. Pass interview phase context (intro → approach → coding → testing → wrapup) through prompt updates

### 9D. Voice UX Polish
- [ ] 53. Barge-in handling — Voice Agent has built-in interruption detection (verify it works with Tia)
- [ ] 54. Wire `AgentStartedSpeaking` / `AgentAudioDone` events → update VoiceVisualizer states (listening/thinking/speaking)
- [ ] 55. Handle `UserStartedSpeaking` event → pause any UI audio, show listening state
- [ ] 56. Implement WebSocket reconnection on drop — resume with conversation context via `agent.context.messages`
- [ ] 57. Add fallback: if mic permission denied → show text input, pipe text through `InjectAgentMessage` instead

### 9E. Remove Old Infra
- [x] 40. ~~Integrate Deepgram Aura 2 for TTS~~ (now handled by Voice Agent)
- [ ] 58. Remove browser SpeechRecognition code
- [ ] 59. Remove browser SpeechSynthesis code
- [ ] 60. Remove Railway voice-server (no longer needed — Voice Agent handles everything)
- [ ] 61. Clean up unused hooks: old `useVoiceInterview` browser API version

## Pre-V1 Launch
_Ship before going live_

- [ ] 62. Referral program for influencers — custom referral links, tracking, commission/credit payouts

## Post-V1 Roadmap
_After launch & initial traction_

- [ ] Other Company-specific interviewer personas
- [ ] Problem bank expansion (100+ problems)
- [ ] Spaced repetition queue
- [ ] System Design mode (Excalidraw)
- [ ] Machine Coding (multi-file IDE)
- [ ] Peer matching (viral loop)
- [ ] LeaderBoard & Challenges

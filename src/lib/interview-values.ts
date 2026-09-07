/**
 * Shared value / competency frameworks for behaviour-led rounds.
 *
 * Behavioural and Engineering Manager rounds are graded against a *value lens*
 * the candidate picks at setup: a generic competency set, or a real company
 * value system (Amazon Leadership Principles, Googleyness & Leadership, Meta
 * values, Netflix culture, startup-operator). Both rounds consume this catalog
 * so a competency means the same thing in the setup UI, the interviewer prompt,
 * and the post-round report.
 *
 * Round-specific focus areas (e.g. "prioritization" for EM) live in
 * `src/lib/behavioral.ts` and `src/lib/engineering-manager.ts`. This module is
 * only about *which value system the interviewer grades against*.
 */

export const VALUE_FRAMEWORK_IDS = [
  "generic",
  "amazon_lp",
  "google_gl",
  "meta_values",
  "netflix_culture",
  "startup_operator",
] as const;

export type ValueFrameworkId = (typeof VALUE_FRAMEWORK_IDS)[number];

export type ValueCompetency = {
  id: string;
  label: string;
  /** Shown on the setup card. One line, candidate-facing. */
  description: string;
  /** Follow-up probes a real interviewer uses to test this competency. */
  probes: string[];
  /** What a strong answer contains. Used by the scorer rubric. */
  strongSignals: string[];
  /** What drops the rating. Used by the scorer rubric. */
  redFlags: string[];
};

export type ValueFramework = {
  id: ValueFrameworkId;
  label: string;
  shortLabel: string;
  /** Where the value system comes from, shown as provenance in the UI. */
  origin: string;
  description: string;
  /** How this round is actually run at that company / in that style. */
  interviewStyle: string;
  defaultCompetencyIds: string[];
  competencies: ValueCompetency[];
};

const GENERIC: ValueFramework = {
  id: "generic",
  label: "Universal Competency Set",
  shortLabel: "Universal",
  origin: "Cross-company behavioural rubric",
  description:
    "The competencies almost every structured behavioural loop grades, regardless of company. Start here if you do not have a specific company in mind.",
  interviewStyle:
    "Four to six competency questions in 45 minutes, each answered in STAR form and pushed on with two or three follow-ups until the candidate's personal contribution and measurable result are clear.",
  defaultCompetencyIds: ["ownership", "collaboration", "conflict"],
  competencies: [
    {
      id: "ownership",
      label: "Ownership",
      description: "Taking end-to-end responsibility for outcomes, including the parts nobody assigned you.",
      probes: [
        "What part of that was your decision versus someone else's?",
        "What happened after you shipped it, and who watched it?",
        "What would have gone wrong if you had not stepped in?",
      ],
      strongSignals: [
        "Names their own decisions and mistakes without deflecting to the team",
        "Followed the outcome past the launch into operation and metrics",
      ],
      redFlags: [
        "Answers entirely in 'we' with no personal contribution",
        "Stops the story at delivery with no result or aftermath",
      ],
    },
    {
      id: "collaboration",
      label: "Collaboration",
      description: "Working across engineers, product, design, and partner teams to move something real.",
      probes: [
        "Who did you have to bring along, and how did you do it?",
        "What did the other side actually want, in their words?",
        "What did you give up to get agreement?",
      ],
      strongSignals: [
        "Represents the other party's position fairly, not as an obstacle",
        "Describes a concrete mechanism used to align people",
      ],
      redFlags: [
        "Frames partners as blockers with no attempt to understand them",
        "Collaboration described only as attending meetings",
      ],
    },
    {
      id: "conflict",
      label: "Conflict & Disagreement",
      description: "Disagreeing productively, escalating well, and committing once a decision is made.",
      probes: [
        "Who disagreed with you, and what was their strongest argument?",
        "What evidence changed the conversation?",
        "What did you do once the decision went against you?",
      ],
      strongSignals: [
        "Can state the counter-argument convincingly",
        "Separates the disagreement from the person and commits after the call",
      ],
      redFlags: [
        "Every conflict story ends with the candidate being proven right",
        "Avoidance framed as diplomacy",
      ],
    },
    {
      id: "ambiguity",
      label: "Ambiguity",
      description: "Making progress when the goal, the data, or the requirements are not settled.",
      probes: [
        "What did you not know when you started?",
        "How did you decide where to start with that little information?",
        "What did you deliberately leave undecided, and why?",
      ],
      strongSignals: [
        "Chose a first cut deliberately and named what would invalidate it",
        "Reduced uncertainty with a cheap experiment or a narrower scope",
      ],
      redFlags: [
        "Waited for someone else to remove the ambiguity",
        "Describes a well-specified project as ambiguous",
      ],
    },
    {
      id: "growth_feedback",
      label: "Growth & Feedback",
      description: "Receiving hard feedback, changing behaviour, and learning from real failure.",
      probes: [
        "What was the hardest piece of feedback you have received?",
        "What did you change concretely, and how did you know it worked?",
        "What did that failure cost, and what did you do about it?",
      ],
      strongSignals: [
        "Describes a specific behaviour change with an observable effect",
        "Owns a real failure with real consequences",
      ],
      redFlags: [
        "Humble-brag failures ('I cared too much about quality')",
        "Feedback acknowledged but nothing changed",
      ],
    },
    {
      id: "communication",
      label: "Communication",
      description: "Explaining decisions, risks, and bad news clearly to the audience in front of you.",
      probes: [
        "How did you explain that to a non-engineering audience?",
        "How did you deliver the bad news, and to whom?",
        "What did you leave out on purpose?",
      ],
      strongSignals: [
        "Adjusts depth to the audience rather than repeating detail",
        "Raised a risk or a slip early, in writing, with options",
      ],
      redFlags: [
        "Bad news surfaced only after it became unavoidable",
        "Cannot explain the work without jargon",
      ],
    },
    {
      id: "impact_delivery",
      label: "Impact & Delivery",
      description: "Shipping things that moved a number, and knowing which number moved.",
      probes: [
        "What was the metric before and after?",
        "How much of that movement was your work?",
        "What did you cut to hit the date?",
      ],
      strongSignals: [
        "Quantifies the result and is honest about attribution",
        "Names the tradeoff that made delivery possible",
      ],
      redFlags: [
        "Impact stated only as effort or scope, never as outcome",
        "Round numbers with no idea how they were measured",
      ],
    },
    {
      id: "quality_bar",
      label: "Quality Bar",
      description: "Insisting on standards under deadline pressure, and knowing when not to.",
      probes: [
        "Where did you hold the line, and what did it cost?",
        "Where did you knowingly accept debt, and how did you track it?",
        "How did you make the standard stick after you moved on?",
      ],
      strongSignals: [
        "Distinguishes debt taken deliberately from debt taken accidentally",
        "Left behind a mechanism, not just a fixed instance",
      ],
      redFlags: [
        "Absolutist about quality with no delivery awareness",
        "No examples of ever having pushed back",
      ],
    },
  ],
};

const AMAZON_LP: ValueFramework = {
  id: "amazon_lp",
  label: "Amazon Leadership Principles",
  shortLabel: "Amazon LPs",
  origin: "Amazon Leadership Principles",
  description:
    "Amazon grades behavioural answers against named Leadership Principles, one or two per round, with relentless follow-ups on your specific role, the data, and what you would do differently.",
  interviewStyle:
    "Two principles per round, three to five questions on each, and follow-ups that dig for the exact metric, who disagreed, what data was missing, and what you would change. Vagueness and 'we' answers are treated as missing evidence.",
  defaultCompetencyIds: ["ownership", "deliver_results", "earn_trust"],
  competencies: [
    {
      id: "customer_obsession",
      label: "Customer Obsession",
      description: "Starting from the customer and working backwards, even when it is inconvenient internally.",
      probes: [
        "Who was the customer, and how did you learn what they needed?",
        "What did you do that was worse for your team but better for the customer?",
        "What customer signal changed your plan?",
      ],
      strongSignals: [
        "Talked to or measured actual customers rather than assuming",
        "Accepted internal cost to protect the customer experience",
      ],
      redFlags: ["'Customer' means an internal stakeholder with no end-user link", "Customer benefit asserted, never measured"],
    },
    {
      id: "ownership",
      label: "Ownership",
      description: "Acting on behalf of the whole company, never saying 'that's not my job'.",
      probes: [
        "What was outside your remit that you picked up anyway?",
        "What did you do about the long-term fix, not just the mitigation?",
        "Who owned it after you?",
      ],
      strongSignals: ["Went past their own scope for a company-level outcome", "Thought past the immediate quarter"],
      redFlags: ["Escalated and stopped", "Long-term fix left unowned"],
    },
    {
      id: "invent_and_simplify",
      label: "Invent and Simplify",
      description: "Finding a simpler path, and inventing where no path exists.",
      probes: [
        "What did you remove to make that simpler?",
        "What was the obvious approach, and why did you not take it?",
        "What did you build that did not exist before?",
      ],
      strongSignals: ["Simplification is concrete and measurable", "Can explain why the obvious solution was wrong"],
      redFlags: ["Novelty for its own sake", "'Simplified' means rewrote with the same complexity"],
    },
    {
      id: "are_right_a_lot",
      label: "Are Right, A Lot",
      description: "Strong judgment, and actively seeking out views that contradict your own.",
      probes: [
        "What did you believe at the start that turned out to be wrong?",
        "Whose view did you go looking for, and what did they tell you?",
        "What would have changed your mind?",
      ],
      strongSignals: ["Sought disconfirming evidence deliberately", "Updated a position on evidence, and says so"],
      redFlags: ["Never wrong in any story", "Confidence with no mechanism behind it"],
    },
    {
      id: "dive_deep",
      label: "Dive Deep",
      description: "Operating at every level of detail, auditing frequently, and distrusting summary metrics.",
      probes: [
        "Walk me down to the actual mechanism that was failing.",
        "What did the raw data say that the dashboard did not?",
        "What number did you not believe, and why?",
      ],
      strongSignals: ["Can go several layers deeper on request", "Found a discrepancy between the metric and reality"],
      redFlags: ["Depth evaporates on the second follow-up", "Only ever reports what a dashboard said"],
    },
    {
      id: "bias_for_action",
      label: "Bias for Action",
      description: "Speed matters; most decisions are reversible and do not need extensive study.",
      probes: [
        "What did you decide without full information?",
        "How did you make it reversible?",
        "What did waiting cost you elsewhere?",
      ],
      strongSignals: ["Classified the decision as reversible or not before moving", "Moved and instrumented rather than moving blind"],
      redFlags: ["Recklessness presented as speed", "Every decision required full analysis"],
    },
    {
      id: "deliver_results",
      label: "Deliver Results",
      description: "Focusing on key inputs, delivering on time, and rising to the occasion when it slips.",
      probes: [
        "What was the commitment, and did you hit it?",
        "What did you cut, and who did you tell?",
        "What was the input metric you drove?",
      ],
      strongSignals: ["Distinguishes input metrics from output metrics", "Honest about a miss and what it changed"],
      redFlags: ["No dates or numbers anywhere in the story", "Setbacks described as external only"],
    },
    {
      id: "earn_trust",
      label: "Earn Trust",
      description: "Listening attentively, speaking candidly, and treating others respectfully — including about your own mistakes.",
      probes: [
        "How did you tell them you had got it wrong?",
        "What did you do when you inherited a team that did not trust you?",
        "What feedback did you act on that you did not want to hear?",
      ],
      strongSignals: ["Self-critical in a specific, non-performative way", "Rebuilt a relationship with a concrete action"],
      redFlags: ["Candour used as an excuse for bluntness", "Trust framed as being liked"],
    },
    {
      id: "have_backbone",
      label: "Have Backbone; Disagree and Commit",
      description: "Challenging respectfully when you disagree, then committing fully once decided.",
      probes: [
        "Who did you disagree with, and how senior were they?",
        "What was their case?",
        "What did you do after the decision went the other way?",
      ],
      strongSignals: ["Disagreed upward with evidence", "Genuinely committed afterwards, visibly"],
      redFlags: ["Disagreement always resolved in their favour", "Committed in name while undermining in practice"],
    },
    {
      id: "hire_and_develop",
      label: "Hire and Develop the Best",
      description: "Raising the performance bar, coaching, and moving people to where they grow.",
      probes: [
        "Who did you develop, and what changed for them?",
        "What did you do about someone who was not meeting the bar?",
        "What did you change in how you hire?",
      ],
      strongSignals: ["Names the individual's growth, not just their output", "Handled underperformance directly and humanely"],
      redFlags: ["Development means having sent someone on a course", "Avoided a hard performance conversation"],
    },
  ],
};

const GOOGLE_GL: ValueFramework = {
  id: "google_gl",
  label: "Googleyness & Leadership",
  shortLabel: "Google G&L",
  origin: "Google's hiring attributes (GCA, Leadership, Googleyness)",
  description:
    "Google's dedicated behavioural round grades comfort with ambiguity, emergent leadership, intellectual humility, and user focus — leadership without relying on formal authority.",
  interviewStyle:
    "One 45-minute round, roughly four to six behavioural questions in STAR form, probing how you handle ambiguity, take the lead without the title, act on feedback, and choose the user over internal convenience.",
  defaultCompetencyIds: ["comfort_with_ambiguity", "emergent_leadership", "intellectual_humility"],
  competencies: [
    {
      id: "comfort_with_ambiguity",
      label: "Comfort with Ambiguity",
      description: "Structuring a problem that arrives without a definition, and moving anyway.",
      probes: [
        "What was undefined when the work landed on you?",
        "How did you carve it into something workable?",
        "What assumption were you most worried about?",
      ],
      strongSignals: ["Imposed structure explicitly and stated assumptions", "Chose a path knowing it might be wrong, and hedged"],
      redFlags: ["Needed the ambiguity removed by a manager", "Structure appeared with no explanation of how"],
    },
    {
      id: "bias_for_action",
      label: "Bias for Action",
      description: "Starting before conditions are ideal, then correcting with evidence.",
      probes: [
        "What was the smallest thing you could ship to learn?",
        "What did you decide not to wait for?",
        "How quickly did you know whether it was working?",
      ],
      strongSignals: ["Shipped something small deliberately to learn", "Feedback loop is concrete and fast"],
      redFlags: ["Action without any learning mechanism", "Long analysis presented as diligence"],
    },
    {
      id: "emergent_leadership",
      label: "Emergent Leadership",
      description: "Stepping into the lead when your skills are needed, and stepping back when they are not.",
      probes: [
        "You had no authority there — how did you get people moving?",
        "When did you hand it back, and to whom?",
        "What would have happened without you?",
      ],
      strongSignals: ["Led without a title, using clarity or credibility", "Stepped back deliberately once the need passed"],
      redFlags: ["Leadership equated to having been the manager", "Took over and never let go"],
    },
    {
      id: "intellectual_humility",
      label: "Intellectual Humility",
      description: "Holding your view loosely, being persuadable by evidence, and saying when you don't know.",
      probes: [
        "What did you get wrong, and who told you?",
        "What evidence changed your mind?",
        "What part of this do you still not understand?",
      ],
      strongSignals: ["Changed position on evidence and names the source", "Comfortable saying 'I don't know' precisely"],
      redFlags: ["Always the smartest person in the story", "Uncertainty hidden behind confident vagueness"],
    },
    {
      id: "user_focus",
      label: "User Focus",
      description: "Defaulting to the user over internal convenience, with evidence about the user.",
      probes: [
        "What did the users actually do, as opposed to what you expected?",
        "What internal cost did you accept for them?",
        "How did you find out you were wrong about them?",
      ],
      strongSignals: ["Used real usage evidence, not intuition", "Took internal pain for user benefit"],
      redFlags: ["User needs asserted from the desk", "Convenience of the team quietly won"],
    },
    {
      id: "collaboration",
      label: "Collaboration",
      description: "Doing the work with people who do not report to you and do not have to agree.",
      probes: [
        "Who did you need, and what was in it for them?",
        "Where did it break down?",
        "What did you change about how you worked together?",
      ],
      strongSignals: ["Understood the other team's incentives", "Fixed the process, not just the instance"],
      redFlags: ["Other teams described as obstacles", "No sense of the other side's priorities"],
    },
    {
      id: "feedback_receptivity",
      label: "Acting on Feedback",
      description: "Receiving unflattering feedback and visibly changing how you work.",
      probes: [
        "What is the feedback you most disagreed with?",
        "What did you change anyway?",
        "How do you know the change stuck?",
      ],
      strongSignals: ["A specific behaviour changed, with an observable check", "Sought the feedback out rather than waiting for review season"],
      redFlags: ["Feedback rationalised away", "Change described in the abstract"],
    },
  ],
};

const META_VALUES: ValueFramework = {
  id: "meta_values",
  label: "Meta Values",
  shortLabel: "Meta",
  origin: "Meta's stated company values",
  description:
    "Meta's behavioural round grades speed with judgment, long-term impact over local wins, directness, and treating the company's problems as your own.",
  interviewStyle:
    "Fast-moving conversation, two to four stories in 45 minutes, pushing on how quickly you moved, what impact you chose, and how directly you handle disagreement and feedback.",
  defaultCompetencyIds: ["move_fast", "focus_on_impact", "be_direct"],
  competencies: [
    {
      id: "move_fast",
      label: "Move Fast",
      description: "Shipping quickly and taking calculated risk, without leaving wreckage behind.",
      probes: [
        "How long did that take, and how long should it have taken?",
        "What risk did you accept to move faster?",
        "What broke, and how fast did you know?",
      ],
      strongSignals: ["Speed paired with a real safety mechanism", "Can name what they consciously traded away"],
      redFlags: ["Fast with no instrumentation or rollback", "Speed claimed but timeline is vague"],
    },
    {
      id: "focus_on_impact",
      label: "Focus on Long-term Impact",
      description: "Choosing the work with the largest durable effect rather than the nearest win.",
      probes: [
        "What else could you have worked on, and why this?",
        "What did this look like a year later?",
        "What short-term win did you pass up?",
      ],
      strongSignals: ["Explicit prioritisation against a real alternative", "Followed the outcome over a long horizon"],
      redFlags: ["Worked on whatever was assigned", "Impact only visible at launch"],
    },
    {
      id: "be_direct",
      label: "Be Direct and Respect Your Colleagues",
      description: "Saying the hard thing early, to the person's face, without damaging the relationship.",
      probes: [
        "What did you have to say that they did not want to hear?",
        "How did you say it?",
        "How was the relationship afterwards?",
      ],
      strongSignals: ["Direct and specific, with the relationship intact after", "Went to the person first, not around them"],
      redFlags: ["Directness used to justify harshness", "Concerns raised only in private to others"],
    },
    {
      id: "build_awesome_things",
      label: "Build Awesome Things",
      description: "Raising ambition beyond 'it works' to something people actually want.",
      probes: [
        "What made it good rather than merely working?",
        "What did you push for that was not asked of you?",
        "How did users react?",
      ],
      strongSignals: ["Pushed quality or ambition past the requirement, with a reason", "Has evidence people valued it"],
      redFlags: ["Polish with no user signal", "Ambition described as more features"],
    },
    {
      id: "live_in_the_future",
      label: "Live in the Future",
      description: "Building for where things are going, not only for today's constraints.",
      probes: [
        "What did you build assuming would change?",
        "What bet did you make about the next two years?",
        "What did you deliberately not future-proof?",
      ],
      strongSignals: ["A named bet about the future with a reason", "Knows where over-engineering was avoided"],
      redFlags: ["Speculative generality dressed up as vision", "No forward view at all"],
    },
    {
      id: "meta_metamates_me",
      label: "Meta, Metamates, Me",
      description: "Company first, team second, self third — with concrete evidence of that ordering.",
      probes: [
        "What did you do that was bad for your visibility but good for the company?",
        "What did you hand over that you wanted to keep?",
        "Who got the credit?",
      ],
      strongSignals: ["Gave up a good project or credit for a better outcome", "Supported someone else's success concretely"],
      redFlags: ["Self-interest narrated as company interest", "Every story maximises the candidate's visibility"],
    },
  ],
};

const NETFLIX_CULTURE: ValueFramework = {
  id: "netflix_culture",
  label: "Netflix Culture",
  shortLabel: "Netflix",
  origin: "Netflix culture memo behaviours",
  description:
    "Netflix grades judgment in the absence of process, candour, selflessness, and the courage to disagree and to say uncomfortable things out loud.",
  interviewStyle:
    "Direct, candid conversation. Fewer questions, deeper probing, with a strong bias toward judgment under freedom-and-responsibility and away from process compliance.",
  defaultCompetencyIds: ["judgment", "candor", "courage"],
  competencies: [
    {
      id: "judgment",
      label: "Judgment",
      description: "Making wise decisions despite ambiguity, and separating the important from the urgent.",
      probes: [
        "What was the root cause, not the symptom?",
        "What did you choose not to do?",
        "What signal told you it was the right call?",
      ],
      strongSignals: ["Identified root cause and acted on it", "Prioritised explicitly against something real"],
      redFlags: ["Symptom-level fixes only", "Decisions justified by process rather than reasoning"],
    },
    {
      id: "candor",
      label: "Candour",
      description: "Giving and taking direct feedback, early, even when it is awkward.",
      probes: [
        "What is the most uncomfortable feedback you have given?",
        "What did they do with it?",
        "What feedback did you receive that stung?",
      ],
      strongSignals: ["Gave hard feedback directly and early", "Took feedback without defending"],
      redFlags: ["Feedback withheld to keep the peace", "Candour that is really just criticism"],
    },
    {
      id: "courage",
      label: "Courage",
      description: "Saying what you think even when it is unpopular, and taking smart risks.",
      probes: [
        "What unpopular position did you take?",
        "What did it cost you?",
        "What risk did you take that could have gone badly?",
      ],
      strongSignals: ["Took a position with real personal downside", "Questioned a decision that others accepted"],
      redFlags: ["Courage described without any cost", "Only ever disagreed downward"],
    },
    {
      id: "selflessness",
      label: "Selflessness",
      description: "Seeking what is best for the company rather than yourself or your team.",
      probes: [
        "What did you give up for a better company outcome?",
        "Whose work did you make easier at your own expense?",
        "What did you kill that you had built?",
      ],
      strongSignals: ["Killed or handed over their own work for the right reason", "Helped another team win"],
      redFlags: ["Team-local optimisation", "Sunk-cost attachment to own work"],
    },
    {
      id: "curiosity",
      label: "Curiosity",
      description: "Learning rapidly and eagerly, including outside your specialty.",
      probes: [
        "What did you have to learn from scratch?",
        "How did you learn it fast?",
        "What did you learn about a part of the business that was not yours?",
      ],
      strongSignals: ["Deliberate, fast learning method with a result", "Understands the business, not only the code"],
      redFlags: ["Learning described only as reading docs", "Curiosity limited to their own stack"],
    },
    {
      id: "impact",
      label: "Impact",
      description: "Accomplishing amounts of important work, reliably, with high standards.",
      probes: [
        "What is the most important thing you shipped last year?",
        "What was the measured effect?",
        "What did you do when the standard slipped?",
      ],
      strongSignals: ["Consistent, measurable output on important work", "Raised the bar for others, not just themselves"],
      redFlags: ["Busy rather than impactful", "Standards asserted with no example of enforcing them"],
    },
    {
      id: "inclusion",
      label: "Inclusion",
      description: "Working effectively with people whose background and viewpoint differ from yours.",
      probes: [
        "Whose perspective was missing, and how did you get it in?",
        "What did you change after hearing it?",
        "Where did you make room for a quieter voice?",
      ],
      strongSignals: ["Actively surfaced a missing viewpoint and used it", "Changed a decision because of it"],
      redFlags: ["Inclusion as a value statement with no action", "Loudest-voice decision making"],
    },
  ],
};

const STARTUP_OPERATOR: ValueFramework = {
  id: "startup_operator",
  label: "Startup Operator",
  shortLabel: "Startup",
  origin: "High-ownership startup and scale-up hiring bars",
  description:
    "Early-stage and scale-up rounds grade whether you create your own structure, move without process, get close to customers, and own outcomes end to end.",
  interviewStyle:
    "Conversational and fast, focused on what you personally built with no support, how you decided without data, and whether you are comfortable when nothing is set up for you.",
  defaultCompetencyIds: ["extreme_ownership", "scrappiness", "customer_proximity"],
  competencies: [
    {
      id: "extreme_ownership",
      label: "Extreme Ownership",
      description: "Owning the outcome end to end, including the parts far outside your job title.",
      probes: [
        "What did you own that nobody asked you to own?",
        "What did you do when there was nobody to escalate to?",
        "Where did the buck stop?",
      ],
      strongSignals: ["Owned outcomes with no formal mandate", "Operated with no escalation path"],
      redFlags: ["Blocked waiting for a decision maker", "Scope defined by job description"],
    },
    {
      id: "scrappiness",
      label: "Scrappiness",
      description: "Getting things done with no budget, no team, and no tooling.",
      probes: [
        "What did you build by hand that should have been a tool?",
        "What did you do without?",
        "What was the ugly version that worked?",
      ],
      strongSignals: ["Shipped a deliberately ugly version that worked", "Substituted effort for missing resources"],
      redFlags: ["Needed the platform to exist first", "Scrappy described as sloppy with no plan to repay"],
    },
    {
      id: "speed_over_polish",
      label: "Speed Over Polish",
      description: "Choosing the fast, reversible path and knowing when that is wrong.",
      probes: [
        "What did you ship that you knew was not good enough?",
        "When did you refuse to cut a corner?",
        "How did you decide which corner to cut?",
      ],
      strongSignals: ["Has a rule for which corners are safe", "Repaid the shortcut deliberately"],
      redFlags: ["No line they would not cross", "Perfectionism that never shipped"],
    },
    {
      id: "first_principles",
      label: "First-Principles Thinking",
      description: "Reasoning from the actual constraints instead of copying a pattern.",
      probes: [
        "What did everyone assume that turned out to be false?",
        "Why not just use the standard approach?",
        "What were the real constraints?",
      ],
      strongSignals: ["Challenged an assumption with reasoning and evidence", "Chose against convention for a stated reason"],
      redFlags: ["Reinvention without evaluating the standard option", "Pattern-matching with no constraint analysis"],
    },
    {
      id: "customer_proximity",
      label: "Customer Proximity",
      description: "Talking to users yourself rather than receiving requirements second-hand.",
      probes: [
        "When did you last talk to a user directly?",
        "What surprised you?",
        "What did you change the same week?",
      ],
      strongSignals: ["Direct, recent contact with users that changed the work", "Short loop from signal to change"],
      redFlags: ["All customer knowledge is second-hand", "Insight gathered but never acted on"],
    },
    {
      id: "comfort_without_process",
      label: "Comfort Without Process",
      description: "Creating the process where none exists, without over-building it.",
      probes: [
        "What process did you introduce, and why then?",
        "What did you deliberately not formalise?",
        "How did you keep it from becoming bureaucracy?",
      ],
      strongSignals: ["Introduced the minimum process at the right moment", "Knows what not to formalise"],
      redFlags: ["Complains about missing process", "Process introduced for its own sake"],
    },
  ],
};

export const INTERVIEW_VALUE_FRAMEWORKS: readonly ValueFramework[] = [
  GENERIC,
  AMAZON_LP,
  GOOGLE_GL,
  META_VALUES,
  NETFLIX_CULTURE,
  STARTUP_OPERATOR,
];

export const DEFAULT_VALUE_FRAMEWORK_ID: ValueFrameworkId = "generic";

/** Number of value competencies a round can meaningfully cover in 45 minutes. */
export const MIN_VALUE_COMPETENCIES = 1;
export const MAX_VALUE_COMPETENCIES = 4;

export function isValueFrameworkId(value: unknown): value is ValueFrameworkId {
  return (
    typeof value === "string" &&
    VALUE_FRAMEWORK_IDS.includes(value as ValueFrameworkId)
  );
}

export function getValueFramework(id?: string | null): ValueFramework {
  if (!isValueFrameworkId(id)) return GENERIC;
  return (
    INTERVIEW_VALUE_FRAMEWORKS.find((framework) => framework.id === id) ?? GENERIC
  );
}

/**
 * Resolves selected competency ids against a framework, preserving the
 * framework's own ordering and dropping anything unrecognised. Falls back to
 * the framework defaults when nothing valid is selected, so a round always has
 * a value lens to grade against.
 */
export function resolveValueCompetencies(
  frameworkId: string | null | undefined,
  competencyIds: readonly string[]
): ValueCompetency[] {
  const framework = getValueFramework(frameworkId);
  const selected = new Set(competencyIds);
  const matched = framework.competencies.filter((competency) =>
    selected.has(competency.id)
  );

  if (matched.length === 0) {
    return framework.competencies.filter((competency) =>
      framework.defaultCompetencyIds.includes(competency.id)
    );
  }

  return matched.slice(0, MAX_VALUE_COMPETENCIES);
}

export function getValueCompetencyLabels(
  frameworkId: string | null | undefined,
  competencyIds: readonly string[]
): string[] {
  return resolveValueCompetencies(frameworkId, competencyIds).map(
    (competency) => competency.label
  );
}

/** Snapshot of the value lens carried on the round context into prompts and scoring. */
export type RoundValuesContext = {
  frameworkId: ValueFrameworkId;
  frameworkLabel: string;
  frameworkOrigin: string;
  interviewStyle: string;
  competencies: {
    id: string;
    label: string;
    description: string;
    probes: string[];
    strongSignals: string[];
    redFlags: string[];
  }[];
};

export function buildRoundValuesContext(
  frameworkId: string | null | undefined,
  competencyIds: readonly string[]
): RoundValuesContext {
  const framework = getValueFramework(frameworkId);
  const competencies = resolveValueCompetencies(framework.id, competencyIds);

  return {
    frameworkId: framework.id,
    frameworkLabel: framework.label,
    frameworkOrigin: framework.origin,
    interviewStyle: framework.interviewStyle,
    competencies: competencies.map((competency) => ({
      id: competency.id,
      label: competency.label,
      description: competency.description,
      probes: competency.probes,
      strongSignals: competency.strongSignals,
      redFlags: competency.redFlags,
    })),
  };
}

/**
 * Interviewer-facing block describing the value lens. Rendered into the voice
 * and chat system prompts so the live interviewer probes the same competencies
 * the report grades.
 */
export function buildValuesPromptBlock(
  values: RoundValuesContext | null | undefined
): string {
  if (!values || values.competencies.length === 0) return "";

  // The snapshot arrives from the client via `generatedLoopRoundSnapshot`, so the
  // probe and signal text is re-resolved from this server-side catalog rather
  // than trusted verbatim. An unrecognised framework degrades to the defaults.
  const framework = getValueFramework(values.frameworkId);
  const competencies = resolveValueCompetencies(
    framework.id,
    values.competencies.map((competency) => competency.id)
  );

  const competencyBlocks = competencies
    .map((competency, index) => {
      const probes = competency.probes.map((probe) => `  - ${probe}`).join("\n");
      return `${index + 1}. ${competency.label} — ${competency.description}
   Probe styles you may adapt (never read verbatim as a list):
${probes}`;
    })
    .join("\n");

  return `
## Value Lens: ${framework.label}
Source: ${framework.origin}
How this round is run in the real world: ${framework.interviewStyle}

Grade the candidate against these competencies, in this order:
${competencyBlocks}

Value-lens rules:
- Cover the competencies in order. Spend real time on each; do not skim all of them.
- Anchor every question to one competency at a time. Never name the competency as a label the candidate can game — ask for the behaviour, not the value.
- For each competency, require a concrete past example. If the candidate answers in generalities or hypotheticals, ask once for a specific instance, then move on if none exists.
- Follow up until you know the candidate's own contribution, what made the decision hard, what the measurable result was, and what they would do differently.
- Treat a polished but evidence-free answer as weak signal, however well delivered.
`;
}

/**
 * Scorer-facing rubric block. Mirrors the live prompt so the report grades the
 * competencies the interviewer actually probed.
 */
export function buildValuesRubricBlock(
  values: RoundValuesContext | null | undefined
): string {
  if (!values || values.competencies.length === 0) return "";

  // Same reason as `buildValuesPromptBlock`: grade against this catalog's
  // wording, not whatever the client put in the snapshot.
  const framework = getValueFramework(values.frameworkId);
  const competencies = resolveValueCompetencies(
    framework.id,
    values.competencies.map((competency) => competency.id)
  );

  const rubric = competencies
    .map((competency) => {
      const strong = competency.strongSignals.map((signal) => `    - ${signal}`).join("\n");
      const flags = competency.redFlags.map((flag) => `    - ${flag}`).join("\n");
      return `- ${competency.id} (${competency.label}): ${competency.description}
  Strong signals:
${strong}
  Red flags:
${flags}`;
    })
    .join("\n");

  return `
## Value Lens Being Graded: ${framework.label} (${framework.origin})
${rubric}

Competency grading rules:
- Return exactly one entry per competency listed above, using the given competency id verbatim.
- Rate "strong" only when the transcript contains a specific example with the candidate's own action and a concrete outcome.
- Rate "solid" when there is a real example but a missing dimension such as metric, tradeoff, or reflection.
- Rate "mixed" when the answer was partly evidence and partly assertion, or when the candidate needed heavy prompting.
- Rate "insufficient" when the competency was not meaningfully probed or the candidate never produced a specific example. Never invent evidence to fill a gap.
- Quote or closely paraphrase what the candidate actually said in the evidence field. Do not fabricate quotes.
`;
}

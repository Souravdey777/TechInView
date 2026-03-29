type Step = {
  number: number;
  title: string;
  description: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
};

const steps: Step[] = [
  {
    number: 1,
    title: "Choose your problem",
    description:
      "Select difficulty, category, and programming language. Pick a problem or let us randomize one for you.",
    borderColor: "border-brand-cyan",
    bgColor: "bg-brand-cyan/10",
    textColor: "text-brand-cyan",
  },
  {
    number: 2,
    title: "Interview with Tia",
    description:
      "Conduct a full 45-minute mock interview. Discuss your approach verbally, write code in the editor, and answer follow-up questions.",
    borderColor: "border-brand-green",
    bgColor: "bg-brand-green/10",
    textColor: "text-brand-green",
  },
  {
    number: 3,
    title: "Get detailed feedback",
    description:
      "Review your score breakdown, read the full transcript, compare your code to the optimal solution, and track progress over time.",
    borderColor: "border-brand-amber",
    bgColor: "bg-brand-amber/10",
    textColor: "text-brand-amber",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-brand-deep">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            How it works
          </h2>
          <p className="text-brand-muted text-lg">
            From setup to feedback in under an hour.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, #1a2332, transparent)",
            }}
            aria-hidden="true"
          />
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center gap-4"
            >
              <div
                className={`w-16 h-16 rounded-full border-2 ${step.borderColor} ${step.bgColor} flex items-center justify-center ${step.textColor} font-bold text-xl relative z-10`}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                {step.title}
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

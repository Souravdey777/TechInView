import { Mic, Code2, BarChart3 } from "lucide-react";
import { getInterviewerPersona } from "@/lib/interviewer-personas";

const DEFAULT_PERSONA = getInterviewerPersona("tia");

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
};

const features: Feature[] = [
  {
    icon: <Mic className="w-6 h-6 text-brand-cyan" />,
    title: "Voice-powered AI interviewer",
    description:
      `Speak naturally with ${DEFAULT_PERSONA.name}, the generalist interviewer, or switch to a FAANG-specific persona. Real-time STT and TTS create an authentic conversational interview experience with under 1.5s latency.`,
    iconBg: "bg-brand-cyan/10",
    iconColor: "text-brand-cyan",
  },
  {
    icon: <Code2 className="w-6 h-6 text-brand-green" />,
    title: "Live code editor",
    description:
      "Full Monaco editor with syntax highlighting, autocompletion, and instant code execution. Supports Python, JavaScript, Java, and C++.",
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-brand-amber" />,
    title: "FAANG-calibrated scoring",
    description:
      "5-dimension evaluation: problem solving, code quality, communication, technical knowledge, and testing. Get a Hire / No-Hire verdict with detailed feedback.",
    iconBg: "bg-brand-amber/10",
    iconColor: "text-brand-amber",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-brand-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            Everything you need to land the job
          </h2>
          <p className="text-brand-muted text-lg max-w-xl mx-auto">
            A complete interview simulation built for engineers who take
            preparation seriously.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card p-8 flex flex-col gap-4 hover:border-brand-cyan/30 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                {feature.title}
              </h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

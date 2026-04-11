import { SetupPageShell } from "@/components/interviews/SetupPageShell";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SystemDesignSetupPage({ searchParams }: PageProps) {
  const company = typeof searchParams?.company === "string" ? searchParams.company : null;
  const role = typeof searchParams?.role === "string" ? searchParams.role : null;
  const contextLabel = company && role ? `${company} · ${role}` : null;

  return (
    <SetupPageShell
      title="System Design Setup"
      status="beta"
      description="This setup page is reserved for choosing persona, stack, and system-design prompts as the dedicated system-design workflow lands."
      setupHighlights={["Persona", "Stack", "Prompt", "Random mode"]}
      primaryHref="/prep-plans/new"
      primaryLabel="Create prep plan"
      secondaryHref="/dashboard"
      secondaryLabel="Back to dashboard"
      contextLabel={contextLabel}
    />
  );
}

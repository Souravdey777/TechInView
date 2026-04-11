import { SetupPageShell } from "@/components/interviews/SetupPageShell";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BehavioralSetupPage({ searchParams }: PageProps) {
  const company = typeof searchParams?.company === "string" ? searchParams.company : null;
  const role = typeof searchParams?.role === "string" ? searchParams.role : null;
  const contextLabel = company && role ? `${company} · ${role}` : null;

  return (
    <SetupPageShell
      title="Behavioral Setup"
      status="beta"
      description="This setup page is reserved for general behavioral scenario prep with persona selection, role context, and structured follow-ups."
      setupHighlights={["Scenarios", "Persona", "Role context", "Follow-up depth"]}
      primaryHref="/prep-plans/new"
      primaryLabel="Create prep plan"
      secondaryHref="/dashboard"
      secondaryLabel="Back to dashboard"
      contextLabel={contextLabel}
    />
  );
}

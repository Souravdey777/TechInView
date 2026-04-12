import { SetupPageShell } from "@/components/interviews/SetupPageShell";

export default function MachineCodingSetupPage() {
  return (
    <SetupPageShell
      title="Machine Coding Setup"
      status="planned"
      description="This setup page will let candidates choose persona, stack, and problem for scoped 45-minute FE, BE, and FS machine-coding rounds."
      setupHighlights={["45 min", "Persona", "Stack", "Problem"]}
      primaryHref="/prep-plans/new"
      primaryLabel="Create prep plan instead"
      secondaryHref="/dashboard"
      secondaryLabel="Back to dashboard"
    />
  );
}

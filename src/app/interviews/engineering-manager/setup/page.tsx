import { EngineeringManagerSetup } from "@/components/interviews/EngineeringManagerSetup";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function EngineeringManagerSetupPage({ searchParams }: PageProps) {
  const company = typeof searchParams?.company === "string" ? searchParams.company : null;
  const roleTitle = typeof searchParams?.role === "string" ? searchParams.role : null;

  return <EngineeringManagerSetup initialCompany={company} initialRoleTitle={roleTitle} />;
}

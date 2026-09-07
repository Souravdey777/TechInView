import { BehavioralSetup } from "@/components/interviews/BehavioralSetup";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BehavioralSetupPage({ searchParams }: PageProps) {
  const company = typeof searchParams?.company === "string" ? searchParams.company : null;
  const roleTitle = typeof searchParams?.role === "string" ? searchParams.role : null;

  return <BehavioralSetup initialCompany={company} initialRoleTitle={roleTitle} />;
}

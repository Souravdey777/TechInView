import { TechnicalQaSetup } from "@/components/interviews/TechnicalQaSetup";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function TechnicalQaSetupPage({ searchParams }: PageProps) {
  const planId = typeof searchParams?.planId === "string" ? searchParams.planId : null;

  return <TechnicalQaSetup planId={planId} />;
}

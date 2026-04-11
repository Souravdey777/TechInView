"use client";

import { useEffect } from "react";
import { TechnicalQaResults } from "@/components/interviews/TechnicalQaResults";

type TechnicalQaResultsPageProps = {
  params: { id: string };
};

export default function TechnicalQaResultsPage({
  params,
}: TechnicalQaResultsPageProps) {
  useEffect(() => {
    document.title = "Technical Q&A Results — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return <TechnicalQaResults interviewId={params.id} />;
}

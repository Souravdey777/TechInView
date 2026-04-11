"use client";

import { useEffect } from "react";
import { EngineeringManagerResults } from "@/components/interviews/EngineeringManagerResults";

type EngineeringManagerResultsPageProps = {
  params: { id: string };
};

export default function EngineeringManagerResultsPage({
  params,
}: EngineeringManagerResultsPageProps) {
  useEffect(() => {
    document.title = "Engineering Manager Results — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return <EngineeringManagerResults interviewId={params.id} />;
}

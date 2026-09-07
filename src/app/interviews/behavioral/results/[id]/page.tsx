"use client";

import { useEffect } from "react";
import { BehavioralResults } from "@/components/interviews/BehavioralResults";

type BehavioralResultsPageProps = {
  params: { id: string };
};

export default function BehavioralResultsPage({ params }: BehavioralResultsPageProps) {
  useEffect(() => {
    document.title = "Behavioral Results — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return <BehavioralResults interviewId={params.id} />;
}

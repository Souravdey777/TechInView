"use client";

import { useEffect } from "react";
import { EngineeringManagerInterviewRoom } from "@/components/interviews/EngineeringManagerInterviewRoom";

type EngineeringManagerInterviewPageProps = {
  params: { id: string };
};

export default function EngineeringManagerInterviewPage({
  params,
}: EngineeringManagerInterviewPageProps) {
  useEffect(() => {
    document.title = "Engineering Manager Interview — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return <EngineeringManagerInterviewRoom interviewId={params.id} />;
}

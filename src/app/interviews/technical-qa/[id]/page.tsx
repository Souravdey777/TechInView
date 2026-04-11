"use client";

import { useEffect } from "react";
import { TechnicalQaInterviewRoom } from "@/components/interviews/TechnicalQaInterviewRoom";

type TechnicalQaInterviewPageProps = {
  params: { id: string };
};

export default function TechnicalQaInterviewPage({
  params,
}: TechnicalQaInterviewPageProps) {
  useEffect(() => {
    document.title = "Technical Q&A Interview — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return <TechnicalQaInterviewRoom interviewId={params.id} />;
}

"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { DesktopInterviewGate } from "@/components/shared/DesktopInterviewGate";
import { FullPageLoader } from "@/components/shared/LoadingSpinner";

const BehavioralInterviewRoom = dynamic(
  () =>
    import("@/components/interviews/BehavioralInterviewRoom").then(
      (module) => module.BehavioralInterviewRoom
    ),
  {
    ssr: false,
    loading: () => <FullPageLoader message="Loading interview room..." />,
  }
);

type BehavioralInterviewPageProps = {
  params: { id: string };
};

export default function BehavioralInterviewPage({ params }: BehavioralInterviewPageProps) {
  useEffect(() => {
    document.title = "Behavioral Interview — TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return (
    <DesktopInterviewGate
      title="Behavioral interview rooms need a larger screen"
      description="This live interview view keeps the round brief, your STAR notes, and the transcript visible together. Open it on desktop to continue the full experience."
    >
      <div className="bg-brand-deep">
        <BehavioralInterviewRoom interviewId={params.id} />
      </div>
    </DesktopInterviewGate>
  );
}

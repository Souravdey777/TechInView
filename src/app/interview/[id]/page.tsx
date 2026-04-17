"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { DesktopInterviewGate } from "@/components/shared/DesktopInterviewGate";
import { FullPageLoader } from "@/components/shared/LoadingSpinner";

const InterviewRoom = dynamic(
  () =>
    import("@/components/interview/InterviewRoom").then(
      (module) => module.InterviewRoom
    ),
  {
    ssr: false,
    loading: () => <FullPageLoader message="Loading interview room..." />,
  }
);

type PageProps = {
  params: { id: string };
};

export default function InterviewRoomPage({ params }: PageProps) {
  const { id } = params;

  useEffect(() => {
    document.title = "Interview — TechInView";
    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return (
    <DesktopInterviewGate
      title="AI interviews need a desktop screen"
      description="This DSA interview room uses side-by-side voice, problem, code, and test panels. Open the same session on a laptop or desktop to continue comfortably."
    >
      <div className="fixed inset-0 overflow-hidden bg-brand-deep">
        <InterviewRoom interviewId={id} />
      </div>
    </DesktopInterviewGate>
  );
}

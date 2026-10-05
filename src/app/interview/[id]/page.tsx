"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { DesktopInterviewGate } from "@/components/shared/DesktopInterviewGate";
import { RoomSkeleton } from "@/components/shared/RoomSkeleton";

const InterviewRoom = dynamic(
  () =>
    import("@/components/interview/InterviewRoom").then(
      (module) => module.InterviewRoom
    ),
  {
    ssr: false,
    loading: () => <RoomSkeleton variant="coding" />,
  }
);

type PageProps = {
  params: { id: string };
};

export default function InterviewRoomPage({ params }: PageProps) {
  const { id } = params;

  useEffect(() => {
    document.title = "Interview · TechInView";
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

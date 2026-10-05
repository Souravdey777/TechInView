"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { DesktopInterviewGate } from "@/components/shared/DesktopInterviewGate";
import { RoomSkeleton } from "@/components/shared/RoomSkeleton";

const TechnicalQaInterviewRoom = dynamic(
  () =>
    import("@/components/interviews/TechnicalQaInterviewRoom").then(
      (module) => module.TechnicalQaInterviewRoom
    ),
  {
    ssr: false,
    loading: () => <RoomSkeleton variant="conversation" />,
  }
);

type TechnicalQaInterviewPageProps = {
  params: { id: string };
};

export default function TechnicalQaInterviewPage({
  params,
}: TechnicalQaInterviewPageProps) {
  useEffect(() => {
    document.title = "Technical Q&A Interview · TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return (
    <DesktopInterviewGate
      roomVariant="conversation"
      title="Technical Q&A rounds work best on desktop"
      description="This room is tuned for a live voice conversation plus transcript review in parallel. Open it on a laptop or desktop for the intended interview flow."
    >
      <div className="bg-brand-deep">
        <TechnicalQaInterviewRoom interviewId={params.id} />
      </div>
    </DesktopInterviewGate>
  );
}

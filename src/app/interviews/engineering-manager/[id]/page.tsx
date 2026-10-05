"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { DesktopInterviewGate } from "@/components/shared/DesktopInterviewGate";
import { RoomSkeleton } from "@/components/shared/RoomSkeleton";

const EngineeringManagerInterviewRoom = dynamic(
  () =>
    import("@/components/interviews/EngineeringManagerInterviewRoom").then(
      (module) => module.EngineeringManagerInterviewRoom
    ),
  {
    ssr: false,
    loading: () => <RoomSkeleton variant="conversation" />,
  }
);

type EngineeringManagerInterviewPageProps = {
  params: { id: string };
};

export default function EngineeringManagerInterviewPage({
  params,
}: EngineeringManagerInterviewPageProps) {
  useEffect(() => {
    document.title = "Engineering Manager Interview · TechInView";

    return () => {
      document.title = "TechInView.ai";
    };
  }, []);

  return (
    <DesktopInterviewGate
      roomVariant="conversation"
      title="Leadership interview rooms need a larger screen"
      description="This live interview view keeps the voice stage, round brief, and transcript visible together. Open it on desktop to continue the full experience."
    >
      <div className="bg-brand-deep">
        <EngineeringManagerInterviewRoom interviewId={params.id} />
      </div>
    </DesktopInterviewGate>
  );
}

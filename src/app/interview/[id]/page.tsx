"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { InterviewRoom } from "@/components/interview/InterviewRoom";

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
    <div className="fixed inset-0 overflow-hidden bg-brand-deep">
      <InterviewRoom interviewId={id} />
    </div>
  );
}

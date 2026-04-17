"use client";

import { useSyncExternalStore } from "react";
import { DesktopOnlyInterviewNotice } from "@/components/shared/DesktopOnlyInterviewNotice";
import { FullPageLoader } from "@/components/shared/LoadingSpinner";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

function subscribeToDesktopBreakpoint(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  const handleChange = () => onStoreChange();

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }

  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
}

function getDesktopSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getDesktopServerSnapshot() {
  return null;
}

type DesktopInterviewGateProps = {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  loadingMessage?: string;
  children: React.ReactNode;
};

export function DesktopInterviewGate({
  title,
  description,
  backHref,
  backLabel,
  loadingMessage = "Loading interview room...",
  children,
}: DesktopInterviewGateProps) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopBreakpoint,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  if (isDesktop === null) {
    return <FullPageLoader message={loadingMessage} />;
  }

  if (!isDesktop) {
    return (
      <DesktopOnlyInterviewNotice
        title={title}
        description={description}
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  return <>{children}</>;
}

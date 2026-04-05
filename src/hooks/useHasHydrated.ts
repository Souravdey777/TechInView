"use client";

import { useState, useEffect } from "react";
import { useInterviewStore } from "@/stores/interview-store";

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // sessionStorage hydration is synchronous, so this is likely already true
    if (useInterviewStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useInterviewStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}

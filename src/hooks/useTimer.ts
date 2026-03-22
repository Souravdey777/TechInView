"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { formatDuration } from "@/lib/utils";

export function useTimer(
  maxSeconds: number,
  onTick?: (remaining: number) => void,
  onExpire?: () => void
) {
  const [timeLeft, setTimeLeft] = useState(maxSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  onTickRef.current = onTick;
  onExpireRef.current = onExpire;

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(maxSeconds);
  }, [maxSeconds]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatDuration(timeLeft),
    isWarning: timeLeft <= 600 && timeLeft > 300,
    isDanger: timeLeft <= 300,
    elapsed: maxSeconds - timeLeft,
  };
}

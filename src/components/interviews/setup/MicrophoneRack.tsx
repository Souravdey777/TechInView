"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Mic, MicOff, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetupRack } from "@/components/interviews/setup/SetupRack";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";

type MicStatus = "idle" | "checking" | "granted" | "denied";

type MicrophoneRackProps = {
  index: string;
  interviewerName: string;
};

/** Numbered microphone rack shared by every voice round's setup page. */
export function MicrophoneRack({ index, interviewerName }: MicrophoneRackProps) {
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const {
    devices: microphoneDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    deviceWarning,
  } = useMicrophoneDevices();

  async function handleMicCheck() {
    setMicStatus("checking");
    try {
      await refreshDevices(true);
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
  }

  return (
    <SetupRack index={index} label="Microphone">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-brand-text">
            Verify your microphone before starting
          </p>
          <p className="text-xs text-brand-muted">
            TechInView uses your mic for real-time voice interaction with{" "}
            {interviewerName}.
          </p>
        </div>
        <button
          onClick={() => void handleMicCheck()}
          disabled={micStatus === "checking"}
          className={cn(
            "flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150",
            micStatus === "granted"
              ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
              : micStatus === "denied"
                ? "border-brand-rose/40 bg-brand-rose/10 text-brand-rose"
                : "border-brand-border text-brand-text hover:border-brand-subtle hover:bg-brand-card"
          )}
        >
          {micStatus === "checking" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : micStatus === "granted" ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Mic Ready
            </>
          ) : micStatus === "denied" ? (
            <>
              <XCircle className="h-4 w-4" />
              Access Denied
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Test Microphone
            </>
          )}
        </button>
      </div>
      {micStatus === "denied" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-brand-rose/20 bg-brand-rose/5 px-3 py-2.5">
          <MicOff className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
          <p className="text-xs text-brand-rose">
            Microphone access was blocked. You can still type your responses
            during the interview, or grant access in your browser settings and
            try again.
          </p>
        </div>
      )}
      {micStatus === "granted" && (
        <div className="mt-3 space-y-3 rounded-lg border border-brand-green/20 bg-brand-green/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
            <p className="text-xs text-brand-green">
              Microphone detected and working. Voice interaction is enabled.
            </p>
          </div>
          {microphoneDevices.length > 0 ? (
            <label className="block text-xs text-brand-muted">
              <span className="mb-1 block">Microphone</span>
              <select
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:border-brand-cyan/60 focus:outline-none"
              >
                <option value="">System default</option>
                {microphoneDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {deviceWarning ? (
            <p className="text-xs text-brand-amber">{deviceWarning}</p>
          ) : null}
        </div>
      )}
    </SetupRack>
  );
}

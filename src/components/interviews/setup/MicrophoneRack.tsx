"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Mic, MicOff, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BTN_GHOST, BTN_SM, FIELD } from "@/components/marketing/ds";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[15px] text-brand-text">
            Verify your microphone before starting
          </p>
          <p className="text-sm text-brand-muted">
            TechInView uses your mic for real-time voice interaction with{" "}
            {interviewerName}.
          </p>
        </div>
        <button
          onClick={() => void handleMicCheck()}
          disabled={micStatus === "checking"}
          className={cn(
            BTN_GHOST,
            BTN_SM,
            "min-h-[44px] shrink-0 gap-2",
            micStatus === "granted" &&
              "border-brand-green/40 text-brand-green hover:border-brand-green hover:text-brand-green",
            micStatus === "denied" &&
              "border-brand-rose/40 text-brand-rose hover:border-brand-rose hover:text-brand-rose"
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
        <div className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4">
          <MicOff className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
          <p className="text-sm text-brand-rose">
            Microphone access was blocked. You can still type your responses
            during the interview, or grant access in your browser settings and
            try again.
          </p>
        </div>
      )}
      {micStatus === "granted" && (
        <div className="mt-5 space-y-4 border-t border-white/[0.08] pt-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
            <p className="text-sm text-brand-green">
              Microphone detected and working. Voice interaction is enabled.
            </p>
          </div>
          {microphoneDevices.length > 0 ? (
            <label className="block">
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
                Microphone
              </span>
              <select
                value={selectedDeviceId}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className={cn(FIELD, "bg-brand-deep")}
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
            <p className="text-sm text-brand-amber">{deviceWarning}</p>
          ) : null}
        </div>
      )}
    </SetupRack>
  );
}

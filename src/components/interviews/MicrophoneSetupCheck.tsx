"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewSetupSection } from "@/components/interviews/InterviewSetupLayout";
import { FIELD, FOCUS } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";

type MicStatus = "idle" | "checking" | "granted" | "denied";

export function MicrophoneSetupCheck() {
  const [status, setStatus] = useState<MicStatus>("idle");
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    deviceWarning,
  } = useMicrophoneDevices();

  async function checkMicrophone() {
    setStatus("checking");
    try {
      await refreshDevices(true);
      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }

  return (
    <InterviewSetupSection
      title="Microphone check"
      icon={<Mic className="h-3.5 w-3.5" />}
      description="Choose the microphone used for the live interview. Typed responses remain available if voice fails."
    >
      <div className="mt-5 space-y-4">
        <Button type="button" variant="outline" onClick={() => void checkMicrophone()} disabled={status === "checking"}>
          {status === "checking" ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Checking microphone...</>
          ) : status === "granted" ? (
            <><CheckCircle className="h-4 w-4 text-brand-green" />Microphone ready</>
          ) : status === "denied" ? (
            <><MicOff className="h-4 w-4 text-brand-rose" />Try microphone again</>
          ) : (
            <><Mic className="h-4 w-4" />Test microphone</>
          )}
        </Button>

        {status === "granted" && devices.length > 0 ? (
          <label className="block">
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">Microphone</span>
            <select
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              className={cn(FIELD, "bg-brand-deep")}
            >
              <option value="">System default</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {status === "denied" ? (
          <p className="text-sm text-brand-rose">
            Microphone access is blocked. You can grant access in browser settings or continue with typed responses.
          </p>
        ) : null}
        {deviceWarning ? <p className="text-sm text-brand-amber">{deviceWarning}</p> : null}
        <p className="text-xs leading-relaxed text-brand-muted">
          Audio is processed live by our voice provider. TechInView does not store raw microphone audio; transcripts and interview results are stored. See our <Link href="/privacy" className={cn("text-brand-cyan transition-colors hover:text-brand-text", FOCUS)}>Privacy Policy</Link>.
        </p>
      </div>
    </InterviewSetupSection>
  );
}

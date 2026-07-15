"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewSetupSection } from "@/components/interviews/InterviewSetupLayout";
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
      <div className="mt-4 space-y-3">
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
          <label className="block text-xs text-brand-muted">
            <span className="mb-1 block">Microphone</span>
            <select
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-card px-3 py-2.5 text-sm text-brand-text focus:border-brand-cyan/60 focus:outline-none"
            >
              <option value="">System default</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {status === "denied" ? (
          <p className="text-xs text-brand-rose">
            Microphone access is blocked. You can grant access in browser settings or continue with typed responses.
          </p>
        ) : null}
        {deviceWarning ? <p className="text-xs text-brand-amber">{deviceWarning}</p> : null}
        <p className="text-xs leading-relaxed text-brand-muted">
          Audio is processed live by our voice provider. TechInView does not store raw microphone audio; transcripts and interview results are stored. See our <Link href="/privacy" className="text-brand-cyan hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </InterviewSetupSection>
  );
}

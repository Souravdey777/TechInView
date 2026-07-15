"use client";

import { useCallback, useEffect, useState } from "react";

export type MicrophoneDevice = {
  deviceId: string;
  label: string;
};

const STORAGE_KEY = "techinview:microphone-device:v1";

export function useMicrophoneDevices() {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceIdState] = useState("");
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSelectedDeviceIdState(window.localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // Storage can be unavailable in hardened/private browser contexts.
    }
  }, []);

  const setSelectedDeviceId = useCallback((deviceId: string) => {
    setSelectedDeviceIdState(deviceId);
    setDeviceWarning(null);
    try {
      if (deviceId) window.localStorage.setItem(STORAGE_KEY, deviceId);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The selection still applies for this session when persistence is unavailable.
    }
  }, []);

  const refreshDevices = useCallback(async (requestPermission = false) => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];

    if (requestPermission) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.getTracks().forEach((track) => track.stop());
    }

    const available = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
      }));

    setDevices(available);
    setSelectedDeviceIdState((current) => {
      if (!current || available.some((device) => device.deviceId === current)) {
        return current;
      }

      setDeviceWarning("Your selected microphone is unavailable. Using the system default.");
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage failures while falling back to the default device.
      }
      return "";
    });

    return available;
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    void refreshDevices(false);
    const handleDeviceChange = () => {
      void refreshDevices(false);
    };
    navigator.mediaDevices.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  useEffect(() => {
    if (!selectedDeviceId || devices.length === 0) return;
    if (devices.some((device) => device.deviceId === selectedDeviceId)) return;

    setDeviceWarning("Your selected microphone is unavailable. Using the system default.");
    setSelectedDeviceIdState("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures while falling back to the default device.
    }
  }, [devices, selectedDeviceId]);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    deviceWarning,
  };
}

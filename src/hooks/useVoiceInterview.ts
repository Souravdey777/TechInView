"use client";
import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API types
type SpeechRecognitionType = {
  new (): SpeechRecognitionInstance;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
    };
  }) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

// SpeechRecognition & webkitSpeechRecognition are declared in lib.dom.d.ts.
// We cast at usage to our local SpeechRecognitionType.

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

export function useVoiceInterview() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");

  // Start listening — non-continuous mode so it auto-stops after silence
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor =
      (win.SpeechRecognition || win.webkitSpeechRecognition) as SpeechRecognitionType | undefined;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false; // Stop after user pauses speaking
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Track full transcript across results
    transcriptRef.current = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update with whatever we have — final takes priority
      const current = finalTranscript || interimTranscript;
      if (current) {
        transcriptRef.current = current;
        setTranscript(current);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceState("listening");
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceState("idle");
      // Recognition ended naturally (user stopped talking)
      // The transcript is already set via onresult
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      setVoiceState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // Stop listening manually
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    setVoiceState("idle");
  }, []);

  // Get the current transcript (use ref for synchronous access)
  const getTranscript = useCallback(() => {
    return transcriptRef.current;
  }, []);

  // Cache the best available en-US voice so we don't re-scan on every utterance
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined") return null;
    if (preferredVoiceRef.current) return preferredVoiceRef.current;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Priority order: natural/premium en-US voices that sound human
    const preferred = [
      "Google US English",
      "Samantha",          // macOS
      "Alex",              // macOS (older)
      "Microsoft David - English (United States)",
      "Microsoft Zira - English (United States)",
    ];

    for (const name of preferred) {
      const match = voices.find((v) => v.name === name);
      if (match) { preferredVoiceRef.current = match; return match; }
    }

    // Fallback: first en-US voice available
    const enUs = voices.find((v) => v.lang === "en-US");
    if (enUs) { preferredVoiceRef.current = enUs; return enUs; }

    return null;
  }, []);

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceState("speaking");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceState("idle");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceState("idle");
    };
    window.speechSynthesis.speak(utterance);
  }, [getPreferredVoice]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceState("idle");
  }, []);

  // Warm up the voice cache once voices are available.
  // Chrome loads voices asynchronously; the voiceschanged event fires when ready.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const populate = () => { getPreferredVoice(); };
    window.speechSynthesis.addEventListener("voiceschanged", populate);
    populate(); // also try immediately (Firefox / Safari have voices synchronously)
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", populate);
    };
  }, [getPreferredVoice]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  return {
    voiceState,
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    setTranscript,
    getTranscript,
  };
}

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

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionType;
    webkitSpeechRecognition?: SpeechRecognitionType;
  }
}

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

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
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
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceState("idle");
  }, []);

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

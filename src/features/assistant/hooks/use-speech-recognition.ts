"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly results: { readonly length: number; readonly [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

interface Options {
  lang?: string;
  /** Chamado ao parar a gravação com algum texto reconhecido (não é chamado ao cancelar). */
  onFinalTranscript: (text: string) => void;
}

export function useSpeechRecognition({ lang = "pt-BR", onFinalTranscript }: Options) {
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => getSpeechRecognition() !== undefined,
    () => true
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const cancelledRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) current += event.results[i][0].transcript;
      transcriptRef.current = current;
      setTranscript(current);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      const text = transcriptRef.current.trim();
      transcriptRef.current = "";
      setTranscript("");
      if (!cancelledRef.current && text) onFinalRef.current(text);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    cancelledRef.current = false;
    transcriptRef.current = "";
    setTranscript("");
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition", error);
    }
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  return { isSupported, isListening, transcript, start, stop, cancel };
}

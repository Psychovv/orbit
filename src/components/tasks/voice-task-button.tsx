"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCategory } from "@/types/orbit";

interface VoiceTaskButtonProps {
  categories: TaskCategory[];
  onVoiceResult: (result: {
    title?: string;
    date?: string;
    time?: string;
    categoryId?: string;
  }) => void;
}

export function VoiceTaskButton({ categories, onVoiceResult }: VoiceTaskButtonProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          setIsListening(false);
          await processVoiceText(text);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const processVoiceText = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/tasks/parse-voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          currentDate: new Date().toISOString(),
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onVoiceResult(data);
      } else {
        console.error("Failed to parse voice text");
      }
    } catch (error) {
      console.error("Error calling parse-voice API", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  if (!isSupported) {
    return null; // Oculta o botão se a API de voz não for suportada
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleListen}
      disabled={isProcessing}
      className={`h-9.5 w-9.5 p-0 flex items-center justify-center transition-all ${
        isListening
          ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10"
          : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
      title="Criar tarefa por voz"
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
      )}
    </Button>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCategory } from "@/types/orbit";
import { cn } from "@/lib/utils";

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
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.interimResults = true;
        recognition.continuous = true; // Use continuous to allow manual stop without cutting off

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = 0; i < event.results.length; ++i) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          transcriptRef.current = current;
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // When recognition ends (either manually stopped or timed out), process the text
          if (transcriptRef.current.trim()) {
            processVoiceText(transcriptRef.current);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch(e) {}
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
      setTranscript("");
      transcriptRef.current = "";
    }
  };

  const handleToggleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Stopping it will trigger onend, which processes the text
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setTranscript("");
        transcriptRef.current = "";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative flex items-center">
      {/* Transcript Popover */}
      {(isListening || isProcessing) && transcript && (
        <div className="absolute right-0 bottom-full mb-2 w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-2">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-[#844DFE] animate-spin shrink-0 mt-0.5" />
            ) : (
              <div className="relative flex h-3 w-3 mt-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
            )}
            <div className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300">
              {isProcessing ? (
                <span className="text-zinc-500 dark:text-zinc-400 font-medium italic">Processando...</span>
              ) : (
                <span className="italic">"{transcript}"</span>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleListen}
        disabled={isProcessing}
        className={cn(
          "h-9.5 w-9.5 p-0 flex items-center justify-center transition-all",
          isListening
            ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
        title={isListening ? "Parar gravação" : "Criar tarefa por voz"}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <Square className="w-4 h-4 fill-current" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

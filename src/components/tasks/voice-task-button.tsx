"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCategory } from "@/types/orbit";
import { cn } from "@/lib/utils";

interface VoiceTaskButtonProps {
  categories: TaskCategory[];
  onVoiceResult: (results: Array<{
    title?: string;
    date?: string;
    time?: string;
    categoryId?: string;
  }>) => void;
}

export function VoiceTaskButton({ categories, onVoiceResult }: VoiceTaskButtonProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.interimResults = true;
        recognition.continuous = true;

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
          if (!isCancelledRef.current && transcriptRef.current.trim()) {
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
        const errorText = await response.text();
        console.error("Failed to parse voice text:", errorText);
      }
    } catch (error) {
      console.error("Error calling parse-voice API", error);
    } finally {
      setIsProcessing(false);
      setTranscript("");
      transcriptRef.current = "";
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setIsListening(false);
    setTranscript("");
    transcriptRef.current = "";
  };

  const handleToggleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        isCancelledRef.current = false;
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
      {/* Transcript Fixed Overlay */}
      {(isListening || isProcessing) && (
        <div className="fixed inset-x-0 bottom-10 md:bottom-24 mx-auto w-[90%] max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          {/* Cancel Button */}
          {isListening && (
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Cancelar gravação"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col items-center text-center gap-4">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-[#844DFE] animate-spin" />
            ) : (
              <div className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500"></span>
              </div>
            )}
            <div className="text-lg md:text-2xl font-medium text-zinc-800 dark:text-zinc-100 max-h-[30vh] overflow-y-auto w-full px-2">
              {isProcessing ? (
                <span className="text-zinc-500 dark:text-zinc-400 italic animate-pulse">Processando sua fala com IA...</span>
              ) : transcript ? (
                <span>"{transcript}"</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 italic">Ouvindo... (Pode falar)</span>
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

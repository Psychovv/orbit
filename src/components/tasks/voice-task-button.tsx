"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Loader2, Square, X, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCategory } from "@/types/orbit";
import { cn } from "@/lib/utils";

interface AiTaskButtonProps {
  categories: TaskCategory[];
  onVoiceResult: (results: Array<{
    title?: string;
    date?: string;
    time?: string;
    categoryId?: string;
  }>) => void;
}

export function VoiceTaskButton({ categories, onVoiceResult }: AiTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
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
            processAIText(transcriptRef.current);
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

  const processAIText = async (text: string) => {
    if (!text.trim()) return;
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
        setIsOpen(false);
        setInputText("");
      } else {
        const errorText = await response.text();
        console.error("Failed to parse AI text:", errorText);
      }
    } catch (error) {
      console.error("Error calling parse API", error);
    } finally {
      setIsProcessing(false);
      setTranscript("");
      transcriptRef.current = "";
    }
  };

  const handleCancelVoice = () => {
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

  const handleSubmitText = () => {
    processAIText(inputText);
  };

  return (
    <div className="relative flex items-center">
      {/* AI Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9.5 px-3 flex items-center gap-2 text-[#844DFE] dark:text-[#b494ff] border-[#844DFE]/30 bg-[#844DFE]/5 hover:bg-[#844DFE]/10 transition-colors"
        title="Orbit AI"
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-medium hidden sm:inline">Orbit AI</span>
      </Button>

      {/* AI Chat/Voice Overlay */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-10 md:bottom-24 mx-auto w-[90%] max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-[#844DFE] dark:text-[#b494ff]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold text-lg tracking-tight">Orbit AI</h3>
            </div>
            {!isListening && !isProcessing && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {isListening && (
              <button
                onClick={handleCancelVoice}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Cancelar gravação"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {(isListening || isProcessing) ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
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
                  <span className="text-zinc-500 dark:text-zinc-400 italic animate-pulse">Processando com IA...</span>
                ) : transcript ? (
                  <span>"{transcript}"</span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 italic">Ouvindo... (Pode falar)</span>
                )}
              </div>
              
              {isListening && (
                <Button
                  onClick={() => recognitionRef.current?.stop()}
                  className="mt-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border-none rounded-xl"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Parar e Enviar
                </Button>
              )}
            </div>
          ) : (
            <div className="relative flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Ex: Comprar leite amanhã de manhã..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputText.trim()) {
                    handleSubmitText();
                  }
                }}
                className="pr-24 h-14 text-base rounded-2xl border-zinc-300 dark:border-zinc-700 focus-visible:ring-[#844DFE]/30"
              />
              <div className="absolute right-1.5 flex items-center gap-1.5">
                {isSupported && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleToggleListen}
                    className="h-11 w-11 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Gravar áudio"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  onClick={handleSubmitText}
                  disabled={!inputText.trim()}
                  className="h-11 w-11 bg-[#844DFE] hover:bg-[#7239ea] text-white rounded-xl shadow-md transition-colors"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

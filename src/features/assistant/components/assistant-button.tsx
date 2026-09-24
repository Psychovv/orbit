"use client";

import React, { useState } from "react";
import { Mic, Loader2, Square, X, Sparkles, Send } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ASSISTANT_TEXT_MAX } from "../domain/actions";
import { useSpeechRecognition } from "../hooks/use-speech-recognition";

interface AssistantButtonProps {
  title?: string;
  placeholder: string;
  /** Deve lançar um erro com mensagem amigável quando falhar. */
  onSubmit: (text: string) => Promise<void>;
}

export function AssistantButton({ title = "Orbit AI", placeholder, onSubmit }: AssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setIsOpen(false);
      setInputText("");
    } catch (err) {
      console.error("Assistant request failed", err);
      setError(err instanceof Error ? err.message : "Não foi possível processar o pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speech = useSpeechRecognition({ onFinalTranscript: submit });

  return (
    <div className="relative flex items-center">
      {/* AI Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9.5 px-3 flex items-center gap-2 text-brand dark:text-brand-soft border-brand/30 bg-brand/5 hover:bg-brand/10 transition-colors"
        title={title}
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-medium hidden sm:inline">Orbit AI</span>
      </Button>

      {/* AI Chat/Voice Overlay */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-10 md:bottom-24 mx-auto w-[90%] max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-brand dark:text-brand-soft">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold text-lg tracking-tight">Orbit AI</h3>
            </div>
            {!speech.isListening && !isProcessing && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {speech.isListening && (
              <button
                onClick={speech.cancel}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Cancelar gravação"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {speech.isListening || isProcessing ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              ) : (
                <div className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500"></span>
                </div>
              )}
              <div className="text-lg md:text-2xl font-medium text-zinc-800 dark:text-zinc-100 max-h-[30vh] overflow-y-auto w-full px-2">
                {isProcessing ? (
                  <span className="text-zinc-500 dark:text-zinc-400 italic animate-pulse">Processando com IA...</span>
                ) : speech.transcript ? (
                  <span>&ldquo;{speech.transcript}&rdquo;</span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 italic">Ouvindo... (Pode falar)</span>
                )}
              </div>

              {speech.isListening && (
                <Button
                  onClick={speech.stop}
                  className="mt-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border-none rounded-xl"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Parar e Enviar
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="relative flex items-center gap-2">
                <Input
                  autoFocus
                  placeholder={placeholder}
                  value={inputText}
                  maxLength={ASSISTANT_TEXT_MAX}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit(inputText);
                  }}
                  className="pr-24 h-14 text-base rounded-2xl border-zinc-300 dark:border-zinc-700 focus-visible:ring-brand/30"
                />
                <div className="absolute right-1.5 flex items-center gap-1.5">
                  {speech.isSupported && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={speech.start}
                      className="h-11 w-11 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Gravar áudio"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={() => submit(inputText)}
                    disabled={!inputText.trim()}
                    className="h-11 w-11 bg-brand hover:bg-brand-strong text-white rounded-xl shadow-md transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {error && <p className="mt-3 text-sm font-medium text-rose-500">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

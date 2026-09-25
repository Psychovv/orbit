/** Header HTTP que indica se a resposta veio do Gemini ou do fallback local. */
export const ASSISTANT_SOURCE_HEADER = "x-orbit-assistant-source";

export type AssistantSource = "model" | "local";

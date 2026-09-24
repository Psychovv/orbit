import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, currentDate, categories } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-pro or gemini-1.5-flash since we are using structured JSON parsing.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é um assistente pessoal encarregado de extrair informações de tarefas a partir de um texto falado pelo usuário.
Sua saída deve ser EXCLUSIVAMENTE um objeto JSON válido, sem markdown, contendo os seguintes campos:
- title: string (o nome ou título principal da tarefa, extraído da fala).
- date: string opcional (a data inferida no formato YYYY-MM-DD. A data atual de referência é ${currentDate}).
- time: string opcional (o horário inferido no formato HH:MM).
- categoryId: string opcional (o ID da categoria que melhor se encaixa, baseado na lista abaixo. Retorne nulo ou omita se não se encaixar em nenhuma).

Lista de categorias disponíveis (id: name):
${categories.map((c: any) => `- ${c.id}: ${c.name}`).join("\n")}

Texto falado: "${text}"
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error parsing voice task:", error);
    return NextResponse.json(
      { error: "Failed to parse voice task" },
      { status: 500 }
    );
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, currentDate, categories, pendingTasks } = body;

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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `Retorne um JSON EXATO: { "create": [{title:string, date?:YYYY-MM-DD, time?:HH:MM, categoryId?:string}], "completeIds": [string] }.
Regras:
1. 'create' tem tarefas novas.
2. 'completeIds' tem IDs (string) das tarefas existentes que o usuario pediu para finalizar/concluir. 
Hoje: ${currentDate}
Cats: ${categories.map((c: any) => `${c.id}:${c.name}`).join(", ")}
Tarefas Existentes: ${(pendingTasks || []).map((t: any) => `${t.id}:${t.title}`).join(" | ")}
Texto: "${text}"`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    let responseText = result.response.text();
    // Strip markdown formatting if the model still returns it
    responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error parsing voice task:", error);
    return NextResponse.json(
      { error: "Failed to parse voice task", details: error.message || String(error) },
      { status: 500 }
    );
  }
}

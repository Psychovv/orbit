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
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
Você é um assistente financeiro encarregado de extrair transações financeiras (receitas ou despesas) a partir de um texto falado pelo usuário.
O usuário pode ter falado sobre UMA ou VÁRIAS transações.
Sua saída deve ser EXCLUSIVAMENTE um array JSON válido (uma lista de objetos), sem markdown, onde cada objeto representa uma transação contendo os seguintes campos:
- description: string (a descrição breve ou título da transação, ex: "Almoço", "Salário", "Uber").
- amount: number (o valor numérico da transação, ex: 45.90. Se o usuário falar "45 e 90", entenda como 45.90).
- type: string (deve ser OBRIGATORIAMENTE "expense" para despesas/gastos ou "income" para receitas/ganhos).
- date: string opcional (a data inferida no formato YYYY-MM-DD. A data atual de referência é ${currentDate}).
- categoryId: string opcional (o ID da categoria que melhor se encaixa, baseado na lista abaixo. Retorne nulo ou omita se não se encaixar).
- paymentMethod: string opcional (deve ser OBRIGATORIAMENTE um destes: "pix", "cartao", "dinheiro", "boleto", "transferencia". Tente deduzir da fala. Se não for possível, retorne nulo).

Lista de categorias disponíveis (id: name - type):
${categories.map((c: any) => `- ${c.id}: ${c.name} (${c.type})`).join("\n")}

Texto falado: "${text}"

Lembre-se: Retorne SEMPRE um Array [ { ... } ], mesmo que haja apenas uma transação.
`;

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
    console.error("Error parsing voice finance:", error);
    return NextResponse.json(
      { error: "Failed to parse voice finance", details: error.message || String(error) },
      { status: 500 }
    );
  }
}

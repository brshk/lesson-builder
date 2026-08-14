import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { DIRECTIONS } from "@/lib/directions";
import { getProgramText, isDriveConfigured } from "@/lib/drive";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

type Provider = "claude" | "gemini";

/** Перетворює технічні помилки провайдерів на зрозумілі повідомлення. */
function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("credit balance is too low")) {
    return "Недостатньо кредитів на акаунті Anthropic. Поповніть баланс: console.anthropic.com → Plans & Billing → Purchase credits.";
  }
  if (lower.includes("invalid x-api-key") || lower.includes("authentication_error")) {
    return "Невалідний API-ключ Anthropic. Перевірте ключ у полі угорі форми (console.anthropic.com → API Keys).";
  }
  if (lower.includes("api key not valid") || lower.includes("api_key_invalid")) {
    return "Невалідний API-ключ Gemini. Перевірте ключ у полі угорі форми (aistudio.google.com/apikey).";
  }
  if (lower.includes("resource_exhausted") || lower.includes("quota")) {
    return "Вичерпано безкоштовний денний ліміт Gemini. Спробуйте пізніше (ліміт оновлюється щодня) або скористайтеся ключем Claude.";
  }
  if (lower.includes("overloaded")) {
    return "Сервіс перевантажений. Зачекайте хвилину та спробуйте ще раз.";
  }
  return raw;
}

export async function POST(req: NextRequest) {
  const provider: Provider =
    req.headers.get("x-provider") === "gemini" ? "gemini" : "claude";
  const userApiKey = req.headers.get("x-user-api-key")?.trim();
  const apiKey =
    userApiKey ||
    (provider === "claude"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.GEMINI_API_KEY);

  if (!apiKey) {
    const hint =
      provider === "claude"
        ? "Введіть свій ключ Anthropic (console.anthropic.com) у полі угорі форми."
        : "Введіть свій безкоштовний ключ Gemini (aistudio.google.com/apikey) у полі угорі форми.";
    return new Response(JSON.stringify({ error: `Не вказано API-ключ. ${hint}` }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Невалідний запит" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.discipline?.trim() || !body.topic?.trim() || !body.materialTypes?.length) {
    return new Response(
      JSON.stringify({ error: "Заповніть дисципліну, тему та оберіть хоча б один тип матеріалу" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const direction =
    DIRECTIONS.find((d) => d.id === body.directionId)?.name ?? body.directionId;

  let program: { name: string; text: string } | undefined;
  if (body.programFileId && isDriveConfigured()) {
    try {
      program = await getProgramText(body.programFileId);
    } catch (e) {
      console.error("Drive program fetch failed:", e);
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(body, direction, program);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      try {
        if (body.programFileId && !program) {
          send("status", {
            message:
              "⚠️ Не вдалося прочитати програму навчання з Google Drive — генерую без неї.",
          });
        }
        send("status", { message: "Шукаю інформацію та генерую матеріали…" });

        if (provider === "claude") {
          await generateWithClaude(apiKey, systemPrompt, userPrompt, send);
        } else {
          await generateWithGemini(apiKey, systemPrompt, userPrompt, send);
        }
        send("done", {});
      } catch (e) {
        const message = e instanceof Error ? e.message : "Помилка генерації";
        send("error", { error: friendlyError(message) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

type SendFn = (event: string, data: unknown) => void;

async function generateWithClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  send: SendFn
) {
  const client = new Anthropic({ apiKey });
  const messageStream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 32000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
  });

  messageStream.on("text", (textDelta) => {
    send("text", { text: textDelta });
  });

  messageStream.on("streamEvent", (event) => {
    if (
      event.type === "content_block_start" &&
      event.content_block.type === "server_tool_use"
    ) {
      send("status", { message: "🔎 Виконую веб-пошук…" });
    }
  });

  await messageStream.finalMessage();
}

async function generateWithGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  send: SendFn
) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 32768 },
      }),
    }
  );

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => "");
    throw new Error(errText || `Gemini API error ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let searchAnnounced = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload);
        const candidate = chunk.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];
        for (const part of parts) {
          if (part.text) send("text", { text: part.text });
        }
        if (!searchAnnounced && candidate?.groundingMetadata) {
          searchAnnounced = true;
          send("status", { message: "🔎 Використано пошук Google…" });
        }
      } catch {
        // неповний JSON-фрагмент — ігноруємо
      }
    }
  }
}

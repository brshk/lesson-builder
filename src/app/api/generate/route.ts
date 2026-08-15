import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { DIRECTIONS } from "@/lib/directions";
import { getProgramText, isDriveConfigured } from "@/lib/drive";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { getPortalDoc } from "@/lib/portal";
import { driveRefFor } from "@/lib/programDrive";
import { fetchDriveProgram } from "@/lib/driveProgramFetch";
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

type Provider = "claude" | "gemini" | "openai";

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
  if (lower.includes("incorrect api key") || lower.includes("invalid_api_key")) {
    return "Невалідний API-ключ OpenAI. Перевірте ключ у полі угорі форми (platform.openai.com/api-keys).";
  }
  if (lower.includes("insufficient_quota")) {
    return "Недостатньо коштів на акаунті OpenAI. Поповніть баланс: platform.openai.com → Billing.";
  }
  if (lower.includes("resource_exhausted") || lower.includes("quota")) {
    return "Вичерпано безкоштовний денний ліміт Gemini. Спробуйте пізніше (ліміт оновлюється щодня) або скористайтеся іншим провайдером.";
  }
  if (lower.includes("overloaded")) {
    return "Сервіс перевантажений. Зачекайте хвилину та спробуйте ще раз.";
  }
  return raw;
}

const ENV_KEY_BY_PROVIDER: Record<Provider, string | undefined> = {
  claude: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
};

const KEY_HINT: Record<Provider, string> = {
  claude: "Введіть свій ключ Anthropic (console.anthropic.com) у полі угорі форми.",
  gemini:
    "Введіть свій безкоштовний ключ Gemini (aistudio.google.com/apikey) у полі угорі форми.",
  openai: "Введіть свій ключ OpenAI (platform.openai.com/api-keys) у полі угорі форми.",
};

export async function POST(req: NextRequest) {
  const providerHeader = req.headers.get("x-provider");
  const provider: Provider =
    providerHeader === "gemini" || providerHeader === "openai"
      ? providerHeader
      : "claude";
  const userApiKey = req.headers.get("x-user-api-key")?.trim();
  const apiKey = userApiKey || ENV_KEY_BY_PROVIDER[provider];

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: `Не вказано API-ключ. ${KEY_HINT[provider]}` }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
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

  const dir = DIRECTIONS.find((d) => d.id === body.directionId);
  const direction = dir ? `${dir.code} — ${dir.name}` : body.directionId;

  // 1) навчальна програма, прив'язана до продукту на Google Drive
  let program: { name: string; text: string } | undefined;
  const driveRef = driveRefFor(body.product);
  if (driveRef) {
    program = await fetchDriveProgram(driveRef);
  }

  // 2) або файл, обраний вручну зі спільної папки (сервісний акаунт)
  if (!program && body.programFileId && isDriveConfigured()) {
    try {
      program = await getProgramText(body.programFileId);
    } catch (e) {
      console.error("Drive program fetch failed:", e);
    }
  }

  // Офіційний опис продукту з ПКО-порталу (зліпок або живе API)
  const portalDoc = await getPortalDoc(body.product);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(body, direction, program, portalDoc);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      try {
        if (program) {
          send("status", {
            message: `📘 Навчальна програма з Google Drive: «${program.name}».`,
          });
        } else if (driveRef || body.programFileId) {
          send("status", {
            message:
              "⚠️ Не вдалося прочитати навчальну програму з Google Drive — генерую без неї.",
          });
        }
        if (portalDoc) {
          send("status", {
            message: `📄 Враховано опис продукту «${portalDoc.title}» з ПКО-порталу${
              portalDoc.live ? "" : " (збережена копія)"
            }.`,
          });
        }
        send("status", { message: "Шукаю інформацію та генерую матеріали…" });

        if (provider === "claude") {
          await generateWithClaude(apiKey, systemPrompt, userPrompt, send);
        } else if (provider === "gemini") {
          await generateWithGemini(apiKey, systemPrompt, userPrompt, send);
        } else {
          await generateWithOpenAI(apiKey, systemPrompt, userPrompt, send);
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

async function generateWithOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  send: SendFn
) {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: systemPrompt,
      input: userPrompt,
      tools: [{ type: "web_search" }],
      max_output_tokens: 32000,
      stream: true,
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => "");
    throw new Error(errText || `OpenAI API error ${resp.status}`);
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
        if (chunk.type === "response.output_text.delta" && chunk.delta) {
          send("text", { text: chunk.delta });
        } else if (
          !searchAnnounced &&
          typeof chunk.type === "string" &&
          chunk.type.startsWith("response.web_search_call")
        ) {
          searchAnnounced = true;
          send("status", { message: "🔎 Виконую веб-пошук…" });
        } else if (chunk.type === "error" || chunk.type === "response.failed") {
          const msg =
            chunk.error?.message ??
            chunk.response?.error?.message ??
            "Помилка OpenAI";
          throw new Error(msg);
        }
      } catch (e) {
        // прокидаємо лише справжні помилки, а не неповні JSON-фрагменти
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
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

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
/**
 * Моделі Gemini пробуються по черзі: Google періодично закриває старі
 * для нових ключів, тому список кандидатів рятує від «404 no longer available».
 */
const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : [
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

type Provider = "claude" | "gemini" | "openai" | "free";

/** Скільки безкоштовних генерацій на день дозволено одному викладачу. */
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT || 5);
const FREE_COOKIE = "lb_free_used";

function readFreeUsage(req: NextRequest): number {
  const raw = req.cookies.get(FREE_COOKIE)?.value;
  if (!raw) return 0;
  const [day, n] = raw.split(":");
  const today = new Date().toISOString().slice(0, 10);
  return day === today ? Number(n) || 0 : 0;
}

function freeUsageCookie(used: number): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${FREE_COOKIE}=${today}:${used}; Path=/; Max-Age=86400; SameSite=Lax`;
}

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
    return "Вичерпано денний ліміт безкоштовного тарифу Google. Спробуйте пізніше (ліміт оновлюється щодня) або скористайтеся власним ключем — вкладки Gemini, ChatGPT чи Claude.";
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
  free: process.env.GEMINI_API_KEY,
};

const KEY_HINT: Record<Provider, string> = {
  claude: "Введіть свій ключ Anthropic (console.anthropic.com) у полі угорі форми.",
  gemini:
    "Введіть свій безкоштовний ключ Gemini (aistudio.google.com/apikey) у полі угорі форми.",
  openai: "Введіть свій ключ OpenAI (platform.openai.com/api-keys) у полі угорі форми.",
  free:
    "Безкоштовний режим ще не налаштовано адміністратором: у змінних середовища Vercel має бути GEMINI_API_KEY.",
};

export async function POST(req: NextRequest) {
  const providerHeader = req.headers.get("x-provider");
  const provider: Provider =
    providerHeader === "gemini" ||
    providerHeader === "openai" ||
    providerHeader === "free"
      ? providerHeader
      : "claude";

  // Безкоштовний режим — спільний ключ академії + денний ліміт на браузер
  let freeUsed = 0;
  if (provider === "free") {
    freeUsed = readFreeUsage(req);
    if (freeUsed >= FREE_DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `Вичерпано денний ліміт безкоштовних генерацій (${FREE_DAILY_LIMIT} на добу). Спробуйте завтра або скористайтеся власним ключем — вкладка Gemini (безкоштовний ключ), ChatGPT чи Claude.`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const userApiKey =
    provider === "free" ? undefined : req.headers.get("x-user-api-key")?.trim();
  const apiKey = userApiKey || ENV_KEY_BY_PROVIDER[provider];

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          provider === "free"
            ? KEY_HINT.free
            : `Не вказано API-ключ. ${KEY_HINT[provider]}`,
      }),
      { status: provider === "free" ? 503 : 401, headers: { "Content-Type": "application/json" } }
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

        if (provider === "free") {
          send("status", {
            message: `🎁 Безкоштовний режим: залишилось генерацій сьогодні — ${
              FREE_DAILY_LIMIT - freeUsed - 1
            } із ${FREE_DAILY_LIMIT}.`,
          });
        }

        if (provider === "claude") {
          await generateWithClaude(apiKey, systemPrompt, userPrompt, send);
        } else if (provider === "gemini" || provider === "free") {
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

  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
  if (provider === "free") {
    headers["Set-Cookie"] = freeUsageCookie(freeUsed + 1);
  }

  return new Response(stream, { headers });
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

  const handleLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
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
          chunk.error?.message ?? chunk.response?.error?.message ?? "Помилка OpenAI";
        throw new Error(msg);
      }
    } catch (e) {
      // прокидаємо лише справжні помилки, а не неповні JSON-фрагменти
      if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  // фінальний рядок без \n наприкінці — інакше губиться кінець відповіді
  buffer += decoder.decode();
  for (const line of buffer.split("\n")) handleLine(line);
}


/**
 * Генерація через Gemini з двома рівнями стійкості:
 *  1. перебір «модель × пошук × міркування» — обхід 404 (закрита модель)
 *     і 429 (пошук недоступний на безкоштовному тарифі);
 *  2. автопродовження, якщо потік обірвався без finishReason або на MAX_TOKENS.
 */
async function generateWithGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  send: SendFn
) {
  type Turn = { role: "user" | "model"; parts: { text: string }[] };

  const makeBody = (
    contents: Turn[],
    withSearch: boolean,
    withThinking: boolean
  ) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: {
        // у Gemini 3.x токени «міркувань» списуються з цього ж бюджету
        maxOutputTokens: 65536,
        temperature: 0.7,
        ...(withThinking ? { thinkingConfig: { thinkingLevel: "high" } } : {}),
      },
    });

  const [best, ...fallbacks] = GEMINI_MODELS;
  const attempts: { model: string; search: boolean; think: boolean }[] = [
    { model: best, search: true, think: true },
    { model: best, search: false, think: true },
    { model: best, search: false, think: false },
    ...fallbacks.map((m) => ({ model: m, search: false, think: false })),
  ];

  /** Один прохід стріму. Повертає текст і причину завершення. */
  async function runStream(
    contents: Turn[],
    withSearch: boolean,
    withThinking: boolean,
    model: string
  ): Promise<{ ok: boolean; status: number; err?: string; text: string; finish: string }> {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: makeBody(contents, withSearch, withThinking),
      }
    );
    if (!r.ok || !r.body) {
      return {
        ok: false,
        status: r.status,
        err: await r.text().catch(() => `${r.status}`),
        text: "",
        finish: "",
      };
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let finish = "";
    let searchAnnounced = false;

    const handleLine = (line: string) => {
      if (!line.startsWith("data:")) return;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const candidate = chunk.candidates?.[0];
        for (const part of candidate?.content?.parts ?? []) {
          if (part.text) {
            text += part.text;
            send("text", { text: part.text });
          }
        }
        if (candidate?.finishReason) finish = candidate.finishReason;
        if (!searchAnnounced && candidate?.groundingMetadata) {
          searchAnnounced = true;
          send("status", { message: "🔎 Використано пошук Google…" });
        }
      } catch {
        /* неповний JSON-фрагмент */
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
    }
    // фінальний рядок приходить без \n — саме в ньому finishReason
    buffer += decoder.decode();
    for (const line of buffer.split("\n")) handleLine(line);

    return { ok: true, status: 200, text, finish };
  }

  // ── перший прохід: підбираємо робочу комбінацію ──
  const baseContents: Turn[] = [{ role: "user", parts: [{ text: userPrompt }] }];
  let chosen: { model: string; search: boolean; think: boolean } | undefined;
  let first: Awaited<ReturnType<typeof runStream>> | undefined;
  let lastErr = "";

  for (const a of attempts) {
    const res = await runStream(baseContents, a.search, a.think, a.model);
    if (res.ok) {
      chosen = a;
      first = res;
      break;
    }
    lastErr = res.err || `${res.status}`;
    if (res.status === 401 || res.status === 403) break;
  }

  if (!chosen || !first) throw new Error(lastErr || "Gemini API error");

  if (!chosen.search) {
    send("status", {
      message:
        "ℹ️ Веб-пошук недоступний на безкоштовному тарифі Google — матеріали побудовано на навчальній програмі, описі продукту та знаннях моделі.",
    });
  }

  let full = first.text;
  let finish = first.finish;

  if (!full) {
    throw new Error(
      "Модель повернула порожню відповідь. Спробуйте ще раз або зменшіть обсяг запиту."
    );
  }

  // ── автопродовження: потік обірвався (немає finishReason) або впёрся в ліміт ──
  const MAX_CONTINUATIONS = 3;
  for (let i = 0; i < MAX_CONTINUATIONS && finish !== "STOP"; i++) {
    send("status", {
      message: `↻ Відповідь обірвалася — дописую продовження (${i + 1}/${MAX_CONTINUATIONS})…`,
    });

    const contents: Turn[] = [
      ...baseContents,
      { role: "model", parts: [{ text: full }] },
      {
        role: "user",
        parts: [
          {
            text:
              "Текст обірвався. Продовж рівно з місця обриву — не повторюй уже написане, " +
              "не починай спочатку, не додавай вступних фраз. Просто допиши документ до кінця " +
              "за тією ж структурою і тією ж мовою.",
          },
        ],
      },
    ];

    const next = await runStream(contents, false, chosen.think, chosen.model);
    if (!next.ok || !next.text) break;
    full += next.text;
    finish = next.finish;
  }

  if (finish !== "STOP") {
    send("status", {
      message:
        "⚠️ Матеріал може бути неповним — генерацію обірвано за лімітом. Спробуйте згенерувати типи матеріалів окремо або зменшити тривалість заняття.",
    });
  }
}

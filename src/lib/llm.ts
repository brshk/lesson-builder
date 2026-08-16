/**
 * Спільний шар доступу до LLM для всіх ендпоінтів.
 *
 * Тут живуть:
 *  - вибір провайдера та ключа (BYOK або ключ академії);
 *  - стрімінг тексту (`streamText`) — генерація уроку і правки блоків;
 *  - разовий JSON-виклик (`generateJson`) — аналіз відповідності програмі.
 *
 * Раніше все це лежало в /api/generate; винесено, щоб редактор і аналітика
 * не дублювали обхід 404/429 Gemini та фікс SSE-парсера.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

export type Provider = "claude" | "gemini" | "openai" | "free";

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

/**
 * Моделі Gemini пробуються по черзі: Google періодично закриває старі
 * для нових ключів, тому список кандидатів рятує від «404 no longer available».
 */
export const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash"];

export const ENV_KEY_BY_PROVIDER: Record<Provider, string | undefined> = {
  claude: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  free: process.env.GEMINI_API_KEY,
};

export const KEY_HINT: Record<Provider, string> = {
  claude: "Введіть свій ключ Anthropic (console.anthropic.com) у полі угорі форми.",
  gemini:
    "Введіть свій безкоштовний ключ Gemini (aistudio.google.com/apikey) у полі угорі форми.",
  openai: "Введіть свій ключ OpenAI (platform.openai.com/api-keys) у полі угорі форми.",
  free:
    "Безкоштовний режим ще не налаштовано адміністратором: у змінних середовища Vercel має бути GEMINI_API_KEY.",
};

export function resolveProvider(req: NextRequest): Provider {
  const h = req.headers.get("x-provider");
  return h === "gemini" || h === "openai" || h === "free" ? h : "claude";
}

export function resolveApiKey(req: NextRequest, provider: Provider): string | undefined {
  const userKey = provider === "free" ? undefined : req.headers.get("x-user-api-key")?.trim();
  return userKey || ENV_KEY_BY_PROVIDER[provider];
}

/** Перетворює технічні помилки провайдерів на зрозумілі повідомлення. */
export function friendlyError(raw: string): string {
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

// ──────────────── денний ліміт безкоштовного режиму ────────────────

/** Скільки безкоштовних «одиниць» на добу дозволено одному викладачу. */
export const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT || 5);
const FREE_COOKIE = "lb_free_used";

/**
 * Вартість операцій у «одиницях». Повна генерація уроку дорога, правка блоку —
 * ні, тому редактор не має з'їдати денний ліміт за кілька натискань.
 */
export const FREE_COST = { generate: 1, edit: 0.2, compliance: 0.2 } as const;

export function readFreeUsage(req: NextRequest): number {
  const raw = req.cookies.get(FREE_COOKIE)?.value;
  if (!raw) return 0;
  const [day, n] = raw.split(":");
  const today = new Date().toISOString().slice(0, 10);
  return day === today ? Number(n) || 0 : 0;
}

export function freeUsageCookie(used: number): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${FREE_COOKIE}=${today}:${Math.round(used * 100) / 100}; Path=/; Max-Age=86400; SameSite=Lax`;
}

export function freeLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: `Вичерпано денний ліміт безкоштовних генерацій (${FREE_DAILY_LIMIT} на добу). Спробуйте завтра або скористайтеся власним ключем — вкладка Gemini (безкоштовний ключ), ChatGPT чи Claude.`,
    }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}

export function missingKeyResponse(provider: Provider): Response {
  return new Response(
    JSON.stringify({
      error:
        provider === "free" ? KEY_HINT.free : `Не вказано API-ключ. ${KEY_HINT[provider]}`,
    }),
    {
      status: provider === "free" ? 503 : 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/** Обгортає генератор у SSE-потік із подіями text/status/error/done. */
export function sseStream(
  run: (send: SendFn) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send: SendFn = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      try {
        await run(send);
        send("done", {});
      } catch (e) {
        send("error", {
          error: friendlyError(e instanceof Error ? e.message : "Помилка генерації"),
        });
      } finally {
        controller.close();
      }
    },
  });
}

export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export type SendFn = (event: string, data: unknown) => void;

export interface StreamOptions {
  provider: Provider;
  apiKey: string;
  system: string;
  user: string;
  send: SendFn;
  /** Веб-пошук потрібен для генерації уроку; для правок блоку — зайва витрата. */
  search?: boolean;
  maxTokens?: number;
  /** Автодописування обірваної відповіді (доречно лише для великих документів). */
  autoContinue?: boolean;
}

/** Стрімить текст обраним провайдером у SSE-канал `send`. */
export async function streamText(o: StreamOptions): Promise<void> {
  if (o.provider === "claude") return streamClaude(o);
  if (o.provider === "openai") return streamOpenAI(o);
  return streamGemini(o);
}

// ───────────────────────────── Claude ─────────────────────────────

async function streamClaude({
  apiKey,
  system,
  user,
  send,
  search = true,
  maxTokens = 32000,
}: StreamOptions) {
  const client = new Anthropic({ apiKey });
  const messageStream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    ...(search
      ? { tools: [{ type: "web_search_20250305" as const, name: "web_search", max_uses: 6 }] }
      : {}),
  });

  messageStream.on("text", (delta) => send("text", { text: delta }));
  messageStream.on("streamEvent", (event) => {
    if (event.type === "content_block_start" && event.content_block.type === "server_tool_use") {
      send("status", { message: "🔎 Виконую веб-пошук…" });
    }
  });

  await messageStream.finalMessage();
}

// ───────────────────────────── OpenAI ─────────────────────────────

async function streamOpenAI({
  apiKey,
  system,
  user,
  send,
  search = true,
  maxTokens = 32000,
}: StreamOptions) {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: system,
      input: user,
      ...(search ? { tools: [{ type: "web_search" }] } : {}),
      max_output_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!resp.ok || !resp.body) {
    throw new Error((await resp.text().catch(() => "")) || `OpenAI API error ${resp.status}`);
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
        throw new Error(
          chunk.error?.message ?? chunk.response?.error?.message ?? "Помилка OpenAI"
        );
      }
    } catch (e) {
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

// ───────────────────────────── Gemini ─────────────────────────────

type Turn = { role: "user" | "model"; parts: { text: string }[] };

/**
 * Два рівні стійкості:
 *  1. перебір «модель × пошук × міркування» — обхід 404 (закрита модель)
 *     і 429 (пошук недоступний на безкоштовному тарифі);
 *  2. автопродовження, якщо потік обірвався без finishReason або на MAX_TOKENS.
 */
async function streamGemini({
  apiKey,
  system,
  user,
  send,
  search = true,
  maxTokens = 65536,
  autoContinue = true,
}: StreamOptions) {
  const makeBody = (contents: Turn[], withSearch: boolean, withThinking: boolean) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: {
        // у Gemini 3.x токени «міркувань» списуються з цього ж бюджету
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        ...(withThinking ? { thinkingConfig: { thinkingLevel: "high" } } : {}),
      },
    });

  const [best, ...fallbacks] = GEMINI_MODELS;
  const attempts = [
    ...(search ? [{ model: best, search: true, think: true }] : []),
    { model: best, search: false, think: true },
    { model: best, search: false, think: false },
    ...fallbacks.map((m) => ({ model: m, search: false, think: false })),
  ];

  async function runStream(contents: Turn[], withSearch: boolean, withThinking: boolean, model: string) {
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

  const baseContents: Turn[] = [{ role: "user", parts: [{ text: user }] }];
  let chosen: (typeof attempts)[number] | undefined;
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

  if (search && !chosen.search) {
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

  if (!autoContinue) return;

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

// ─────────────────────── разовий JSON-виклик ───────────────────────

/** Витягує JSON із відповіді моделі, навіть якщо вона обгорнула його в ```json. */
function parseJsonLoose<T>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.search(/[[{]/);
  if (start > 0) s = s.slice(start);
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace >= 0) s = s.slice(0, lastBrace + 1);
  return JSON.parse(s) as T;
}

/** Нестрімінговий виклик, що повертає розібраний JSON. Без веб-пошуку. */
export async function generateJson<T>(opts: {
  provider: Provider;
  apiKey: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const { provider, apiKey, system, user, maxTokens = 16000 } = opts;

  if (provider === "claude") {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");
    return parseJsonLoose<T>(text);
  }

  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: system,
        input: user,
        max_output_tokens: maxTokens,
        text: { format: { type: "json_object" } },
      }),
    });
    if (!r.ok) throw new Error((await r.text().catch(() => "")) || `OpenAI error ${r.status}`);
    const data = await r.json();
    const text: string =
      data.output_text ??
      data.output
        ?.flatMap((o: { content?: { text?: string }[] }) => o.content ?? [])
        .map((c: { text?: string }) => c.text ?? "")
        .join("") ??
      "";
    return parseJsonLoose<T>(text);
  }

  // gemini / free
  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    if (!r.ok) {
      lastErr = (await r.text().catch(() => "")) || `${r.status}`;
      if (r.status === 401 || r.status === 403) break;
      continue;
    }
    const data = await r.json();
    const text: string =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    if (!text) {
      lastErr = "порожня відповідь моделі";
      continue;
    }
    return parseJsonLoose<T>(text);
  }
  throw new Error(lastErr || "Gemini API error");
}

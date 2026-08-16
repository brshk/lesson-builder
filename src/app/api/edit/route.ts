import { NextRequest } from "next/server";
import { buildEditSystemPrompt, buildEditUserPrompt } from "@/lib/prompts";
import {
  FREE_COST,
  FREE_DAILY_LIMIT,
  SSE_HEADERS,
  freeLimitResponse,
  freeUsageCookie,
  missingKeyResponse,
  readFreeUsage,
  resolveApiKey,
  resolveProvider,
  sseStream,
  streamText,
} from "@/lib/llm";
import type { EditRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Правка одного блоку конспекту або всього документа за інструкцією викладача. */
export async function POST(req: NextRequest) {
  const provider = resolveProvider(req);

  let freeUsed = 0;
  if (provider === "free") {
    freeUsed = readFreeUsage(req);
    if (freeUsed >= FREE_DAILY_LIMIT) return freeLimitResponse();
  }

  const apiKey = resolveApiKey(req, provider);
  if (!apiKey) return missingKeyResponse(provider);

  let body: EditRequest;
  try {
    body = (await req.json()) as EditRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Невалідний запит" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.action && !body.instruction?.trim()) {
    return new Response(JSON.stringify({ error: "Не вказано, що саме змінити" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const target = body.scope === "document" ? body.documentText : body.blockText;
  if (!target?.trim()) {
    return new Response(JSON.stringify({ error: "Немає тексту для редагування" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = sseStream(async (send) => {
    await streamText({
      provider,
      apiKey,
      system: buildEditSystemPrompt(),
      user: buildEditUserPrompt(body),
      send,
      // правка спирається на вже зібраний контекст — веб-пошук тут лише
      // сповільнює й витрачає квоту
      search: false,
      maxTokens: body.scope === "document" ? 65536 : 16384,
      autoContinue: body.scope === "document",
    });
  });

  const headers = { ...SSE_HEADERS };
  if (provider === "free") headers["Set-Cookie"] = freeUsageCookie(freeUsed + FREE_COST.edit);

  return new Response(stream, { headers });
}

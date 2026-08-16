import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function probe(
  key: string,
  model: string,
  withSearch: boolean,
  thinking?: Record<string, unknown>
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Скажи 'ок'" }] }],
        ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          maxOutputTokens: 20,
          ...(thinking ? { thinkingConfig: thinking } : {}),
        },
      }),
    }
  );
  const raw = await res.text();
  return { model, withSearch, status: res.status, raw: raw.slice(0, 300) };
}

/** Які моделі Gemini доступні для ключа академії (діагностика). */
export async function GET(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY не задано" }, { status: 503 });
  }

  // /api/models?test=<model> — пробний виклик із пошуком і без нього
  const test = req.nextUrl.searchParams.get("test");
  if (test) {
    const model = test === "1" ? "gemini-3.7-flash" : test;
    if (req.nextUrl.searchParams.get("think")) {
      const [level, budget] = await Promise.all([
        probe(key, model, false, { thinkingLevel: "high" }),
        probe(key, model, false, { thinkingBudget: 4096 }),
      ]);
      return NextResponse.json({ thinkingLevel: level, thinkingBudget: budget });
    }
    const [plain, withSearch] = await Promise.all([
      probe(key, model, false),
      probe(key, model, true),
    ]);
    return NextResponse.json({ plain, withSearch });
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, error: (await res.text()).slice(0, 400) },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      models?: {
        name: string;
        supportedGenerationMethods?: string[];
        inputTokenLimit?: number;
        outputTokenLimit?: number;
      }[];
    };
    const usable = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map(
        (m) =>
          `${m.name.replace("models/", "")} (in ${m.inputTokenLimit ?? "?"} / out ${
            m.outputTokenLimit ?? "?"
          })`
      );
    return NextResponse.json({
      ok: true,
      current: process.env.GEMINI_MODEL || "(default у коді)",
      count: usable.length,
      models: usable,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}

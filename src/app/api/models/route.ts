import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Які моделі Gemini доступні для ключа академії (діагностика). */
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY не задано" }, { status: 503 });
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
      models?: { name: string; supportedGenerationMethods?: string[] }[];
    };
    const usable = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));
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

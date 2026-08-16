import { NextRequest, NextResponse } from "next/server";
import { splitBlocks } from "@/lib/blocks";
import { getProgramText, isDriveConfigured } from "@/lib/drive";
import { driveRefFor } from "@/lib/programDrive";
import { fetchDriveProgram } from "@/lib/driveProgramFetch";
import { buildComplianceSystemPrompt, buildComplianceUserPrompt } from "@/lib/prompts";
import {
  FREE_COST,
  FREE_DAILY_LIMIT,
  freeLimitResponse,
  freeUsageCookie,
  friendlyError,
  generateJson,
  missingKeyResponse,
  readFreeUsage,
  resolveApiKey,
  resolveProvider,
} from "@/lib/llm";
import type { ComplianceReport, Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  lessonText: string;
  discipline: string;
  topic: string;
  language: Language;
  product?: string;
  programFileId?: string;
}

/** Модель повертає лише факти; відсоток рахуємо самі, щоб його не «домальовували». */
type ModelPart = Pick<ComplianceReport, "items" | "outcomes" | "aiAdditions" | "outOfScope">;

export async function POST(req: NextRequest) {
  const provider = resolveProvider(req);

  let freeUsed = 0;
  if (provider === "free") {
    freeUsed = readFreeUsage(req);
    if (freeUsed >= FREE_DAILY_LIMIT) return freeLimitResponse();
  }

  const apiKey = resolveApiKey(req, provider);
  if (!apiKey) return missingKeyResponse(provider);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Невалідний запит" }, { status: 400 });
  }
  if (!body.lessonText?.trim()) {
    return NextResponse.json({ error: "Немає конспекту для перевірки" }, { status: 400 });
  }

  // навчальна програма — та сама, що використовувалась під час генерації
  let program: { name: string; text: string } | undefined;
  const driveRef = driveRefFor(body.product);
  if (driveRef) program = await fetchDriveProgram(driveRef);
  if (!program && body.programFileId && isDriveConfigured()) {
    try {
      program = await getProgramText(body.programFileId);
    } catch (e) {
      console.error("Drive program fetch failed:", e);
    }
  }

  // без програми відсоток рахувати нема від чого — так і кажемо, а не малюємо число
  if (!program) {
    const empty: ComplianceReport = {
      curriculumFound: false,
      items: [],
      outcomes: [],
      aiAdditions: [],
      outOfScope: [],
      coverage: 0,
    };
    return NextResponse.json(empty);
  }

  const outline = splitBlocks(body.lessonText)
    .filter((b) => b.level > 0)
    .map((b) => b.heading);

  try {
    const raw = await generateJson<ModelPart>({
      provider,
      apiKey,
      system: buildComplianceSystemPrompt(),
      user: buildComplianceUserPrompt({
        discipline: body.discipline,
        topic: body.topic,
        language: body.language,
        programName: program.name,
        programText: program.text,
        lessonText: body.lessonText,
        outline,
      }),
    });

    const items = Array.isArray(raw.items) ? raw.items : [];
    const covered = items.filter((i) => i.covered).length;

    const report: ComplianceReport = {
      curriculumFound: true,
      programName: program.name,
      items,
      outcomes: Array.isArray(raw.outcomes) ? raw.outcomes : [],
      aiAdditions: Array.isArray(raw.aiAdditions) ? raw.aiAdditions : [],
      outOfScope: Array.isArray(raw.outOfScope) ? raw.outOfScope : [],
      // відсоток — виключно арифметика за covered, модель його не бачить
      coverage: items.length ? Math.round((covered / items.length) * 100) : 0,
    };

    const headers: Record<string, string> = {};
    if (provider === "free") {
      headers["Set-Cookie"] = freeUsageCookie(freeUsed + FREE_COST.compliance);
    }
    return NextResponse.json(report, { headers });
  } catch (e) {
    return NextResponse.json(
      { error: friendlyError(e instanceof Error ? e.message : "Помилка аналізу") },
      { status: 502 }
    );
  }
}

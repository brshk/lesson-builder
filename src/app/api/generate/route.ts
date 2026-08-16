import { NextRequest } from "next/server";
import { DIRECTIONS } from "@/lib/directions";
import { getProgramText, isDriveConfigured } from "@/lib/drive";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { getPortalDoc } from "@/lib/portal";
import { driveRefFor } from "@/lib/programDrive";
import { fetchDriveProgram } from "@/lib/driveProgramFetch";
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
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const provider = resolveProvider(req);

  let freeUsed = 0;
  if (provider === "free") {
    freeUsed = readFreeUsage(req);
    if (freeUsed >= FREE_DAILY_LIMIT) return freeLimitResponse();
  }

  const apiKey = resolveApiKey(req, provider);
  if (!apiKey) return missingKeyResponse(provider);

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
  const direction = dir ? `${dir.code ? `${dir.code} — ` : ""}${dir.name}` : body.directionId;

  // 1) навчальна програма, прив'язана до продукту на Google Drive
  let program: { name: string; text: string } | undefined;
  const driveRef = driveRefFor(body.product);
  if (driveRef) program = await fetchDriveProgram(driveRef);

  // 2) або файл, обраний вручну зі спільної папки (сервісний акаунт)
  if (!program && body.programFileId && isDriveConfigured()) {
    try {
      program = await getProgramText(body.programFileId);
    } catch (e) {
      console.error("Drive program fetch failed:", e);
    }
  }

  const portalDoc = await getPortalDoc(body.product);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(body, direction, program, portalDoc);

  const stream = sseStream(async (send) => {
    if (program) {
      send("status", { message: `📘 Навчальна програма з Google Drive: «${program.name}».` });
    } else if (driveRef || body.programFileId) {
      send("status", {
        message: "⚠️ Не вдалося прочитати навчальну програму з Google Drive — генерую без неї.",
      });
    }
    if (portalDoc) {
      send("status", {
        message: `📄 Враховано опис продукту «${portalDoc.title}» з ПКО-порталу${
          portalDoc.live ? "" : " (збережена копія)"
        }.`,
      });
    }
    if (body.group && hasGroupData(body.group)) {
      send("status", { message: "👥 Матеріали адаптовано під профіль групи." });
    }
    send("status", { message: "Шукаю інформацію та генерую матеріали…" });

    if (provider === "free") {
      send("status", {
        message: `🎁 Безкоштовний режим: використано ${
          Math.round((freeUsed + FREE_COST.generate) * 10) / 10
        } із ${FREE_DAILY_LIMIT} одиниць на сьогодні.`,
      });
    }

    await streamText({ provider, apiKey, system: systemPrompt, user: userPrompt, send });

    // сигналізуємо клієнту, чи є з чим рахувати відповідність програмі
    send("meta", { programName: program?.name ?? null });
  });

  const headers = { ...SSE_HEADERS };
  if (provider === "free") headers["Set-Cookie"] = freeUsageCookie(freeUsed + FREE_COST.generate);

  return new Response(stream, { headers });
}

function hasGroupData(g: NonNullable<GenerateRequest["group"]>): boolean {
  return Boolean(
    g.ageFrom || g.ageTo || g.students || g.level || g.hardware?.trim() || g.priorKnowledge?.trim()
  );
}

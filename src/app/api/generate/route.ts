import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { DIRECTIONS } from "@/lib/directions";
import { getProgramText, isDriveConfigured } from "@/lib/drive";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import type { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY не налаштовано" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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

  const direction =
    DIRECTIONS.find((d) => d.id === body.directionId)?.name ?? body.directionId;

  // Підтягуємо програму навчання з Google Drive, якщо обрано файл
  let program: { name: string; text: string } | undefined;
  if (body.programFileId && isDriveConfigured()) {
    try {
      program = await getProgramText(body.programFileId);
    } catch (e) {
      console.error("Drive program fetch failed:", e);
      // генеруємо без програми, але повідомляємо в потоці
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

        const messageStream = client.messages.stream({
          model: MODEL,
          max_tokens: 32000,
          system: buildSystemPrompt(),
          messages: [
            { role: "user", content: buildUserPrompt(body, direction, program) },
          ],
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
              max_uses: 6,
            },
          ],
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
        send("done", {});
      } catch (e) {
        const message = e instanceof Error ? e.message : "Помилка генерації";
        send("error", { error: message });
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

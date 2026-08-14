import { NextRequest } from "next/server";
import { markdownToDocx } from "@/lib/mdToDocx";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = (await req.json()) as {
      markdown: string;
      title?: string;
    };
    if (!markdown?.trim()) {
      return new Response(JSON.stringify({ error: "Порожній документ" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const buffer = await markdownToDocx(markdown, title || "Навчальні матеріали");
    const filename = encodeURIComponent(
      (title || "lesson-materials").replace(/[\\/:*?"<>|]/g, "_") + ".docx"
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Помилка експорту";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

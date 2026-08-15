import type { DriveProgramRef } from "./programDrive";

/**
 * Читання навчальної програми з Google Drive.
 *
 * Файли відкриті «за посиланням», тому працює без авторизації:
 *  - Google Документи — експорт у text/plain;
 *  - .docx / .pdf — прямий download + локальний парсинг.
 *
 * Якщо задано GOOGLE_API_KEY, використовується офіційний Drive API
 * (стабільніше при великих обсягах запитів).
 */

const MAX_CHARS = 120_000;

async function fetchBinary(ref: DriveProgramRef): Promise<Buffer> {
  const key = process.env.GOOGLE_API_KEY;
  const url = key
    ? `https://www.googleapis.com/drive/v3/files/${ref.fileId}?alt=media&key=${key}`
    : `https://drive.google.com/uc?export=download&id=${ref.fileId}`;

  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`Drive download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // Google іноді віддає HTML-сторінку підтвердження замість файлу
  const head = buf.subarray(0, 200).toString("utf8").toLowerCase();
  if (head.includes("<!doctype html") || head.includes("<html")) {
    throw new Error("Drive повернув HTML замість файлу (перевірте доступ «за посиланням»)");
  }
  return buf;
}

async function fetchGoogleDocText(ref: DriveProgramRef): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  const url = key
    ? `https://www.googleapis.com/drive/v3/files/${ref.fileId}/export?mimeType=text/plain&key=${key}`
    : `https://docs.google.com/document/d/${ref.fileId}/export?format=txt`;

  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`Drive export ${res.status}`);
  return await res.text();
}

/** Текст навчальної програми або undefined, якщо не вдалося прочитати. */
export async function fetchDriveProgram(
  ref: DriveProgramRef
): Promise<{ name: string; text: string } | undefined> {
  try {
    let text = "";

    if (ref.kind === "gdoc") {
      text = await fetchGoogleDocText(ref);
    } else if (ref.kind === "docx") {
      const buffer = await fetchBinary(ref);
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      const buffer = await fetchBinary(ref);
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      text = result.text;
    }

    text = text.replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 200) return undefined;
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n[...програму скорочено...]";
    }
    return { name: ref.fileName, text };
  } catch (e) {
    console.error("Drive program fetch failed:", ref.fileId, e);
    return undefined;
  }
}

import type { DriveProgramRef } from "./programDrive";

/**
 * Читання навчальних програм з Google Drive.
 *
 * Файли/папки відкриті «за посиланням», тому працює без авторизації:
 *  - вміст папки — через embeddedfolderview;
 *  - Google Документи — експорт у text/plain;
 *  - .docx / .pdf — прямий download + локальний парсинг.
 *
 * Тип файлу визначається за вмістом (magic bytes), а не лише за назвою,
 * бо Drive не завжди віддає розширення.
 */

const MAX_CHARS = 120_000;

export type DriveItemKind = "gdoc" | "gsheet" | "docx" | "pdf" | "other";

export interface PublicFolderItem {
  id: string;
  name: string;
  kind: DriveItemKind;
}

function kindFromEntry(name: string, chunk: string): DriveItemKind {
  const n = name.toLowerCase();
  if (n.endsWith(".docx") || n.endsWith(".doc")) return "docx";
  if (n.endsWith(".pdf")) return "pdf";
  if (chunk.includes("vnd.google-apps.document")) return "gdoc";
  if (chunk.includes("vnd.google-apps.spreadsheet")) return "gsheet";
  if (chunk.includes("wordprocessingml")) return "docx";
  if (chunk.includes("application/pdf")) return "pdf";
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".zip")) return "other";
  return "other";
}

/** Вміст публічної папки Google Drive без API-ключа. */
export async function listPublicFolder(
  folderId: string
): Promise<PublicFolderItem[]> {
  const res = await fetch(
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`embeddedfolderview ${res.status}`);
  const html = await res.text();

  const items: PublicFolderItem[] = [];
  const seen = new Set<string>();
  // кожен запис: <div class="flip-entry" id="entry-<ID>"> …іконка… <div class="flip-entry-title">NAME</div>
  const parts = html.split('class="flip-entry"');
  for (const part of parts.slice(1)) {
    const idM = part.match(/id="entry-([A-Za-z0-9_-]{20,})"/);
    const nameM = part.match(/flip-entry-title[^>]*>([^<]+)</);
    if (!idM || !nameM) continue;
    const id = idM[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const name = nameM[1]
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    items.push({ id, name, kind: kindFromEntry(name, part.slice(0, 1200)) });
  }
  return items;
}

const PROGRAM_HINTS = [
  "програма",
  "программа",
  "program",
  "curriculum",
  "навчальний план",
  "учебный план",
];

const SKIP_HINTS = [".zip", ".rar", "шаблон", "конкурс", "брошура", "буклет"];

/** Обирає у списку файл, який найбільше схожий на навчальну програму. */
export function pickProgramFile(
  items: PublicFolderItem[]
): PublicFolderItem | undefined {
  const usable = items.filter(
    (i) => !SKIP_HINTS.some((s) => i.name.toLowerCase().includes(s))
  );
  const byHint = usable.find((i) =>
    PROGRAM_HINTS.some((h) => i.name.toLowerCase().includes(h))
  );
  if (byHint) return byHint;
  const doc = usable.find((i) => i.kind === "gdoc" || i.kind === "docx" || i.kind === "pdf");
  return doc ?? usable[0];
}

async function downloadBinary(fileId: string): Promise<Buffer> {
  const key = process.env.GOOGLE_API_KEY;
  const url = key
    ? `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${key}`
    : `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function exportGoogleDoc(fileId: string, format: "txt" | "csv"): Promise<string> {
  const kind = format === "csv" ? "spreadsheets" : "document";
  const res = await fetch(
    `https://docs.google.com/${kind}/d/${fileId}/export?format=${format}`,
    { redirect: "follow", cache: "no-store" }
  );
  if (!res.ok) throw new Error(`export ${res.status}`);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("export returned HTML");
  return text;
}

/** Витягує текст із файлу, визначаючи формат за вмістом. */
async function extractText(fileId: string, hint: DriveItemKind): Promise<string> {
  // 1) нативні Google-файли
  if (hint === "gdoc" || hint === "gsheet" || hint === "other") {
    try {
      return await exportGoogleDoc(fileId, hint === "gsheet" ? "csv" : "txt");
    } catch {
      /* не Google-документ — пробуємо як файл */
    }
  }

  // 2) завантажений файл: визначаємо тип за сигнатурою
  const buffer = await downloadBinary(fileId);
  const magic = buffer.subarray(0, 5).toString("latin1");

  if (magic.startsWith("PK")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (magic.startsWith("%PDF")) {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }
  const asText = buffer.toString("utf8");
  if (/^\s*<(!doctype|html)/i.test(asText)) {
    throw new Error("Drive повернув HTML — файл не відкритий «за посиланням»");
  }
  return asText;
}

/**
 * Текст навчальної програми за прив'язкою.
 * Якщо задано folderId замість fileId — файл шукається в папці автоматично.
 */
export async function fetchDriveProgram(
  ref: DriveProgramRef
): Promise<{ name: string; text: string } | undefined> {
  try {
    let fileId = ref.fileId;
    let name = ref.fileName;
    let hint: DriveItemKind = ref.kind === "gdoc" ? "gdoc" : ref.kind === "pdf" ? "pdf" : "docx";

    if (!fileId && ref.folderId) {
      const items = await listPublicFolder(ref.folderId);
      const pick = pickProgramFile(items);
      if (!pick) return undefined;
      fileId = pick.id;
      name = name || pick.name;
      hint = pick.kind;
    }
    if (!fileId) return undefined;

    let text = await extractText(fileId, hint);
    text = text.replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 200) return undefined;
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n\n[...програму скорочено...]";
    }
    return { name: name || fileId, text };
  } catch (e) {
    console.error("Drive program fetch failed:", ref.fileId || ref.folderId, e);
    return undefined;
  }
}

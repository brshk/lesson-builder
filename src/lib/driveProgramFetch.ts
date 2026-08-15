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

export interface PublicFolderItem {
  id: string;
  name: string;
  kind: DriveFileKindGuess;
}
type DriveFileKindGuess = "gdoc" | "gsheet" | "docx" | "pdf" | "folder" | "other";

function guessKind(name: string, iconHint: string): DriveFileKindGuess {
  const n = name.toLowerCase();
  if (iconHint.includes("folder")) return "folder";
  if (n.endsWith(".docx") || n.endsWith(".doc")) return "docx";
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".xlsx") || n.endsWith(".xls")) return "other";
  if (iconHint.includes("document")) return "gdoc";
  if (iconHint.includes("spreadsheet")) return "gsheet";
  return "other";
}

/**
 * Вміст публічної (відкритої «за посиланням») папки Google Drive
 * без API-ключа — через вбудований перегляд embeddedfolderview.
 */
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
  // рядки виду: <div class="flip-entry" id="entry-<ID>"> ... <img src="...icon...">
  //             <div class="flip-entry-title">NAME</div>
  const entryRe =
    /id="entry-([A-Za-z0-9_-]{20,})"[\s\S]*?src="([^"]*?)"[\s\S]*?flip-entry-title[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(html)) !== null) {
    const [, id, icon, rawName] = m;
    if (seen.has(id)) continue;
    seen.add(id);
    const name = rawName.replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();
    items.push({ id, name, kind: guessKind(name, icon) });
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

/** Обирає у списку файл, який найбільше схожий на навчальну програму. */
export function pickProgramFile(
  items: PublicFolderItem[]
): PublicFolderItem | undefined {
  const readable = items.filter(
    (i) => i.kind === "gdoc" || i.kind === "docx" || i.kind === "pdf"
  );
  const byHint = readable.find((i) =>
    PROGRAM_HINTS.some((h) => i.name.toLowerCase().includes(h))
  );
  return byHint ?? readable[0];
}

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

/**
 * Текст навчальної програми за прив'язкою.
 * Якщо в ref задано folderId замість fileId — файл шукається в папці автоматично.
 */
export async function fetchDriveProgram(
  ref: DriveProgramRef
): Promise<{ name: string; text: string } | undefined> {
  try {
    // папка курсу → знаходимо в ній файл програми
    if (!ref.fileId && ref.folderId) {
      const items = await listPublicFolder(ref.folderId);
      const pick = pickProgramFile(items);
      if (!pick) return undefined;
      return fetchDriveProgram({
        ...ref,
        fileId: pick.id,
        fileName: ref.fileName || pick.name,
        kind: pick.kind === "pdf" ? "pdf" : pick.kind === "docx" ? "docx" : "gdoc",
      });
    }

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

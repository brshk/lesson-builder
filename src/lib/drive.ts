import { google, drive_v3 } from "googleapis";
import type { DriveProgram } from "./types";

/**
 * Google Drive: читання програм навчання зі спільної папки.
 *
 * Налаштування:
 * 1. Створіть сервісний акаунт у Google Cloud Console, увімкніть Drive API.
 * 2. Розшарте папку з програмами навчання на email сервісного акаунта (Viewer).
 * 3. Задайте змінні середовища:
 *    GOOGLE_SERVICE_ACCOUNT_KEY — JSON ключа сервісного акаунта (одним рядком
 *      або в base64);
 *    GOOGLE_DRIVE_FOLDER_ID — id папки з програмами.
 */

function getServiceAccountCredentials(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  }
  let jsonText = raw.trim();
  if (!jsonText.startsWith("{")) {
    // припускаємо base64
    jsonText = Buffer.from(jsonText, "base64").toString("utf-8");
  }
  const parsed = JSON.parse(jsonText);
  return {
    client_email: parsed.client_email,
    private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

function getDrive(): drive_v3.Drive {
  const creds = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

/** Список файлів програм навчання у папці (включно з підпапками 1-го рівня). */
export async function listPrograms(): Promise<DriveProgram[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
  const drive = getDrive();

  const results: DriveProgram[] = [];
  const folderQueue: string[] = [folderId];
  const seenFolders = new Set<string>();
  // обмежимо глибину, щоб не обійти весь Drive
  let depth = 0;
  while (folderQueue.length > 0 && depth < 3) {
    const currentLevel = [...folderQueue];
    folderQueue.length = 0;
    depth += 1;
    for (const fid of currentLevel) {
      if (seenFolders.has(fid)) continue;
      seenFolders.add(fid);
      let pageToken: string | undefined;
      do {
        const res = await drive.files.list({
          q: `'${fid}' in parents and trashed = false`,
          fields:
            "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)",
          pageSize: 200,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        for (const f of res.data.files ?? []) {
          if (f.mimeType === "application/vnd.google-apps.folder") {
            if (f.id) folderQueue.push(f.id);
          } else {
            results.push({
              id: f.id!,
              name: f.name ?? "(без назви)",
              mimeType: f.mimeType ?? "",
              modifiedTime: f.modifiedTime ?? undefined,
              webViewLink: f.webViewLink ?? undefined,
            });
          }
        }
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);
    }
  }
  results.sort((a, b) => a.name.localeCompare(b.name, "uk"));
  return results;
}

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

/** Отримати текстовий вміст файлу програми навчання. */
export async function getProgramText(fileId: string): Promise<{ name: string; text: string }> {
  const drive = getDrive();
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  });
  const name = meta.data.name ?? "програма";
  const mimeType = meta.data.mimeType ?? "";

  // Google Docs / Sheets / Slides — експорт у текст
  if (mimeType.startsWith("application/vnd.google-apps.")) {
    const exportMime =
      mimeType === "application/vnd.google-apps.spreadsheet"
        ? "text/csv"
        : "text/plain";
    const res = await drive.files.export(
      { fileId, mimeType: exportMime },
      { responseType: "arraybuffer" }
    );
    return { name, text: Buffer.from(res.data as ArrayBuffer).toString("utf-8") };
  }

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  const buffer = Buffer.from(res.data as ArrayBuffer);

  if (TEXT_MIME_TYPES.has(mimeType) || mimeType.startsWith("text/")) {
    return { name, text: buffer.toString("utf-8") };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { name, text: result.value };
  }

  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return { name, text: result.text };
  }

  throw new Error(`Непідтримуваний тип файлу програми: ${mimeType}`);
}

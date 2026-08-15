/**
 * Прив'язка програм застосунку до навчальних програм на Google Drive.
 *
 * Файли лежать у спільних папках IT STEP і відкриті «за посиланням»,
 * тому читаються без сервісного акаунта й без API-ключа.
 *
 * Як додати новий напрямок:
 * 1. Відкрити папку напрямку на Drive, скопіювати id файлу програми
 *    (з посилання .../file/d/<ID>/view або .../document/d/<ID>/edit).
 * 2. Додати запис сюди: ключ — точна назва програми з src/lib/directions.ts.
 * 3. kind: "gdoc" для Google Документів, "docx" / "pdf" для завантажених файлів.
 */
export type DriveFileKind = "gdoc" | "docx" | "pdf";

export interface DriveProgramRef {
  fileId: string;
  fileName: string;
  kind: DriveFileKind;
  /** Папка напрямку на Drive — для посилання «відкрити на Drive». */
  folder: string;
}

const DESIGN_FOLDER = "1PyA6NWXFYsiCDcEVStFXf8HEfLwanyv0";

export const PROGRAM_DRIVE: Record<string, DriveProgramRef> = {
  // ───────── Дизайн · ПКО (папка «СТ») ─────────
  "Full-Stack Designer + AI": {
    fileId: "1P5v5rbx9Whycsb4wcuaWfVY89EgZ-0RF",
    fileName:
      "СТ ITSTEP — Full-Stack Designer & AI — Curriculum — 2 роки, 4 семестри × 138 пар",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },

  // ───────── Дизайн · ШС (папка «ШС») ─────────
  "ШС Full-Stack Designer + AI": {
    fileId: "1cJTrPi3i0lSOWsuI5yISeU9w0CT4sYDp",
    fileName:
      "ШС ITSTEP — Full-Stack Designer + AI — Curriculum — 3 роки × 160 пар",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },

  // ───────── Дизайн · СК (папка «СК») ─────────
  "Графічний дизайн + AI": {
    fileId: "1IIZcdNo1XAjclBmdjiLrK-aALqXSdvGI",
    fileName: "GRAPHIC DESIGN + AI",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "UI/UX дизайн + AI": {
    fileId: "1v-mlzS9OEFJs2IzsQu3PgY19X4K7BHVV",
    fileName: "UI/UX DESIGN + AI",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "Motion-design + AI": {
    fileId: "1T1czF-OFpQRe6nkGoQWryECQe70HKMsU",
    fileName: "MOTION DESIGN + AI",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "FIGMA + AI": {
    fileId: "1uqgj095rIXNIgI3ivkpsbWdWZSsWca1M",
    fileName: "FIGMA + AI",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "Дизайн інтер'єру + AI": {
    fileId: "1qvDl22-dJDGLJnMNfi_e3Jmcv3CW9Ckf",
    fileName: "INTERIOR DESIGN + AI",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "Штучний інтелект від нуля до профі": {
    fileId: "1_HSmHknUHAZ0ssdE4mexTSYNnYrzqzifnKAcUGOu44Q",
    fileName: "СК Штучний інтелект з нуля до профі — BASIC та PRO",
    kind: "gdoc",
    folder: DESIGN_FOLDER,
  },
};

export function driveRefFor(programName?: string): DriveProgramRef | undefined {
  if (!programName) return undefined;
  return PROGRAM_DRIVE[programName];
}

export function driveViewUrl(ref: DriveProgramRef): string {
  return ref.kind === "gdoc"
    ? `https://docs.google.com/document/d/${ref.fileId}/edit`
    : `https://drive.google.com/file/d/${ref.fileId}/view`;
}

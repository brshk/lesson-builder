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
  /** Конкретний файл програми. Якщо не задано — шукається у folderId. */
  fileId?: string;
  /** Папка курсу: застосунок сам знайде в ній файл «програма …». */
  folderId?: string;
  fileName: string;
  kind: DriveFileKind;
  /** Батьківська папка напрямку — для посилання «відкрити на Drive». */
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

// ───────── МКА (папка «МКА 2025») та ПШ — прив'язка до папок курсів ─────────
const MKA_FOLDER = "10CZkmBHH3RZ2UT7U-fXwsy1TgrSzrBEq";
const PSH_FOLDER = "1LicJ069tUV1nTomTbjjCFzu_glVuuYcv";

/** Курс = папка на Drive; файл програми застосунок знаходить у ній сам. */
function courseFolder(folderId: string, parent: string): DriveProgramRef {
  return { folderId, fileName: "", kind: "docx", folder: parent };
}

export const MKA_COURSES: Record<string, string> = {
  "3D Game Creator": "1leLIhEFdv2gINrke1YRxe4BDncsGrSYP",
  "Блогінг": "1QNw-7MGnPF1L77n9rsrQV3OEgZPF7Gjb",
  "Вебдизайн": "1qa0Emf7l0b59DKrWvkG5VCj_wejyTSmN",
  "Ігровий дизайн": "1UBKabJJvbI_6Byq4G1Fw-8M8DcFbB3hv",
  "Кібербезпека (МКА)": "13a_cLnDH08bAvO9zxUJncFq_S38fZold",
  "Мобільні додатки AR": "1EUNZeDyYHNTE5D9Vhj536XbvGGP5TPyl",
  "Робототехніка АІ": "1_ieTfN2EOfwxmGA-ICF_JNhTNXqkz-kJ",
  "Стартап (додаткові уроки)": "17PKPzYObFezUQjeaI1N7_T5UFMWVvqe_",
  "AI Assistant": "1HFp6arxb2gBsusPnPy7qHVClsE9YY1RU",
  "AI Design ENG": "1nHjgf1yGU2KtoQ9VrLsZOqwwM9NYP_0X",
  "AI-геймплей МКА": "1fO-J8_GUYRoTL7BzpOtAZ1jeepqHv-mt",
  "Blender PRO": "1BsvMnim4kGRQcdpa21ti_Au2PpvdfTW5",
  "DesignRoom 3D": "1ttd9DhvTU4TdjUBkseashKcknsrSFwyy",
  "DigitalArt": "11R6zsY1sjZ6JGBMsYXswwCUIMYYAOyUh",
  "Minecraft AI": "1sn2ACYmx0Qpggru5gCPGjxERzNcsS6fJ",
  "Python AI": "1C_siY6Z9uTjQ79B6pBGOYQJ2awCxa7zn",
  "Smart Gadgets Lab (Мікробіт)": "1ZFIRUPnfYIC52vNlnLqp9_9So-T0gRHv",
  "SmartTech Lab (Arduino)": "1LDOYApaCiG4KXvZcCkP-maTDSnhpxGan",
  "WEB Art": "1OGCUUELyaRYNgIBVlouplu07DKK1q2h8",
};

export const PSH_COURSES: Record<string, string> = {
  "3D-скульптинг": "1dB1s8KdS7MTzJGVjLe6T4unppjRu1uwU",
  "Графічний дизайн в Adobe Express": "1IgF4C1PT49o3I9JktayGZSAu7Zie5ivz",
  "CodeCraft": "155HadtBAgNAE2s0zbeig6vnlSrqMM0Io",
  "IT Start": "1AmyTro4Qu1Kcp8_exBRPQVUBZkJQVjlN",
  "LegoKids": "1MvMLLx-viTit1SWrRjGcLIuN3FnLcthz",
  "Reels Studio": "12jfWr14bzYDg8sT0ICooSG4gJhh345Kb",
  "ScratchLab": "1Bygf_ABwc830GuIAQeDvQwPhJYD2f0T-",
  "SoundLab": "1PgVVb0IE9jrHejavbvtRry1MBfEOUvge",
};

for (const [name, id] of Object.entries(MKA_COURSES)) {
  PROGRAM_DRIVE[name] = courseFolder(id, MKA_FOLDER);
}
for (const [name, id] of Object.entries(PSH_COURSES)) {
  PROGRAM_DRIVE[name] = courseFolder(id, PSH_FOLDER);
}

// окремі файли ПШ, що лежать у корені папки
PROGRAM_DRIVE["Digital Art Kids"] = {
  fileId: "1vh9NtEcBWYsGyhXvx3qT5YbhfoRFlnhLzu8w5iizyzc",
  fileName: "Програма курсу Digital Art Kids",
  kind: "gdoc",
  folder: PSH_FOLDER,
};
PROGRAM_DRIVE["МегаАрт 2D"] = {
  fileId: "15xSG-trDy9s_3IOtB4pkwFuXd3Jd4mTMxW9pTTFqgeM",
  fileName: "МегаАрт 2D",
  kind: "gdoc",
  folder: PSH_FOLDER,
};
PROGRAM_DRIVE["3D-мейкер"] = {
  fileId: "11wBkYjcGwNsVWSZkk3FPLV4d2_2hQ_aBAxOP-73Mrw8",
  fileName: "3D-мейкер програма",
  kind: "gdoc",
  folder: PSH_FOLDER,
};

/**
 * Курси всередині укрупнених карток напрямку «Освіта для дітей».
 * Картка-продукт веде одразу в генератор, а конкретний курс (і разом із ним
 * навчальну програму з Drive) викладач обирає полем «Курс» у формі.
 */
export const COURSE_SETS: Record<string, string[]> = {
  "МКА — Мала Комп'ютерна Академія": Object.keys(MKA_COURSES),
  "ПШ — Перший крок": [
    ...Object.keys(PSH_COURSES),
    "Digital Art Kids",
    "МегаАрт 2D",
    "3D-мейкер",
  ],
  "Дитячі спецкурси": [
    "Розробка ігор у Roblox Studio",
    "Анімація та мультиплікація",
  ],
};

/** Список курсів для продукту (порожній, якщо продукт не має підкурсів). */
export function coursesFor(product: string): string[] {
  return COURSE_SETS[product] ?? [];
}

export function driveRefFor(programName?: string): DriveProgramRef | undefined {
  if (!programName) return undefined;
  return PROGRAM_DRIVE[programName];
}

export function driveViewUrl(ref: DriveProgramRef): string {
  if (!ref.fileId && ref.folderId) {
    return `https://drive.google.com/drive/folders/${ref.folderId}`;
  }
  return ref.kind === "gdoc"
    ? `https://docs.google.com/document/d/${ref.fileId}/edit`
    : `https://drive.google.com/file/d/${ref.fileId}/view`;
}

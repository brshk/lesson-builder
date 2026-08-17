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
/** Підпапки, що з'явилися в бібліотеці «Дизайн» улітку 2026. */
const PRO_FOLDER = "11JuxvGCUKFgxJw3r0tB9rerUsqXpu-jD";
const COLLEGE_FOLDER = "1UOFXo80BnS6mWtMHtlWKXN1aZ_7wCnLA";
const KL_FOLDER = "1NH2a795PME8-JWeGfUl__1tmJFNVVXe0";

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
  "ШІ для дизайнера": {
    fileId: "1NiQBg5w6A9WkYQ9Jnw2p3rTP6Pdq9Ky7",
    fileName: "ШІ ДЛЯ ДИЗАЙНЕРА",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "AI Content Creator": {
    fileId: "17msGDEzgAFkIo3492kbek3XA4qZG6qCR",
    fileName: "AI Content Creator — 6 місяців",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },
  "Graphic Design + AI (Kuala Lumpur)": {
    folderId: KL_FOLDER,
    fileName: "",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },

  // ───────── СК · Курси для професіоналів (папка «Курси для професіоналів») ─────────
  "AI Native Designer": {
    fileId: "1w-ZpTGq6WtM0D62EXmU9bInvLR5-ftDz",
    fileName: "AI Native Designer",
    kind: "docx",
    folder: PRO_FOLDER,
  },
  "AI Art Direction": {
    fileId: "1S017Bup8sprXTwD--POmq9sUBNLk7_7O",
    fileName: "AI Art Direction",
    kind: "docx",
    folder: PRO_FOLDER,
  },
  "AI Illustration & Character Design": {
    fileId: "101Rneyb8YnYW5oxsxBmivNzJk3EIM8nu",
    fileName: "AI Illustration & Character Design",
    kind: "docx",
    folder: PRO_FOLDER,
  },
  "AI Game Art & Game UI": {
    fileId: "1gQq09qL7x53Qp7xhA8sm6tYjpjfgCIvT",
    fileName: "AI Game Art & Game UI",
    kind: "docx",
    folder: PRO_FOLDER,
  },
  "AI Video Production": {
    fileId: "1i8pGMigMnqHISLF3096Y8vvWDuUmkp2c",
    fileName: "AI Video Production",
    kind: "docx",
    folder: PRO_FOLDER,
  },
  "Generative UI & Prototyping": {
    fileId: "1rQbEUp4ZWbLkycVM9ixQzEOsTUGHYolg",
    fileName: "Generative UI & Prototyping",
    kind: "docx",
    folder: PRO_FOLDER,
  },

  // ───────── ВНЗ ─────────
  "ВНЗ — Вища освіта": {
    fileId: "1z-_zvsgHM0VPyAm3LaKqy3lqC26OG76L",
    fileName: "1 рік — ПРОГРАМА Університет",
    kind: "docx",
    folder: DESIGN_FOLDER,
  },

  // ───────── Коледж · предмети (папка «Коледж») ─────────
  "Комп'ютерна графіка та основи дизайну (72 пари)": {
    fileId: "1piYhBAF4yHserh7Kh8dPqL74YvqQdkiV",
    fileName: "Комп'ютерна графіка та основи дизайну — 72 пари",
    kind: "docx",
    folder: COLLEGE_FOLDER,
  },
  "Мистецтво (78 пар)": {
    fileId: "1yJhCyusD7IxGyu2LLIPE210VUurzs6mC",
    fileName: "Мистецтво — 78 пар",
    kind: "docx",
    folder: COLLEGE_FOLDER,
  },
  "Типологія графічного дизайну (81 пара)": {
    fileId: "1EreiumN9lYLoB0uX0tomJ-_91xq3Rv90",
    fileName: "Типологія графічного дизайну — 81 пара",
    kind: "docx",
    folder: COLLEGE_FOLDER,
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
  "Arcade Lab": "1GKWFK1SksziRwx9HYsrlUiXTUTk-Y_nv",
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
 * Курси МКА, чиї програми лежать окремими файлами в корені папки «МКА 2025»,
 * а не в підпапках курсів (додано під час звірки з Drive 2026-08-17).
 */
const MKA_ROOT_PROGRAMS: Record<string, { fileId: string; fileName: string; kind: DriveFileKind }> = {
  PhotoLab: { fileId: "16L96PvuCCaCAYov5eF8_iVLia_AK-jQSgnirKPrIpjo", fileName: "програма PhotoLab", kind: "gdoc" },
  "Python Lab": { fileId: "1OfrxcUhcv_snp225g3CEEbqpuvwETDON", fileName: "програма Python Lab", kind: "docx" },
  "VR LAB": { fileId: "1fJAICkNeXcLacb3AtmfagxeH4I82CcfWuvBMedup_W8", fileName: "програма VR LAB МКА", kind: "gdoc" },
  "Concept Art": { fileId: "1SlkrROBG8_Rn0JIxcaOsWM0cPPo4Z_p5v_gfNts7Kg8", fileName: "Concept Art МКА", kind: "gdoc" },
  "Kodu + Struckd": { fileId: "19DLnFxqw2bOG5MZpavsg2r72r7-ucVYQ05g1jZpudo8", fileName: "програма Kodu+Struckd", kind: "gdoc" },
  "CodeArt: Створення сайту": { fileId: "1xXMVn4aKAb1IPHgi5HLLjN4xJ0ahp1PF4NLl4l-Czp8", fileName: "CodeArt: Створення сайту", kind: "gdoc" },
  "Інноваційні технології": { fileId: "1HaU2luD5oClvSsytB5sfERgrot23rf0VmSUx81o-suA", fileName: "Інноваційні технології", kind: "gdoc" },
  "CineMagic AI (візуальні ефекти)": { fileId: "1LNhmqHQSC4Ry4_fW27NOE0WGgj7wYShc2HHBhwZyv8c", fileName: "Додатковий модуль CineMagic AI — візуальні ефекти", kind: "gdoc" },
};

for (const [name, ref] of Object.entries(MKA_ROOT_PROGRAMS)) {
  PROGRAM_DRIVE[name] = { ...ref, folder: MKA_FOLDER };
}

/** Дитячі спецкурси — програми лежать у корені папки МКА. */
PROGRAM_DRIVE["Розробка ігор у Roblox Studio"] = {
  fileId: "1zi0_5g01CEmkFR7JOsrwnvUeEqqk68GkbK-u5Ku8Qgk",
  fileName: "програма Roblox",
  kind: "gdoc",
  folder: MKA_FOLDER,
};

/**
 * Курси всередині укрупнених карток напрямку «Освіта для дітей».
 * Картка-продукт веде одразу в генератор, а конкретний курс (і разом із ним
 * навчальну програму з Drive) викладач обирає полем «Курс» у формі.
 */
export const COURSE_SETS: Record<string, string[]> = {
  "МКА — Мала Комп'ютерна Академія": [
    ...Object.keys(MKA_COURSES),
    ...Object.keys(MKA_ROOT_PROGRAMS),
  ].sort((a, b) => a.localeCompare(b, "uk")),
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
  "Коледж — Фаховий коледж IT STEP": [
    "Комп'ютерна графіка та основи дизайну (72 пари)",
    "Мистецтво (78 пар)",
    "Типологія графічного дизайну (81 пара)",
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

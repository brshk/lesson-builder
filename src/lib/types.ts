export type LessonDuration = 45 | 60 | 90 | 120 | 180 | number;

export type LessonFormat = "offline" | "online" | "mixed";

export type Language = "uk" | "ru" | "en";

export type MaterialType =
  | "scenario" // Детальний сценарій заняття
  | "slides" // Опис слайдів презентації
  | "practice" // Практичне завдання
  | "homework"; // Домашнє завдання (3 рівні)

export interface GenerateRequest {
  directionId: string;
  product?: string; // продукт/курс з каталогу напрямку
  discipline: string;
  topic: string;
  duration: number; // хвилини
  format: LessonFormat;
  language: Language;
  extraContext?: string;
  tools?: string;
  materialTypes: MaterialType[];
  programFileId?: string; // файл програми навчання з Google Drive
}

export interface DriveProgram {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export type DirectionAccent =
  | "violet"
  | "orange"
  | "sky"
  | "emerald"
  | "teal"
  | "amber"
  | "rose";

export type DirectionIcon =
  | "cap"
  | "book"
  | "school"
  | "rocket"
  | "layers"
  | "building"
  | "diploma";

/** Категорія програм усередині напрямку (напр. «Дизайн» у СК). */
export interface ProgramGroup {
  title: string;
  programs: string[];
}

export interface Direction {
  id: string;
  /** Коротке позначення напрямку: ПКО, ШС, МКА… */
  code: string;
  name: string;
  description?: string;
  accent: DirectionAccent;
  icon: DirectionIcon;
  /** Плаский список усіх програм напрямку. */
  disciplines?: string[];
  /** Якщо задано — програми показуються згрупованими за категоріями. */
  groups?: ProgramGroup[];
}

export type LessonDuration = 45 | 60 | 90 | 120 | 180 | number;

export type LessonFormat = "offline" | "online" | "mixed";

export type Language = "uk" | "ru" | "en";

export type MaterialType =
  | "scenario" // Детальний сценарій заняття
  | "slides" // Опис слайдів презентації
  | "practice" // Практичне завдання
  | "homework"; // Домашнє завдання (3 рівні)

export type GroupLevel = "weak" | "mixed" | "strong";

/**
 * Профіль конкретної групи. Один і той самий урок для 11-річних новачків
 * і для сильної групи підлітків має виглядати по-різному — саме ці поля
 * дають моделі підстави для диференціації.
 */
export interface GroupContext {
  /** Назва профілю, щоб викладач міг зберегти й перевикористати групу. */
  name?: string;
  ageFrom?: number;
  ageTo?: number;
  students?: number;
  level?: GroupLevel;
  /** ПК/ноутбуки, проєктор, планшети… */
  hardware?: string;
  /** Що група вже проходила. */
  priorKnowledge?: string;
}

export interface GenerateRequest {
  directionId: string;
  product?: string; // продукт/курс з каталогу напрямку
  lessonNumber?: number; // номер уроку в курсі (для шапки шаблону)
  discipline: string;
  topic: string;
  duration: number; // хвилини
  format: LessonFormat;
  language: Language;
  extraContext?: string;
  tools?: string;
  materialTypes: MaterialType[];
  programFileId?: string; // файл програми навчання з Google Drive
  group?: GroupContext;
}

/** Швидкі дії AI-редактора над окремим блоком уроку. */
export type EditAction =
  | "simpler"
  | "harder"
  | "more-practice"
  | "shorter"
  | "add-game"
  | "adapt-online"
  | "adapt-offline"
  | "replace-paid"
  | "regenerate";

export interface EditRequest {
  /** Готова дія або довільна інструкція з чату. */
  action?: EditAction;
  instruction?: string;
  /** Markdown блоку, який правимо. Порожній — коли правимо весь документ. */
  blockText?: string;
  blockHeading?: string;
  /** Заголовки всіх блоків — щоб модель тримала в голові структуру уроку. */
  outline?: string[];
  /** Весь документ (потрібен для правок у режимі «весь урок»). */
  documentText?: string;
  scope: "block" | "document";
  discipline: string;
  topic: string;
  duration: number;
  format: LessonFormat;
  language: Language;
  product?: string;
  group?: GroupContext;
  tools?: string;
}

// ─────────── відповідність навчальній програмі ───────────

export interface CurriculumItem {
  /** Формулювання пункту програми (цитата або стислий переказ). */
  text: string;
  covered: boolean;
  /** У яких блоках уроку розкрито цей пункт. */
  blocks: string[];
}

export interface ComplianceReport {
  /** false — програму не прив'язано, відсоток не рахуємо. */
  curriculumFound: boolean;
  programName?: string;
  items: CurriculumItem[];
  outcomes: string[];
  /** Що модель додала від себе понад програму (не обов'язково погано). */
  aiAdditions: { block: string; what: string }[];
  /** Блоки, що виходять за межі затвердженої програми. */
  outOfScope: { block: string; why: string }[];
  /** Рахується в коді як covered/total, а не вигадується моделлю. */
  coverage: number;
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

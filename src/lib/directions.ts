import type { Direction, ProgramGroup } from "./types";

/**
 * Програми напрямку «Освіта для дітей» — чотири укрупнені картки.
 * Конкретний курс усередині МКА/ПШ/спецкурсів викладач обирає вже
 * в генераторі (поле «Курс»), див. COURSE_SETS у programDrive.ts.
 */
const KIDS_PROGRAMS = [
  "МКА — Мала Комп'ютерна Академія",
  "ПШ — Перший крок",
  "Дитячі спецкурси",
  "IT табір",
];

/** Категорії програм напрямку «СК — Спеціальні курси». */
const SK_GROUPS: ProgramGroup[] = [
  {
    title: "Програмування",
    programs: [
      "Front-end розробка + AI",
      "Full-stack + AI",
      "Тестувальник ПЗ (QA) + AI",
      "Python + AI",
      "DevOps-інженер + AI",
      "Вайб-кодинг",
      "Data Analytics + AI",
    ],
  },
  {
    title: "Дизайн",
    programs: [
      "Графічний дизайн + AI",
      "Graphic Design + AI (Kuala Lumpur)",
      "ШІ для дизайнера",
      "Motion-design + AI",
      "Моделювання в 3Ds Max + AI",
      "FIGMA + AI",
      "UI/UX дизайн + AI",
      "Дизайн інтер'єру + AI",
      "Дизайн легко: Canva + AI",
    ],
  },
  {
    title: "Кібербезпека",
    programs: ["Білий хакінг"],
  },
  {
    // нова бібліотека програм для практикуючих фахівців (Drive, липень 2026)
    title: "Курси для професіоналів",
    programs: [
      "AI Native Designer",
      "AI Art Direction",
      "AI Illustration & Character Design",
      "AI Game Art & Game UI",
      "AI Video Production",
      "Generative UI & Prototyping",
    ],
  },
  {
    title: "Інші напрямки",
    programs: [
      "Штучний інтелект від нуля до профі",
      "AI Content Creator",
      "АІ для бізнесу",
      "Бізнес аналітика + AI",
      "Інтернет-маркетинг + AI",
      "Маркетолог + AI",
      "Digital Marketing Pro",
      "Контекстна реклама Google Ads",
      "Таргетинг у Facebook та Instagram",
      "Курси англійської (Step2Talk)",
      "Корпоративне навчання",
      "Індивідуальні курси",
    ],
  },
];

/**
 * Освітні напрямки IT STEP (структура карток).
 * Продукти всередині напрямків взяті з каталогу ПКО-порталу
 * (https://pko-portal.vercel.app/, зчитано 2026-08-14).
 */
export const DIRECTIONS: Direction[] = [
  {
    id: "pko",
    code: "ПКО",
    name: "Професійна комп'ютерна освіта",
    description:
      "Глибока фундаментальна та практична підготовка спеціалістів для роботи в IT та Creative Industries.",
    accent: "violet",
    icon: "cap",
    disciplines: [
      "AI Native Developer (Розробка ПЗ + AI)",
      "Full-Stack Designer + AI",
      "Кібербезпека + AI",
    ],
  },
  {
    id: "shs",
    code: "ШС",
    name: "Школяр — студент",
    description:
      "Освітні програми для дітей та підлітків, спрямовані на розвиток технічного мислення та креативності.",
    accent: "orange",
    icon: "book",
    disciplines: [
      "ШС Full-Stack Designer + AI",
      "GameDev Unity для підлітків",
    ],
  },
  {
    id: "step-school",
    code: "STEP School",
    name: "Приватна школа IT STEP",
    description:
      "Повна загальна середня освіта з поглибленим вивченням IT — очно та онлайн.",
    accent: "sky",
    icon: "school",
    disciplines: ["ITSTEP SCHOOL (1–11 клас)", "Unicorn online school"],
  },
  {
    id: "mka",
    code: "",
    name: "Освіта для дітей",
    description:
      "Мала Комп'ютерна Академія, Перший крок, дитячі спецкурси та IT табір: IT для учнів 1–8 класів, 7–14 років.",
    accent: "emerald",
    icon: "rocket",
    disciplines: KIDS_PROGRAMS,
  },
  {
    id: "sk",
    code: "СК",
    name: "Спеціальні курси",
    description:
      "Інтенсивні спеціалізовані курси підвищення кваліфікації та швидкого опанування AI-інструментів.",
    accent: "teal",
    icon: "layers",
    groups: SK_GROUPS,
    disciplines: SK_GROUPS.flatMap((g) => g.programs),
  },
  {
    id: "university",
    code: "ВНЗ",
    name: "Вища освіта",
    description:
      "Фаховий коледж і програми вищої освіти — бакалаврат та магістратура за IT-спеціальностями.",
    accent: "rose",
    icon: "diploma",
    disciplines: [
      "Коледж — Фаховий коледж IT STEP",
      "ВНЗ — Вища освіта",
    ],
  },
];

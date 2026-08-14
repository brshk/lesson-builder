import type { Direction } from "./types";

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
      "Розробка ігор у Roblox Studio",
      "Анімація та мультиплікація",
    ],
  },
  {
    id: "psh",
    code: "ПШ",
    name: "Освіта для дітей",
    description:
      "Приватна школа IT STEP: повна загальна середня освіта з поглибленим вивченням IT.",
    accent: "sky",
    icon: "school",
    disciplines: ["ITSTEP SCHOOL (1–11 клас)", "Unicorn online school"],
  },
  {
    id: "mka",
    code: "МКА",
    name: "Освіта для дітей",
    description:
      "Мала Комп'ютерна Академія: перші кроки в IT для учнів 1–8 класів, 7–14 років.",
    accent: "emerald",
    icon: "rocket",
    disciplines: ["Мала Комп'ютерна Академія", "ІТ Старт"],
  },
  {
    id: "sk",
    code: "СК",
    name: "Спеціальні курси",
    description:
      "Інтенсивні спеціалізовані курси підвищення кваліфікації та швидкого опанування AI-інструментів.",
    accent: "teal",
    icon: "layers",
    disciplines: [
      "Front-end розробка + AI",
      "Full-stack + AI",
      "Тестувальник ПЗ (QA) + AI",
      "Python + AI",
      "DevOps-інженер + AI",
      "Вайб-кодинг",
      "Data Analytics + AI",
      "Графічний дизайн + AI",
      "Motion-design + AI",
      "Моделювання в 3Ds Max + AI",
      "FIGMA + AI",
      "UI/UX дизайн + AI",
      "Дизайн інтер'єру + AI",
      "Дизайн легко: Canva + AI",
      "Інтернет-маркетинг + AI",
      "Маркетолог + AI",
      "Digital Marketing Pro",
      "Контекстна реклама Google Ads",
      "Таргетинг у Facebook та Instagram",
      "Штучний інтелект від нуля до профі",
      "АІ для бізнесу",
      "Бізнес аналітика + AI",
      "Білий хакінг",
      "Курси англійської (Step2Talk)",
      "Корпоративне навчання",
      "Індивідуальні курси",
    ],
  },
  {
    id: "college",
    code: "Коледж",
    name: "Фаховий коледж IT STEP",
    description:
      "Фахова передвища освіта після 9/11 класу — 4 роки навчання з дипломом державного зразка.",
    accent: "amber",
    icon: "building",
    disciplines: ["Фаховий коледж IT STEP"],
  },
  {
    id: "university",
    code: "ВНЗ",
    name: "Вища освіта",
    description:
      "Програми вищої освіти — бакалаврат і магістратура за IT-спеціальностями.",
    accent: "rose",
    icon: "diploma",
    disciplines: [],
  },
];

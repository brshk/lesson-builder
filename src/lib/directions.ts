import type { Direction } from "./types";

/**
 * Напрямки та продукти з вкладки «Продукти» ПКО-порталу
 * (https://pko-portal.vercel.app/, зчитано 2026-08-14).
 */
export const DIRECTIONS: Direction[] = [
  {
    id: "pko",
    name: "Професійна комп'ютерна освіта (ПКО)",
    description: "Альтернатива університету",
    disciplines: [
      "AI Native Developer (Розробка ПЗ + AI)",
      "Full-Stack Designer + AI",
      "Кібербезпека + AI",
      "Фаховий коледж IT STEP",
      "ШС Full-Stack Designer + AI",
    ],
  },
  {
    id: "programming",
    name: "Програмування",
    description: "Для дорослих",
    disciplines: [
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
    id: "design",
    name: "Дизайн",
    description: "Для дорослих",
    disciplines: [
      "Графічний дизайн + AI",
      "Motion-design + AI",
      "Моделювання в 3Ds Max + AI",
      "FIGMA + AI",
      "UI/UX дизайн + AI",
      "Дизайн інтер'єру + AI",
      "Дизайн легко: Canva + AI",
    ],
  },
  {
    id: "marketing",
    name: "Маркетинг",
    description: "Для дорослих",
    disciplines: [
      "Інтернет-маркетинг + AI",
      "Маркетолог + AI",
      "Digital Marketing Pro",
      "Контекстна реклама Google Ads",
      "Таргетинг у Facebook та Instagram",
    ],
  },
  {
    id: "cyber-ai-business",
    name: "Кібербезпека · AI · Бізнес",
    description: "Для дорослих",
    disciplines: [
      "Штучний інтелект від нуля до профі",
      "АІ для бізнесу",
      "Бізнес аналітика + AI",
      "Білий хакінг",
    ],
  },
  {
    id: "it-schools",
    name: "ІТ-програми та школи",
    description: "Для дітей та підлітків",
    disciplines: [
      "Мала Комп'ютерна Академія",
      "ІТ Старт",
      "Анімація та мультиплікація",
      "Розробка ігор у Roblox Studio",
      "GameDev Unity для підлітків",
      "ITSTEP SCHOOL (1–11 клас)",
    ],
  },
  {
    id: "new-products",
    name: "Нові продукти",
    description: "Для дітей та підлітків",
    disciplines: ["Unicorn online school"],
  },
  {
    id: "other",
    name: "Інші напрями",
    description: "Додатково",
    disciplines: [
      "Курси англійської (Step2Talk)",
      "Корпоративне навчання",
      "Табори (літо / зима)",
      "Індивідуальні курси",
      "Закордонні табори",
    ],
  },
];

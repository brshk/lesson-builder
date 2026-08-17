/**
 * Відповідність програм застосунку та продуктів ПКО-порталу
 * (https://pko-portal.vercel.app/product/<slug>).
 *
 * Ключ — назва програми з src/lib/directions.ts, значення — slug продукту.
 * Слаги оновлено 2026-08-17: портал перейшов на короткі коди
 * (ai-native-developer-2 → rpz, full-stack-designer-ai → kgid тощо).
 * Програми, яких немає в цьому мапі, генеруються без документа порталу.
 */
export const PROGRAM_PORTAL_SLUG: Record<string, string> = {
  // ПКО
  "AI Native Developer (Розробка ПЗ + AI)": "rpz",
  "Full-Stack Designer + AI": "kgid",
  "Кібербезпека + AI": "mik",

  // ШС — шкільний формат тих самих продуктів ПКО.
  // Документи rpz/mik описують і формат «ПКО Школяр-студент», тому
  // прив'язка коректна; вік і темп задаються профілем групи у формі.
  "ШС Full-Stack Designer + AI": "shs-full-stack-designer-ai",
  "ШС AI Native Developer (Розробка ПЗ + AI)": "rpz",
  "ШС Кібербезпека + AI": "mik",

  // STEP School
  "ITSTEP SCHOOL (1–11 клас)": "itstep-school",
  "Unicorn online school": "unicorn-online-school",

  // Освіта для дітей
  "МКА — Мала Комп'ютерна Академія": "mka",
  "Розробка ігор у Roblox Studio": "roblox",
  "Анімація та мультиплікація": "animation",
  "IT табір": "camps",

  // ШС · окремі продукти
  "GameDev Unity для підлітків": "unity-teens",

  // СК · Програмування
  "Front-end розробка + AI": "frontend",
  "Full-stack + AI": "full-stack",
  "Тестувальник ПЗ (QA) + AI": "qa",
  "Python + AI": "ai-python",
  "DevOps-інженер + AI": "devops",
  "Вайб-кодинг": "vibe-coding",
  "Data Analytics + AI": "data-analytics",

  // СК · Дизайн
  "Графічний дизайн + AI": "graphic-design",
  "Motion-design + AI": "motion-design",
  "Моделювання в 3Ds Max + AI": "3dsmax",
  "FIGMA + AI": "figma",
  "UI/UX дизайн + AI": "uiux",
  "Дизайн інтер'єру + AI": "interior-design",
  "Дизайн легко: Canva + AI": "canva",

  // СК · Кібербезпека
  "Білий хакінг": "white-hacking",

  // СК · Інші напрямки
  "Штучний інтелект від нуля до профі": "ai-zero-pro",
  "АІ для бізнесу": "business-ai",
  "Бізнес аналітика + AI": "ba",
  "Інтернет-маркетинг + AI": "internet-marketing",
  "Маркетолог + AI": "marketer-ai",
  "Digital Marketing Pro": "digital-pro",
  "Контекстна реклама Google Ads": "google-ads",
  "Таргетинг у Facebook та Instagram": "targeting",
  "Курси англійської (Step2Talk)": "english",
  "Корпоративне навчання": "corporate",
  "Індивідуальні курси": "individual",

  // ВНЗ
  "Коледж — Фаховий коледж IT STEP": "koledzh",
};

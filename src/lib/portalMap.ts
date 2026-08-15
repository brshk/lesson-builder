/**
 * Відповідність програм застосунку та документів ПКО-порталу
 * (https://pko-portal.vercel.app/product/<slug>).
 *
 * Ключ — назва програми з src/lib/directions.ts, значення — slug продукту на порталі.
 * Програми, яких немає в цьому мапі, генеруються без документа порталу.
 */
export const PROGRAM_PORTAL_SLUG: Record<string, string> = {
  // ПКО
  "AI Native Developer (Розробка ПЗ + AI)": "ai-native-developer-2",
  "Full-Stack Designer + AI": "full-stack-designer-ai",
  "Кібербезпека + AI": "cybersecurity-ai",

  // ШС
  "ШС Full-Stack Designer + AI": "shs-full-stack-designer-ai",

  // STEP School
  "ITSTEP SCHOOL (1–11 клас)": "it-step-school",
  "Unicorn online school": "unicorn-online-school",

  // МКА
  "Мала Комп'ютерна Академія": "malaia-kompiuternaia-akademyia-mka",

  // СК · Програмування
  "Front-end розробка + AI": "front-end-razrabotka-ai",
  "Full-stack + AI": "full-stack-ai",
  "Тестувальник ПЗ (QA) + AI": "testyrovshchyk-po-qa-ai",
  "Python + AI": "python-ai",
  "DevOps-інженер + AI": "devops-ynzhener-ai",
  "Вайб-кодинг": "vaib-kodynh",
  "Data Analytics + AI": "data-analytics-ai",

  // СК · Дизайн
  "Графічний дизайн + AI": "hrafycheskyi-dyzain-ai",
  "Motion-design + AI": "motion-design-ai",
  "Моделювання в 3Ds Max + AI": "modelyrovanye-v-3ds-max-ai",
  "FIGMA + AI": "figma-ai",
  "UI/UX дизайн + AI": "ui-ux-dyzain-ai",
  "Дизайн легко: Canva + AI": "dyzain-lehko-canva-dlia-vsekh-ai",

  // СК · Інші напрямки
  "Штучний інтелект від нуля до профі": "yskusstvennyi-yntellekt-ot-nulia-do-profy",
  "АІ для бізнесу": "ai-dlia-byznesa",
  "Бізнес аналітика + AI": "byznes-analytyka-ai",
  "Інтернет-маркетинг + AI": "ynternet-marketynh-ai",

  // Коледж
  "Фаховий коледж IT STEP": "koledzh-it-step",
};

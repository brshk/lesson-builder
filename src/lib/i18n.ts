/**
 * Локалізація інтерфейсу: українська / російська / англійська.
 *
 * Базова мова — українська (ключі відповідають українському тексту за змістом).
 * Щоб додати рядок: додайте ключ у всі три словники.
 */
export type UiLang = "uk" | "ru" | "en";

export const UI_LANGS: { id: UiLang; label: string; short: string }[] = [
  { id: "uk", label: "Українська", short: "УКР" },
  { id: "ru", label: "Русский", short: "РУС" },
  { id: "en", label: "English", short: "ENG" },
];

const uk = {
  appTitle: "AI Lesson Builder",
  appSubtitle: "Генератор навчальних матеріалів · IT STEP",

  // крок 1 — напрямки
  directionsTitle: "Освітні напрямки",
  directionsSubtitle:
    "Оберіть напрямок для вибору навчальної програми та створення матеріалів",
  chooseDirection: "Обрати напрямок",
  programsPending: "Програми додаються",
  programsOne: "програма",
  programsFew: "програми",
  programsMany: "програм",

  // крок 2 — програми
  allDirections: "Усі напрямки",
  chooseProgramTitle: "Оберіть навчальну програму",
  chooseProgramSubtitle:
    "Матеріали будуть згенеровані з урахуванням обраної програми напрямку",
  chooseProgram: "Обрати програму",
  programBound: "Навчальна програма прив'язана",
  noProgramsYet: "Для цього напрямку програми ще не додані.",
  continueWithoutProgram: "Продовжити без програми",
  skipProgram: "Пропустити — генерувати без прив'язки до програми",

  // крок 3 — форма
  breadcrumbDirections: "Напрямки",
  change: "Змінити",
  noProgramBound: "Без прив'язки до програми",
  aiModelAndKey: "AI-модель та ключ",
  freeNote:
    "Нічого налаштовувати не потрібно — генерація працює одразу за рахунок академії. Діє обмеження: кілька занять на добу з одного пристрою. Якщо ліміт вичерпано або потрібна вища якість — оберіть вкладку з власним ключем.",
  keyLabel: "Ключ",
  keyStored: "Ключ зберігається лише у вашому браузері.",
  show: "Показати",
  hide: "Сховати",

  lessonParams: "Параметри заняття",
  direction: "Напрямок",
  program: "Програма",
  portalDocUsed: "Опис продукту з ПКО-порталу враховується при генерації",
  changeDirectionOrProgram: "Змінити напрямок або програму",
  discipline: "Дисципліна",
  disciplinePlaceholder: "Напр.: Основи Python",
  topic: "Тема заняття",
  topicPlaceholder: "Напр.: Робота зі списками та кортежами",
  curriculumDrive: "Програма навчання (Google Drive)",
  bound: "Прив'язано",
  boundNote: "Матеріали будуть згенеровані відповідно до цієї програми.",
  notBoundNote:
    "Для цієї програми файл навчальної програми ще не прив'язано — генерація працюватиме без нього.",
  searchProgram: "Пошук програми за назвою…",
  withoutProgram: "— без програми —",
  loadingPrograms: "Завантажую список програм…",

  duration: "Тривалість заняття",
  minutes: "хв",
  customDuration: "Власне значення",
  customDurationPlaceholder: "Тривалість у хвилинах",
  format: "Формат заняття",
  formatOffline: "Офлайн",
  formatOnline: "Онлайн",
  formatMixed: "Змішаний",
  materialsLanguage: "Мова генерування матеріалів",
  extraContext: "Додатковий контекст та побажання",
  extraContextPlaceholder: "Особливості групи, рівень студентів, акценти…",
  tools: "Необхідні інструменти",
  toolsPlaceholder: "Напр.: VS Code, Python 3.12, Figma…",

  materialTypes: "Тип заняття / матеріалів",
  matScenario: "Детальний сценарій заняття",
  matScenarioHint: "поетапний план з таймінгом і конспектом",
  matSlides: "Опис слайдів презентації",
  matSlidesHint: "вміст, візуал і нотатки для кожного слайда",
  matPractice: "Практичне завдання",
  matPracticeHint: "покрокова робота в аудиторії",
  matHomework: "Домашнє завдання",
  matHomeworkHint: "3 рівні: простий, середній, складний",

  generate: "Згенерувати матеріали",
  generating: "Генерую…",
  stop: "Зупинити",

  result: "Результат",
  copy: "Копіювати",
  download: "Завантажити",
  emptyResult:
    "Заповніть параметри заняття зліва та натисніть «Згенерувати матеріали»",

  interfaceLanguage: "Мова інтерфейсу",
  toHome: "На головну",

  footerRights:
    "Усі права захищені. Навчальні програми, описи продуктів і фірмовий шаблон заняття є власністю IT STEP Academy й використовуються лише для внутрішньої підготовки занять.",
  footerDisclaimer:
    "Матеріали створює штучний інтелект — перевіряйте факти, код і таймінг перед заняттям.",
  footerContact: "Зворотний звʼязок",

  course: "Курс",
  courseAny: "— усі курси напрямку —",
  courseHint:
    "Оберіть конкретний курс, щоб генерація враховувала його навчальну програму (📘 — програма прив'язана).",

  providerFree: "Без ключа",
  badgeFree: "безкоштовно",
  badgePaid: "платний ключ",
  noteGemini:
    "Безкоштовний ключ без банківської картки: увійдіть Google-акаунтом → Create API key. Діє безкоштовний денний ліміт запитів.",
  noteOpenai:
    "Потрібен акаунт OpenAI Platform із поповненим балансом (Billing, від $5). Підписка ChatGPT Plus для API не діє — це окремий баланс.",
  noteClaude:
    "Потрібен баланс на акаунті Anthropic (Plans & Billing, від $5). Одна генерація ≈ $0.10–0.30.",

  preparing: "Готую запит…",
  serverError: "Помилка сервера",
  genError: "Помилка генерації",
  docxFailed: "Не вдалося створити DOCX",
  downloadDocx: "Завантажити .docx",
  required: "*",
};

type Dict = typeof uk;

const ru: Dict = {
  appTitle: "AI Lesson Builder",
  appSubtitle: "Генератор учебных материалов · IT STEP",

  directionsTitle: "Образовательные направления",
  directionsSubtitle:
    "Выберите направление, чтобы перейти к учебной программе и созданию материалов",
  chooseDirection: "Выбрать направление",
  programsPending: "Программы добавляются",
  programsOne: "программа",
  programsFew: "программы",
  programsMany: "программ",

  allDirections: "Все направления",
  chooseProgramTitle: "Выберите учебную программу",
  chooseProgramSubtitle:
    "Материалы будут сгенерированы с учётом выбранной программы направления",
  chooseProgram: "Выбрать программу",
  programBound: "Учебная программа привязана",
  noProgramsYet: "Для этого направления программы ещё не добавлены.",
  continueWithoutProgram: "Продолжить без программы",
  skipProgram: "Пропустить — генерировать без привязки к программе",

  breadcrumbDirections: "Направления",
  change: "Изменить",
  noProgramBound: "Без привязки к программе",
  aiModelAndKey: "AI-модель и ключ",
  freeNote:
    "Ничего настраивать не нужно — генерация работает сразу за счёт академии. Действует ограничение: несколько занятий в сутки с одного устройства. Если лимит исчерпан или нужно выше качество — выберите вкладку со своим ключом.",
  keyLabel: "Ключ",
  keyStored: "Ключ хранится только в вашем браузере.",
  show: "Показать",
  hide: "Скрыть",

  lessonParams: "Параметры занятия",
  direction: "Направление",
  program: "Программа",
  portalDocUsed: "Описание продукта с ПКО-портала учитывается при генерации",
  changeDirectionOrProgram: "Изменить направление или программу",
  discipline: "Дисциплина",
  disciplinePlaceholder: "Напр.: Основы Python",
  topic: "Тема занятия",
  topicPlaceholder: "Напр.: Работа со списками и кортежами",
  curriculumDrive: "Учебная программа (Google Drive)",
  bound: "Привязано",
  boundNote: "Материалы будут сгенерированы в соответствии с этой программой.",
  notBoundNote:
    "Для этой программы файл учебной программы ещё не привязан — генерация будет работать без него.",
  searchProgram: "Поиск программы по названию…",
  withoutProgram: "— без программы —",
  loadingPrograms: "Загружаю список программ…",

  duration: "Длительность занятия",
  minutes: "мин",
  customDuration: "Своё значение",
  customDurationPlaceholder: "Длительность в минутах",
  format: "Формат занятия",
  formatOffline: "Офлайн",
  formatOnline: "Онлайн",
  formatMixed: "Смешанный",
  materialsLanguage: "Язык генерации материалов",
  extraContext: "Дополнительный контекст и пожелания",
  extraContextPlaceholder: "Особенности группы, уровень студентов, акценты…",
  tools: "Необходимые инструменты",
  toolsPlaceholder: "Напр.: VS Code, Python 3.12, Figma…",

  materialTypes: "Тип занятия / материалов",
  matScenario: "Подробный сценарий занятия",
  matScenarioHint: "поэтапный план с таймингом и конспектом",
  matSlides: "Описание слайдов презентации",
  matSlidesHint: "содержание, визуал и заметки для каждого слайда",
  matPractice: "Практическое задание",
  matPracticeHint: "пошаговая работа в аудитории",
  matHomework: "Домашнее задание",
  matHomeworkHint: "3 уровня: простой, средний, сложный",

  generate: "Сгенерировать материалы",
  generating: "Генерирую…",
  stop: "Остановить",

  result: "Результат",
  copy: "Копировать",
  download: "Скачать",
  emptyResult:
    "Заполните параметры занятия слева и нажмите «Сгенерировать материалы»",

  interfaceLanguage: "Язык интерфейса",
  toHome: "На главную",

  footerRights:
    "Все права защищены. Учебные программы, описания продуктов и фирменный шаблон занятия являются собственностью IT STEP Academy и используются только для внутренней подготовки занятий.",
  footerDisclaimer:
    "Материалы создаёт искусственный интеллект — проверяйте факты, код и тайминг перед занятием.",
  footerContact: "Обратная связь",

  course: "Курс",
  courseAny: "— все курсы направления —",
  courseHint:
    "Выберите конкретный курс, чтобы генерация учитывала его учебную программу (📘 — программа привязана).",

  providerFree: "Без ключа",
  badgeFree: "бесплатно",
  badgePaid: "платный ключ",
  noteGemini:
    "Бесплатный ключ без банковской карты: войдите Google-аккаунтом → Create API key. Действует бесплатный дневной лимит запросов.",
  noteOpenai:
    "Нужен аккаунт OpenAI Platform с пополненным балансом (Billing, от $5). Подписка ChatGPT Plus для API не действует — это отдельный баланс.",
  noteClaude:
    "Нужен баланс на аккаунте Anthropic (Plans & Billing, от $5). Одна генерация ≈ $0.10–0.30.",

  preparing: "Готовлю запрос…",
  serverError: "Ошибка сервера",
  genError: "Ошибка генерации",
  docxFailed: "Не удалось создать DOCX",
  downloadDocx: "Скачать .docx",
  required: "*",
};

const en: Dict = {
  appTitle: "AI Lesson Builder",
  appSubtitle: "Lesson material generator · IT STEP",

  directionsTitle: "Educational tracks",
  directionsSubtitle:
    "Choose a track to pick a curriculum and create lesson materials",
  chooseDirection: "Choose track",
  programsPending: "Programs coming soon",
  programsOne: "program",
  programsFew: "programs",
  programsMany: "programs",

  allDirections: "All tracks",
  chooseProgramTitle: "Choose a program",
  chooseProgramSubtitle:
    "Materials will be generated according to the selected program",
  chooseProgram: "Choose program",
  programBound: "Curriculum linked",
  noProgramsYet: "No programs have been added to this track yet.",
  continueWithoutProgram: "Continue without a program",
  skipProgram: "Skip — generate without linking to a program",

  breadcrumbDirections: "Tracks",
  change: "Change",
  noProgramBound: "No program selected",
  aiModelAndKey: "AI model and key",
  freeNote:
    "Nothing to set up — generation works right away at the academy's expense. Limit: a few lessons per day from one device. If the limit is reached or you need higher quality, switch to a tab with your own key.",
  keyLabel: "Key",
  keyStored: "The key is stored only in your browser.",
  show: "Show",
  hide: "Hide",

  lessonParams: "Lesson settings",
  direction: "Track",
  program: "Program",
  portalDocUsed: "Product description from the PKO portal is used in generation",
  changeDirectionOrProgram: "Change track or program",
  discipline: "Subject",
  disciplinePlaceholder: "e.g. Python Basics",
  topic: "Lesson topic",
  topicPlaceholder: "e.g. Working with lists and tuples",
  curriculumDrive: "Curriculum (Google Drive)",
  bound: "Linked",
  boundNote: "Materials will follow this curriculum.",
  notBoundNote:
    "No curriculum file is linked to this program yet — generation will run without it.",
  searchProgram: "Search program by name…",
  withoutProgram: "— no curriculum —",
  loadingPrograms: "Loading programs…",

  duration: "Lesson duration",
  minutes: "min",
  customDuration: "Custom",
  customDurationPlaceholder: "Duration in minutes",
  format: "Lesson format",
  formatOffline: "Offline",
  formatOnline: "Online",
  formatMixed: "Hybrid",
  materialsLanguage: "Materials language",
  extraContext: "Additional context and notes",
  extraContextPlaceholder: "Group specifics, student level, emphasis…",
  tools: "Required tools",
  toolsPlaceholder: "e.g. VS Code, Python 3.12, Figma…",

  materialTypes: "Material types",
  matScenario: "Detailed lesson plan",
  matScenarioHint: "step-by-step plan with timing and teacher notes",
  matSlides: "Presentation slide outline",
  matSlidesHint: "content, visuals and speaker notes for each slide",
  matPractice: "Classroom exercise",
  matPracticeHint: "step-by-step guided practice",
  matHomework: "Homework",
  matHomeworkHint: "3 levels: easy, medium, hard",

  generate: "Generate materials",
  generating: "Generating…",
  stop: "Stop",

  result: "Result",
  copy: "Copy",
  download: "Download",
  emptyResult:
    "Fill in the lesson settings on the left and click “Generate materials”",

  interfaceLanguage: "Interface language",
  toHome: "Go to home page",

  footerRights:
    "All rights reserved. Curricula, product descriptions and the lesson template are the property of IT STEP Academy and are used solely for internal lesson preparation.",
  footerDisclaimer:
    "Materials are AI-generated — verify facts, code and timing before class.",
  footerContact: "Get in touch",

  course: "Course",
  courseAny: "— all courses in this track —",
  courseHint:
    "Pick a specific course so generation follows its curriculum (📘 — curriculum linked).",

  providerFree: "No key",
  badgeFree: "free",
  badgePaid: "paid key",
  noteGemini:
    "Free key, no credit card: sign in with a Google account → Create API key. A free daily request limit applies.",
  noteOpenai:
    "Requires an OpenAI Platform account with credit (Billing, from $5). A ChatGPT Plus subscription does not cover API usage — it is a separate balance.",
  noteClaude:
    "Requires credit on your Anthropic account (Plans & Billing, from $5). One generation ≈ $0.10–0.30.",

  preparing: "Preparing the request…",
  serverError: "Server error",
  genError: "Generation error",
  docxFailed: "Could not create the DOCX",
  downloadDocx: "Download .docx",
  required: "*",
};

const DICTS: Record<UiLang, Dict> = { uk, ru, en };

export type UiKey = keyof Dict;

/** Переклад рядка інтерфейсу. */
export function tr(lang: UiLang, key: UiKey): string {
  return DICTS[lang]?.[key] ?? DICTS.uk[key] ?? String(key);
}

/** Правильна форма слова «програма» для лічильника на картці. */
export function programsLabel(lang: UiLang, n: number): string {
  if (n === 0) return tr(lang, "programsPending");
  if (lang === "en") return `${n} ${n === 1 ? tr(lang, "programsOne") : tr(lang, "programsMany")}`;
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${n} ${tr(lang, "programsMany")}`;
  if (last === 1) return `${n} ${tr(lang, "programsOne")}`;
  if (last >= 2 && last <= 4) return `${n} ${tr(lang, "programsFew")}`;
  return `${n} ${tr(lang, "programsMany")}`;
}

/** Назви й описи напрямків (id з directions.ts). */
const DIRECTION_I18N: Record<string, Partial<Record<UiLang, { name: string; description: string }>>> = {
  pko: {
    ru: {
      name: "Профессиональное компьютерное образование",
      description:
        "Глубокая фундаментальная и практическая подготовка специалистов для работы в IT и Creative Industries.",
    },
    en: {
      name: "Professional Computer Education",
      description:
        "In-depth fundamental and practical training for careers in IT and the creative industries.",
    },
  },
  shs: {
    ru: {
      name: "Школьник — студент",
      description:
        "Образовательные программы для детей и подростков, направленные на развитие технического мышления и креативности.",
    },
    en: {
      name: "School student track",
      description:
        "Programs for children and teenagers focused on technical thinking and creativity.",
    },
  },
  "step-school": {
    ru: {
      name: "Частная школа IT STEP",
      description:
        "Полное общее среднее образование с углублённым изучением IT — очно и онлайн.",
    },
    en: {
      name: "IT STEP private school",
      description:
        "Full secondary education with an advanced IT focus — on-site and online.",
    },
  },
  mka: {
    ru: {
      name: "Образование для детей",
      description:
        "Малая Компьютерная Академия, Первый шаг, детские спецкурсы и IT лагерь: IT для учеников 1–8 классов, 7–14 лет.",
    },
    en: {
      name: "Education for children",
      description:
        "Junior Computer Academy, First Step, kids' special courses and IT camp: IT for grades 1–8, ages 7–14.",
    },
  },
  sk: {
    ru: {
      name: "Специальные курсы",
      description:
        "Интенсивные специализированные курсы повышения квалификации и быстрого освоения AI-инструментов.",
    },
    en: {
      name: "Special courses",
      description:
        "Intensive specialised courses for upskilling and mastering AI tools quickly.",
    },
  },
  university: {
    ru: {
      name: "Высшее образование",
      description:
        "Профессиональный колледж и программы высшего образования — бакалавриат и магистратура по IT-специальностям.",
    },
    en: {
      name: "Higher education",
      description:
        "Vocational college plus bachelor's and master's programs in IT specialities.",
    },
  },
};

export function directionName(lang: UiLang, id: string, fallback: string): string {
  return DIRECTION_I18N[id]?.[lang]?.name ?? fallback;
}

export function directionDescription(
  lang: UiLang,
  id: string,
  fallback?: string
): string | undefined {
  return DIRECTION_I18N[id]?.[lang]?.description ?? fallback;
}

/** Заголовки категорій програм (ключ — українська назва з directions.ts). */
const GROUP_I18N: Record<string, Partial<Record<UiLang, string>>> = {
  Програмування: { ru: "Программирование", en: "Programming" },
  Дизайн: { ru: "Дизайн", en: "Design" },
  Кібербезпека: { ru: "Кибербезопасность", en: "Cybersecurity" },
  "Інші напрямки": { ru: "Другие направления", en: "Other" },
  "МКА — Мала Комп'ютерна Академія": {
    ru: "МКА — Малая Компьютерная Академия",
    en: "JCA — Junior Computer Academy",
  },
  "ПШ — Перший крок": { ru: "ПШ — Первый шаг", en: "First Step" },
};

export function groupTitle(lang: UiLang, title: string): string {
  return GROUP_I18N[title]?.[lang] ?? title;
}

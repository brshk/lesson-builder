# AI Lesson Builder

Веб-застосунок для викладачів IT STEP: генерація навчальних матеріалів (сценарії занять, описи слайдів, практичні та домашні завдання) на основі програм навчання з Google Drive та актуальної інформації з інтернету.

## Можливості

- Вибір напрямку (з вкладки «Продукти» ПКО-порталу), дисципліни й теми заняття
- Автоматичний підбір програми навчання з папки Google Drive за назвою дисципліни
- Веб-пошук актуальної інформації з теми (Claude web search)
- Параметри: тривалість (45/60/90/120/180 хв або власне значення), формат (офлайн/онлайн/змішаний), мова (укр/рос/англ), додатковий контекст, інструменти
- Типи матеріалів: детальний сценарій заняття, опис слайдів, практичне завдання, домашнє завдання (3 рівні складності)
- Стрімінг результату в реальному часі, експорт у .docx та .md

## Налаштування

### 1. Anthropic API

Отримайте ключ на https://console.anthropic.com → змінна `ANTHROPIC_API_KEY`.

### 2. Google Drive (сервісний акаунт)

1. У [Google Cloud Console](https://console.cloud.google.com) створіть проєкт, увімкніть **Google Drive API**.
2. Створіть **Service Account** (IAM & Admin → Service Accounts), згенеруйте JSON-ключ.
3. Розшарте папку з програмами навчання на email сервісного акаунта (право «Читач»).
4. Змінні середовища:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` — вміст JSON-ключа (одним рядком або в base64)
   - `GOOGLE_DRIVE_FOLDER_ID` — id папки (частина URL після `/folders/`)

Підтримувані формати програм: Google Docs/Sheets, .docx, .pdf, .txt, .md, .csv. Підпапки скануються до 3 рівнів.

### 3. Локальний запуск

```bash
cp .env.example .env.local   # заповніть значення
npm install
npm run dev                  # http://localhost:3000
```

### 4. Деплой на Vercel

```bash
npx vercel
```

Додайте змінні середовища у Vercel: Project → Settings → Environment Variables (`ANTHROPIC_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_DRIVE_FOLDER_ID`). Для генерації довгих матеріалів рекомендовано увімкнути Fluid Compute (maxDuration до 300 c).

## Що відредагувати під себе

- **`src/lib/directions.ts`** — список напрямків з вкладки «Продукти» ПКО-порталу (зараз заглушка).
- **`src/lib/prompts.ts`** — шаблони матеріалів (`MATERIAL_TEMPLATES`) і системний промпт. Підлаштуйте під фірмовий шаблон академії.
- **`ANTHROPIC_MODEL`** — за замовчуванням `claude-sonnet-4-5`.

## Структура

```
src/
  app/
    page.tsx                  # головна сторінка з формою та результатом
    api/programs/route.ts     # список програм з Google Drive
    api/generate/route.ts     # генерація (Claude + web search, SSE-стрімінг)
    api/export/docx/route.ts  # експорт результату в .docx
  lib/
    directions.ts             # напрямки (Продукти)
    prompts.ts                # шаблони матеріалів і промпти
    drive.ts                  # Google Drive (сервісний акаунт)
    mdToDocx.ts               # Markdown → DOCX
    types.ts
```

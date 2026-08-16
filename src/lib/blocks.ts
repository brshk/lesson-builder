/**
 * Розбиття згенерованого конспекту на редаговані блоки.
 *
 * Блок = заголовок рівня ## або ### разом із текстом до наступного такого
 * заголовка. Заголовок першого рівня (# Урок №…) і таблиця-шапка під ним
 * потрапляють в один вступний блок — його теж можна правити.
 *
 * Розбиття суто текстове й зворотне: join(blocks) === вихідний markdown,
 * тому правка одного блоку ніколи не псує решту документа.
 */
export interface LessonBlock {
  id: string;
  /** Текст заголовка без «#». Для вступу — назва уроку або «Шапка заняття». */
  heading: string;
  /** 0 — вступ (до першого ##), інакше 2 або 3. */
  level: number;
  /** Повний markdown блоку, разом із рядком заголовка. */
  text: string;
}

/** Рядки всередині ``` не є заголовками, навіть якщо починаються з #. */
function headingLevelAt(line: string): number | null {
  const m = /^(#{2,3})\s+(.+)$/.exec(line);
  return m ? m[1].length : null;
}

export function splitBlocks(markdown: string): LessonBlock[] {
  const lines = markdown.split("\n");
  const blocks: LessonBlock[] = [];
  let current: string[] = [];
  let currentHeading = "";
  let currentLevel = 0;
  let inFence = false;
  let n = 0;

  const flush = () => {
    const text = current.join("\n");
    if (!text.trim()) return;
    blocks.push({
      id: `b${n++}`,
      heading: currentHeading || firstMeaningfulLine(text),
      level: currentLevel,
      text,
    });
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const level = inFence ? null : headingLevelAt(line);
    if (level !== null) {
      flush();
      current = [line];
      currentHeading = line.replace(/^#{2,3}\s+/, "").trim();
      currentLevel = level;
    } else {
      current.push(line);
    }
  }
  flush();
  return blocks;
}

function firstMeaningfulLine(text: string): string {
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^#\s+/, "").trim();
    if (line && !line.startsWith("|")) return line.slice(0, 80);
  }
  return "Початок документа";
}

export function joinBlocks(blocks: LessonBlock[]): string {
  return blocks.map((b) => b.text).join("\n");
}

/**
 * Прибирає обгортку, яку модель іноді додає попри заборону:
 * ```markdown … ``` та вступні фрази на кшталт «Ось оновлена версія:».
 */
export function cleanEditedBlock(raw: string, expectedHeading?: string): string {
  let s = raw.trim();

  const fence = s.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```$/);
  if (fence) s = fence[1].trim();

  // якщо перед заголовком є балачка — відрізаємо все до заголовка
  if (expectedHeading) {
    const idx = s.indexOf("#");
    if (idx > 0 && idx < 400) {
      const before = s.slice(0, idx);
      if (!before.includes("\n\n") || before.length < 200) s = s.slice(idx);
    }
  }
  return s.trim();
}

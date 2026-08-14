import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

/** Спрощений конвертер Markdown → DOCX (заголовки, списки, таблиці, код, жирний/курсив). */

function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // токенізація **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, m.index) }));
    }
    const token = m[0];
    if (token.startsWith("**")) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith("`")) {
      runs.push(
        new TextRun({ text: token.slice(1, -1), font: "Consolas", shading: { fill: "F2F2F2" } })
      );
    } else {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true }));
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }
  return runs.length ? runs : [new TextRun({ text: "" })];
}

function headingLevel(depth: number) {
  switch (depth) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    default:
      return HeadingLevel.HEADING_4;
  }
}

function makeTable(rows: string[][]): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (cells, rowIndex) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                borders: { top: border, bottom: border, left: border, right: border },
                shading: rowIndex === 0 ? { fill: "EDEDED" } : undefined,
                children: [
                  new Paragraph({
                    children: rowIndex === 0
                      ? [new TextRun({ text: cell.replace(/\*\*/g, ""), bold: true })]
                      : parseInline(cell),
                  }),
                ],
              })
          ),
        })
    ),
  });
}

export async function markdownToDocx(markdown: string, title: string): Promise<Buffer> {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title })],
    })
  );

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // код-блок
    if (line.trim().startsWith("```")) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // закриваючі ```
      for (const codeLine of codeLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: codeLine || " ", font: "Consolas", size: 18 })],
            shading: { fill: "F5F5F5" },
            spacing: { before: 0, after: 0 },
          })
        );
      }
      continue;
    }

    // таблиця
    if (line.trim().startsWith("|") && lines[i + 1]?.trim().match(/^\|[\s\-:|]+\|$/)) {
      const tableRows: string[][] = [];
      const parseRow = (row: string) =>
        row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      tableRows.push(parseRow(line));
      i += 2; // пропускаємо роздільник
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableRows.push(parseRow(lines[i]));
        i++;
      }
      children.push(makeTable(tableRows));
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    // заголовок
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      children.push(
        new Paragraph({
          heading: headingLevel(h[1].length),
          children: parseInline(h[2]),
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    // горизонтальна лінія
    if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "BFBFBF" } },
          text: "",
        })
      );
      i++;
      continue;
    }

    // маркований список
    const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bullet) {
      const level = Math.min(Math.floor(bullet[1].length / 2), 3);
      children.push(
        new Paragraph({ children: parseInline(bullet[2]), bullet: { level } })
      );
      i++;
      continue;
    }

    // нумерований список (як абзац з номером — спрощено)
    const numbered = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${numbered[2]}. `, bold: true }), ...parseInline(numbered[3])],
          indent: { left: 360 + Math.min(Math.floor(numbered[1].length / 2), 3) * 360 },
        })
      );
      i++;
      continue;
    }

    // порожній рядок
    if (!line.trim()) {
      i++;
      continue;
    }

    // звичайний абзац
    children.push(
      new Paragraph({ children: parseInline(line), spacing: { after: 120 } })
    );
    i++;
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

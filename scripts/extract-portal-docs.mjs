/**
 * Витягує документи продуктів із вивантаження ПКО-порталу у src/data/portal/<slug>.md
 *
 * Як оновити зліпок:
 * 1. Залогіньтеся на https://pko-portal.vercel.app
 * 2. У консолі браузера виконайте скрипт із scripts/portal-dump-snippet.js
 *    — він збереже pko-portal-docs.json
 * 3. node scripts/extract-portal-docs.mjs <шлях-до-pko-portal-docs.json>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const input = process.argv[2];
if (!input) {
  console.error("Використання: node scripts/extract-portal-docs.mjs <pko-portal-docs.json>");
  process.exit(1);
}

// читаємо мапу програм → slug просто як текст (щоб не тягнути TS-рантайм)
const mapSrc = fs.readFileSync(path.join(root, "src/lib/portalMap.ts"), "utf8");
const slugs = new Set(
  [...mapSrc.matchAll(/:\s*"([a-z0-9-]+)",/g)].map((m) => m[1])
);

const data = JSON.parse(fs.readFileSync(input, "utf8"));
const outDir = path.join(root, "src/data/portal");
fs.mkdirSync(outDir, { recursive: true });

const docs = {};
const missing = new Set(slugs);
for (const p of data.products) {
  if (!slugs.has(p.slug) || !p.doc) continue;
  docs[p.slug] = { title: p.title, category: p.category || "", doc: p.doc };
  missing.delete(p.slug);
}
const written = Object.keys(docs).length;

// один JSON-модуль, щоб Next гарантовано включив його у серверний бандл
fs.writeFileSync(
  path.join(root, "src/data/portalDocs.json"),
  JSON.stringify(
    {
      fetchedAt: data.fetchedAt,
      source: "https://pko-portal.vercel.app",
      count: written,
      docs,
    },
    null,
    0
  ),
  "utf8"
);

console.log(`Записано ${written} документів у src/data/portalDocs.json`);
if (missing.size) console.log("Не знайдено на порталі:", [...missing].join(", "));

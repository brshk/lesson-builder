/**
 * Оновлення зліпка документів ПКО-порталу.
 *
 * 1. Залогіньтеся на https://pko-portal.vercel.app
 * 2. Відкрийте консоль браузера (F12 → Console) і виконайте весь цей файл
 *    — завантажиться pko-portal-docs.json
 * 3. У проєкті: node scripts/extract-portal-docs.mjs ~/Downloads/pko-portal-docs.json
 * 4. Закомітьте оновлений src/data/portalDocs.json
 */
(async () => {
  const j = await (await fetch("/api/products")).json();
  const out = [];
  for (const p of j.products) {
    try {
      const r = await fetch("/api/doc/" + p.slug);
      const t = r.ok ? await r.text() : "";
      out.push({
        slug: p.slug,
        title: p.title,
        category: p.category || "",
        group: p.group || "",
        note: p.note || "",
        doc: t,
      });
    } catch {
      out.push({ slug: p.slug, title: p.title, doc: "" });
    }
  }
  const blob = new Blob(
    [JSON.stringify({ fetchedAt: new Date().toISOString(), products: out })],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pko-portal-docs.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log("Збережено продуктів:", out.length);
})();

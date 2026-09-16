import { active, esc, refNames, safeUrl, unb64 } from "./core.js";
export function graphSVG(p) {
  const entities = active(p, "entities"),
    relations = active(p, "relations"),
    count = entities.length,
    w = 900,
    h = Math.max(420, Math.ceil(count / 4) * 150),
    pos = new Map();
  entities.forEach((n, i) => {
    const angle = (i * 2 * Math.PI) / Math.max(count, 1) - Math.PI / 2;
    pos.set(n.id, {
      x: w / 2 + Math.cos(angle) * (count === 1 ? 0 : 300),
      y: h / 2 + Math.sin(angle) * (count === 1 ? 0 : h / 2 - 70),
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Graf powiązań"><rect width="${w}" height="${h}" fill="#121c2d"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7da6e9"/></marker></defs>${relations
    .map((r) => {
      const a = pos.get(r.from),
        b = pos.get(r.to);
      if (!a || !b) return "";
      return `<g><title>${esc(r.code + " · " + r.title + " · " + refNames(p, "sources", r.sources))}</title><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#678fc9" stroke-width="2" marker-end="url(#arrow)"/><text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 9}" fill="#e6b16d" font-family="sans-serif" font-size="12" text-anchor="middle">${esc(r.code)}</text></g>`;
    })
    .join("")}${entities
    .map((n) => {
      const a = pos.get(n.id);
      return `<g data-entity="${n.id}" tabindex="0" style="cursor:pointer"><title>${esc(n.title)}</title><circle cx="${a.x}" cy="${a.y}" r="24" fill="#243b5f" stroke="#87b5ff" stroke-width="2"/><text x="${a.x}" y="${a.y + 4}" fill="#ffffff" font-size="11" font-family="sans-serif" text-anchor="middle">${esc(n.code.slice(-4))}</text><text x="${a.x}" y="${a.y + 44}" fill="#eaf1fb" font-family="sans-serif" font-size="14" text-anchor="middle">${esc(n.title.length > 28 ? n.title.slice(0, 26) + "…" : n.title)}</text></g>`;
    })
    .join(
      "",
    )}${!count ? '<text x="450" y="210" text-anchor="middle" fill="#9caec9" font-family="sans-serif" font-size="18">Dodaj podmioty i relacje, aby zobaczyć graf.</text>' : ""}</svg>`;
}
async function svgPNG(svg) {
  const img = new Image(),
    url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = Math.round((1800 * img.height) / img.width);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function makePDF(p) {
  const { PDFDocument, rgb, PDFName, PDFString } = window.PDFLib;
  if (!window.fontkit)
    throw new Error(
      "Nie załadowano lokalnej biblioteki czcionek. Odśwież stronę online.",
    );
  const doc = await PDFDocument.create();
  doc.registerFontkit(window.fontkit);
  const fetchFont = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Brak czcionki do PDF.");
    return r.arrayBuffer();
  };
  const [regular, bold] = await Promise.all([
    fetchFont("./DejaVuSans.ttf"),
    fetchFont("./DejaVuSans-Bold.ttf"),
  ]);
  const font = await doc.embedFont(regular, { subset: true }),
    heavy = await doc.embedFont(bold, { subset: true });
  const width = 595.28,
    height = 841.89,
    left = 48,
    right = 547,
    bodyWidth = right - left,
    bottom = 62;
  const navy = rgb(0.09, 0.15, 0.25),
    blue = rgb(0.15, 0.32, 0.56),
    gray = rgb(0.34, 0.4, 0.49),
    light = rgb(0.84, 0.88, 0.92);
  let page,
    y,
    toc = [];
  const supported = new Set(font.getCharacterSet());
  const clean = (s) =>
    Array.from(
      String(s ?? "")
        .replace(/\t/g, "    ")
        .replace(/[\u0000-\u0008\u000b-\u001f]/g, ""),
    )
      .map((c) => (c === "\n" || supported.has(c.codePointAt(0)) ? c : "?"))
      .join("");
  const newPage = () => {
    page = doc.addPage([width, height]);
    y = height - 66;
    return page;
  };
  function need(h) {
    if (y - h < bottom) newPage();
  }
  function lines(text, size = 10, f = font, max = bodyWidth) {
    const out = [];
    for (const par of clean(text).split("\n")) {
      if (!par) {
        out.push("");
        continue;
      }
      let line = "";
      for (const word of par.split(/\s+/)) {
        let next = line ? line + " " + word : word;
        if (f.widthOfTextAtSize(next, size) <= max) {
          line = next;
          continue;
        }
        if (line) {
          out.push(line);
          line = "";
        }
        if (f.widthOfTextAtSize(word, size) > max) {
          for (const ch of word) {
            if (f.widthOfTextAtSize(line + ch, size) > max) {
              out.push(line);
              line = "";
            }
            line += ch;
          }
        } else line = word;
      }
      out.push(line);
    }
    return out;
  }
  function linkAnnotation(text, x, baseline, size, f, url) {
    const uri = safeUrl(url);
    if (!uri) return;
    const ann = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [
        x,
        baseline - 2,
        x + Math.min(bodyWidth, f.widthOfTextAtSize(text, size)),
        baseline + size,
      ],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(uri) },
    });
    page.node.addAnnot(doc.context.register(ann));
  }
  function write(
    text,
    {
      size = 10,
      f = font,
      color = navy,
      gap = 8,
      x = left,
      max = bodyWidth,
      url,
    } = {},
  ) {
    for (const line of lines(text, size, f, max)) {
      need(size * 1.6);
      if (line) {
        page.drawText(line, { x, y, size, font: f, color });
        if (url) linkAnnotation(line, x, y, size, f, url);
      }
      y -= size * 1.55;
    }
    y -= gap;
  }
  function heading(title) {
    need(70);
    toc.push({ title, page: doc.getPageCount() });
    write(title, { size: 17, f: heavy, color: blue, gap: 12 });
  }
  function sub(title) {
    need(65);
    write(title, { size: 11, f: heavy, gap: 7 });
  }
  function pair(label, value) {
    if (value) write(label + ": " + value, { size: 9.5, color: gray, gap: 7 });
  }
  function sourceRefs(ids, label = "Źródła") {
    const names = refNames(p, "sources", ids);
    if (names) pair(label, names);
  }
  function rule() {
    need(18);
    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness: 0.6,
      color: light,
    });
    y -= 18;
  }
  newPage();
  page.drawRectangle({
    x: 0,
    y: height - 210,
    width,
    height: 210,
    color: navy,
  });
  page.drawText("RAPORT OSINT", {
    x: left,
    y: height - 66,
    font: heavy,
    size: 13,
    color: rgb(0.67, 0.79, 1),
  });
  page.drawText(clean(p.report.template), {
    x: left,
    y: height - 108,
    font,
    size: 11,
    color: rgb(0.85, 0.9, 0.96),
  });
  y = height - 275;
  const coverTitle = lines(p.title, 27, heavy);
  write(coverTitle.slice(0, 3).join("\n"), { size: 27, f: heavy, gap: 24 });
  const coverGoal = lines(p.goal || "Raport analityczny", 12);
  write(coverGoal.slice(0, 3).join("\n"), { size: 12, color: gray, gap: 18 });
  rule();
  pair("Autor", (p.author || "Nie wskazano").slice(0, 90));
  pair("Wygenerowano (UTC)", new Date().toISOString());
  pair("Oznaczenie", p.classification);
  pair("Identyfikator projektu", p.id);
  y = Math.min(y, 190);
  write("Fakty • źródła • ocena analityczna", {
    size: 12,
    f: heavy,
    color: blue,
  });
  write(
    "Raport odzwierciedla stan materiałów w chwili eksportu. Skróty plików pozwalają sprawdzić ich integralność, lecz nie potwierdzają autentyczności ani prawdziwości treści.",
    { size: 9, color: gray },
  );
  newPage();
  const tocPage = page;
  newPage();
  heading("01 / Cel i metodologia");
  pair("Cel", p.goal);
  pair("Pytania badawcze", p.questions);
  pair("Zakres", p.scope);
  pair("Metodologia", p.report.method);
  heading("02 / Streszczenie");
  write(p.report.summary || "Nie uzupełniono.");
  const compact = ["Raport skrócony", "Notatka analityczna"].includes(
    p.report.template,
  );
  if (!compact) {
    heading("03 / Podmioty");
    for (const r of active(p, "entities")) {
      sub(r.code + " · " + r.title);
      pair("Rodzaj", r.type);
      pair("Aliasy", r.aliases);
      write(r.notes || "");
      sourceRefs(r.sources);
      rule();
    }
    if (!active(p, "entities").length) write("Nie dodano podmiotów.");
  }
  heading("04 / Ustalenia");
  for (const r of active(p, "findings")) {
    sub(r.code + " · " + r.title);
    write(r.fact || "");
    pair("Ocena analityczna", r.analysis);
    pair("Pewność", r.confidence);
    sourceRefs(r.sources, "Źródła potwierdzające");
    sourceRefs(r.against, "Źródła przeczące");
    pair("Materiały", refNames(p, "materials", r.materials));
    pair("Podmioty", refNames(p, "entities", r.entities));
    pair("Ograniczenia / alternatywy", r.limits);
    rule();
  }
  if (!active(p, "findings").length) write("Nie dodano ustaleń.");
  if (!compact) {
    heading("05 / Relacje");
    if (p.report.includeGraph && active(p, "entities").length) {
      const img = await doc.embedPng(await svgPNG(graphSVG(p)));
      const ratio = Math.min(bodyWidth / img.width, 330 / img.height);
      const h = img.height * ratio;
      need(h + 30);
      page.drawImage(img, {
        x: left,
        y: y - h,
        width: img.width * ratio,
        height: h,
      });
      y -= h + 22;
      write(
        "Numery krawędzi odpowiadają poniższym relacjom. Dla dużych sieci pełne nazwy znajdują się w rejestrze podmiotów.",
        { size: 8, color: gray },
      );
    }
    for (const r of active(p, "relations")) {
      sub(r.code + " · " + r.title);
      write(
        refNames(p, "entities", [r.from]) +
          " → " +
          refNames(p, "entities", [r.to]),
      );
      pair("Okres", r.date);
      pair("Pewność", r.confidence);
      pair("Opis", r.notes);
      sourceRefs(r.sources);
    }
    heading("06 / Chronologia");
    for (const r of active(p, "events").sort((a, b) =>
      (a.date || "9999").localeCompare(b.date || "9999"),
    )) {
      sub(
        (r.date || "Data nieustalona") +
          (r.end ? " – " + r.end : "") +
          " · " +
          r.title,
      );
      pair("Dokładność", r.precision);
      write(r.notes || "");
      sourceRefs(r.sources);
    }
    heading("07 / Hipotezy");
    for (const r of active(p, "hypotheses")) {
      sub(r.code + " · " + r.title);
      pair("Status", r.status);
      pair("Argumenty za", r.support);
      pair("Argumenty przeciw", r.againstText);
      pair("Alternatywy", r.alternative);
      pair("Do sprawdzenia", r.missing);
      pair("Ustalenia", refNames(p, "findings", r.findings));
      rule();
    }
  }
  heading("08 / Wnioski i ograniczenia");
  sub("Wnioski");
  write(p.report.conclusions || "Nie sformułowano.");
  sub("Ograniczenia");
  write(p.report.limitations || "Nie opisano.");
  for (const s of p.report.sections) {
    heading(s.title);
    write(s.text);
    sourceRefs(s.sources);
  }
  heading("09 / Wykaz źródeł");
  for (const r of active(p, "sources")) {
    sub(r.code + " · " + r.title);
    pair("Autor / wydawca", r.author);
    pair("Data publikacji", r.published);
    pair("Data dostępu (UTC)", r.accessed);
    pair("Typ", r.type);
    pair("Wiarygodność", r.reliability);
    pair("Niezależność", r.independence);
    if (r.url) write(r.url, { size: 9, color: blue, url: r.url });
    if (r.archive) write(r.archive, { size: 9, color: blue, url: r.archive });
    pair("Cytat / treść", r.quote);
    pair("Uwagi", r.notes);
    rule();
  }
  heading("10 / Wykaz materiałów");
  for (const r of active(p, "materials")) {
    sub(r.code + " · " + r.title);
    pair("Plik", r.filename);
    pair("Rozmiar", r.size + " bajtów");
    pair("Import (UTC)", r.created);
    pair("SHA-256", r.hash);
    pair("Opis", r.notes);
    sourceRefs(r.sources);
    if (
      p.report.includeImages &&
      /^data:image\/(png|jpeg|webp);base64,/.test(r.data || "")
    ) {
      let image;
      try {
        if (r.data.startsWith("data:image/png"))
          image = await doc.embedPng(r.data);
        else if (r.data.startsWith("data:image/jpeg"))
          image = await doc.embedJpg(r.data);
        else {
          const img = new Image();
          img.src = r.data;
          await img.decode();
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          c.getContext("2d").drawImage(img, 0, 0);
          image = await doc.embedPng(c.toDataURL("image/png"));
        }
      } catch (e) {
        write("Nie udało się osadzić obrazu; zachowano wpis w wykazie.", {
          size: 9,
          color: gray,
        });
      }
      if (image) {
        const scale = Math.min(1, bodyWidth / image.width, 360 / image.height),
          h = image.height * scale;
        need(h + 30);
        page.drawImage(image, {
          x: left,
          y: y - h,
          width: image.width * scale,
          height: h,
        });
        y -= h + 14;
        write(r.code + " · " + r.title, { size: 8, color: gray });
      }
    }
    rule();
  }
  // Fill the reserved contents page; overflow gets its own page after the cover.
  const tocLines = toc.flatMap((t) =>
    lines(t.title, 10, font, bodyWidth - 40).map((line, i) => ({
      line,
      page: i === 0 ? t.page : null,
    })),
  );
  const perPage = 36,
    extra = Math.max(0, Math.ceil(tocLines.length / perPage) - 1);
  for (let i = 0; i < extra; i++) doc.insertPage(2 + i, [width, height]);
  for (let i = 0; i <= extra; i++) {
    page = doc.getPage(1 + i);
    y = height - 70;
    write(i ? "Spis treści — ciąg dalszy" : "Spis treści", {
      size: 22,
      f: heavy,
      color: blue,
      gap: 24,
    });
    for (const row of tocLines.slice(i * perPage, (i + 1) * perPage)) {
      page.drawText(row.line, { x: left, y, size: 10, font, color: navy });
      if (row.page)
        page.drawText(String(row.page + extra), {
          x: right - 25,
          y,
          size: 10,
          font,
          color: gray,
        });
      y -= 18;
    }
  }
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    if (i > 0) {
      pg.drawText(clean(p.classification), {
        x: left,
        y: height - 31,
        size: 8,
        font,
        color: gray,
      });
      pg.drawLine({
        start: { x: left, y: height - 40 },
        end: { x: right, y: height - 40 },
        thickness: 0.5,
        color: light,
      });
    }
    pg.drawLine({
      start: { x: left, y: 43 },
      end: { x: right, y: 43 },
      thickness: 0.5,
      color: light,
    });
    pg.drawText("Raport OSINT · " + clean(p.id.slice(0, 8)), {
      x: left,
      y: 28,
      size: 8,
      font,
      color: gray,
    });
    pg.drawText(`${i + 1} / ${pages.length}`, {
      x: right - 40,
      y: 28,
      size: 8,
      font,
      color: gray,
    });
  });
  doc.setTitle(p.title);
  doc.setAuthor(p.author || "");
  doc.setSubject("Raport OSINT — " + p.classification);
  doc.setCreator("Generator raportów OSINT");
  doc.setProducer("pdf-lib");
  return doc.save();
}

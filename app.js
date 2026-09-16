import {
  uid,
  now,
  esc,
  collections,
  labels,
  prefixes,
  schema,
  newProject,
  active,
  refNames,
  safeUrl,
  code,
  audit,
  checks,
  openDB,
  readState,
  writeState,
  sha256,
  b64,
  unb64,
  pack,
  unpack,
  download,
  publicProject,
} from "./core.js";
import { makePDF, graphSVG } from "./report.js";
let db,
  state,
  view = "overview",
  query = "",
  saveChain = Promise.resolve(),
  installEvent = null,
  pdfURL = null,
  reportSaveTimer,
  reportUnsaved = false;
const $ = (s) => document.querySelector(s),
  project = () => state.projects.find((x) => x.id === state.current),
  dialog = $("#dialog");
const nav = [
  ["overview", "Pulpit"],
  ["sources", "Źródła"],
  ["materials", "Materiały"],
  ["entities", "Podmioty"],
  ["findings", "Ustalenia"],
  ["relations", "Relacje i graf"],
  ["events", "Oś czasu"],
  ["hypotheses", "Hipotezy"],
  ["tasks", "Zadania"],
  ["report", "Raport"],
  ["quality", "Kontrola jakości"],
  ["tools", "Warsztat OSINT"],
  ["backup", "Kopie i historia"],
];
let toastTimer;
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").style.display = "none"), 5000);
}
function error(e) {
  console.error(e);
  toast(e.message || String(e));
}
async function persist(message) {
  const p = project();
  if (message && p) audit(p, message);
  const copy = structuredClone(state);
  const op = saveChain.catch(() => {}).then(() => writeState(db, copy));
  saveChain = op;
  try {
    await op;
    const el = $("#save-state");
    if (el)
      el.textContent =
        "Zapisano na tym urządzeniu · " +
        new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        });
  } catch (e) {
    const el = $("#save-state");
    if (el) el.textContent = "BŁĄD ZAPISU — wyeksportuj projekt";
    throw new Error(
      "Nie udało się zapisać danych. Sprawdź wolne miejsce i pobierz kopię projektu.",
    );
  }
}
function badge(text, cls = "") {
  return `<span class="tag ${cls}">${esc(text)}</span>`;
}
function head(title, sub, actions = "") {
  return `<div class="heading"><div><div class="eyebrow">${esc(project()?.title || "Twój warsztat")}</div><h1>${title}</h1><p class="muted">${sub}</p></div><div class="actions">${actions}</div></div>`;
}
function btn(action, text, cls = "", attrs = "") {
  return `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${text}</button>`;
}
function rows(key) {
  return active(project(), key).filter(
    (x) =>
      !query ||
      JSON.stringify({ ...x, data: undefined })
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
}
function empty(title, desc) {
  return `<div class="empty"><h2>${title}</h2><p>${desc}</p></div>`;
}
function show(html) {
  dialog.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
function close() {
  dialog.close();
  dialog.innerHTML = "";
  if (pdfURL) {
    URL.revokeObjectURL(pdfURL);
    pdfURL = null;
  }
}
function formFooter(text = "Zapisz") {
  return `<div class="actions">${btn("close", "Anuluj")}<button class="primary" type="submit">${text}</button></div>`;
}
function field(name, label, type = "text", value = "", required = false) {
  return `<div class="field"><label for="f-${name}">${label}${required ? " *" : ""}</label>${type === "textarea" ? `<textarea id="f-${name}" name="${name}" ${required ? "required" : ""}>${esc(value)}</textarea>` : `<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""}>`}</div>`;
}
function select(name, label, options, value) {
  return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options
    .map((o) => {
      const [v, t] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(t)}</option>`;
    })
    .join("")}</select></div>`;
}
function render() {
  document.body.classList.toggle("light", state.theme === "light");
  const p = project();
  $("#app").innerHTML =
    `<div class="shell"><aside class="sidebar"><div class="brand"><img src="./icon.svg" alt=""><div><strong>ARGUS</strong><small>OSINT STUDIO</small></div></div><div><label class="eyebrow" for="project-select">Aktywny projekt</label><select id="project-select">${state.projects.map((p) => `<option value="${p.id}" ${p.id === state.current ? "selected" : ""}>${esc(p.title)}</option>`).join("") || "<option>Brak projektów</option>"}</select><div class="actions" style="margin-top:10px">${btn("new-project", "+ Projekt")}${btn("import", "Import")}</div></div><nav class="nav" aria-label="Nawigacja projektu">${nav.map(([id, title], i) => `<button data-view="${id}" class="${view === id ? "active" : ""}"><b>${String(i + 1).padStart(2, "0")}</b>${title}</button>`).join("")}</nav><div class="sidebar-foot">Twoje dane. Twoje urządzenie.<br>Bez konta i bez telemetrii.<div class="actions" style="margin-top:12px">${btn("theme", state.theme === "light" ? "Ciemny motyw" : "Jasny motyw")}${btn("install", "Instalacja PWA")}</div></div></aside><div class="work"><header class="topbar">${btn("menu", "☰", "mobile-menu", 'aria-label="Otwórz nawigację"')}<span class="brand-name">Warsztat analityczny <span class="muted">/ ${esc(nav.find((n) => n[0] === view)?.[1] || "")}</span></span><input id="search" type="search" aria-label="Filtruj aktualną listę" placeholder="Szukaj na bieżącej liście…" value="${esc(query)}"><span class="status" id="save-state">${navigator.onLine ? "Online" : "Offline"} · dane lokalne</span></header><main id="main" class="page">${p ? content() : welcome()}</main></div></div>`;
  bindMain();
}
function welcome() {
  return (
    head(
      "Zacznij od pytania. Zakończ raportem.",
      "Utwórz projekt, dodaj źródła i powiąż je z ustaleniami.",
    ) +
    `<div class="cols"><section class="card"><div class="eyebrow">NOWE DOCHODZENIE</div><h2>Jaki temat chcesz zbadać?</h2><p class="muted">Każdy projekt ma osobny rejestr źródeł, podmiotów i materiałów. Raport PDF powstaje z Twoich ustaleń.</p><div class="actions">${btn("new-project", "+ Utwórz projekt", "primary")}${btn("demo", "Otwórz przykład fikcyjny")}${btn("import", "Wczytaj kopię")}</div></section><section class="card"><h2>Praca lokalna</h2><p class="muted">Dane nie trafiają do repozytorium. Czyszczenie pamięci przeglądarki może je usunąć. Regularnie pobieraj kopie projektów.</p><small>Na komputerze przygotujesz cały raport. Na telefonie dodasz notatki, zdjęcia i źródła.</small></section></div>`
  );
}
function content() {
  const p = project();
  if (view === "overview") return overview(p);
  if (view === "report") return reportEditor(p);
  if (view === "quality") return quality(p);
  if (view === "tools") return toolsView();
  if (view === "backup") return backups(p);
  if (view === "materials") return materials(p);
  if (collections.includes(view)) return collectionView(p, view);
  return "";
}
function overview(p) {
  const issues = checks(p),
    f = active(p, "findings"),
    linked = f.filter((x) => x.sources?.length).length,
    percent = f.length ? Math.round((linked / f.length) * 100) : 0;
  return (
    head(
      "Przegląd dochodzenia",
      "Źródła, które możesz wskazać. Wnioski, które możesz uzasadnić.",
      btn("edit-project", "Ustawienia projektu") +
        btn("go-report", "Otwórz raport", "primary"),
    ) +
    `<div class="metrics">${[
      ["Źródła", active(p, "sources").length],
      ["Materiały", active(p, "materials").length],
      ["Ustalenia", f.length],
      ["Do sprawdzenia", issues.length],
    ]
      .map(
        ([a, b]) =>
          `<div class="metric"><span>${a}</span><strong>${b.toString().padStart(2, "0")}</strong></div>`,
      )
      .join(
        "",
      )}</div><div class="cols"><div><section class="card"><div class="card-head"><div><div class="eyebrow">KARTA PROJEKTU</div><h2>${esc(p.title)}</h2></div>${badge(p.classification, "warn")}</div><p>${esc(p.goal || "Określ cel badania w ustawieniach projektu.")}</p><small>Pytania badawcze</small><p>${esc(p.questions || "Nie określono.")}</p><small>Zakres</small><p>${esc(p.scope || "Nie określono.")}</p><div class="actions">${btn("add-source", "+ Źródło")}${btn("add-finding", "+ Ustalenie")}${btn("upload", "+ Materiał")}</div></section><section class="card"><h2>Ostatnie ustalenia</h2>${
      f
        .slice(-3)
        .reverse()
        .map(
          (r) =>
            `<div class="step"><b>${esc(r.code)}</b><div><strong>${esc(r.title)}</strong><p class="muted">${esc(r.fact?.slice(0, 180) || "")}</p></div></div>`,
        )
        .join("") ||
      '<p class="muted">Jeszcze nie dodano ustaleń. Zacznij od źródła.</p>'
    }</section></div><div><section class="card"><div class="eyebrow">POKRYCIE ŹRÓDŁAMI</div><h2>${percent}% ustaleń ma źródło</h2><div class="progress"><span style="width:${percent}%"></span></div><p class="muted">${linked} z ${f.length} ustaleń ma przypisaną podstawę. Ten wskaźnik nie ocenia prawdziwości.</p>${btn("go-quality", `Sprawdź raport (${issues.length})`)}</section><section class="card"><h2>Od tropu do raportu</h2>${[
      ["01", "Dodaj źródło i zachowaj materiał."],
      ["02", "Opisz podmioty oraz powiązania."],
      ["03", "Zapisz fakt oddzielnie od oceny."],
      ["04", "Sprawdź hipotezy i ograniczenia."],
      ["05", "Przejrzyj raport i pobierz PDF."],
    ]
      .map(([a, b]) => `<div class="step"><b>${a}</b><p>${b}</p></div>`)
      .join("")}</section></div></div>`
  );
}
function collectionView(p, key) {
  let title = labels[key];
  let body = rows(key);
  if (key === "events")
    body.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    head(
      title,
      `Rejestr projektu · ${body.length} elementów`,
      btn(
        "add",
        `+ Dodaj: ${title.toLowerCase()}`,
        "primary",
        `data-key="${key}"`,
      ),
    ) +
    (key === "relations"
      ? `<section class="card"><div class="card-head"><h2>Mapa powiązań</h2>${btn("graph-download", "Pobierz SVG")}</div><p class="muted">Kliknij podmiot, aby otworzyć jego kartę. Połączenie nie oznacza winy ani tożsamości.</p><div class="graphbox">${graphSVG(p)}</div></section>`
      : "") +
    `<div class="${key === "events" ? "timeline" : "list"}">${body.map((r) => record(p, key, r)).join("") || empty("Ten rejestr jest pusty", query ? "Brak wyników dla bieżącego filtra." : "Dodaj pierwszy element przyciskiem powyżej.")}</div>`
  );
}
function record(p, key, r) {
  let body = "";
  for (const [name, label, type, target] of schema[key]) {
    if (
      name === "title" ||
      !r[name] ||
      (Array.isArray(r[name]) && !r[name].length)
    )
      continue;
    let val =
      type === "refs"
        ? refNames(p, target, r[name])
        : type === "ref"
          ? refNames(p, target, [r[name]])
          : r[name];
    if (type === "url") {
      const u = safeUrl(val);
      val = u
        ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(val)}</a>`
        : esc(val);
    } else val = esc(val);
    body += `<p><small>${label}</small><br>${val}</p>`;
  }
  return `<article class="record ${r.private ? "sensitive" : ""}"><div class="card-head"><div>${badge(r.code)} ${r.private ? badge("WEWNĘTRZNY", "warn") : ""}</div><small>${new Date(r.updated || r.created).toLocaleDateString("pl-PL")}</small></div><h3>${esc(r.title)}</h3>${body}<div class="actions">${btn("edit", "Edytuj", "", `data-key="${key}" data-id="${r.id}"`)}${key === "tasks" ? btn("complete", r.status === "Gotowe" ? "Otwórz ponownie" : "Oznacz gotowe", "", `data-id="${r.id}"`) : ""}${btn("delete", "Do kosza", "danger", `data-key="${key}" data-id="${r.id}"`)}</div></article>`;
}
function formRecord(key, id) {
  const p = project(),
    r = p[key].find((x) => x.id === id) || {},
    isNew = !id;
  show(
    `<form id="record-form" data-key="${key}" data-id="${id || ""}"><h2>${isNew ? "Dodaj" : "Edytuj"} · ${labels[key]}</h2>${schema[
      key
    ]
      .map(([name, label, type, extra]) => {
        let value =
          r[name] ??
          (name === "accessed" ? new Date().toISOString().slice(0, 16) : "");
        if (type === "select") return select(name, label, extra, value);
        if (type === "ref")
          return select(
            name,
            label,
            [
              ["", "Wybierz podmiot"],
              ...active(p, extra).map((x) => [x.id, x.code + " · " + x.title]),
            ],
            value,
          );
        if (type === "refs")
          return `<fieldset><legend>${label}</legend>${
            active(p, extra)
              .map(
                (x) =>
                  `<label class="check"><input type="checkbox" name="${name}" value="${x.id}" ${(r[name] || []).includes(x.id) ? "checked" : ""}>${esc(x.code + " · " + x.title)}</label>`,
              )
              .join("") ||
            "<small>Najpierw dodaj elementy w odpowiednim rejestrze.</small>"
          }</fieldset>`;
        return field(
          name,
          label + (name === "accessed" ? " (UTC)" : ""),
          type || "text",
          value,
          extra === true,
        );
      })
      .join(
        "",
      )}<label class="check"><input type="checkbox" name="private" ${r.private ? "checked" : ""}>Wewnętrzny — pomiń w eksporcie publicznym</label>${formFooter()}</form>`,
  );
  $("#record-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target),
      obj = { ...r };
    for (const [name, , type] of schema[key])
      obj[name] =
        type === "refs" ? fd.getAll(name) : String(fd.get(name) || "").trim();
    if (key === "relations" && (!obj.from || !obj.to))
      return toast("Wybierz oba podmioty relacji.");
    if (key === "events" && obj.end && obj.date && obj.end < obj.date)
      return toast("Data końca nie może poprzedzać początku.");
    obj.private = fd.has("private");
    obj.updated = now();
    if (isNew) {
      obj.id = uid();
      obj.code = code(p, key);
      obj.created = now();
      p[key].push(obj);
    } else p[key][p[key].findIndex((x) => x.id === id)] = obj;
    await persist(
      `${isNew ? "Dodano" : "Zmieniono"} ${obj.code}: ${obj.title}`,
    );
    close();
    render();
  };
}
function projectForm(edit = false) {
  const p = edit ? project() : newProject("");
  show(
    `<form id="project-form"><h2>${edit ? "Ustawienia projektu" : "Nowy projekt"}</h2>${field("title", "Nazwa projektu", "text", p.title, true)}${field("author", "Autor raportu", "text", p.author)}${field("goal", "Cel badania", "textarea", p.goal)}${field("questions", "Pytania badawcze", "textarea", p.questions)}${field("scope", "Zakres i granice analizy", "textarea", p.scope)}${select("classification", "Oznaczenie raportu", ["Roboczy", "Wewnętrzny", "Publiczny"], p.classification)}${formFooter(edit ? "Zapisz" : "Utwórz projekt")}</form>`,
  );
  $("#project-form").onsubmit = async (e) => {
    e.preventDefault();
    Object.assign(p, Object.fromEntries(new FormData(e.target)));
    if (!edit) {
      state.projects.push(p);
      state.current = p.id;
      view = "overview";
    }
    await persist(edit ? "Zmieniono kartę projektu" : "Utworzono projekt");
    close();
    render();
  };
}
function materials(p) {
  return (
    head(
      "Magazyn materiałów",
      "Oryginały, metadane i skróty SHA-256. Maks. 15 MB na plik.",
      btn("upload", "+ Dodaj pliki", "primary"),
    ) +
    `<div class="notice">Skrót potwierdza zgodność bajtów, nie autentyczność treści ani datę jej powstania. HTML jest pobierany jako plik — nigdy wykonywany w aplikacji.</div><div class="library-grid">${
      rows("materials")
        .map(
          (r) =>
            `<article class="record">${badge(r.code)} ${r.private ? badge("WEWNĘTRZNY", "warn") : ""}<h3>${esc(r.title)}</h3>${/^data:image\/(png|jpeg|webp);base64,/.test(r.data || "") ? `<img class="file-preview" src="${r.data}" alt="${esc(r.title)}">` : badge(r.mime || "PLIK")}<p class="muted">${esc(r.filename)} · ${Math.ceil(r.size / 1024)} KB</p><p>${esc(r.notes || "")}</p><small>${esc(refNames(p, "sources", r.sources))}</small><p class="mono">SHA-256<br>${esc(r.hash)}</p><div class="actions">${btn("edit", "Opis / źródła", "", `data-key="materials" data-id="${r.id}"`)}${btn("download-material", "Pobierz", "", `data-id="${r.id}"`)}${btn("verify-material", "Zweryfikuj", "", `data-id="${r.id}"`)}${/^data:image\/(png|jpeg|webp);base64,/.test(r.data || "") ? btn("redact", "Redakcja", "", `data-id="${r.id}"`) : ""}${btn("delete", "Do kosza", "danger", `data-key="materials" data-id="${r.id}"`)}</div></article>`,
        )
        .join("") ||
      empty(
        "Zachowaj materiał źródłowy",
        "Dodaj zrzuty ekranu, dokumenty PDF lub eksporty tekstowe.",
      )
    }</div>`
  );
}
function chooseFile(multiple = false, accept = "") {
  return new Promise((resolve) => {
    const i = document.createElement("input");
    i.type = "file";
    i.multiple = multiple;
    i.accept = accept;
    i.onchange = () => resolve([...i.files]);
    i.oncancel = () => resolve([]);
    i.click();
  });
}
async function upload() {
  const files = await chooseFile(true);
  if (!files.length) return;
  const p = project();
  let total = p.materials.reduce((a, r) => a + r.size, 0);
  for (const file of files) {
    if (file.size > 15 * 1024 * 1024) {
      toast(`${file.name}: limit 15 MB.`);
      continue;
    }
    if (total + file.size > 100 * 1024 * 1024) {
      toast("Limit materiałów projektu: 100 MB.");
      break;
    }
    const bytes = new Uint8Array(await file.arrayBuffer()),
      hash = await sha256(bytes);
    if (p.materials.some((m) => m.hash === hash && !m.deleted)) {
      toast("Pominięto duplikat: " + file.name);
      continue;
    }
    p.materials.push({
      id: uid(),
      code: code(p, "materials"),
      title: file.name,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      hash,
      data: `data:${file.type || "application/octet-stream"};base64,${b64(bytes)}`,
      sources: [],
      created: now(),
      updated: now(),
      private: false,
    });
    total += file.size;
  }
  await persist("Dodano materiały do projektu");
  view = "materials";
  render();
}
function quality(p) {
  const list = checks(p);
  return (
    head(
      "Kontrola jakości",
      "Weryfikacja kompletności, nie automatyczny werdykt o prawdziwości.",
      btn("go-report", "Wróć do raportu", "primary"),
    ) +
    `<div class="metrics"><div class="metric"><span>Błędy strukturalne</span><strong>${list.filter((x) => x.level === "error").length}</strong></div><div class="metric"><span>Uwagi do weryfikacji</span><strong>${list.filter((x) => x.level === "warn").length}</strong></div></div><div class="list">${list.map((x) => `<div class="record">${badge(x.level === "error" ? "WYMAGA POPRAWY" : "SPRAWDŹ", x.level === "error" ? "red" : "warn")}<p style="margin:12px 0 0">${esc(x.text)}</p></div>`).join("") || '<div class="card"><h2>Nie wykryto braków strukturalnych.</h2><p class="muted">Przeczytaj raport i zweryfikuj, czy źródła rzeczywiście wspierają wnioski.</p></div>'}</div>`
  );
}
function reportEditor(p) {
  return (
    head(
      "Raport analityczny",
      "Edytuj treść. Rejestry zostaną dołączone automatycznie.",
      btn("preview-report", "Podgląd") +
        btn("pdf-options", "Generuj PDF", "primary"),
    ) +
    `<section class="card"><div class="grid2">${select("template", "Szablon raportu", ["Raport pełny OSINT", "Raport skrócony", "Profil osoby", "Profil firmy", "Analiza domeny", "Analiza powiązań", "Notatka analityczna"], p.report.template)}<div class="notice">Treści zapisują się po zmianie pola. Oznaczenie „publiczny” nie anonimizuje automatycznie nazw w opisach.</div></div>${[
      ["summary", "Streszczenie"],
      ["method", "Metodologia"],
      ["conclusions", "Wnioski"],
      ["limitations", "Ograniczenia analizy"],
    ]
      .map(
        ([k, l]) =>
          `<div class="section-editor">${field(k, l, "textarea", p.report[k])}</div>`,
      )
      .join(
        "",
      )}<label class="check"><input id="includeGraph" type="checkbox" ${p.report.includeGraph ? "checked" : ""}>Dołącz graf powiązań</label><label class="check"><input id="includeImages" type="checkbox" ${p.report.includeImages ? "checked" : ""}>Dołącz obrazy z magazynu materiałów</label></section><section class="card"><div class="card-head"><h2>Własne rozdziały</h2>${btn("add-section", "+ Rozdział")}</div><p class="muted">Rozdziały pojawią się po części analitycznej, przed wykazem źródeł.</p>${p.report.sections.map((s, i) => `<article class="record"><div class="card-head"><h3>${esc(s.title)}</h3>${s.private ? badge("WEWNĘTRZNY", "warn") : ""}</div><p>${esc(s.text)}</p><small>${esc(refNames(p, "sources", s.sources))}</small><div class="actions">${btn("edit-section", "Edytuj", "", `data-id="${s.id}"`)}${btn("section-up", "↑", "", `aria-label="Rozdział w górę" data-id="${s.id}" ${i === 0 ? "disabled" : ""}`)}${btn("section-down", "↓", "", `aria-label="Rozdział w dół" data-id="${s.id}" ${i === p.report.sections.length - 1 ? "disabled" : ""}`)}${btn("delete-section", "Usuń", "danger", `data-id="${s.id}"`)}</div></article>`).join("")}</section>`
  );
}
function sectionForm(id) {
  const p = project(),
    s = p.report.sections.find((x) => x.id === id) || {
      id: uid(),
      title: "",
      text: "",
      sources: [],
    };
  show(
    `<form id="section-form"><h2>Rozdział raportu</h2>${field("title", "Tytuł", "text", s.title, true)}${field("text", "Treść", "textarea", s.text, true)}<fieldset><legend>Źródła</legend>${active(
      p,
      "sources",
    )
      .map(
        (x) =>
          `<label class="check"><input name="sources" type="checkbox" value="${x.id}" ${s.sources?.includes(x.id) ? "checked" : ""}>${esc(x.code + " · " + x.title)}</label>`,
      )
      .join(
        "",
      )}</fieldset><label class="check"><input name="private" type="checkbox" ${s.private ? "checked" : ""}>Wewnętrzny</label>${formFooter()}</form>`,
  );
  $("#section-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    s.title = fd.get("title");
    s.text = fd.get("text");
    s.sources = fd.getAll("sources");
    s.private = fd.has("private");
    if (!id) p.report.sections.push(s);
    await persist("Zapisano rozdział " + s.title);
    close();
    render();
  };
}
function preview(p) {
  return `<article class="paper"><small>ARGUS / ${esc(p.classification)} / ${new Date().toLocaleDateString("pl-PL")}</small><h1 style="margin-top:25px">${esc(p.title)}</h1><p>${esc(p.report.template)} · ${esc(p.author || "Autor nieokreślony")}</p><hr>${[
    ["Streszczenie", p.report.summary],
    ["Cel badania", p.goal],
    ["Pytania badawcze", p.questions],
    ["Zakres", p.scope],
    ["Metodologia", p.report.method],
  ]
    .map(([t, v]) => (v ? `<h2>${t}</h2><p>${esc(v)}</p>` : ""))
    .join("")}<h2>Ustalenia</h2>${active(p, "findings")
    .map(
      (r) =>
        `<h3>${esc(r.code + " · " + r.title)}</h3><p>${esc(r.fact)}</p><p><strong>Ocena:</strong> ${esc(r.analysis)}</p><p><strong>Pewność:</strong> ${esc(r.confidence)}</p><p class="ref">${esc(refNames(p, "sources", r.sources))}</p>`,
    )
    .join(
      "",
    )}<h2>Wnioski</h2><p>${esc(p.report.conclusions || "Nie sformułowano.")}</p><h2>Ograniczenia</h2><p>${esc(p.report.limitations || "Nie opisano.")}</p>${p.report.sections.map((s) => `<h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>`).join("")}<hr><h2>Źródła</h2>${active(
    p,
    "sources",
  )
    .map(
      (r) =>
        `<p class="ref">${esc(r.code + " · " + r.title)}<br>${esc(r.url || "")}<br>Dostęp: ${esc(r.accessed || "brak")}</p>`,
    )
    .join("")}</article>`;
}
function pdfOptions() {
  const p = project();
  show(
    `<form id="pdf-form"><h2>Eksport raportu PDF</h2><p class="muted">Wykryto ${checks(p).length} uwag kontroli jakości. Eksport nie zastępuje weryfikacji.</p>${select("mode", "Zakres", ["Pełny — z materiałami wewnętrznymi", "Publiczny — bez oznaczonych wewnętrznych"], "Pełny — z materiałami wewnętrznymi")}<label class="check"><input name="reviewed" type="checkbox" required>Sprawdzę treść i dane osobowe przed udostępnieniem.</label><p class="muted">Wariant publiczny usuwa całe oznaczone rekordy. Nie wykrywa wszystkich nazw i danych w tekście. Oryginalnych załączników binarnych nie osadzamy w PDF; raport zawiera ich wykaz i wybrane obrazy.</p><div class="actions">${btn("close", "Anuluj")}<button class="primary" type="submit">Pobierz PDF i manifest</button></div></form>`,
  );
  $("#pdf-form").onsubmit = async (e) => {
    e.preventDefault();
    const mode = new FormData(e.target).get("mode");
    const button = e.target.querySelector("button[type=submit]");
    button.disabled = true;
    button.textContent = "Składanie raportu…";
    try {
      await persist();
      const exported = mode.startsWith("Publiczny")
        ? publicProject(p)
        : structuredClone(p);
      const bytes = await makePDF(exported);
      const hash = await sha256(bytes);
      const name =
        "ARGUS-" +
        p.title
          .replace(/[^a-zA-Z0-9ąęćłńóśźżĄĘĆŁŃÓŚŹŻ_-]+/g, "-")
          .slice(0, 65) +
        "-" +
        new Date().toISOString().slice(0, 10);
      download(bytes, name + ".pdf", "application/pdf");
      download(
        JSON.stringify(
          {
            format: "ARGUS-MANIFEST",
            version: 1,
            title: exported.title,
            exported: now(),
            reportSHA256: hash,
            mode,
            materials: active(exported, "materials").map(
              ({ code, filename, hash, size }) => ({
                code,
                filename,
                sha256: hash,
                size,
              }),
            ),
          },
          null,
          2,
        ),
        name + "-manifest.json",
        "application/json",
      );
      await persist("Wygenerowano raport PDF: " + mode);
      close();
      toast("Pobrano PDF i manifest SHA-256.");
    } catch (e) {
      error(e);
      button.disabled = false;
      button.textContent = "Spróbuj ponownie";
    }
  };
}
function backups(p) {
  return (
    head(
      "Kopie i historia",
      "Przenoś projekt razem z materiałami. Zachowuj kopię poza przeglądarką.",
      btn("export", "Pobierz kopię projektu", "primary"),
    ) +
    `<div class="notice">Lokalna baza nie jest szyfrowana. Hasło zabezpiecza plik eksportu, nie aktywną sesję. Dziennik i daty pochodzą z tego urządzenia; nie są kwalifikowanym znacznikiem czasu ani niezmiennym rejestrem dowodowym.</div><div class="cols"><div><section class="card"><h2>Kopia z załącznikami</h2><p>Ostatni eksport: ${esc(p.lastBackup ? new Date(p.lastBackup).toLocaleString("pl-PL") : "jeszcze nie wykonano")}</p><div class="actions">${btn("export", "Zaszyfrowany eksport")}${btn("import", "Importuj projekt")}${btn("persist-storage", "Poproś o trwałą pamięć")}</div><p id="storage-info" class="muted"></p></section><section class="card"><h2>Punkty przywracania</h2><p class="muted">Do 10 lokalnych kopii opisów i raportu. Oryginalne pliki pozostają w magazynie. To nie zastępuje eksportu.</p>${btn("snapshot", "Zapisz punkt przywracania")}<div class="list" style="margin-top:15px">${(p.snapshots || []).map((s) => `<div class="record"><small>${new Date(s.at).toLocaleString("pl-PL")}</small><p>${esc(s.title)}</p>${btn("restore-snapshot", "Przywróć opisy", "", `data-id="${s.id}"`)}</div>`).join("")}</div></section><section class="card"><h2>Kosz</h2><p class="muted">Usunięte rekordy można przywrócić. Zależne ustalenia pozostają w projekcie, a kontrola jakości pokaże brakujące odwołania.</p>${collections.flatMap((k) => p[k].filter((x) => x.deleted).map((r) => `<div class="step"><span>${esc(r.code + " · " + r.title)}</span>${btn("restore", "Przywróć", "", `data-key="${k}" data-id="${r.id}"`)}</div>`)).join("") || "<small>Kosz jest pusty.</small>"}</section></div><section class="card"><h2>Dziennik zmian</h2><div class="audit">${p.audit.map((a) => `<div><small>${new Date(a.at).toLocaleString("pl-PL")}</small><br>${esc(a.text)}</div>`).join("")}</div><hr><h3>Projekt</h3>${btn("remove-project", "Usuń projekt z tego urządzenia", "danger")}</section></div>`
  );
}
function exportForm() {
  show(
    `<form id="export-form"><h2>Kopia projektu</h2><p class="muted">Wszystkie rekordy, kosz, historia i załączniki. Zalecane hasło: przynajmniej 12 znaków.</p>${field("password", "Hasło eksportu (puste = plik jawny)", "password")}${field("repeat", "Powtórz hasło", "password")}<p class="muted">Nie ma możliwości odzyskania zapomnianego hasła. Jawny plik może odczytać każdy, kto go otrzyma.</p>${formFooter("Pobierz .osintpkg")}</form>`,
  );
  $("#export-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target),
      pass = fd.get("password");
    if (pass !== fd.get("repeat")) return toast("Hasła różnią się.");
    if (pass && pass.length < 12) return toast("Użyj co najmniej 12 znaków.");
    const b = e.target.querySelector("[type=submit]");
    b.disabled = true;
    try {
      const p = project();
      const text = await pack(p, pass);
      download(
        text,
        "ARGUS-" + p.id.slice(0, 8) + ".osintpkg",
        "application/json",
      );
      p.lastBackup = now();
      await persist("Wyeksportowano kopię projektu");
      close();
      render();
      toast("Kopia pobrana. Zachowaj ją w bezpiecznym miejscu.");
    } catch (e) {
      error(e);
      b.disabled = false;
    }
  };
}
async function importProject() {
  const files = await chooseFile(false, ".osintpkg,.json");
  if (!files.length) return;
  const file = files[0];
  if (file.size > 160 * 1024 * 1024)
    throw new Error("Plik przekracza limit 160 MB.");
  const text = await file.text();
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error("To nie jest prawidłowy plik projektu.");
  }
  const perform = async (password) => {
    const p = await unpack(text, password);
    for (const m of p.materials) {
      if (typeof m.data !== "string" || !/^data:[^,]*;base64,/.test(m.data))
        throw new Error("Uszkodzony materiał.");
      const bytes = unb64(m.data.split(",")[1]);
      if (bytes.length !== m.size)
        throw new Error("Nieprawidłowy rozmiar materiału: " + m.title);
      if ((await sha256(bytes)) !== m.hash)
        throw new Error("Niezgodny SHA-256 materiału: " + m.title);
    }
    p.id = uid();
    p.title += " (import)";
    state.projects.push(p);
    state.current = p.id;
    await persist("Zaimportowano projekt jako osobną kopię");
    close();
    view = "overview";
    render();
    toast("Projekt wczytany. Skróty materiałów zweryfikowane.");
  };
  if (envelope.format === "ARGUS-ENCRYPTED") {
    show(
      `<form id="import-form"><h2>Otwórz zaszyfrowaną kopię</h2>${field("password", "Hasło", "password", "", true)}${formFooter("Odszyfruj i importuj")}</form>`,
    );
    $("#import-form").onsubmit = async (e) => {
      e.preventDefault();
      const b = e.target.querySelector("[type=submit]");
      b.disabled = true;
      try {
        await perform(new FormData(e.target).get("password"));
      } catch (e) {
        error(e);
        b.disabled = false;
      }
    };
  } else await perform("");
}
function toolsView() {
  return (
    head(
      "Warsztat OSINT",
      "Narzędzia pracują lokalnie. Wyszukiwanie otwiera wybrany serwis zewnętrzny.",
    ) +
    `<div class="cols"><section class="card"><h2>Analiza tekstu i identyfikatorów</h2>${select(
      "tool",
      "Narzędzie",
      [
        ["extract", "Wyodrębnij e-maile, URL, IP i telefony"],
        ["whois", "Porządkuj WHOIS"],
        ["headers", "Analizuj nagłówki e-mail"],
        ["hash", "Oblicz SHA-256 tekstu"],
        ["normalize", "Normalizuj URL / e-mail / telefon"],
        ["diff", "Porównaj teksty (wiersze)"],
        ["time", "Konwertuj datę ze strefą czasową"],
      ],
      "extract",
    )}${field("tool-input", "Tekst wejściowy", "textarea")}${field("tool-second", "Drugi tekst (tylko porównanie)", "textarea")}<p class="muted">Dla dat użyj np. 2026-09-16T10:30:00+02:00. Telefon normalizowany jest bez przypisywania kraju.</p><div class="actions">${btn("run-tool", "Analizuj", "primary")}${btn("tool-to-material", "Zapisz wynik jako materiał")}</div><pre id="tool-result" class="tool-result">Wynik pojawi się tutaj.</pre></section><div><section class="card"><h2>Zapytania badawcze</h2>${field("search-term", "Nazwa, domena lub pseudonim")}${field("search-site", "Ogranicz do domeny (opcjonalnie)")}${select(
      "search-kind",
      "Rodzaj zapytania",
      [
        ["exact", "Dokładna fraza"],
        ["pdf", "Dokumenty PDF"],
        ["names", "Warianty nazwy"],
        ["social", "Profile społecznościowe"],
      ],
      "exact",
    )}${btn("search-query", "Zbuduj zapytania", "primary")}<div id="queries" style="margin-top:20px"></div></section><section class="card"><h2>Rejestry i źródła</h2><p class="muted">Otwarcie serwisu wymaga Internetu. Samodzielnie zapisz wynik i datę dostępu.</p>${[
      ["KRS", "https://wyszukiwarka-krs.ms.gov.pl/"],
      ["CEIDG", "https://www.biznes.gov.pl/pl/wyszukiwarka-firm"],
      ["CRBR", "https://crbr.podatki.gov.pl/"],
      ["Archiwum WWW", "https://web.archive.org/"],
      ["ICANN Lookup", "https://lookup.icann.org/"],
      ["Google Lens", "https://lens.google/"],
    ]
      .map(
        ([t, u]) =>
          `<div class="step"><a href="${u}" target="_blank" rel="noopener noreferrer">${t} ↗</a></div>`,
      )
      .join("")}</section></div></div>`
  );
}
async function runTool() {
  const t = $("#f-tool-input").value,
    other = $("#f-tool-second").value,
    kind = $("#f-tool").value;
  let out = "";
  const unique = (a) => [...new Set(a || [])];
  if (kind === "extract")
    out = JSON.stringify(
      {
        emails: unique(t.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi)),
        urls: unique(t.match(/https?:\/\/[^\s<>"']+/g)),
        ipv4: unique(t.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)).filter((s) =>
          s.split(".").every((n) => +n <= 255),
        ),
        telefony_kandydaci: unique(
          t.match(/(?:\+\d{1,3}[ -]?)?(?:\d[ -]?){9,12}\b/g),
        ),
      },
      null,
      2,
    );
  if (kind === "whois")
    out =
      t
        .split(/\r?\n/)
        .filter((l) =>
          /domain|registrar|creation|created|expir|updated|status|name server|dnssec|registrant|abuse/i.test(
            l,
          ),
        )
        .join("\n") || "Nie rozpoznano pól WHOIS. Zachowaj również oryginał.";
  if (kind === "headers")
    out =
      t
        .replace(/\r?\n[ \t]+/g, " ")
        .split(/\r?\n/)
        .filter((l) =>
          /^(from|to|subject|date|message-id|return-path|reply-to|received|authentication-results|dkim-signature|received-spf):/i.test(
            l,
          ),
        )
        .join("\n\n") +
      "\n\nUwaga: nagłówki mogą być sfałszowane. Linia Received nie jest samodzielnym dowodem tożsamości.";
  if (kind === "hash") out = await sha256(t);
  if (kind === "normalize") {
    out = t
      .split(/\r?\n/)
      .map((s) => {
        s = s.trim();
        if (s.includes("://")) {
          try {
            let u = new URL(s);
            u.hash = "";
            return u.href;
          } catch {
            return "Nieprawidłowy URL: " + s;
          }
        }
        if (s.includes("@")) {
          const i = s.lastIndexOf("@");
          return s.slice(0, i) + "@" + s.slice(i + 1).toLowerCase();
        }
        if (/^[+\d ()-]+$/.test(s)) return s.replace(/[^+\d]/g, "");
        return s;
      })
      .join("\n");
  }
  if (kind === "diff") {
    const a = t.split("\n"),
      b = other.split("\n");
    out =
      "Tylko w pierwszym:\n" +
      a
        .filter((x) => !b.includes(x))
        .map((x) => "- " + x)
        .join("\n") +
      "\n\nTylko w drugim:\n" +
      b
        .filter((x) => !a.includes(x))
        .map((x) => "+ " + x)
        .join("\n") +
      "\n\nPorównanie zbiorów wierszy; nie śledzi kolejności ani liczby powtórzeń.";
  }
  if (kind === "time") {
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(t.trim()))
      throw new Error("Podaj datę ISO ze strefą, np. +02:00 lub Z.");
    const d = new Date(t);
    if (isNaN(d)) throw new Error("Nieprawidłowa data.");
    out =
      "UTC: " +
      d.toISOString() +
      "\nWarszawa: " +
      d.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }) +
      "\nLokalnie: " +
      d.toLocaleString("pl-PL");
  }
  $("#tool-result").textContent = out;
}
function buildQueries() {
  const term = $("#f-search-term").value.trim().replaceAll('"', ""),
    site = $("#f-search-site")
      .value.trim()
      .replace(/[^\w.-]/g, ""),
    kind = $("#f-search-kind").value;
  if (!term) return toast("Wpisz frazę.");
  let list = [`"${term}"`];
  if (kind === "pdf") list = [`"${term}" filetype:pdf`];
  if (kind === "names")
    list = [
      `"${term}"`,
      `"${term.split(/\s+/).reverse().join(" ")}"`,
      `"${term.replace(/\s+/g, "")}"`,
    ];
  if (kind === "social")
    list = ["facebook.com", "linkedin.com", "instagram.com"].map(
      (s) => `"${term}" site:${s}`,
    );
  if (site) list = list.map((q) => q + " site:" + site);
  $("#queries").innerHTML = list
    .map(
      (q) =>
        `<p><code>${esc(q)}</code><br><a href="https://www.google.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Google ↗</a> · <a href="https://www.bing.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Bing ↗</a></p>`,
    )
    .join("");
}
function bindMain() {
  const p = project();
  $("#project-select").onchange = async (e) => {
    state.current = e.target.value;
    query = "";
    await persist();
    render();
  };
  $("#search").oninput = (e) => {
    query = e.target.value;
    $("#main").innerHTML = p ? content() : welcome();
    bindEditor();
  };
  bindEditor();
}
function bindEditor() {
  const p = project();
  if (!p) return;
  if (view === "report") {
    for (const key of [
      "summary",
      "method",
      "conclusions",
      "limitations",
      "template",
    ]) {
      const el = $("#f-" + key);
      if (el) {
        const save = async () => {
          clearTimeout(reportSaveTimer);
          p.report[key] = el.value;
          try {
            await persist("Zmieniono sekcję raportu: " + key);
            reportUnsaved = false;
          } catch (e) {
            reportUnsaved = true;
            error(e);
          }
        };
        el.oninput = () => {
          p.report[key] = el.value;
          reportUnsaved = true;
          const label = $("#save-state");
          if (label) label.textContent = "Zapisywanie…";
          clearTimeout(reportSaveTimer);
          reportSaveTimer = setTimeout(save, 450);
        };
        el.onchange = save;
      }
    }
    for (const key of ["includeGraph", "includeImages"]) {
      const el = $("#" + key);
      if (el)
        el.onchange = async () => {
          p.report[key] = el.checked;
          await persist();
        };
    }
  }
  if (view === "backup" && navigator.storage?.estimate)
    navigator.storage.estimate().then((x) => {
      const el = $("#storage-info");
      if (el)
        el.textContent = `Zajętość tego originu: ${Math.round((x.usage || 0) / 1024 / 1024)} MB. Dostępny limit: około ${Math.round((x.quota || 0) / 1024 / 1024)} MB.`;
    });
}
async function confirmAction(title, text, fn) {
  show(
    `<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions">${btn("close", "Anuluj")}<button id="confirm" class="danger">Potwierdź</button></div>`,
  );
  $("#confirm").onclick = async () => {
    try {
      await fn();
      close();
      render();
    } catch (e) {
      error(e);
    }
  };
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action],[data-view],[data-entity]");
  if (!b) return;
  try {
    if (b.dataset.entity) {
      formRecord("entities", b.dataset.entity);
      return;
    }
    if (b.dataset.view) {
      view = b.dataset.view;
      query = "";
      render();
      return;
    }
    const action = b.dataset.action,
      p = project(),
      id = b.dataset.id,
      key = b.dataset.key;
    if (action === "close") return close();
    if (action === "menu") return $(".sidebar").classList.toggle("open");
    if (action === "new-project") return projectForm();
    if (action === "edit-project") return projectForm(true);
    if (action === "import") return await importProject();
    if (action === "demo") return await demo();
    if (action === "theme") {
      state.theme = state.theme === "light" ? "dark" : "light";
      await persist();
      render();
      return;
    }
    if (action === "install") {
      if (installEvent) {
        await installEvent.prompt();
        installEvent = null;
      } else
        show(
          "<h2>Zainstaluj ARGUS</h2><p>iPhone / iPad: otwórz stronę w Safari, wybierz Udostępnij → Do ekranu początkowego.</p><p>Komputer / Android: użyj opcji instalacji w menu przeglądarki. Najpierw otwórz stronę przez HTTPS. Po pobraniu zasobów praca jest możliwa offline.</p>" +
            btn("close", "Rozumiem"),
        );
      return;
    }
    if (!p) return toast("Najpierw utwórz projekt.");
    if (action === "add") return formRecord(key);
    if (action === "edit") return formRecord(key, id);
    if (action === "add-source") return formRecord("sources");
    if (action === "add-finding") return formRecord("findings");
    if (action === "upload") return await upload();
    if (action === "go-report") {
      view = "report";
      render();
      return;
    }
    if (action === "go-quality") {
      view = "quality";
      render();
      return;
    }
    if (action === "delete") {
      const r = p[key].find((x) => x.id === id);
      return confirmAction(
        "Przenieść do kosza?",
        r.title + " — element pozostanie możliwy do przywrócenia.",
        async () => {
          r.deleted = now();
          await persist("Do kosza: " + r.code);
        },
      );
    }
    if (action === "restore") {
      delete p[key].find((x) => x.id === id).deleted;
      await persist("Przywrócono rekord");
      render();
      return;
    }
    if (action === "complete") {
      const r = p.tasks.find((x) => x.id === id);
      r.status = r.status === "Gotowe" ? "Do zrobienia" : "Gotowe";
      await persist("Zmieniono status " + r.code);
      render();
      return;
    }
    if (action === "download-material") {
      const m = p.materials.find((x) => x.id === id);
      return download(unb64(m.data.split(",")[1]), m.filename, m.mime);
    }
    if (action === "verify-material") {
      const m = p.materials.find((x) => x.id === id);
      return toast(
        (await sha256(unb64(m.data.split(",")[1]))) === m.hash
          ? "SHA-256 zgodny. Plik nie zmienił się od importu."
          : "NIEZGODNOŚĆ SHA-256!",
      );
    }
    if (action === "redact") return await redact(id);
    if (action === "graph-download")
      return download(graphSVG(p), "ARGUS-powiazania.svg", "image/svg+xml");
    if (action === "preview-report") {
      show(
        '<h2>Podgląd treści głównych</h2><p class="muted">Pełny PDF zawiera również rejestry, graf i wykaz materiałów zgodnie z wybranym szablonem.</p>' +
          preview(p) +
          btn("close", "Zamknij"),
      );
      return;
    }
    if (action === "pdf-options") return pdfOptions();
    if (action === "add-section") return sectionForm();
    if (action === "edit-section") return sectionForm(id);
    if (action === "delete-section")
      return confirmAction(
        "Usunąć rozdział?",
        "Zapisz punkt przywracania, jeśli chcesz zachować tę wersję.",
        async () => {
          p.report.sections = p.report.sections.filter((s) => s.id !== id);
          await persist("Usunięto własny rozdział");
        },
      );
    if (action === "section-up" || action === "section-down") {
      const i = p.report.sections.findIndex((s) => s.id === id),
        j = i + (action === "section-up" ? -1 : 1);
      if (j >= 0 && j < p.report.sections.length)
        [p.report.sections[i], p.report.sections[j]] = [
          p.report.sections[j],
          p.report.sections[i],
        ];
      await persist("Zmieniono kolejność rozdziałów");
      render();
      return;
    }
    if (action === "export") return exportForm();
    if (action === "snapshot") {
      const snapshot = structuredClone(p);
      delete snapshot.snapshots;
      snapshot.materials = snapshot.materials.map(({ data, ...r }) => r);
      p.snapshots.unshift({
        id: uid(),
        at: now(),
        title: p.title,
        data: snapshot,
      });
      p.snapshots = p.snapshots.slice(0, 10);
      await persist("Zapisano punkt przywracania");
      render();
      return;
    }
    if (action === "restore-snapshot")
      return confirmAction(
        "Przywrócić opisy i raport?",
        "Bieżące opisy zostaną zastąpione. Nowsze pliki pozostaną w magazynie. Pobierz kopię przed przywróceniem.",
        async () => {
          const snap = p.snapshots.find((x) => x.id === id),
            currentMaterials = p.materials;
          const materials = snap.data.materials.map((m) => ({
            ...m,
            data: currentMaterials.find((x) => x.id === m.id)?.data,
          }));
          for (const m of currentMaterials)
            if (!materials.some((x) => x.id === m.id)) materials.push(m);
          const snapshots = p.snapshots;
          Object.assign(p, structuredClone(snap.data), {
            materials,
            snapshots,
          });
          await persist("Przywrócono punkt z " + snap.at);
        },
      );
    if (action === "persist-storage") {
      const ok = await navigator.storage?.persist?.();
      return toast(
        ok
          ? "Przeglądarka przyznała trwałą pamięć. Nadal rób kopie."
          : "Przeglądarka nie przyznała trwałej pamięci. Eksportuj kopie.",
      );
    }
    if (action === "remove-project")
      return confirmAction(
        "Usunąć cały projekt?",
        `„${p.title}” zostanie usunięty z tej przeglądarki. Odtworzenie będzie możliwe tylko z wcześniej pobranej kopii.`,
        async () => {
          state.projects = state.projects.filter((x) => x.id !== p.id);
          state.current = state.projects[0]?.id || null;
          await persist();
          toast(
            "Projekt usunięty. Można go odzyskać wyłącznie z pobranej kopii.",
          );
        },
      );
    if (action === "run-tool") return await runTool();
    if (action === "search-query") return buildQueries();
    if (action === "tool-to-material") {
      const text = $("#tool-result").textContent;
      if (!text || text === "Wynik pojawi się tutaj.")
        return toast("Najpierw uruchom analizę.");
      const bytes = new TextEncoder().encode(text);
      p.materials.push({
        id: uid(),
        code: code(p, "materials"),
        title: "Wynik warsztatu — " + $("#f-tool").selectedOptions[0].text,
        filename: "wynik-analizy.txt",
        mime: "text/plain",
        size: bytes.length,
        hash: await sha256(bytes),
        data: "data:text/plain;base64," + b64(bytes),
        created: now(),
        updated: now(),
        sources: [],
        notes: "Wynik narzędzia lokalnego; wymaga interpretacji.",
      });
      await persist("Zapisano wynik warsztatu");
      toast("Wynik dodano do materiałów.");
      return;
    }
  } catch (e) {
    error(e);
  }
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      close();
  }
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches("[data-entity]")
  ) {
    e.preventDefault();
    formRecord("entities", e.target.dataset.entity);
  }
});
window.addEventListener("beforeunload", (e) => {
  if (reportUnsaved) {
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
  error(e.reason);
});
async function redact(id) {
  const p = project(),
    m = p.materials.find((x) => x.id === id),
    img = new Image();
  img.src = m.data;
  await img.decode();
  show(
    `<h2>Redakcja kopii obrazu</h2><p class="muted">Przeciągnij po obrazie, aby trwale zakryć obszar czarnym prostokątem. Oryginał pozostanie bez zmian — oznacz go jako wewnętrzny przed eksportem publicznym.</p><canvas id="redact-canvas"></canvas><div class="actions"><button id="redact-reset">Resetuj maski</button>${btn("close", "Anuluj")}<button class="primary" id="redact-save">Zapisz kopię PNG</button></div>`,
  );
  const c = $("#redact-canvas");
  const factor = Math.min(1, 2400 / Math.max(img.width, img.height));
  c.width = Math.round(img.width * factor);
  c.height = Math.round(img.height * factor);
  const ctx = c.getContext("2d"),
    rects = [];
  function paint() {
    ctx.drawImage(img, 0, 0, c.width, c.height);
    ctx.fillStyle = "#000";
    for (const r of rects) ctx.fillRect(...r);
  }
  paint();
  let start;
  const pos = (e) => {
    const b = c.getBoundingClientRect();
    return [
      ((e.clientX - b.left) * c.width) / b.width,
      ((e.clientY - b.top) * c.height) / b.height,
    ];
  };
  c.onpointerdown = (e) => {
    start = pos(e);
    c.setPointerCapture(e.pointerId);
  };
  c.onpointerup = (e) => {
    if (!start) return;
    const end = pos(e);
    rects.push([
      Math.min(start[0], end[0]),
      Math.min(start[1], end[1]),
      Math.abs(end[0] - start[0]),
      Math.abs(end[1] - start[1]),
    ]);
    start = null;
    paint();
  };
  $("#redact-reset").onclick = () => {
    rects.length = 0;
    paint();
  };
  $("#redact-save").onclick = async () => {
    try {
      if (!rects.length) return toast("Zaznacz co najmniej jeden obszar.");
      const data = c.toDataURL("image/png"),
        bytes = unb64(data.split(",")[1]);
      p.materials.push({
        ...m,
        id: uid(),
        code: code(p, "materials"),
        title: m.title + " — kopia zredagowana",
        filename: "redacted-" + m.filename.replace(/\.[^.]+$/, "") + ".png",
        mime: "image/png",
        data,
        size: bytes.length,
        hash: await sha256(bytes),
        created: now(),
        updated: now(),
        private: false,
        notes: "Zredagowana kopia " + m.code + ". Oryginał zachowany.",
      });
      await persist("Zapisano redakcję kopii " + m.code);
      close();
      render();
    } catch (e) {
      error(e);
    }
  };
}
async function demo() {
  const p = newProject("DEMO · Sieć witryn Example");
  p.author = "Analityk demonstracyjny";
  p.goal =
    "Sprawdzić, czy dwie fikcyjne witryny mają wspólną podstawę organizacyjną.";
  p.questions =
    "Czy istnieją źródła potwierdzające wspólnego operatora? Jakie są alternatywne wyjaśnienia?";
  p.scope =
    "Dane wyłącznie fikcyjne. Przykład sposobu dokumentowania, nie rzeczywiste dochodzenie.";
  function add(k, obj) {
    const r = {
      id: uid(),
      code: code(p, k),
      created: now(),
      updated: now(),
      ...obj,
    };
    p[k].push(r);
    return r;
  }
  const s = add("sources", {
    title: "Przykładowy regulamin — fikcyjny materiał",
    url: "https://example.com",
    author: "Fikcyjny operator",
    accessed: now().slice(0, 16),
    published: "2026-09-01",
    type: "Pierwotne",
    reliability: "Nieoceniona",
    quote: "DEMO: w regulaminie wskazano tę samą nazwę operatora.",
    notes: "Treść ilustracyjna; nie została pobrana z witryny.",
  });
  const a = add("entities", {
      title: "Operator Example (fikcyjny)",
      type: "Firma",
      sources: [s.id],
      notes: "Podmiot demonstracyjny.",
    }),
    b = add("entities", {
      title: "example.com",
      type: "Domena",
      sources: [s.id],
      notes: "Domena przykładowa; relacja jest fikcyjna.",
    }),
    c = add("entities", {
      title: "example.org",
      type: "Domena",
      sources: [s.id],
      notes: "Domena przykładowa; relacja jest fikcyjna.",
    });
  add("relations", {
    title: "wskazany operator (DEMO)",
    from: a.id,
    to: b.id,
    sources: [s.id],
    confidence: "Niska",
  });
  add("relations", {
    title: "wskazany operator (DEMO)",
    from: a.id,
    to: c.id,
    sources: [s.id],
    confidence: "Niska",
  });
  const f = add("findings", {
    title: "Powtarzająca się nazwa operatora (DEMO)",
    fact: "W dwóch fikcyjnych regulaminach pojawia się identyczna nazwa operatora.",
    analysis:
      "Zbieżność może wskazywać wspólnego operatora, ale nie wyklucza skopiowania treści.",
    confidence: "Niska",
    sources: [s.id],
    against: [],
    entities: [a.id, b.id, c.id],
    materials: [],
    limits: "Brak niezależnego potwierdzenia. Dane demonstracyjne.",
  });
  add("hypotheses", {
    title: "Wspólny operator obu witryn (DEMO)",
    support: "Zgodna nazwa w fikcyjnych regulaminach.",
    againstText: "Brak niezależnych źródeł.",
    alternative: "Skopiowany szablon regulaminu.",
    missing: "Potwierdzenie w niezależnym rejestrze.",
    status: "Otwarta",
    findings: [f.id],
  });
  add("events", {
    title: "Zapis fikcyjnego regulaminu",
    date: "2026-09-01",
    precision: "Dokładna",
    sources: [s.id],
    entities: [b.id],
  });
  add("tasks", {
    title: "Zweryfikować operatora w niezależnym źródle",
    status: "Do zrobienia",
    notes: "Zadanie demonstracyjne.",
  });
  p.report.summary =
    "Przykładowy raport pokazuje sposób łączenia źródeł, ustaleń oraz hipotez. Wszystkie powiązania są fikcyjne.";
  p.report.conclusions =
    "Nie można potwierdzić hipotezy na podstawie danych demonstracyjnych.";
  p.report.limitations =
    "Raport nie stanowi ustalenia dotyczącego rzeczywistych podmiotów.";
  state.projects.push(p);
  state.current = p.id;
  await persist("Utworzono projekt demonstracyjny");
  view = "overview";
  render();
}
async function init() {
  try {
    db = await openDB();
    state = await readState(db);
    if (!state.projects.some((p) => p.id === state.current))
      state.current = state.projects[0]?.id || null;
    render();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js")
        .then((reg) => {
          if (reg.waiting)
            toast(
              "Nowa wersja gotowa. Zamknij wszystkie okna ARGUS i otwórz ponownie.",
            );
          reg.addEventListener("updatefound", () => {
            const w = reg.installing;
            w?.addEventListener("statechange", () => {
              if (w.state === "installed")
                toast(
                  navigator.serviceWorker.controller
                    ? "Aktualizacja gotowa. Zamknij wszystkie okna aplikacji po zapisaniu pracy."
                    : "Aplikacja przygotowana do pracy offline.",
                );
            });
          });
        })
        .catch(error);
    }
    const context = document.modelContext;
    if (context?.registerTool) {
      Promise.resolve(
        context.registerTool({
          name: "argus_check_current_report",
          description:
            "Read completeness issues in the currently selected local ARGUS project. Does not modify or export data.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input) => {
            if (!input || Object.keys(input).length)
              throw new Error("No arguments accepted");
            if (!project()) throw new Error("No project selected");
            return { title: project().title, issues: checks(project()) };
          },
        }),
      ).catch(error);
    }
  } catch (e) {
    $("#app").innerHTML =
      '<div class="boot"><h1>Nie można otworzyć lokalnej bazy.</h1><p>' +
      esc(e.message) +
      "</p><p>Użyj zwykłego okna przeglądarki, zezwól na przechowywanie danych i otwórz aplikację przez HTTPS lub localhost.</p></div>";
  }
}
if (navigator.locks) {
  navigator.locks
    .request("argus-writer", { ifAvailable: true }, async (lock) => {
      if (!lock) {
        $("#app").innerHTML =
          '<div class="boot"><h1>ARGUS jest już otwarty.</h1><p>Zamknij drugą kartę lub okno tej aplikacji i odśwież stronę. Chroni to projekty przed równoczesnym nadpisaniem.</p>';
        return;
      }
      await init();
      await new Promise(() => {});
    })
    .catch(error);
} else init();

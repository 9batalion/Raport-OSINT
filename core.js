import { fillReportDefaults, REPORT_DEFAULTS } from "./report-defaults.js";
export const VERSION = 1;
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const collections = [
  "sources",
  "entities",
  "findings",
  "relations",
  "events",
  "hypotheses",
  "tasks",
  "materials",
];
export const labels = {
  sources: "Źródła",
  entities: "Podmioty",
  findings: "Ustalenia",
  relations: "Relacje",
  events: "Oś czasu",
  hypotheses: "Hipotezy",
  tasks: "Zadania",
  materials: "Materiały",
};
export const prefixes = {
  sources: "SRC",
  entities: "ENT",
  findings: "FND",
  relations: "REL",
  events: "EVT",
  hypotheses: "HYP",
  tasks: "TSK",
  materials: "MAT",
};
export const schema = {
  sources: [
    ["title", "Tytuł", "text", true],
    ["url", "Adres URL", "url"],
    ["author", "Autor / wydawca"],
    ["published", "Data publikacji", "date"],
    ["accessed", "Data i czas dostępu", "datetime-local", true],
    ["type", "Rodzaj źródła", "select", ["Pierwotne", "Wtórne", "Nieustalone"]],
    [
      "reliability",
      "Wiarygodność",
      "select",
      ["Nieoceniona", "Wysoka", "Średnia", "Niska"],
    ],
    ["independence", "Niezależność / powiązania z innymi źródłami", "textarea"],
    ["archive", "Adres kopii archiwalnej", "url"],
    ["quote", "Cytat / zaobserwowana treść", "textarea"],
    ["notes", "Ograniczenia i uwagi", "textarea"],
  ],
  entities: [
    ["title", "Nazwa / identyfikator", "text", true],
    [
      "type",
      "Rodzaj",
      "select",
      [
        "Osoba",
        "Firma",
        "Domena",
        "Profil",
        "E-mail",
        "Telefon",
        "IP",
        "Rachunek",
        "Adres",
        "Pojazd",
        "Portfel kryptowalutowy",
        "Inny",
      ],
    ],
    ["aliases", "Aliasy / inne identyfikatory"],
    ["notes", "Opis i ustalenia identyfikacyjne", "textarea"],
    ["sources", "Źródła", "refs", "sources"],
  ],
  findings: [
    ["title", "Tytuł ustalenia", "text", true],
    ["fact", "Fakt / obserwacja", "textarea", true],
    ["analysis", "Ocena analityczna", "textarea"],
    [
      "confidence",
      "Pewność",
      "select",
      ["Nieoceniona", "Wysoka", "Średnia", "Niska"],
    ],
    ["sources", "Źródła potwierdzające", "refs", "sources"],
    ["against", "Źródła przeczące", "refs", "sources"],
    ["materials", "Materiały", "refs", "materials"],
    ["entities", "Podmioty", "refs", "entities"],
    ["limits", "Alternatywne wyjaśnienia / ograniczenia", "textarea"],
  ],
  relations: [
    ["title", "Rodzaj powiązania, np. właściciel", "text", true],
    ["from", "Podmiot początkowy", "ref", "entities"],
    ["to", "Podmiot końcowy", "ref", "entities"],
    ["date", "Od kiedy / okres"],
    [
      "confidence",
      "Pewność",
      "select",
      ["Nieoceniona", "Wysoka", "Średnia", "Niska"],
    ],
    ["sources", "Podstawa źródłowa", "refs", "sources"],
    ["notes", "Opis relacji", "textarea"],
  ],
  events: [
    ["title", "Zdarzenie", "text", true],
    ["date", "Data początku", "date"],
    ["end", "Data końca (opcjonalna)", "date"],
    [
      "precision",
      "Dokładność daty",
      "select",
      ["Dokładna", "Przybliżona", "Przedział", "Nieustalona"],
    ],
    ["notes", "Przebieg / kontekst", "textarea"],
    ["entities", "Podmioty", "refs", "entities"],
    ["sources", "Źródła", "refs", "sources"],
  ],
  hypotheses: [
    ["title", "Hipoteza", "text", true],
    ["support", "Argumenty za", "textarea"],
    ["againstText", "Argumenty przeciw", "textarea"],
    ["alternative", "Alternatywne wyjaśnienia", "textarea"],
    ["missing", "Co trzeba sprawdzić", "textarea"],
    [
      "status",
      "Status",
      "select",
      ["Otwarta", "Wzmocniona", "Osłabiona", "Odrzucona"],
    ],
    ["findings", "Powiązane ustalenia", "refs", "findings"],
  ],
  tasks: [
    ["title", "Co należy zrobić", "text", true],
    ["due", "Termin", "date"],
    ["status", "Status", "select", ["Do zrobienia", "W toku", "Gotowe"]],
    ["notes", "Opis", "textarea"],
  ],
  materials: [
    ["title", "Tytuł / podpis w raporcie", "text", true],
    ["sources", "Źródła", "refs", "sources"],
    ["notes", "Sposób pozyskania / opis", "textarea"],
  ],
};
export function newProject(title = "Nowe dochodzenie") {
  return fillReportDefaults({
    id: uid(),
    title,
    author: "",
    caseNumber: "",
    reportDate: "",
    period: "",
    reportVersion: "1.0",
    goal: "",
    questions: "",
    scope: "",
    classification: "Roboczy",
    created: now(),
    updated: now(),
    report: {
      template: "Raport uniwersalny",
      summary: "",
      method:
        "",
      conclusions: "",
      nextSteps: "",
      review: "",
      limitations: "",
      sections: [],
      includeGraph: true,
      includeImages: true,
    },
    ...Object.fromEntries(collections.map((k) => [k, []])),
    audit: [],
    trash: [],
    snapshots: [],
  });
}
export function active(p, key) {
  return (p[key] || []).filter((x) => !x.deleted);
}
export function refNames(p, key, ids) {
  return (ids || [])
    .map((id) => p[key]?.find((r) => r.id === id))
    .filter(Boolean)
    .map((r) => `${r.code} · ${r.title}`)
    .join("; ");
}
export function safeUrl(s) {
  try {
    const u = new URL(s);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function code(p, key) {
  return `${prefixes[key]}-${String(Math.max(0, ...p[key].map((r) => Number(r.code?.split("-")[1]) || 0)) + 1).padStart(4, "0")}`;
}
export function audit(p, text) {
  p.updated = now();
  p.audit.unshift({ at: now(), text });
  p.audit = p.audit.slice(0, 500);
}
export function checks(p) {
  const out = [];
  const add = (level, text) => out.push({ level, text });
  if (!p.author) add("warn", "Nie wskazano autora raportu.");
  if (!p.goal) add("warn", "Nie określono celu badania.");
  if (!p.report.summary) add("warn", "Brak streszczenia raportu.");
  if (!active(p, "findings").length) add("warn", "Brak ustaleń w projekcie.");
  for (const r of active(p, "sources")) {
    if (!r.accessed) add("warn", `${r.code}: brak daty dostępu.`);
    if (
      !r.url &&
      !active(p, "materials").some((m) => m.sources?.includes(r.id))
    )
      add("warn", `${r.code}: brak URL i przypisanego materiału.`);
    if (r.reliability === "Nieoceniona")
      add("warn", `${r.code}: nieoceniona wiarygodność.`);
  }
  for (const r of active(p, "findings")) {
    if (!r.sources?.length) add("error", `${r.code}: ustalenie bez źródła.`);
    if (!r.analysis) add("warn", `${r.code}: brak oceny analitycznej.`);
    if (r.confidence === "Nieoceniona")
      add("warn", `${r.code}: nieoceniona pewność.`);
    if (
      r.sources?.length &&
      r.sources.every(
        (id) => p.sources.find((s) => s.id === id)?.reliability === "Niska",
      )
    )
      add("warn", `${r.code}: wyłącznie źródła o niskiej wiarygodności.`);
  }
  for (const r of active(p, "relations")) {
    if (!r.sources?.length) add("warn", `${r.code}: relacja bez źródła.`);
    if (r.from === r.to)
      add("warn", `${r.code}: oba końce relacji to ten sam podmiot.`);
  }
  for (const r of active(p, "events")) {
    if (r.end && r.date && r.end < r.date)
      add("error", `${r.code}: koniec przed początkiem.`);
  }
  for (const key of collections)
    for (const r of active(p, key))
      for (const [name, label, type, target] of schema[key] || []) {
        if (type === "refs" || type === "ref") {
          const ids =
            type === "refs" ? r[name] || [] : [r[name]].filter(Boolean);
          if (ids.some((id) => !active(p, target).some((x) => x.id === id)))
            add(
              "error",
              `${r.code}: brakujący lub usunięty element w polu „${label}”.`,
            );
        }
      }
  const text = JSON.stringify({
    ...p,
    audit: [],
    snapshots: [],
    materials: [],
  });
  if (/\b\d{11}\b|\b(?:\d[ -]?){26}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text))
    add(
      "warn",
      "Wykryto możliwe dane osobowe / kontaktowe. Sprawdź zakres przed publikacją.",
    );
  return out;
}
export async function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("argus-osint-v1", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("workspace");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function readState(db) {
  return new Promise((resolve, reject) => {
    const r = db.transaction("workspace").objectStore("workspace").get("state");
    r.onsuccess = () =>
      resolve(
        r.result || {
          version: VERSION,
          projects: [],
          current: null,
          theme: "dark",
        },
      );
    r.onerror = () => reject(r.error);
  });
}
export async function writeState(db, state) {
  return new Promise((resolve, reject) => {
    const t = db.transaction("workspace", "readwrite");
    t.objectStore("workspace").put(state, "state");
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error("Zapis przerwany"));
  });
}
export async function sha256(bytes) {
  const a =
    bytes instanceof ArrayBuffer
      ? bytes
      : typeof bytes === "string"
        ? new TextEncoder().encode(bytes)
        : bytes;
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", a)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export const b64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
};
export const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function cryptKey(password, salt) {
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    ),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function pack(project, password) {
  const payload = JSON.stringify({
    format: "ARGUS-PROJECT",
    version: 1,
    exported: now(),
    project,
  });
  if (!password) return payload;
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await cryptKey(password, salt),
    new TextEncoder().encode(payload),
  );
  return JSON.stringify({
    format: "ARGUS-ENCRYPTED",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 310000,
    salt: b64(salt),
    iv: b64(iv),
    data: b64(new Uint8Array(cipher)),
  });
}
export async function unpack(text, password = "") {
  let x = JSON.parse(text);
  if (x.format === "ARGUS-ENCRYPTED") {
    if (x.version !== 1 || x.iterations !== 310000)
      throw new Error("Nieobsługiwana wersja szyfrowania.");
    try {
      x = JSON.parse(
        new TextDecoder().decode(
          await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: unb64(x.iv) },
            await cryptKey(password, unb64(x.salt)),
            unb64(x.data),
          ),
        ),
      );
    } catch {
      throw new Error("Nieprawidłowe hasło albo uszkodzony plik.");
    }
  }
  if (
    x.format !== "ARGUS-PROJECT" ||
    x.version !== 1 ||
    !x.project ||
    typeof x.project.title !== "string"
  )
    throw new Error("Nieprawidłowy format projektu.");
  const p = x.project;
  validateProject(p);
  p.audit = Array.isArray(p.audit) ? p.audit : [];
  p.snapshots = [];
  p.trash = [];
  return p;
}
export function validateProject(p) {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const fail = () => {
    throw new Error(
      "Nieprawidłowa struktura projektu lub przekroczone limity.",
    );
  };
  if (
    !uuid.test(p.id) ||
    !p.report ||
    !Array.isArray(p.report.sections) ||
    p.report.sections.length > 200
  )
    fail();
  for (const key of [
    "title",
    "author",
    "goal",
    "questions",
    "scope",
    "classification",
    "caseNumber",
    "reportDate",
    "period",
    "reportVersion",
    "created",
    "updated",
  ])
    if (p[key] !== undefined && typeof p[key] !== "string") fail();
  for (const key of [
    "template",
    "preset",
    "summary",
    "method",
    "conclusions",
    ...Object.keys(REPORT_DEFAULTS),
    "limitations",
    "nextSteps",
    "review",
  ])
    if (p.report[key] !== undefined && typeof p.report[key] !== "string")
      fail();
  for (const s of p.report.sections) {
    if (
      !s ||
      !uuid.test(s.id) ||
      typeof s.title !== "string" ||
      typeof s.text !== "string"
    )
      fail();
    if (
      s.sources !== undefined &&
      (!Array.isArray(s.sources) || s.sources.some((x) => !uuid.test(x)))
    )
      fail();
  }
  for (const k of collections) {
    if (!Array.isArray(p[k]) || p[k].length > 5000) fail();
    const ids = new Set();
    for (const r of p[k]) {
      if (
        !r ||
        !uuid.test(r.id) ||
        ids.has(r.id) ||
        typeof r.title !== "string" ||
        !new RegExp("^" + prefixes[k] + "-\\d{4,}$").test(r.code)
      )
        fail();
      ids.add(r.id);
      for (const [name, , type] of schema[k]) {
        if (r[name] === undefined) continue;
        if (type === "refs") {
          if (!Array.isArray(r[name]) || r[name].some((id) => !uuid.test(id)))
            fail();
        } else if (type === "ref") {
          if (r[name] && !uuid.test(r[name])) fail();
        } else if (typeof r[name] !== "string") fail();
      }
      if (r.private !== undefined && typeof r.private !== "boolean") fail();
    }
  }
  let total = 0;
  for (const m of p.materials) {
    if (
      typeof m.filename !== "string" ||
      typeof m.mime !== "string" ||
      typeof m.data !== "string" ||
      !Number.isSafeInteger(m.size) ||
      m.size < 0 ||
      m.size > 15 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(m.hash)
    )
      fail();
    total += m.size;
  }
  if (total > 100 * 1024 * 1024) fail();
  if (
    p.audit !== undefined &&
    (!Array.isArray(p.audit) ||
      p.audit.some(
        (a) => !a || typeof a.at !== "string" || typeof a.text !== "string",
      ))
  )
    fail();
}
export function download(bytes, name, type = "application/octet-stream") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function publicProject(p) {
  const q = structuredClone(p);
  for (const key of collections)
    q[key] = q[key].filter((x) => !x.private && !x.deleted);
  for (const key of collections)
    for (const r of q[key])
      for (const [name, , type, target] of schema[key]) {
        if (type === "refs")
          r[name] = (r[name] || []).filter((id) =>
            q[target].some((x) => x.id === id),
          );
        if (type === "ref" && !q[target].some((x) => x.id === r[name]))
          r[name] = "";
      }
  q.relations = q.relations.filter((r) => r.from && r.to);
  q.report.sections = q.report.sections.filter((s) => !s.private);
  q.classification = "Publiczny";
  return q;
}

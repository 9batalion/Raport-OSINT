import { active, refNames, safeUrl, unb64 } from "./core.js";
import { REPORT } from "./report-template.js";
import { graphSVG } from "./report.js";

export const ODT_MIME = "application/vnd.oasis.opendocument.text";
const encoder = new TextEncoder();
const xml = value => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
  .replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[c]);
const text = value => xml(value).replace(/\r\n?/g, "\n").replace(/\n/g, "<text:line-break/>").replace(/\t/g, "<text:tab/>").replace(/ {2,}/g, s => `<text:s text:c="${s.length}"/>`);

// ZIP STORE: mimetype is the first, uncompressed entry, without extra fields.
function zip(entries) {
  const parts = [], central = [];
  let offset = 0, centralSize = 0;
  const header = n => { const bytes = new Uint8Array(n); return [bytes, new DataView(bytes.buffer)]; };
  for (const [name, value] of entries) {
    const nameBytes = encoder.encode(name), data = typeof value === "string" ? encoder.encode(value) : value;
    let crc = 0xffffffff;
    for (const byte of data) { crc ^= byte; for (let i=0;i<8;i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
    crc = (crc ^ 0xffffffff) >>> 0;
    const [local,l] = header(30);
    l.setUint32(0,0x04034b50,true); l.setUint16(4,20,true); l.setUint16(6,0x800,true); l.setUint16(12,33,true);
    l.setUint32(14,crc,true); l.setUint32(18,data.length,true); l.setUint32(22,data.length,true); l.setUint16(26,nameBytes.length,true);
    const [dir,d] = header(46);
    d.setUint32(0,0x02014b50,true); d.setUint16(4,20,true); d.setUint16(6,20,true); d.setUint16(8,0x800,true); d.setUint16(14,33,true);
    d.setUint32(16,crc,true); d.setUint32(20,data.length,true); d.setUint32(24,data.length,true); d.setUint16(28,nameBytes.length,true); d.setUint32(42,offset,true);
    parts.push(local,nameBytes,data); central.push(dir,nameBytes);
    offset += local.length + nameBytes.length + data.length; centralSize += dir.length + nameBytes.length;
  }
  const [end,e] = header(22);
  e.setUint32(0,0x06054b50,true); e.setUint16(8,entries.length,true); e.setUint16(10,entries.length,true); e.setUint32(12,centralSize,true); e.setUint32(16,offset,true);
  const out = new Uint8Array(offset + centralSize + end.length);
  let pos=0; for (const part of [...parts,...central,end]) { out.set(part,pos); pos+=part.length; }
  return out;
}

const namespaces = `xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"`;
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

export async function makeODT(p) {
  const blocks=[], headings=[], pictures=[];
  const para = (value,style="Body") => blocks.push(`<text:p text:style-name="${style}">${text(value)}</text:p>`);
  const pair = (label,value) => { if(value !== undefined && value !== null && value !== "") para(`${label}: ${value}`); };
  const sub = title => para(title,"Sub");
  const refs = (ids,label="Źródła",key="sources") => pair(label,refNames(p,key,ids));
  const heading = title => {
    const id=`section-${headings.length+1}`;
    headings.push({id,title});
    blocks.push(`<text:h text:style-name="${headings.length === 1 ? 'FirstHeading' : 'Heading'}" text:outline-level="1"><text:bookmark-start text:name="${id}"/>${text(title)}<text:bookmark-end text:name="${id}"/></text:h>`);
  };
  const empty = key => { if (!active(p,key).length) para("Nie dodano wpisów."); };
  const picture = (bytes,mime,extension,width,height,caption) => {
    const path=`Pictures/image-${pictures.length+1}.${extension}`;
    pictures.push({path,bytes,mime});
    blocks.push(`<text:p text:style-name="Body"><draw:frame draw:name="Obraz-${pictures.length}" text:anchor-type="as-char" svg:width="${width}cm" svg:height="${height}cm"><draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame></text:p>`);
    para(caption,"Small");
  };
  para(REPORT.title,"Title"); para(REPORT.subtitle,"Subtitle"); para(p.title,"CoverSubject");
  for (const [label,value] of [["Numer sprawy / sygnatura",p.caseNumber],["Autor",p.author],["Data i miejsce sporządzenia",p.reportDate],["Okres objęty raportem",p.period],["Wersja",p.reportVersion||"1.0"],["Oznaczenie",p.classification],["Wygenerowano (UTC)",new Date().toISOString()],["Identyfikator projektu",p.id]]) pair(label,value||"Nie wskazano");
  para(REPORT.notice,"Small");
  const tocPosition=blocks.length;
  heading(REPORT.sections[0]); pair("Cel",p.goal); pair("Pytania do wyjaśnienia",p.questions); pair("Zakres",p.scope); pair("Metodyka",p.report.method);
  heading(REPORT.sections[1]); para(p.report.summary||"Nie uzupełniono.");
  const compact=["Raport skrócony","Notatka analityczna"].includes(p.report.template);
  if(!compact) {
    heading(REPORT.sections[2]);
  if (p.report.entitiesIntro) para(p.report.entitiesIntro); empty("entities");
    for(const r of active(p,"entities")) { sub(`${r.code} · ${r.title}`); pair("Rodzaj",r.type); pair("Aliasy",r.aliases); para(r.notes||""); refs(r.sources); }
  }
  heading(REPORT.sections[3]);
  if (p.report.findingsIntro) para(p.report.findingsIntro); empty("findings");
  for(const r of active(p,"findings")) {
    sub(`${r.code} · ${r.title}`); para(r.fact||""); pair("Ocena analityczna",r.analysis); pair("Pewność",r.confidence);
    refs(r.sources,"Źródła potwierdzające"); refs(r.against,"Źródła przeczące"); refs(r.materials,"Materiały","materials"); refs(r.entities,"Podmioty","entities"); pair("Ograniczenia / alternatywy",r.limits);
  }
  if(!compact) {
    heading(REPORT.sections[4]);
  if (p.report.relationsIntro) para(p.report.relationsIntro); empty("relations");
    if(p.report.includeGraph && active(p,"entities").length) {
      const svg=graphSVG(p).replaceAll("#121c2d","#f7f9fb").replaceAll("#243b5f","#e1e7ef").replaceAll("#ffffff","#172640").replaceAll("#eaf1fb","#172640").replaceAll("#e6b16d","#57667d");
      const h=Math.max(420,Math.ceil(active(p,"entities").length/4)*150), scale=Math.min(16/900,12/h);
      picture(encoder.encode(svg),"image/svg+xml","svg",900*scale,h*scale,"Graf powiązań. Identyfikatory odpowiadają rejestrom podmiotów i relacji.");
    }
    for(const r of active(p,"relations")) { sub(`${r.code} · ${r.title}`); para(`${refNames(p,"entities",[r.from])} → ${refNames(p,"entities",[r.to])}`); pair("Okres",r.date); pair("Pewność",r.confidence); pair("Opis",r.notes); refs(r.sources); }
    heading(REPORT.sections[5]);
  if (p.report.chronologyIntro) para(p.report.chronologyIntro); empty("events");
    for(const r of active(p,"events").sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"))) { sub(`${r.date||"Data nieustalona"}${r.end?" – "+r.end:""} · ${r.title}`); pair("Dokładność",r.precision); para(r.notes||""); refs(r.sources); }
    heading(REPORT.sections[6]);
  if (p.report.hypothesesIntro) para(p.report.hypothesesIntro); empty("hypotheses");
    for(const r of active(p,"hypotheses")) { sub(`${r.code} · ${r.title}`); for(const [label,key] of [["Status","status"],["Argumenty za","support"],["Argumenty przeciw","againstText"],["Alternatywy","alternative"],["Do sprawdzenia","missing"]]) pair(label,r[key]); refs(r.findings,"Ustalenia","findings"); }
  }
  heading(REPORT.sections[7]); sub("Wnioski"); para(p.report.conclusions||"Nie sformułowano."); sub("Ograniczenia"); para(p.report.limitations||"Nie opisano."); sub("Dalsze czynności"); para(p.report.nextSteps||"Nie wskazano.");
  for(const s of p.report.sections||[]) { heading(s.title); para(s.text); refs(s.sources); }
  heading(REPORT.sections[8]);
  if (p.report.sourcesIntro) para(p.report.sourcesIntro); empty("sources");
  for(const r of active(p,"sources")) {
    sub(`${r.code} · ${r.title}`);
    for(const [label,key] of [["Autor / wydawca","author"],["Data publikacji","published"],["Data dostępu (strefa wg źródła)","accessed"],["Typ","type"],["Wiarygodność","reliability"],["Niezależność","independence"]]) pair(label,r[key]);
    for(const value of [r.url,r.archive]) if(value) { const url=safeUrl(value); if(url) blocks.push(`<text:p text:style-name="Body"><text:a xlink:href="${xml(url)}" xlink:type="simple">${text(value)}</text:a></text:p>`); else para(value); }
    pair("Cytat / treść",r.quote); pair("Uwagi",r.notes);
  }
  heading(REPORT.sections[9]);
  if (p.report.materialsIntro) para(p.report.materialsIntro); empty("materials");
  for(const r of active(p,"materials")) {
    sub(`${r.code} · ${r.title}`); pair("Plik",r.filename); pair("Rozmiar",`${r.size} bajtów`); pair("Import (UTC)",r.created); pair("SHA-256",r.hash); pair("Opis",r.notes); refs(r.sources);
    if(p.report.includeImages && /^data:image\/(png|jpeg|webp);base64,/.test(r.data||"")) {
      try {
        const img=new Image(); img.src=r.data; await img.decode();
        let bytes=unb64(r.data.split(",")[1]), mime=r.data.slice(5,r.data.indexOf(";")), extension=mime.split("/")[1];
        if(extension==="webp") { const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight; c.getContext("2d").drawImage(img,0,0); bytes=unb64(c.toDataURL("image/png").split(",")[1]); mime="image/png"; extension="png"; }
        const scale=Math.min(16/img.naturalWidth,12/img.naturalHeight);
        picture(bytes,mime,extension,img.naturalWidth*scale,img.naturalHeight*scale,`${r.code} · ${r.title}`);
      } catch { para("Nie udało się osadzić obrazu; zachowano wpis w wykazie."); }
    }
  }
  heading(REPORT.sections[10]);
  if (p.report.closingIntro) para(p.report.closingIntro); pair("Data i miejsce",p.reportDate||"Nie wskazano"); pair("Sporządził(a)",p.author||"Nie wskazano"); pair("Weryfikacja / akceptacja",p.report.review||"Nie wskazano"); para("Podpis: ........................................................");
  blocks.splice(tocPosition,0,`<text:p text:style-name="FirstHeading">Spis treści</text:p><text:p text:style-name="Small">Kliknij nazwę rozdziału, aby do niego przejść.</text:p>`+headings.map(h=>`<text:p text:style-name="Body"><text:a xlink:type="simple" xlink:href="#${h.id}">${text(h.title)}</text:a></text:p>`).join(""));
  const styles=declaration+`<office:document-styles ${namespaces} office:version="1.3"><office:styles>
    <style:default-style style:family="paragraph"><style:paragraph-properties fo:line-height="145%" fo:margin-bottom="0.22cm"/><style:text-properties fo:font-family="DejaVu Sans" fo:font-size="10pt" fo:color="#172640" fo:language="pl" fo:country="PL"/></style:default-style>
    <style:style style:name="Body" style:family="paragraph"/>
    <style:style style:name="Title" style:family="paragraph" style:master-page-name="Report"><style:paragraph-properties fo:margin-top="1cm" fo:margin-bottom="0.7cm"/><style:text-properties fo:font-size="27pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="Subtitle" style:family="paragraph"><style:paragraph-properties fo:margin-bottom="1.2cm"/><style:text-properties fo:font-size="12pt" fo:color="#57667d"/></style:style>
    <style:style style:name="CoverSubject" style:family="paragraph"><style:paragraph-properties fo:margin-bottom="0.8cm"/><style:text-properties fo:font-size="20pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="Heading" style:family="paragraph"><style:paragraph-properties fo:keep-with-next="always" fo:margin-top="0.45cm" fo:margin-bottom="0.3cm"/><style:text-properties fo:font-size="15pt" fo:font-weight="bold" fo:color="#26528f"/></style:style>
    <style:style style:name="FirstHeading" style:family="paragraph" style:parent-style-name="Heading"><style:paragraph-properties fo:break-before="page"/></style:style>
    <style:style style:name="Sub" style:family="paragraph"><style:paragraph-properties fo:keep-with-next="always" fo:margin-top="0.35cm"/><style:text-properties fo:font-size="11pt" fo:font-weight="bold"/></style:style>
    <style:style style:name="Small" style:family="paragraph"><style:text-properties fo:font-size="8pt" fo:color="#57667d"/></style:style>
    </office:styles><office:automatic-styles><style:page-layout style:name="A4"><style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" style:print-orientation="portrait" fo:margin="1.7cm" fo:border-left="0.12cm solid #f0f2f5" fo:padding-left="0.4cm"/><style:footer-style><style:header-footer-properties fo:min-height="0.6cm" fo:margin-top="0.4cm" fo:border-top="0.02cm solid #d6e0eb"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Report" style:page-layout-name="A4"><style:footer><text:p text:style-name="Small">Raport z ustaleń · <text:page-number text:select-page="current">1</text:page-number> / <text:page-count>1</text:page-count></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>`;
  const content=declaration+`<office:document-content ${namespaces} office:version="1.3"><office:body><office:text>${blocks.join("")}</office:text></office:body></office:document-content>`;
  const meta=declaration+`<office:document-meta ${namespaces} office:version="1.3"><office:meta><dc:title>${xml(p.title)}</dc:title><dc:creator>${xml(p.author)}</dc:creator><dc:description>${xml(REPORT.subtitle)}</dc:description></office:meta></office:document-meta>`;
  const files=[["mimetype",ODT_MIME],["content.xml",content],["styles.xml",styles],["meta.xml",meta],...pictures.map(r=>[r.path,r.bytes])];
  const manifest=declaration+`<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="${ODT_MIME}" manifest:version="1.3"/>${[...files.slice(1).filter(([name])=>name.endsWith('.xml')).map(([name])=>({path:name,mime:"text/xml"})),...pictures].map(r=>`<manifest:file-entry manifest:full-path="${r.path}" manifest:media-type="${r.mime}"/>`).join("")}</manifest:manifest>`;
  return zip([...files,["META-INF/manifest.xml",manifest]]);
}

// Builds index.html: the live cabinet front (in Gerrick's system order), the 3D model, the A4 drawings
// and the open points. node pdf.mjs && node build.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as k from "./kit/iso-kit.mjs";
import { figure, BOXES, CHART, WIDTH, HEIGHT } from "./figure.mjs";
import { sheets, RACK_ROWS, REV, DATE } from "./drawing.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const demo = readFileSync(join(HERE, "demo.js"), "utf8");
const PDF = `drawings/avr-demo-cabinet-rev-${REV}.pdf`;
if (!existsSync(join(HERE, PDF))) console.warn(`${PDF} missing: run node pdf.mjs first`);
// file?v=<content hash>, so a browser never shows an old model or sheet after an update
const v = (f) => existsSync(join(HERE, f)) ? `${f}?v=${createHash("sha1").update(readFileSync(join(HERE, f))).digest("hex").slice(0, 8)}` : f;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dateText = DATE.toLowerCase().replace(/^(\d+) (\w)(\w+) (\d+)$/, (_, d, a, b, y) => `${d} ${a.toUpperCase()}${b} ${y}`);

// ---------- the cabinet front ----------
const VB = { cabinet: [0, 0, WIDTH, HEIGHT] };
const CAB_SVG = `<div class="iso dc-fig" data-theme="light" data-chart='${JSON.stringify(CHART)}'>${figure()}</div>`;

// ---------- page parts ----------
const I = {
  down: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8.5M4.5 7 8 10.5 11.5 7M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  up: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12.5V4M4.5 7.5 8 4l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  dn: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5V12M4.5 8.5 8 12l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  prev: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  next: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

const systems = RACK_ROWS.map((r) => `<li><button type="button" class="sys-row${r.no ? "" : " spare"}" data-pick="${r.no || "spare"}">
  <span class="no">${r.no || "–"}</span>
  <span class="nm"><span class="n1">${esc(r.name)}${r.no ? ` <span class="tg">${esc(r.tag)}</span>` : ""}</span><span class="n2">${r.kind === "spare" ? "blank panel" : `${esc(r.front)}${r.depth ? ` · ${r.depth} deep${r.tbc ? " (TBC)" : ""}` : ""}`}</span></span>
  <span class="u">${r.u}</span>
</button></li>`).join("");

const SHEETS = sheets();
const sheetCards = SHEETS.map((s, i) => `<li><button type="button" class="sheet" data-sheet="${i}">
  <span class="paper"><img src="${v(`drawings/sheet-${i + 1}.svg`)}" alt="" loading="lazy" width="297" height="210"></span>
  <span class="cap"><span>${i + 1} · ${esc(s.title)}</span><span class="sc">${s.scale}</span></span>
</button></li>`).join("");

const CONFIRM = [
  ["Systems 5 and 6 stacked", "The sketch has them side by side, but 340.4 + 243 = 583 mm, wider than the 450 mm between the rails. Drawn on two 3U plates."],
  ["Remote control module size", "2U high and 150 mm deep are read off the photo. Need the maker's drawing."],
  ["Number of SHM-D motor drives", "Two drawn, one per AVR. The HMJK-II and SHM-KX both sit on T1."],
  ["Junction box size", "300 × 400 × 150 mm, about 1/5 of the SHM-D front. One per SHM-D, outside."],
  ["BCD box size", "200 × 120 × 75 mm, inside on the back panel."],
  ["Control cable cores (W3)", "Raise, lower, stop and status from the junction box to the AVR and the SHM-KX."],
];
const confirm = CONFIRM.map(([h, p], i) => `<li><span class="ci">${i + 1}</span><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></li>`).join("");

// ---------- style ----------
const CSS = `
:root{
  --ground:#f5f6f8;--surface:#fff;--sunk:#f0f2f5;--stage:#eceef1;
  --ink:#0f172a;--text:#475569;--muted:#64748b;--line:#e3e6eb;--line-strong:#cdd3db;
  --accent:#1d4ed8;--accent-ink:#1e40af;--accent-soft:#eef3ff;--warn:#b45309;
  --f:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,Consolas,monospace;
  --r:12px;--r-sm:8px;--ease:cubic-bezier(.23,1,.32,1);
  --gutter:clamp(16px,4vw,48px);
}
*{box-sizing:border-box}
html{color-scheme:light;scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--text);font:15px/1.55 var(--f);-webkit-font-smoothing:antialiased}
body:has(dialog[open]){overflow:hidden}
.wrap{width:min(1240px,100% - 2 * var(--gutter));margin:0 auto}
h1,h2,h3{color:var(--ink);margin:0;font-weight:600;letter-spacing:-.015em;text-wrap:balance}
h1{font-size:clamp(1.6rem,3vw,2.1rem);line-height:1.15;letter-spacing:-.025em}
h2{font-size:1.25rem;line-height:1.3}
h3{font-size:.9375rem;line-height:1.4}
p{margin:0}
ol,ul{list-style:none;margin:0;padding:0}
button{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* header */
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px 32px;flex-wrap:wrap;padding-block:clamp(28px,5vw,56px) clamp(20px,3vw,28px)}
.facts{margin-top:8px;color:var(--muted)}
.top-r{display:flex;align-items:center;gap:16px}
.rev{color:var(--muted);font-size:.875rem;white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 16px;border-radius:var(--r-sm);border:1px solid var(--line-strong);background:var(--surface);color:var(--ink);font-weight:500;font-size:.875rem;text-decoration:none;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;transition:background-color .15s,border-color .15s,transform .12s var(--ease)}
.btn svg{width:16px;height:16px;flex:none}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn:active{transform:scale(.97)}
@media (hover:hover){.btn:hover{background:var(--sunk);border-color:#aeb7c2}.btn.primary:hover{background:var(--accent-ink);border-color:var(--accent-ink)}}

/* hero */
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(330px,1fr);gap:clamp(20px,2.5vw,32px);align-items:start}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.stage{overflow:hidden;position:sticky;top:16px}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 12px;border-bottom:1px solid var(--line)}
.seg{display:inline-flex;padding:3px;background:var(--sunk);border-radius:10px;gap:2px}
.seg button{border:0;background:transparent;padding:0 14px;min-height:34px;border-radius:7px;font-size:.875rem;font-weight:500;color:var(--muted);cursor:pointer;transition:background-color .15s,color .15s}
.seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px #0f172a14,0 0 0 1px #0f172a0d}
@media (hover:hover){.seg button:not([aria-pressed="true"]):hover{color:var(--ink)}}
.taps{display:flex;gap:6px}
.taps span{display:inline-flex;align-items:baseline;gap:6px;padding:5px 10px;border-radius:7px;background:var(--sunk);font-size:.8125rem;color:var(--muted)}
.taps b{font:600 .9375rem var(--mono);color:var(--ink)}
.view{position:relative;height:clamp(500px,calc(100svh - 300px),860px);background:#fff}
.view svg.cab{display:block;width:100%;height:100%}
.view model-viewer[hidden]{display:none}
.view model-viewer{position:absolute;inset:0;width:100%;height:100%;background:var(--stage);--poster-color:transparent;--progress-bar-color:var(--accent)}
.foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-top:1px solid var(--line);min-height:61px}
.status{font-size:.875rem;color:var(--text);min-width:0}
.status[data-warn]{color:var(--warn)}
.press{display:flex;gap:8px;flex:none}
.stage[data-view="model"] .taps{visibility:hidden}
.stage[data-view="model"] .foot{display:none}

/* systems */
.side{display:grid;gap:28px}
.side h2{margin-bottom:12px}
.sys-list{display:grid;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);overflow:hidden}
.sys-list li+li{border-top:1px solid var(--line)}
.sys-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:14px;width:100%;padding:12px 16px;border:0;background:transparent;text-align:left;cursor:pointer;transition:background-color .15s}
@media (hover:hover){.sys-row:hover{background:var(--sunk)}}
.sys-row[aria-pressed="true"]{background:var(--accent-soft)}
.no{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;border:1px solid var(--line-strong);font-weight:600;font-size:.8125rem;color:var(--ink);font-variant-numeric:tabular-nums}
.sys-row[aria-pressed="true"] .no{background:var(--accent);border-color:var(--accent);color:#fff}
.spare .no{border-style:dashed;color:var(--muted)}
.nm{display:grid;min-width:0}
.n1{color:var(--ink);font-weight:500}
.tg{color:var(--muted);font-weight:400}
.n2{font-size:.8125rem;color:var(--muted)}
.spare .n1{color:var(--muted);font-weight:400}
.u{font:500 .8125rem var(--mono);color:var(--muted)}
.more{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.more .card{padding:16px}
.more h3{margin-bottom:6px}
.more li{font-size:.875rem;padding:2px 0}
.parts li{padding:0}
.parts .plain{padding:6px 0;color:var(--muted)}
.part-row{display:block;width:calc(100% + 16px);margin:0 -8px;padding:6px 8px;border:0;border-radius:6px;background:transparent;text-align:left;font-size:.875rem;color:var(--ink);cursor:pointer;transition:background-color .15s}
.part-row[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-ink);font-weight:500}
@media (hover:hover){.part-row:hover{background:var(--sunk)}}

/* sections */
section.block{padding-top:clamp(48px,7vw,88px)}
.head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.sheets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.sheet{display:grid;width:100%;padding:0;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);cursor:zoom-in;overflow:hidden;text-align:left;transition:border-color .15s,box-shadow .2s var(--ease)}
.paper{display:block;padding:14px;background:var(--sunk)}
.paper img{display:block;width:100%;height:auto;background:#fff;box-shadow:0 1px 2px #0f172a14,0 0 0 1px #0f172a0f}
.cap{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;color:var(--ink);font-weight:500;font-size:.875rem}
.sc{color:var(--muted);font-weight:400}
@media (hover:hover){.sheet:hover{border-color:var(--line-strong);box-shadow:0 4px 16px #0f172a0f}}
.confirm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.confirm li{display:flex;gap:14px;padding:16px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.ci{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--sunk);font-size:.75rem;font-weight:600;color:var(--muted)}
.confirm p{margin-top:4px;font-size:.875rem}
footer{padding-block:56px 40px;color:var(--muted);font-size:.8125rem}

/* sheet viewer */
dialog.viewer{width:min(1400px,100vw - 32px);height:min(980px,100dvh - 32px);max-width:none;max-height:none;padding:0;border:0;border-radius:var(--r);background:var(--surface);color:var(--text);box-shadow:0 24px 64px #0f172a40;overflow:hidden}
dialog.viewer[open]{display:flex;flex-direction:column;animation:pop .2s var(--ease)}
dialog.viewer::backdrop{background:#0f172a8c;backdrop-filter:blur(2px)}
@keyframes pop{from{opacity:0;transform:scale(.98)}}
.v-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 18px;border-bottom:1px solid var(--line)}
.v-title{color:var(--ink);font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.v-title .sc{font-weight:400;margin-left:8px}
.v-act{display:flex;align-items:center;gap:6px;flex:none}
.icon{display:grid;place-items:center;width:40px;height:40px;border-radius:var(--r-sm);border:1px solid transparent;background:transparent;color:var(--ink);cursor:pointer;transition:background-color .15s}
.icon svg{width:18px;height:18px}
@media (hover:hover){.icon:hover{background:var(--sunk)}}
.v-count{font:500 .8125rem var(--mono);color:var(--muted);min-width:40px;text-align:center}
.v-sep{width:1px;height:24px;background:var(--line);margin:0 4px}
.v-body{flex:1;min-height:0;overflow:auto;background:var(--sunk);padding:20px;cursor:zoom-in}
.v-body img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 8px #0f172a24)}
.v-body.zoom{cursor:zoom-out}
.v-body.zoom img{width:max(1800px,200%);height:auto;filter:none}

/* cabinet figure (Anatomy kit, light theme) */
.iso[data-theme="light"]{--anatomy-card:#fff;--anatomy-paper:#fff;--anatomy-muted:#64748b}
.dc-fig{position:absolute;inset:0;overflow:hidden}
.dc-fig svg.cab{display:block;width:100%;height:100%;overflow:hidden;user-select:none}
.cab text{font-family:Inter,Arial,sans-serif}
.cab .dc-mono{font-family:var(--mono)}
.cab .dc-well{fill:var(--anatomy-shade-0)}
.cab .dc-glass{fill:#071210}
.cab .dc-led{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.3}
.cab .dc-led[data-on]{fill:#ffb347}
.cab .dc-lamp{fill:#5b6268;transition:fill .15s}
.cab .dc-lamp[data-on]{fill:var(--c)}
.cab .dc-swl{fill:#8a9197}
.cab .dc-swl[data-on]{fill:#1b1f22;font-weight:700}
.cab .sw[data-pos="0"] .p1,.cab .sw[data-pos="1"] .p0{display:none}
.cab .dc-knob .iso-fill,.cab .dc-knob .iso-top{fill:#24282c}
.cab .dc-knob .iso-shade{fill:#191c1f}
.cab .dc-knob .iso-edge{stroke:#0e1012}
.cab .dc-green .iso-fill,.cab .dc-green .iso-top{fill:#2a9a52}.cab .dc-green .iso-shade{fill:#1f7a40}
.cab .dc-red .iso-fill,.cab .dc-red .iso-top{fill:#cf3434}.cab .dc-red .iso-shade{fill:#a32626}
.cab .dc-green-cap{fill:#34b35f}.cab .dc-red-cap{fill:#de4040}
.cab .dc-cap{stroke:#0e1012;stroke-width:.15}
.cab .dc-hit{fill:transparent;stroke:none}
.cab .sw,.cab .bt{cursor:pointer;outline:none}
.cab .bt:active .dc-cap{opacity:.8}
.cab .sw:focus-visible .dc-hit,.cab .bt:focus-visible .dc-hit{stroke:var(--accent);stroke-width:.4}
@media (hover:hover){.cab .sw:hover .dc-hit,.cab .bt:hover .dc-hit{fill:#1d4ed81a}}
.cab .dc-hmi-bar{fill:#0f2c27}
.cab .dc-hmi-h{font:2.4px var(--mono);fill:#8ff0d0}
.cab .dc-hmi-s{font:2.2px var(--mono);fill:#5fbfa5}
.cab .dc-hmi-big{font:700 7px var(--mono);fill:#eafff8}
.cab .dc-hmi-tile{fill:#0c211d;stroke:#1d4a41;stroke-width:.3}
.cab .dc-hmi-grid{fill:none;stroke:#1d4a41;stroke-width:.3}
.cab .dc-hmi-set{fill:none;stroke:#5fbfa5;stroke-width:.25;stroke-dasharray:1 1}
.cab .dc-hmi-trend{fill:none;stroke:#ffb347;stroke-width:.6;stroke-linejoin:round}
.cab .dc-hmi-trend2{fill:none;stroke:#8ff0d0;stroke-width:.45;stroke-dasharray:1.2 .8;stroke-linejoin:round}
.cab [data-sys]{transition:opacity .25s}
.cab.picked [data-sys]{opacity:.22}
.cab.picked [data-sys][data-on]{opacity:1}

@media (max-width:1040px){
  .hero{grid-template-columns:1fr}
  .stage{position:static}
  .view{height:min(78svh,760px)}
}
@media (max-width:720px){
  .sheets,.confirm,.more{grid-template-columns:1fr}
  .top-r{width:100%;justify-content:space-between}
  .foot{flex-wrap:wrap}
  .press{width:100%}
  .press .btn{flex:1}
  .taps span{padding:5px 8px}
  dialog.viewer{width:100vw;height:100dvh;border-radius:0}
  .v-bar{padding-left:14px}
  .v-body{padding:10px}
  .v-sep{display:none}
}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}html{scroll-behavior:auto}}
`;

// ---------- page script (views, picking, sheet viewer) ----------
const SITE_JS = `
const VB = ${JSON.stringify(VB)};
const BOX = ${JSON.stringify(BOXES)};
const SHEETS = ${JSON.stringify(SHEETS.map((s, i) => ({ title: s.title, scale: s.scale, src: v(`drawings/sheet-${i + 1}.svg`) })))};
const stage = document.querySelector(".stage");
function fitBox([x0, y0, x1, y1], pad = 12) {
  const r = cab.clientHeight / cab.clientWidth || 1.4;
  let w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  if (h / w < r) h = w * r; else w = h / r;
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
}
const cab = stage.querySelector("svg.cab");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
let vb = VB.cabinet.slice(), anim = 0;
function zoom(to) {
  cancelAnimationFrame(anim);
  const from = vb.slice(), t0 = performance.now(), dur = reduce.matches ? 0 : 480;
  const stepz = (now) => {
    const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
    vb = from.map((v, i) => v + (to[i] - v) * e);
    cab.setAttribute("viewBox", vb.map((v) => v.toFixed(2)).join(" "));
    if (k < 1) anim = requestAnimationFrame(stepz);
  };
  anim = requestAnimationFrame(stepz);
}
// zoom onto one system, with the badge on the left in view
function zoomSys(no) {
  if (stage.dataset.view === "model") show("rack");
  segs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewBtn === "rack")));
  stage.dataset.view = "rack";
  zoom(fitBox(BOX[no], 26));
}
let mvLoaded = false;
const mv = stage.querySelector("model-viewer");
const segs = [...stage.querySelectorAll("[data-view-btn]")];
function show(name) {
  segs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewBtn === name)));
  stage.dataset.view = name;
  const model = name === "model";
  cab.style.visibility = model ? "hidden" : "";
  mv.hidden = !model;
  if (model && !mvLoaded) {
    mvLoaded = true;
    import("https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js");
  }
  if (!model) zoom(name === "rack" ? fitBox(BOX.rack, 6) : VB.cabinet);
}
segs.forEach((b) => b.addEventListener("click", () => show(b.dataset.viewBtn)));

const rows = [...document.querySelectorAll("[data-pick]")];
let picked = null;
function mark(no) {
  cab.classList.toggle("picked", !!no);
  cab.querySelectorAll("[data-sys]").forEach((g) => g.toggleAttribute("data-on", g.dataset.sys === no));
  cab.querySelectorAll("[data-badge]").forEach((g) => g.toggleAttribute("data-on", g.dataset.badge === no));
}
function pick(no) {
  picked = picked === no ? null : no;
  rows.forEach((r) => r.setAttribute("aria-pressed", String(r.dataset.pick === picked)));
  mark(picked);
  if (picked) zoomSys(picked);
  else if (stage.dataset.view === "rack") zoom(fitBox(BOX.rack, 6));
  if (picked && matchMedia("(max-width:1040px)").matches) stage.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
}
rows.forEach((r) => {
  r.setAttribute("aria-pressed", "false");
  r.addEventListener("click", () => pick(r.dataset.pick));
  r.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && !picked && mark(r.dataset.pick));
  r.addEventListener("pointerleave", () => !picked && mark(null));
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && picked && !document.querySelector("dialog[open]")) pick(picked); });

// sheet viewer
const dlg = document.querySelector("dialog.viewer");
const vImg = dlg.querySelector("[data-v-img]"), vBody = dlg.querySelector(".v-body");
let at = 0;
function openSheet(i) {
  at = (i + SHEETS.length) % SHEETS.length;
  const s = SHEETS[at];
  vImg.src = s.src;
  vImg.alt = "Sheet " + (at + 1) + ": " + s.title;
  dlg.querySelector("[data-v-title]").textContent = (at + 1) + " · " + s.title;
  dlg.querySelector("[data-v-scale]").textContent = s.scale;
  dlg.querySelector("[data-v-count]").textContent = (at + 1) + " / " + SHEETS.length;
  dlg.querySelector("[data-v-svg]").href = s.src;
  vBody.classList.remove("zoom");
  if (!dlg.open) dlg.showModal();
}
document.querySelectorAll("[data-sheet]").forEach((b) => b.addEventListener("click", () => openSheet(+b.dataset.sheet)));
dlg.querySelector("[data-v-prev]").addEventListener("click", () => openSheet(at - 1));
dlg.querySelector("[data-v-next]").addEventListener("click", () => openSheet(at + 1));
dlg.querySelector("[data-v-close]").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
vBody.addEventListener("click", (e) => {
  if (e.target === vBody && !vBody.classList.contains("zoom")) return dlg.close();
  const r = vImg.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
  if (vBody.classList.toggle("zoom")) {
    requestAnimationFrame(() => {
      vBody.scrollLeft = Math.max(0, fx * vImg.offsetWidth - vBody.clientWidth / 2);
      vBody.scrollTop = Math.max(0, fy * vImg.offsetHeight - vBody.clientHeight / 2);
    });
  }
});
dlg.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") openSheet(at + 1);
  if (e.key === "ArrowLeft") openSheet(at - 1);
});
`;

// ---------- page ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>AVR demo cabinet</title>
<meta name="description" content="Mobile 19-inch demo cabinet with two HMIET-I AVRs, their remote control modules, an HMJK-II OLTC monitor and an SHM-KX controller. Live front, 3D model and A4 drawings, rev ${REV}.">
<meta name="theme-color" content="#f5f6f8">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='7' y='2' width='18' height='28' rx='3' fill='%23383e42'/%3E%3Crect x='10' y='6' width='12' height='5' rx='1' fill='%23e3e6e8'/%3E%3Crect x='10' y='13' width='12' height='5' rx='1' fill='%23e3e6e8'/%3E%3Ccircle cx='16' cy='24' r='2.5' fill='%231d4ed8'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>${k.ISO_CSS}${CSS}</style>
</head>
<body>
<header class="top wrap">
  <div>
    <h1>AVR demo cabinet</h1>
    <p class="facts">600 × 500 × 1700 mm · 20U rack · 3″ lockable castors</p>
  </div>
  <div class="top-r">
    <span class="rev">Rev ${REV} · ${dateText}</span>
    <a class="btn primary" href="${v(PDF)}" download>${I.down}Drawings PDF</a>
  </div>
</header>

<main>
<div class="hero wrap">
  <div class="stage card" data-view="cabinet">
    <div class="bar">
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-view-btn="cabinet" aria-pressed="true">Cabinet</button>
        <button type="button" data-view-btn="rack" aria-pressed="false">Rack</button>
        <button type="button" data-view-btn="model" aria-pressed="false">3D</button>
      </div>
      <div class="taps" aria-label="Tap positions"><span>T1 <b data-tap-out>09</b></span><span>T2 <b data-tap-out>09</b></span></div>
    </div>
    <div class="view">
      ${CAB_SVG}
      <model-viewer hidden src="${v("models/cabinet.glb")}" ios-src="${v("models/cabinet.usdz")}" poster="${v("models/poster.webp")}" alt="3D model of the AVR demo cabinet" camera-controls touch-action="pan-y" ar ar-modes="webxr scene-viewer quick-look" shadow-intensity="0.6" exposure="1.05" camera-orbit="-28deg 78deg auto"></model-viewer>
    </div>
    <div class="foot">
      <p class="status" data-status aria-live="polite"></p>
      <div class="press">
        <button type="button" class="btn" data-press="S2">${I.dn}Lower T1</button>
        <button type="button" class="btn" data-press="S1">${I.up}Raise T1</button>
      </div>
    </div>
  </div>

  <aside class="side">
    <div>
      <h2>In the rack</h2>
      <ol class="sys-list">${systems}</ol>
    </div>
    <div class="more">
      <div class="card"><h3>Cabinet</h3><ul class="parts"><li><button type="button" class="part-row" data-pick="screen">Screen</button></li><li><button type="button" class="part-row" data-pick="tray">Keyboard tray</button></li><li><button type="button" class="part-row" data-pick="locker">Cable locker, 13 A extension</button></li><li><button type="button" class="part-row" data-pick="side">Side cable box, power strip</button></li><li class="plain">BCD box, back panel</li></ul></div>
      <div class="card"><h3>Outside</h3><ul><li>2 × SHM-D motor drive</li><li>Junction box at each SHM-D</li><li>Cables in through the back</li></ul></div>
    </div>
  </aside>
</div>

<section class="block wrap" id="drawings" aria-labelledby="h-dr">
  <div class="head"><h2 id="h-dr">Drawings</h2><a class="btn" href="${v(PDF)}" download>${I.down}PDF · A4</a></div>
  <ol class="sheets">${sheetCards}</ol>
</section>

<section class="block wrap" id="confirm" aria-labelledby="h-cf">
  <div class="head"><h2 id="h-cf">To confirm</h2></div>
  <ol class="confirm">${confirm}</ol>
</section>
</main>

<footer class="wrap">Huaming · AVR demo cabinet · rev ${REV}, ${dateText}</footer>

<dialog class="viewer" aria-labelledby="v-t">
  <div class="v-bar">
    <p class="v-title" id="v-t"><span data-v-title></span><span class="sc" data-v-scale></span></p>
    <div class="v-act">
      <button type="button" class="icon" data-v-prev aria-label="Previous sheet">${I.prev}</button>
      <span class="v-count" data-v-count></span>
      <button type="button" class="icon" data-v-next aria-label="Next sheet">${I.next}</button>
      <span class="v-sep"></span>
      <a class="icon" data-v-svg download aria-label="Download this sheet">${I.down}</a>
      <button type="button" class="icon" data-v-close aria-label="Close" autofocus>${I.close}</button>
    </div>
  </div>
  <div class="v-body"><img data-v-img alt=""></div>
</dialog>

<script>
${SITE_JS}
${demo}
</script>
</body>
</html>
`;
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html", (html.length / 1024).toFixed(0) + " KB");

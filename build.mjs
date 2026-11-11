// Builds index.html: the website around the cabinet (live isometric, 3D model, A4 drawings).
// node pdf.mjs && node build.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import { figure, CHART } from "./figure.mjs";
import { sheets, RACK_ROWS, REV, DATE } from "./drawing.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const live = readFileSync(join(HERE, "live.js"), "utf8");
const PDF = `drawings/avr-demo-cabinet-rev-${REV}.pdf`;
if (!existsSync(join(HERE, PDF))) console.warn(`${PDF} missing: run node pdf.mjs first`);

const FIG_CSS = `
.dc-well{fill:var(--anatomy-shade-0)}
.dc-glass{fill:#071210}
.dc-dial{fill:var(--anatomy-shade-1)}
.dc-lcd{fill:#08201b}
.dc-hub{fill:var(--anatomy-mid)}
.dc-led{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.3;transition:fill 60ms linear}
.dc-led[data-on]{fill:var(--amber)}
.dc-stage text{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace}
.dc-scale{font-size:2px;fill:var(--anatomy-mid)}
.dc-digits{font-size:4px;fill:var(--teal)}
.dc-hmi-bar{fill:#0f2c27}
.dc-hmi-h{font-size:2.4px;fill:var(--teal)}
.dc-hmi-s{font-size:2.2px;fill:#5fbfa5}
.dc-hmi-big{font-size:7px;font-weight:700;fill:#eafff8}
.dc-hmi-tile{fill:#0c211d;stroke:#1d4a41;stroke-width:.3}
.dc-hmi-grid{fill:none;stroke:#1d4a41;stroke-width:.3}
.dc-hmi-set{fill:none;stroke:#5fbfa5;stroke-width:.25;stroke-dasharray:1 1}
.dc-hmi-trend{fill:none;stroke:var(--amber);stroke-width:.6;stroke-linejoin:round}
.dc-hmi-trend2{fill:none;stroke:var(--teal);stroke-width:.45;stroke-dasharray:1.2 .8;stroke-linejoin:round}
.dc-stage [data-part]{transition:opacity .35s var(--anatomy-ease)}
.dc-stage svg.dc-dim [data-part]{opacity:.16}
.dc-stage svg.dc-dim [data-part][data-focus]{opacity:1}
.dc-stage{outline:none}
`;

// Page system: calm product page. White surfaces on a cool off-white ground, hairlines, no shadows.
// One accent (Huaming blue) for actions and selection only. Inter for UI, tabular numbers.
const SITE_CSS = `
:root{
  --ground:#f6f7f9;--surface:#fff;--sunk:#f1f3f6;
  --ink:#0f172a;--text:#475569;--muted:#64748b;--line:#e3e7ed;--line-strong:#cbd3dd;
  --accent:#1d4ed8;--accent-ink:#1e40af;--accent-soft:#eef3ff;
  --amber:#ffb347;--teal:#8ff0d0;
  --f:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --t-sm:.8125rem;--t-md:.9375rem;--t-lg:1.125rem;--t-xl:1.5rem;--t-2xl:clamp(2rem,4.2vw,2.75rem);
  --r:10px;--r-sm:8px;
  --ease-out:cubic-bezier(.23,1,.32,1);
  --gap:clamp(20px,3vw,32px);--gutter:clamp(16px,4vw,48px);--section:clamp(48px,6vw,80px);
}
*{box-sizing:border-box}
html{color-scheme:light;scroll-behavior:smooth}
body{margin:0;background:var(--ground);color:var(--text);font:var(--t-md)/1.6 var(--f);-webkit-font-smoothing:antialiased}
.wrap{width:min(1200px,100% - 2 * var(--gutter));margin:0 auto}
h1,h2,h3{color:var(--ink);margin:0;font-weight:600;letter-spacing:-.02em;text-wrap:balance}
h1{font-size:var(--t-2xl);line-height:1.1;letter-spacing:-.03em}
h2{font-size:var(--t-xl);line-height:1.2}
h3{font-size:var(--t-lg);line-height:1.3;letter-spacing:-.01em}
p{margin:0}
::selection{background:#1d4ed826;color:var(--ink)}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}
.num{font-variant-numeric:tabular-nums}

header.wrap{display:flex;justify-content:space-between;align-items:flex-end;gap:20px 32px;flex-wrap:wrap;padding-block:clamp(40px,7vw,88px) clamp(24px,3.5vw,40px)}
header .lede{margin-top:10px;font-size:var(--t-lg);color:var(--text);max-width:44ch}
.meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.rev{font-size:var(--t-sm);color:var(--muted)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:500 var(--t-md)/1 var(--f);color:var(--ink);background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--r-sm);min-height:44px;padding:0 18px;cursor:pointer;text-decoration:none;white-space:nowrap}
.btn svg{width:16px;height:16px;flex:none}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
button,.btn{-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform 140ms var(--ease-out),background-color 150ms ease,border-color 150ms ease,color 150ms ease}
button:active,.btn:active{transform:scale(.97)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (hover:hover) and (pointer:fine){.btn:hover{border-color:#94a3b8;background:var(--sunk)}.btn.primary:hover{background:var(--accent-ink);border-color:var(--accent-ink)}}

.hero{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:var(--gap);align-items:start;padding-bottom:var(--section)}
@media (max-width:960px){.hero{grid-template-columns:minmax(0,1fr)}}
.stage{overflow:hidden}
.tabs{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--line)}
.seg{display:inline-flex;padding:3px;gap:2px;background:var(--sunk);border-radius:var(--r-sm)}
.seg button{font:500 var(--t-sm)/1 var(--f);color:var(--text);background:transparent;border:0;border-radius:6px;min-height:36px;padding:0 14px;cursor:pointer}
.seg button[aria-selected="true"],.seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:0 0 0 1px var(--line)}
@media (hover:hover) and (pointer:fine){.seg button:not([aria-selected="true"]):not([aria-pressed="true"]):hover{color:var(--ink)}}
.readout{font:500 var(--t-sm)/1 var(--f);color:var(--muted);font-variant-numeric:tabular-nums;padding-inline-end:6px}
.pane[hidden]{display:none}
.pane:not([hidden]){animation:pane-in 200ms var(--ease-out)}
@keyframes pane-in{from{opacity:0}}
.pane2d{padding:clamp(8px,2vw,20px) clamp(8px,2vw,20px) 0}
.pane2d .iso-plate{box-shadow:none;padding:0;background:transparent}
.pane2d .iso-plate-corners{display:none}
.iso[data-theme="light"]{--anatomy-muted:#64748b;--anatomy-mono:"JetBrains Mono",ui-monospace,Consolas,monospace;--anatomy-card:#fff;--anatomy-paper:#fff}
.dc-stage{user-select:none}
@media (min-width:961px){.pane2d .dc-stage svg{height:clamp(440px,calc(100svh - 360px),640px)}}
.run{display:flex;align-items:center;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;padding:16px clamp(14px,2.2vw,24px);border-top:1px solid var(--line)}
.status{display:flex;align-items:center;gap:10px;font:500 var(--t-md)/1.3 var(--f);color:var(--ink);font-variant-numeric:tabular-nums;min-height:24px}
.status i{flex:none;width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 4px #16a34a1f;transition:background-color .2s,box-shadow .2s}
.status[data-phase="tap"] i,.status[data-phase="follow"] i{background:#d97706;box-shadow:0 0 0 4px #d977062b}
.status[data-phase="limit"] i{background:#94a3b8;box-shadow:0 0 0 4px #94a3b82b}
.steps{display:flex;gap:8px}
.steps .btn{min-width:104px}
.viewer{position:relative}
model-viewer{display:block;width:100%;height:min(72vh,680px);min-height:440px;background:var(--surface);--poster-color:transparent;--progress-bar-color:var(--accent)}
@media (min-width:961px){model-viewer{height:calc(clamp(440px,calc(100svh - 360px),640px) + 40px)}}
.vbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:16px clamp(14px,2.2vw,24px);border-top:1px solid var(--line)}
.ar{position:absolute;inset-inline-end:12px;top:12px}

.side{display:grid;gap:var(--gap);align-content:start}
.spec{padding:clamp(20px,2.4vw,28px)}
.spec h2{font-size:var(--t-lg)}
.spec dl{display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);margin:16px 0 0}
.spec dt,.spec dd{padding:11px 0;border-top:1px solid var(--line);margin:0}
.spec dt{color:var(--muted);font-size:var(--t-sm);padding-top:12px;padding-inline-end:16px}
.spec dd{color:var(--ink)}
.spec dd b{font-weight:600}
.purpose{padding:0 4px}
.purpose h2{font-size:var(--t-lg);margin-bottom:12px}
.purpose ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.purpose li{display:flex;gap:12px;color:var(--ink)}
.purpose li::before{content:"";flex:none;width:6px;height:6px;margin-top:.6em;border-radius:50%;background:var(--accent)}

section{padding-block:var(--section);border-top:1px solid var(--line)}
.shead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:clamp(24px,3vw,36px)}
.sheets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap)}
@media (max-width:960px){.sheets{grid-template-columns:minmax(0,1fr)}}
.sheet{display:block;text-decoration:none;color:inherit;overflow:hidden}
.sheet img{display:block;width:100%;height:auto;aspect-ratio:297/210;background:#fff;border-bottom:1px solid var(--line)}
.sheet figcaption{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;font-size:var(--t-sm)}
.sheet figcaption b{color:var(--ink);font-weight:500}
.sheet figcaption span{color:var(--muted);font-variant-numeric:tabular-nums}
@media (hover:hover) and (pointer:fine){.sheet{transition:border-color .15s}.sheet:hover{border-color:var(--line-strong)}}

.build{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:var(--gap);align-items:start}
@media (max-width:960px){.build{grid-template-columns:minmax(0,1fr)}}
.build .card{padding:clamp(20px,2.4vw,28px)}
.build h3{margin-bottom:14px}
.tbl{overflow-x:auto}
table{width:100%;border-collapse:collapse}
td:nth-child(2),td:nth-child(3){font-variant-numeric:tabular-nums}
th{text-align:start;white-space:nowrap;font:500 var(--t-sm)/1.3 var(--f);color:var(--muted);padding:0 16px 10px 0}
td{padding:12px 16px 12px 0;border-top:1px solid var(--line);color:var(--ink);vertical-align:top}
td:first-child,td:nth-child(2),td:nth-child(3){white-space:nowrap}
td:first-child{font-weight:500}
tr.key td:first-child{color:var(--accent)}
.notes{margin:0;padding:0;list-style:none;display:grid;gap:12px;color:var(--ink)}
.notes li{display:flex;gap:12px}
.notes li::before{content:"";flex:none;width:6px;height:6px;margin-top:.6em;border-radius:50%;background:var(--line-strong)}
.notes li.tbc::before{background:#d97706}
footer{padding-block:28px 56px;font-size:var(--t-sm);color:var(--muted);border-top:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){.pane:not([hidden]){animation:none}button,.btn{transition-property:background-color,color,border-color}button:active,.btn:active{transform:none}}
`;

const ICON_DOWN = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>`;
const ICON_UP = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V4M4.5 7.5 8 4l3.5 3.5"/></svg>`;
const ICON_LOWER = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v9M4.5 8.5 8 12l3.5-3.5"/></svg>`;

const plate = k.plateHtml({
  fig: "",
  title: "",
  hint: "",
  readout: "T1 09 · T2 09",
  body: `<div class="iso-stage dc-stage" tabindex="0" role="group" aria-label="Live cabinet. Arrow up raises T1, arrow down lowers it." data-chart='${JSON.stringify(CHART)}'>${figure()}</div>`,
});

const SPEC = [
  ["Size", "600 × 500 × 1700 mm, 1800 on castors"],
  ["Rack", "19″, 22U"],
  ["AVR", "<b>2 × HMIET-I</b>, master and follower"],
  ["OLTC monitor", "<b>2 × HMJK-II</b>"],
  ["Tap indicator", "2 × HMC-3C"],
  ["Test unit", "Tap-changer simulator, 3U"],
  ["Inside", "BCD box"],
  ["Outside", "2 × SHM-D, one junction box each"],
  ["Screen", "22″ on a stand, keyboard tray"],
  ["Supply", "230 V, one 13 A plug"],
];
const PURPOSES = [
  "Show the tap-changer control chain working, live",
  "Demo parallel control: master and follower",
  "Show OLTC monitoring on the HMJK-II",
  "Something real to show at office visits",
  "Test AVR and monitor settings before site",
];
const rackRows = [...RACK_ROWS, { slot: "Locker", u: "", size: "", mm: "120–255", name: "Cable drawer" }];
const rackHtml = rackRows.map((r) => `<tr${r.key ? ' class="key"' : ""}><td>${r.slot}</td><td>${r.u}</td><td>${r.mm}</td><td>${r.name}</td></tr>`).join("");
const NOTES = [
  ["Confirm the junction box size (300 × 400 × 150 assumed)", true],
  ["Confirm the BCD box size and the W3 control cores", true],
  ["Lower the tray to 1.0–1.1 m", false],
  ["Heaviest unit at the bottom", false],
  ["Leave 100 mm behind each unit", false],
  ["RCD and earth stud on the frame", false],
];
const sheetList = sheets();
const sheetHtml = sheetList
  .map((s, i) => `<a class="card sheet" href="drawings/sheet-${i + 1}.svg" target="_blank" rel="noopener"><figure style="margin:0"><img src="drawings/sheet-${i + 1}.svg" width="297" height="210" loading="lazy" alt="Sheet ${i + 1}, ${s.title}"><figcaption><b>${i + 1} · ${s.title}</b><span>${s.scale}</span></figcaption></figure></a>`)
  .join("");

// +θ looks from the right, where the duct, power strip and fan are.
const VIEWS = { "3/4": "35deg 78deg 95%", Front: "0deg 86deg 95%", Side: "90deg 82deg 95%", Back: "180deg 80deg 95%" };

const SITE_JS = `
const say = document.querySelector("[data-say]");
const status = document.querySelector("[data-status]");
const statusText = document.querySelector("[data-status-text]");
const two = (t) => String(t).padStart(2, "0");
let acted = 0;
document.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { acted = Date.now(); window.dcStep(Number(b.dataset.step)); }));
const SAY = {
  steady: (d) => "T1 and T2 on tap " + two(d.tap),
  tap: (d) => "T1 " + (d.dir > 0 ? "raising" : "lowering") + " to " + two(d.tap + d.dir),
  follow: (d) => "T2 following to " + two(d.tap),
  limit: (d) => "T1 is on tap " + two(d.tap) + ", the " + (d.note === "top" ? "top" : "bottom"),
};
let was = "";
document.addEventListener("avr", (e) => {
  const d = e.detail;
  status.dataset.phase = d.phase;
  const t = SAY[d.phase](d);
  if (statusText.textContent !== t) statusText.textContent = t;
  if (t !== was) { was = t; if (Date.now() - acted < 20000) say.textContent = t; }
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
const pick = (t, focus) => {
  tabs.forEach((x) => {
    const on = x === t;
    x.setAttribute("aria-selected", String(on));
    x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
  });
  if (focus) t.focus();
};
tabs.forEach((t, i) => {
  t.addEventListener("click", () => pick(t));
  t.addEventListener("keydown", (e) => {
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    pick(tabs[(n + tabs.length) % tabs.length], true);
  });
});
const mv = document.querySelector("model-viewer");
const calm = matchMedia("(prefers-reduced-motion: reduce)");
const settle = () => { if (calm.matches) { mv.removeAttribute("autoplay"); mv.pause && mv.pause(); } };
mv.addEventListener("load", settle);
settle();
const views = [...document.querySelectorAll("[data-orbit]")];
views.forEach((b) => b.addEventListener("click", () => {
  mv.cameraOrbit = b.dataset.orbit;
  mv.cameraTarget = "auto auto auto";
  if (calm.matches) mv.jumpCameraToGoal();
  views.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
mv.addEventListener("camera-change", (e) => {
  if (e.detail.source === "user-interaction") views.forEach((x) => x.setAttribute("aria-pressed", "false"));
});
`;

const download = `<a class="btn primary" href="${PDF}" download>${ICON_DOWN}Drawings PDF · A4</a>`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>AVR demo cabinet</title>
<meta name="description" content="A mobile 19-inch cabinet with two HMIET-I AVRs, two HMJK-II OLTC monitors and two HMC-3C indicators: live drawing, 3D model and A4 build drawings.">
<meta name="theme-color" content="#f6f7f9">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap">
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>${k.ISO_CSS}${FIG_CSS}${SITE_CSS}</style>
</head>
<body>
<header class="wrap">
  <div>
    <h1>AVR demo cabinet</h1>
    <p class="lede">A rolling 19″ cabinet that shows Huaming tap-changer control and monitoring, live.</p>
  </div>
  <div class="meta">
    <span class="rev">Rev ${REV} · ${DATE.toLowerCase().replace(/^(\d+) (\w)/, (m, d, c) => d + " " + c.toUpperCase())}</span>
    ${download}
  </div>
</header>
<main>
<div class="wrap hero">
  <div class="card stage">
    <div class="tabs">
      <div class="seg" role="tablist" aria-label="View">
        <button type="button" role="tab" id="tab-2d" aria-controls="pane-2d" aria-selected="true">Live</button>
        <button type="button" role="tab" id="tab-3d" aria-controls="pane-3d" aria-selected="false" tabindex="-1">3D</button>
      </div>
    </div>
    <div class="pane" id="pane-2d" role="tabpanel" aria-labelledby="tab-2d">
      <div class="pane2d"><div class="iso" data-theme="light">${plate}</div></div>
      <div class="run">
        <p class="status" data-status data-phase="steady"><i aria-hidden="true"></i><span data-status-text>T1 and T2 on tap 09</span></p>
        <p class="sr-only" role="status" data-say></p>
        <div class="steps" role="group" aria-label="T1 master, manual">
          <button class="btn" type="button" data-step="-1">${ICON_LOWER}Lower</button>
          <button class="btn" type="button" data-step="1">${ICON_UP}Raise</button>
        </div>
      </div>
    </div>
    <div class="pane viewer" id="pane-3d" role="tabpanel" aria-labelledby="tab-3d" hidden>
      <model-viewer src="models/cabinet.glb" ios-src="models/cabinet.usdz" poster="models/poster.webp" loading="lazy" alt="3D model of the AVR demo cabinet. The master AVR steps the tap changer and the follower copies it."
        camera-controls touch-action="pan-y" autoplay interaction-prompt="none"
        camera-orbit="${VIEWS["3/4"]}" field-of-view="auto" min-camera-orbit="auto 20deg 1.6m" max-camera-orbit="auto 100deg 7m"
        shadow-intensity="1" shadow-softness="0.9" exposure="1.05" environment-image="neutral" tone-mapping="aces"
        ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed">
        <button slot="ar-button" class="btn ar">View in your room</button>
      </model-viewer>
      <div class="vbar">
        <div class="seg" role="group" aria-label="Camera">
          ${Object.entries(VIEWS).map(([name, orbit], i) => `<button type="button" data-orbit="${orbit}" aria-pressed="${i === 0}">${name}</button>`).join("")}
        </div>
      </div>
    </div>
  </div>
  <div class="side">
    <div class="card spec">
      <h2>Specification</h2>
      <dl>${SPEC.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join("")}</dl>
    </div>
    <div class="purpose">
      <h2>What it is for</h2>
      <ul>${PURPOSES.map((t) => `<li>${t}</li>`).join("")}</ul>
    </div>
  </div>
</div>

<section id="drawings"><div class="wrap">
  <div class="shead"><h2>Drawings</h2>${download}</div>
  <div class="sheets">${sheetHtml}</div>
</div></section>

<section><div class="wrap">
  <div class="shead"><h2>Build</h2></div>
  <div class="build">
    <div class="card">
      <h3>Rack layout</h3>
      <div class="tbl"><table><thead><tr><th>Slot</th><th>U</th><th>mm</th><th>Unit</th></tr></thead><tbody>${rackHtml}</tbody></table></div>
    </div>
    <div class="card">
      <h3>Before building</h3>
      <ul class="notes">${NOTES.map(([t, tbc]) => `<li${tbc ? ' class="tbc"' : ""}>${t}</li>`).join("")}</ul>
    </div>
  </div>
</div></section>
</main>
<footer><div class="wrap">Concept from a hand sketch and Huaming device drawings. Huaming Power Equipment Singapore.</div></footer>
<script type="module">${live.replace(/<\/(script)/gi, "<\\/$1")}
${SITE_JS}</script>
</body>
</html>`;

writeFileSync(join(HERE, "index.html"), page);
console.log("wrote index.html", (page.length / 1024).toFixed(0) + " KB,", sheetList.length, "sheets");

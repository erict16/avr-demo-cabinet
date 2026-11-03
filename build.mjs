// Builds index.html: the website around the isometric cabinet.
// node build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import { figure, CHART } from "./figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const live = readFileSync(join(HERE, "live.js"), "utf8");

const FIG_CSS = `
.dc-well{fill:var(--anatomy-shade-0)}
.dc-glass{fill:#071210}
.dc-dial{fill:var(--anatomy-shade-1)}
.dc-lcd{fill:#08201b}
.dc-hub{fill:var(--anatomy-mid)}
.dc-led{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.3;transition:fill 60ms linear}
.dc-led[data-on]{fill:var(--amber)}
.dc-stage text{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace}
.dc-lcdtxt{font-size:5.4px;fill:var(--teal)}
.dc-lcdsmall{font-size:2.2px;fill:#5fbfa5;letter-spacing:.1px}
.dc-scale{font-size:2.4px;fill:var(--anatomy-mid)}
.dc-digits{font-size:4px;fill:var(--teal)}
.dc-seg{font-size:13px;font-weight:700;fill:var(--amber)}
.dc-ghost{font-size:13px;font-weight:700;fill:#ffb34712}
.dc-hmi-bar{fill:#0f2c27}
.dc-hmi-h{font-size:2.4px;fill:var(--teal)}
.dc-hmi-s{font-size:2.2px;fill:#5fbfa5}
.dc-hmi-big{font-size:7px;font-weight:700;fill:#eafff8}
.dc-hmi-tile{fill:#0c211d;stroke:#1d4a41;stroke-width:.3}
.dc-hmi-band{fill:#8ff0d012}
.dc-hmi-grid{fill:none;stroke:#1d4a41;stroke-width:.3}
.dc-hmi-set{fill:none;stroke:#5fbfa5;stroke-width:.25;stroke-dasharray:1 1}
.dc-hmi-trend{fill:none;stroke:var(--amber);stroke-width:.6;stroke-linejoin:round}
.dc-bar-bg{fill:#0f2c27}
.dc-bar{fill:var(--amber)}
.dc-stage [data-part]{transition:opacity .35s var(--anatomy-ease)}
.dc-stage svg.dc-dim [data-part]{opacity:.16}
.dc-stage svg.dc-dim [data-part][data-focus]{opacity:1}
.dc-stage{outline:none}

`;

// Page system: DESIGN.md (a hardware product page). Full-bleed light tiles, canvas and panel alternating:
// 3D hero -> specification + what it is for -> 2D drawings -> before building + build info.
// Flat UI with hairlines; the only shadow is the model's own floor shadow. Amber = selected, focus, live.

// Layout: phone first, one column. Desktop: 3D model (the hero) left, specification plate and purposes right;
// then the 2D drawings: live isometric beside the rack table, the dimensioned drawing full width.
const SITE_CSS = `
:root{
  --ral7035:#e3e6e3;   /* panel-paint grey, the page ground */
  --sheet:#fbfbfa;     /* white panels, same as the figure card */
  --ink:#1b1f22;
  --text:#4a5358;
  --rule:#cfd4d1;
  --lamp:#e08a00;      /* indicator-lamp amber */
  --ok:#2f8a4e;        /* in band */
  --amber:#ffb347;     /* LEDs inside the drawing */
  --teal:#8ff0d0;      /* LCD text inside the drawing */
  --draw-ink:#1b1f22;--draw-line:#8d989d;--draw-dim:#5b676d;--draw-accent:#c46d00;
  --f:"Barlow",ui-sans-serif,system-ui,sans-serif;
  --fc:"Barlow Semi Condensed","Barlow",ui-sans-serif,system-ui,sans-serif;
  --lamp-text:#9a5200; /* amber for text and focus: 4.7:1 on the page, 5.7:1 on white */
  --focus:#9a5200;
  --t-xs:.8125rem;--t-sm:.875rem;--t-md:1.0625rem;--t-lg:1.3125rem;--t-xl:1.75rem;--t-2xl:clamp(2.25rem,5vw,3.25rem);
  --ease-out:cubic-bezier(.23,1,.32,1);
  --gap:clamp(24px,4vw,56px);--gutter:clamp(20px,5vw,64px);
}
*{box-sizing:border-box}
html{color-scheme:light}
body{margin:0;background:var(--ral7035);color:var(--text);font:var(--t-md)/1.55 var(--f);-webkit-font-smoothing:antialiased}
.wrap{width:min(1160px,100% - 2 * var(--gutter));margin:0 auto;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}
h1,h2,h3{font-family:var(--fc);color:var(--ink);margin:0;font-weight:700;text-wrap:balance}
h1{font-size:var(--t-2xl);line-height:1.05;letter-spacing:-.015em}
h2{font-size:var(--t-xl);line-height:1.1;letter-spacing:-.01em}
h3{font-size:var(--t-lg);line-height:1.2}
p{margin:0}
p,li,dd,td{text-wrap:pretty}
::selection{background:#e08a0030;color:var(--ink)}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.card{background:var(--sheet);border-radius:12px;border:1px solid var(--rule)}

header.wrap{display:flex;justify-content:space-between;align-items:end;gap:16px;flex-wrap:wrap;padding-block:clamp(32px,6vw,64px) clamp(20px,3vw,32px)}
header p{max-width:46ch}
header h1+p{margin-top:8px}
.when{font-size:var(--t-sm)}

.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:var(--gap);align-items:start;padding-bottom:clamp(56px,8vw,96px)}
@media (max-width:920px){.hero{grid-template-columns:minmax(0,1fr)}}
.col{display:grid;gap:clamp(28px,3.5vw,40px);align-content:start}

.stage{overflow:hidden}
.modes{display:flex;gap:6px;padding:8px;border-bottom:1px solid var(--rule);background:#f1f3f1}
.modes button{flex:1;font:600 1rem/1 var(--fc);color:var(--text);background:transparent;border:1px solid transparent;border-radius:4px;min-height:44px;cursor:pointer}
.modes button[aria-selected="true"]{background:var(--sheet);color:var(--ink);border-color:var(--rule);box-shadow:inset 0 -2px 0 var(--lamp)}
.pane[hidden]{display:none}
.pane:not([hidden]){animation:pane-in 180ms var(--ease-out)}
@keyframes pane-in{from{opacity:0}}
.pane2d{padding:clamp(14px,2.4vw,28px)}
.pane2d .iso-plate{box-shadow:none;padding-top:8px}
.pane2d [data-corner="fig"],.pane2d [data-corner="title"]{display:none}
.pane2d .iso-plate-corner{font:500 var(--t-sm)/1 var(--fc);letter-spacing:.01em;text-transform:none;color:var(--text)}
.iso[data-theme="light"]{--anatomy-muted:#6b6b70;--anatomy-mono:"JetBrains Mono",ui-monospace,Consolas,monospace}
@media (min-width:921px){.pane2d .dc-stage svg{height:clamp(420px,calc(100svh - 420px),620px)}.stage .pane{min-height:calc(clamp(420px,calc(100svh - 420px),620px) + 300px)}.viewer{display:flex;flex-direction:column}.viewer model-viewer{flex:1;height:auto;min-height:0}}
.dc-stage{user-select:none}
.viewer{position:relative;overflow:hidden}
model-viewer{display:block;width:100%;height:min(72vh,680px);min-height:460px;background:radial-gradient(120% 80% at 50% 92%,#e6e9e6 0%,var(--sheet) 60%);--poster-color:transparent;--progress-bar-color:var(--lamp)}
@media (max-width:920px){model-viewer{height:min(72vh,620px);min-height:420px}}
.vbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px clamp(14px,2.4vw,24px);border-top:1px solid var(--rule)}
.vbar .hint{margin-inline-start:auto;font-size:var(--t-sm)}
.seg{display:inline-flex;border:1px solid var(--rule);border-radius:4px;overflow:hidden}
.seg button{font:600 1rem/1 var(--fc);color:var(--ink);background:var(--sheet);border:0;border-right:1px solid var(--rule);min-height:44px;padding:0 16px;cursor:pointer}
.seg button:last-child{border-right:0}
.seg button[aria-pressed="true"]{background:var(--ink);color:#fff}
button:focus-visible,.dc-stage:focus-visible,.ga:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform 120ms var(--ease-out),background-color 150ms ease,color 150ms ease,border-color 150ms ease}
button:active{transform:scale(.97)}
@media (hover:hover) and (pointer:fine){.btn:not([aria-pressed="true"]):hover{border-color:#9aa4a0;background:#f1f3f1}.seg button:not([aria-pressed="true"]):hover,.modes button[aria-selected="false"]:hover{background:#e8ebe8;color:var(--ink)}}
.ar{position:absolute;inset-inline-end:12px;top:12px;font:600 1rem/1 var(--fc);color:#fff;background:var(--ink);border:0;border-radius:4px;min-height:44px;padding:0 16px;cursor:pointer}
@media (max-width:520px){.vbar .hint{display:none}}

/* the one bold thing: an engraved specification plate */
.plate{position:relative;background:linear-gradient(180deg,#26292b,#141617);color:#f1f3f2;border-radius:4px;padding:clamp(22px,3vw,30px) clamp(22px,3vw,32px) clamp(18px,2.4vw,26px);box-shadow:0 1px 0 #ffffff1a inset,0 10px 24px -14px #000a}
.plate::before,.plate::after{content:"";position:absolute;top:10px;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#c9cdcf,#6c7275);box-shadow:0 0 0 1px #000}
.plate::before{left:10px}.plate::after{right:10px}
.plate h2{color:#fff;font-size:var(--t-lg);letter-spacing:.16em;padding-left:.16em;text-transform:uppercase;text-align:center;padding-bottom:12px;border-bottom:1px solid #ffffff2e}
.plate dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:13px 24px;margin:16px 0 0;font:500 1rem/1.35 var(--fc);font-variant-numeric:tabular-nums}
.plate dt{color:#a9b0b3;letter-spacing:.08em;text-transform:uppercase;font-size:var(--t-xs);padding-top:2px}
.plate dd{margin:0;color:#fff}

.purpose{display:grid;gap:14px}
.purpose ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--rule)}
.purpose li{display:flex;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px solid var(--rule);color:var(--ink);font-weight:500}
.dots{flex:none;display:inline-flex;gap:4px;padding-top:calc((1.55em - 8px) / 2)}
.dots b{width:8px;height:8px;border-radius:50%;background:transparent;box-shadow:inset 0 0 0 1.5px #7a8488}
.dots[data-n="3"] b,.dots[data-n="2"] b:nth-child(-n+2),.dots[data-n="1"] b:first-child{background:#c46d00;box-shadow:none}
.key{font-size:var(--t-sm)}

section{padding-block:clamp(56px,8vw,104px);border-top:1px solid var(--rule)}
.shead{display:grid;gap:8px;margin-bottom:clamp(24px,3vw,36px)}
.shead p{font-size:var(--t-sm)}
.twod{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--gap);row-gap:clamp(48px,7vw,56px);align-items:start}
.twod h3{margin-bottom:14px}
@media (max-width:920px){.twod{grid-template-columns:minmax(0,1fr)}}
.iso-figure{margin:0}
.iso-plate{border-radius:6px;box-shadow:0 0 0 1px var(--rule)}
.run{display:grid;gap:16px;margin-top:clamp(18px,2.4vw,28px)}
.status{display:flex;align-items:center;gap:10px;font:600 var(--t-md)/1.3 var(--fc);color:var(--ink);font-variant-numeric:tabular-nums;min-height:24px}
.status i{flex:none;width:12px;height:12px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 3px #2f8a4e22}
.status[data-phase="timing"] i,.status[data-phase="drift"] i{background:var(--lamp);box-shadow:0 0 0 3px #e08a0026}
.status[data-phase="tap"] i,.status[data-phase="follow"] i{background:var(--lamp);box-shadow:0 0 0 6px #e08a0033}
.btns{display:grid;grid-template-columns:auto repeat(3,minmax(0,1fr));align-items:center;gap:8px}
.btns .lbl{font:600 var(--t-sm)/1 var(--fc);color:var(--text);padding-inline-end:4px}
.btn{font:600 1rem/1 var(--fc);white-space:nowrap;padding-inline:8px;color:var(--ink);background:var(--sheet);border:1px solid var(--rule);border-radius:4px;min-height:44px;cursor:pointer;font-variant-numeric:tabular-nums}
.btn[aria-pressed="true"]{background:var(--ink);color:#fff;border-color:var(--ink)}
.side{display:grid;gap:28px;align-content:start}
.ga{padding:clamp(14px,2.4vw,28px);overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
.ga svg{display:block;min-width:720px}
@media (max-width:760px){.ga svg{min-width:1000px}}
.swipe{display:none;font-size:var(--t-sm);margin:var(--gap) 0 8px}
.swipe+.ga{margin-top:0}
.twod+.ga{margin-top:var(--gap)}
@media (max-width:760px){.swipe{display:block}}
.tbl{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:1rem}
th{text-align:start;white-space:nowrap;font:600 var(--t-sm)/1.3 var(--fc);color:var(--text);padding:0 12px 8px 0}
td{padding:13px 16px 13px 0;border-top:1px solid var(--rule);color:var(--ink);vertical-align:top}
td:first-child{font-weight:700;white-space:nowrap}
td:nth-child(2),td:nth-child(3){white-space:nowrap}
tr.avr td:first-child{color:var(--lamp-text)}
.notes{margin:0;padding:0;padding-inline-start:20px;display:grid;gap:12px;color:var(--ink)}
.notes li::marker{color:var(--lamp)}
footer{padding-block:32px 56px;font-size:var(--t-sm);border-top:1px solid var(--rule)}
@media (prefers-reduced-motion:reduce){.pane:not([hidden]){animation:none}button{transition-property:background-color,color,border-color}button:active{transform:none}}
`;

const plate = k.plateHtml({
  fig: "",
  title: "",
  hint: "Drag or tap to change the grid",
  readout: "tap 09 · 11.00 kV",
  body: `<div class="iso-stage dc-stage" tabindex="0" role="slider" aria-label="Grid voltage" aria-valuemin="94" aria-valuemax="106" aria-valuenow="100" data-chart='${JSON.stringify(CHART)}'>${figure()}</div>`,
});

const PURPOSES = [
  [3, "Show the whole AVR system working, live"],
  [3, "Demo parallel control: master and follower"],
  [3, "Something real to show at office visits"],
  [2, "One reusable asset for shows and training"],
  [2, "Test AVR settings in Singapore before site"],
];
const dots = (n) => `<span class="dots" data-n="${n}" role="img" aria-label="${n} of 3"><b></b><b></b><b></b></span>`;
const purposeHtml = PURPOSES.map(([n, t]) => `<li><span>${t}</span>${dots(n)}</li>`).join("");

const RACK = [
  ["U20", "1U", "1117–1159", "Cable entry, brush strip"],
  ["S5, S6", "3U", "984–1115", "2 × HMC-3C tap indicator"],
  ["S4", "4U", "806–981", "HMIET-I AVR, T2 follower", "avr"],
  ["S3", "4U", "628–803", "HMIET-I AVR, T1 master", "avr"],
  ["S2", "4U", "450–625", "Tap‑changer simulator"],
  ["S1", "4U", "272–447", "Grid source"],
  ["Locker", "", "120–255", "Cable drawer"],
];
const rackHtml = RACK.map(([a, b, c, d, cls]) => `<tr${cls ? ` class="${cls}"` : ""}><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`).join("");

let ga = "";
try {
  ga = (await import("./drawing.mjs")).elevations();
} catch (error) {
  console.warn("no drawing yet:", error.message);
}

// +θ looks from the right, where the duct, power strip and fan are.
const VIEWS = { "3/4": "35deg 78deg 95%", Front: "0deg 86deg 95%", Side: "90deg 82deg 95%", Back: "180deg 80deg 95%" };

const SITE_JS = `
const btns = [...document.querySelectorAll("[data-grid]")];
let acted = 0;
btns.forEach((b) => b.addEventListener("click", () => { acted = Date.now(); window.dcSteer(Number(b.dataset.grid)); }));
document.querySelector(".dc-stage").addEventListener("pointerdown", () => { acted = Date.now(); });
document.querySelector(".dc-stage").addEventListener("keydown", () => { acted = Date.now(); });
const say = document.querySelector("[data-say]");
let was = "steady";
const status = document.querySelector("[data-status]");
const statusText = document.querySelector("[data-status-text]");
const SAY = {
  steady: (d) => "In band, " + d.kv.toFixed(2) + " kV",
  drift: (d) => "Grid " + (d.dev > 0 ? "+" : "") + d.dev.toFixed(1) + " %",
  timing: (d) => "Out of band, delay " + Math.max(0, d.delay - d.timer).toFixed(1) + " s",
  tap: (d) => "Tap changer " + (d.dev < 0 ? "raising" : "lowering"),
  follow: (d) => "Follower to tap " + String(d.tap).padStart(2, "0"),
};
document.addEventListener("avr", (e) => {
  const d = e.detail;
  status.dataset.phase = d.phase;
  const t = SAY[d.phase](d);
  if (statusText.textContent !== t) statusText.textContent = t;
  btns.forEach((x) => x.setAttribute("aria-pressed", String(!d.touring && Number(x.dataset.grid) === d.target)));
  if (d.phase !== was) { was = d.phase; if (Date.now() - acted < 20000) say.textContent = t; }
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

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>AVR demo cabinet</title>
<meta name="description" content="A mobile 19-inch cabinet with two live HMIET-I AVRs and a tap-changer simulator: 3D model, live drawing and build drawing.">
<meta name="theme-color" content="#e3e6e3">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;700&display=swap">
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>${k.ISO_CSS}${FIG_CSS}${SITE_CSS}</style>
</head>
<body>
<header class="wrap">
  <div>
    <h1>AVR demo cabinet</h1>
    <p>A rolling cabinet that shows an AVR holding the voltage, live.</p>
  </div>
  <p class="when">Concept, November 2026</p>
</header>
<main>
<div class="wrap hero">
  <div class="card stage">
    <div class="modes" role="tablist" aria-label="Drawing type">
      <button type="button" role="tab" id="tab-2d" aria-controls="pane-2d" aria-selected="true">2D drawing</button>
      <button type="button" role="tab" id="tab-3d" aria-controls="pane-3d" aria-selected="false" tabindex="-1">3D model</button>
    </div>
    <div class="pane pane2d" id="pane-2d" role="tabpanel" aria-labelledby="tab-2d">
      <div class="iso" data-theme="light">${plate}</div>
      <div class="run">
        <p class="status" data-status data-phase="steady"><i aria-hidden="true"></i><span data-status-text>In band, 11.00 kV</span></p>
        <p class="sr-only" role="status" data-say></p>
        <div class="btns" role="group" aria-labelledby="grid-lbl">
          <span class="lbl" id="grid-lbl">Grid</span>
          <button class="btn" type="button" data-grid="96.6" aria-pressed="false">−3.4 %</button>
          <button class="btn" type="button" data-grid="100" aria-pressed="false">100 %</button>
          <button class="btn" type="button" data-grid="103.4" aria-pressed="false">+3.4 %</button>
        </div>
      </div>
    </div>
    <div class="pane viewer" id="pane-3d" role="tabpanel" aria-labelledby="tab-3d" hidden>
      <model-viewer src="models/cabinet.glb" ios-src="models/cabinet.usdz" poster="models/poster.webp" loading="lazy" alt="3D model of the AVR demo cabinet. The grid knob turns, the AVR steps the tap changer and the follower copies it."
        camera-controls touch-action="pan-y" autoplay interaction-prompt="none"
        camera-orbit="${VIEWS["3/4"]}" field-of-view="auto" min-camera-orbit="auto 20deg 1.6m" max-camera-orbit="auto 100deg 7m"
        shadow-intensity="1.1" shadow-softness="0.9" exposure="1.05" environment-image="neutral" tone-mapping="aces"
        ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed">
        <button slot="ar-button" class="ar">View in your room</button>
      </model-viewer>
      <div class="vbar">
        <div class="seg" role="group" aria-label="Camera view">
          ${Object.entries(VIEWS).map(([name, orbit], i) => `<button type="button" data-orbit="${orbit}" aria-pressed="${i === 0}">${name}</button>`).join("")}
        </div>
        <span class="hint">Drag to turn</span>
      </div>
    </div>
  </div>
  <div class="col">
    <div class="plate">
      <h2>Specification</h2>
      <dl>
        <dt>Size</dt><dd>600 × 500 × 1700 mm, 1800 on castors</dd>
        <dt>Rack</dt><dd>19″, 20U</dd>
        <dt>AVR</dt><dd>2 × HMIET-I, master and follower</dd>
        <dt>Tap indicator</dt><dd>2 × HMC-3C</dd>
        <dt>Test units</dt><dd>Grid source, tap‑changer simulator</dd>
        <dt>Screen</dt><dd>22″ on a stand, keyboard tray</dd>
        <dt>Supply</dt><dd>230 V, one 13 A plug</dd>
        <dt>Castors</dt><dd>3″, lockable</dd>
      </dl>
    </div>
    <div class="purpose">
      <h2>What it is for</h2>
      <ul>${purposeHtml}</ul>
      <p class="key">Dots: how clearly the sketch shows it.</p>
    </div>
  </div>
</div>

<section><div class="wrap">
  <div class="shead"><h2>Build</h2></div>
  <div class="twod">
    <div>
      <h3>Rack layout</h3>
      <div class="tbl"><table><thead><tr><th>Slot</th><th>Size</th><th>Height, mm</th><th>Unit</th></tr></thead><tbody>${rackHtml}</tbody></table></div>
    </div>
    <div>
      <h3>Before building</h3>
      <ul class="notes">
        <li>Lower the tray to 1.0–1.1 m</li>
        <li>Heaviest unit at the bottom</li>
        <li>Leave 100 mm behind each unit</li>
        <li>Fan low, louvres high</li>
        <li>RCD and earth stud on the frame</li>
      </ul>
    </div>
  </div>
  ${ga ? `<p class="swipe">Swipe for the side view</p><div class="card ga" tabindex="0" role="region" aria-label="Build drawing">${ga}</div>` : ""}
</div></section>
</main>
<footer><div class="wrap">Concept from a hand sketch and device drawings. Sizes approximate, slot contents assumed. 3D model built in Blender.</div></footer>
<script type="module">${live.replace(/<\/(script)/gi, "<\\/$1")}
${SITE_JS}</script>
</body>
</html>`;

writeFileSync(join(HERE, "index.html"), page);
console.log("wrote index.html", (page.length / 1024).toFixed(0) + " KB", ga ? "with drawing" : "without drawing");

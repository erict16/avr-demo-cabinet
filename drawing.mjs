// A4 drawing sheets and the live front of the AVR demo cabinet, rev C.
// Each sheet is an SVG in millimetres (297 × 210, landscape), so it prints 1:1 on A4.
// Sheet 1: general arrangement (front and right side, 1:12).
// Sheet 2: rack front (1:6), systems 1–6 as in Gerrick's sketch.
// Sheet 3: system layout (1:15) with the SHM-D motor drives, junction boxes, BCD box and cables,
//          and the HMJK-II, SHM-KX, junction box and BCD box details.
// cabinetFront() draws the same front elevation in model mm for the website, with real labels
// and data-* hooks for the live demo.
// Model values are mm; heights are above the floor; x is from the cabinet centre.

export const SHEET_W = 297;
export const SHEET_H = 210;
export const REV = "C";
export const DATE = "11 NOV 2026";

const n = (v) => Math.round(v * 1000) / 1000;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// LIVE: drawing for the website (real text, colour classes, data hooks) instead of a sheet.
let LIVE = false;

// A view maps model mm (x from the centre, h above the floor) to sheet mm.
const view = (ox, oy, s) => ({ s, X: (x) => ox + x * s, Y: (h) => oy - h * s });

function rect(x1, y1, x2, y2, cls, extra = "") {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  return `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(Math.abs(x2 - x1))}" height="${n(Math.abs(y2 - y1))}"${extra}/>`;
}
const R = (v, x1, h1, x2, h2, cls, r = 0, extra = "") => rect(v.X(x1), v.Y(h1), v.X(x2), v.Y(h2), cls, (r ? ` rx="${n(r * v.s)}"` : "") + extra);
const line = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const circle = (x, y, r, cls, extra = "") => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"${extra}/>`;
const C = (v, x, h, r, cls, extra = "") => circle(v.X(x), v.Y(h), Math.max(0.12, r * v.s), cls, extra);
const text = (x, y, s, cls, anchor = "start", extra = "") =>
  `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;
// text on a device front, size in model mm
const TX = (v, x, h, s, size, cls, anchor = "start", extra = "") => text(v.X(x), v.Y(h), s, cls, anchor, ` style="font-size:${n(size * v.s)}px"${extra}`);
// a run of printed text on a device front: real text on the website, a dashed bar on a sheet
const print = (v, x1, x2, h) => `<line class="pr" x1="${n(v.X(x1))}" y1="${n(v.Y(h))}" x2="${n(v.X(x2))}" y2="${n(v.Y(h))}" style="stroke-width:${n(Math.max(0.12, 3 * v.s))}"/>`;
const label = (v, x, h, s, size, cls = "t-ink", anchor = "start", extra = "") =>
  LIVE ? TX(v, x, h, s, size, cls, anchor, extra) : print(v, anchor === "middle" ? x - (s.length * size * 0.28) : anchor === "end" ? x - s.length * size * 0.56 : x, anchor === "middle" ? x + s.length * size * 0.28 : anchor === "end" ? x : x + s.length * size * 0.56, h + size * 0.35);
const pad2 = (t) => String(t).padStart(2, "0");

// ---------- rack (rev C), Gerrick's systems 1–6 from the bottom ----------
export const U0 = 270.5;
export const U = 44.45;
const uBottom = (u) => U0 + (u - 1) * U;
const uTop = (u) => U0 + u * U;
export const RACK_U = 20;
export const RACK_TOP = 1160;
export const SLOTS = [
  { no: "1", u: [1, 4], kind: "avr", unit: 0, name: "HMIET-I AVR", tag: "T1 master", front: "482.8 × 177", depth: 267 },
  { no: "2", u: [5, 8], kind: "avr", unit: 1, name: "HMIET-I AVR", tag: "T2 follower", front: "482.8 × 177", depth: 267 },
  { no: "3", u: [9, 10], kind: "rcm", unit: 0, name: "Remote control module", tag: "T1", front: "482.6 × 88", depth: 150, tbc: true },
  { no: "4", u: [11, 12], kind: "rcm", unit: 1, name: "Remote control module", tag: "T2", front: "482.6 × 88", depth: 150, tbc: true },
  { no: "", u: [13, 14], kind: "spare", name: "Spare", tag: "blank panel", front: "482.6 × 88", depth: 0 },
  { no: "5", u: [15, 17], kind: "hmjk", name: "HMJK-II OLTC monitor", tag: "T1", front: "340.4 × 130", depth: 200 },
  { no: "6", u: [18, 20], kind: "kx", name: "SHM-KX controller", tag: "T1", front: "243 × 95", depth: 169 },
].map((s) => ({ ...s, a: uBottom(s.u[0]), b: uTop(s.u[1]), hc: (uBottom(s.u[0]) + uTop(s.u[1])) / 2, size: `${s.u[1] - s.u[0] + 1}U` }));
const slot = (kind, i = 0) => SLOTS.filter((s) => s.kind === kind)[i];
export const RACK_ROWS = [...SLOTS].reverse().map((s) => ({
  no: s.no,
  kind: s.kind,
  name: s.name,
  tag: s.tag,
  u: `U${s.u[0]}–${s.u[1]}`,
  size: s.size,
  mm: `${Math.round(s.a + 1)}–${Math.round(s.b - 1)}`,
  front: s.front,
  depth: s.depth,
  tbc: !!s.tbc,
}));
const slotLabel = (s) => `${s.no ? `${s.no} · ` : ""}${s.name}${s.tag && s.kind !== "spare" ? ` ${s.tag}` : ""}`;

// ---------- dimensions and callouts (sheet mm) ----------
function arrow(x, y, dir) {
  const L = 1.5, B = 0.42;
  const p = { u: [[x, y], [x - B, y + L], [x + B, y + L]], d: [[x, y], [x - B, y - L], [x + B, y - L]], l: [[x, y], [x + L, y - B], [x + L, y + B]], r: [[x, y], [x - L, y - B], [x - L, y + B]] }[dir];
  return `<path class="ar" d="M${p.map((q) => `${n(q[0])} ${n(q[1])}`).join(" L")} Z"/>`;
}
function dimV(x, ya, yb, label, { extA = null, extB = null } = {}) {
  let o = "";
  for (const [ex, y] of [[extA, ya], [extB, yb]]) {
    if (ex == null) continue;
    const d = Math.sign(x - ex);
    o += line(ex + 0.6 * d, y, x + 1 * d, y, "dm");
  }
  o += line(x, ya, x, yb, "dm") + arrow(x, ya, "d") + arrow(x, yb, "u");
  const ty = (ya + yb) / 2;
  o += text(x - 0.7, ty, label, "dt", "middle", ` transform="rotate(-90 ${n(x - 0.7)} ${n(ty)})"`);
  return o;
}
function dimH(y, xa, xb, label, { extA = null, extB = null } = {}) {
  let o = "";
  for (const [ey, x] of [[extA, xa], [extB, xb]]) {
    if (ey == null) continue;
    const d = Math.sign(y - ey);
    o += line(x, ey + 0.6 * d, x, y + 1 * d, "dm");
  }
  o += line(xa, y, xb, y, "dm") + arrow(xa, y, "l") + arrow(xb, y, "r");
  o += text((xa + xb) / 2, y - 0.7, label, "dt", "middle");
  return o;
}
const LH = 2.5; // callout line height
function leader(px, py, kx, ty, lines, accent) {
  return (
    circle(px, py, 0.32, "ld-dot") +
    `<path class="ld" d="M${n(px)} ${n(py)} L${n(kx)} ${n(ty)} L${n(kx + 1.6)} ${n(ty)}"/>` +
    lines.map((t, i) => text(kx + 2.4, ty + i * LH, t, i ? "lb lb2" : accent ? "lb lb-k" : "lb", "start", ` dy="0.35em"`)).join("")
  );
}
// Stack callouts in a column so they never overlap: each wants to sit level with its point.
function callouts(items, kx, top, bottom) {
  const list = items.map((it) => ({ ...it, h: it.lines.length * LH })).sort((a, b) => a.want - b.want);
  let y = top;
  for (const it of list) { it.ty = Math.max(it.want, y); y = it.ty + it.h + 0.6; }
  let over = y - 0.6 - bottom;
  for (let i = list.length - 1; i >= 0 && over > 0; i--) {
    const it = list[i];
    const room = i ? it.ty - (list[i - 1].ty + list[i - 1].h + 0.6) : it.ty - top;
    it.ty -= over;
    over = Math.max(0, over - room);
    for (let j = i + 1; j < list.length; j++) list[j].ty = Math.max(list[j].ty, list[j - 1].ty + list[j - 1].h + 0.6);
  }
  return list.map((it) => leader(it.px, it.py, kx, it.ty, it.lines, it.accent)).join("");
}

// ---------- device fronts (front elevation) ----------
const AVR_W = 482.8, AVR_H = 177, AVR_D = 267;
const AVR_LEDS = [["Run", "g"], ["Fault", "r"], ["Remote", "g"], ["Auto", "g"], ["Parallel", "g"], ["U/I Block", "r"], ["Tap Block", "r"], ["AVR Failed", "r"], ["Regulating", "a"], ["Par.Block", "r"]];
const ears = (v, hc, dhs) => {
  let o = "";
  for (const x of [-232.5, 232.5]) for (const dh of dhs) o += R(v, x - 5, hc + dh - 3.25, x + 5, hc + dh + 3.25, "d f-hole", 3.25);
  return o;
};
function hmiet(v, hc, unit) {
  const L = -AVR_W / 2, T = hc + AVR_H / 2;
  const P = (x1, t1, x2, t2, cls, r, extra) => R(v, L + x1, T - t2, L + x2, T - t1, cls, r, extra);
  let o = R(v, L, hc - AVR_H / 2, -L, T, "ok f-dev", 1) + ears(v, hc, [-50.8, 50.8]);
  AVR_LEDS.forEach(([name, c], i) => {
    const t = 26 + i * 14;
    o += LIVE ? C(v, L + 36, T - t, 2.6, `led led-${c}`, ` data-led="${name}" data-unit="${unit}"`) : C(v, L + 36, T - t, 2.5, "d");
    o += label(v, L + 44, T - t - 2, name, 6);
  });
  o += P(115, 10, 197, 91, "d f-bezel", 1) + P(121, 16, 191, 85, "g f-lcd");
  if (LIVE) {
    o += TX(v, L + 126, T - 27, `T${unit + 1} ${unit ? "FOLLOWER" : "MASTER"}`, 6, "t-lcd", "start", ` data-avr-role="${unit}"`);
    o += TX(v, L + 126, T - 41, "TAP", 5.5, "t-lcd t-dim");
    o += TX(v, L + 186, T - 66, "09", 30, "t-lcd t-big", "end", ` data-avr-tap="${unit}"`);
    o += TX(v, L + 126, T - 78, "MANUAL", 6, "t-lcd", "start", ` data-avr-mode="${unit}"`);
  }
  const kx = 317, kt = 57.5, k = 5;
  for (const [dx, dt] of [[0, -15], [0, 15], [-15, 0], [15, 0]]) o += P(kx + dx - k, kt + dt - k, kx + dx + k, kt + dt + k, "d f-key", 1);
  o += C(v, L + kx, T - kt, 5, "d f-key");
  o += P(352, 38, 367, 50, "d f-key", 1) + P(352, 65, 367, 77, "d f-key", 1);
  if (LIVE) o += TX(v, L + 359.5, T - 32, "ESC", 4, "t-mute", "middle") + TX(v, L + 359.5, T - 59, "RST", 4, "t-mute", "middle");
  o += label(v, L + 466, T - 14, "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR", 5.5, "t-ink", "end");
  return o;
}

// HMIET-I remote control module, 19″ 2U, from Eric's photo.
const RCM_SW = [["SA1", "REMOTE", "LOCAL", -112], ["SA2", "AUTO", "MANUAL", -40], ["SA3", "PARALLEL", "INDEPEND", 32]];
const RCM_BT = [["S1", "1-N", "g", 102], ["S2", "N-1", "g", 144], ["S3", "STOP", "r", 186]];
function rcm(v, s) {
  const a = s.a + 0.4, b = s.b - 0.4, hc = (a + b) / 2, cy = hc - 5, unit = s.unit;
  let o = R(v, -241.3, a, 241.3, b, "ok f-dev", 1) + ears(v, hc, [-19, 19]);
  [["POWER", -200, "a"], ["RUN", -170, "g"]].forEach(([name, x, c]) => {
    o += C(v, x, cy, 8, "d f-ring");
    o += LIVE ? C(v, x, cy, 5.8, `led led-${c}`, ` data-lamp="${name}" data-unit="${unit}" data-on="1"`) : C(v, x, cy, 5.8, "d");
    o += label(v, x, hc + 25, name, 4.6, "t-ink", "middle");
  });
  o += label(v, -214, hc - 33, `REMOTE CONTROL · T${unit + 1}`, 4.6, "t-mute");
  for (const [id, p0, p1, x] of RCM_SW) {
    o += C(v, x, cy, 15, "d f-ring") + C(v, x, cy, 12, "o f-knob");
    if (LIVE) {
      o += `<g class="sw" data-sw="${id}" data-unit="${unit}" data-pos="0" role="button" tabindex="0" aria-label="${id} T${unit + 1}: ${p0}">`;
      o += C(v, x, cy, 22, "hit");
      o += `<g class="sw-bar" transform="rotate(-40 ${n(v.X(x))} ${n(v.Y(cy))})">${R(v, x - 1.8, cy, x + 1.8, cy + 11, "f-pointer", 1)}</g></g>`;
    } else {
      o += `<line class="d" x1="${n(v.X(x))}" y1="${n(v.Y(cy))}" x2="${n(v.X(x - 7))}" y2="${n(v.Y(cy + 8.5))}"/>`;
    }
    o += label(v, x - 9, hc + 25, p0, 4.2, "t-ink sw-l", "end", LIVE ? ` data-sw-l="${id}-${unit}-0"` : "");
    o += label(v, x + 9, hc + 25, p1, 4.2, "t-mute sw-l", "start", LIVE ? ` data-sw-l="${id}-${unit}-1"` : "");
    o += label(v, x, hc - 33, id, 4.6, "t-mute", "middle");
  }
  for (const [id, name, c, x] of RCM_BT) {
    o += C(v, x, cy, 13, "d f-ring");
    if (LIVE) {
      o += `<g class="bt" data-btn="${id}" data-unit="${unit}" role="button" tabindex="0" aria-label="${id} ${name} T${unit + 1}">`;
      o += C(v, x, cy, 20, "hit") + C(v, x, cy, 10.5, `o f-btn f-btn-${c}`) + C(v, x - 2.6, cy + 3, 4, "f-gloss") + `</g>`;
    } else o += C(v, x, cy, 10.5, "o");
    o += label(v, x, hc + 25, name, 4.6, "t-ink", "middle");
    o += label(v, x, hc - 33, id, 4.6, "t-mute", "middle");
  }
  return o;
}

// HMJK-II OLTC monitor, landscape 340.4 × 130, 200 deep.
export const HMJK = { w: 340.4, h: 130, d: 200 };
function hmjk(v, cx, hc) {
  const L = cx - HMJK.w / 2, T = hc + HMJK.h / 2, B = hc - HMJK.h / 2;
  let o = R(v, L, B, L + HMJK.w, T, "ok f-dev", 2);
  for (const h of [T - 6, B + 6]) for (const x of [L + 7, L + HMJK.w - 7]) o += C(v, x, h, 2, "d f-hole");
  o += label(v, L + 16, T - 15, "HMJK-Ⅱ  OLTC MONITOR", 5.5);
  o += R(v, L + 14, T - 106, L + 150, T - 22, "d f-bezel", 2) + R(v, L + 19, T - 101, L + 145, T - 27, "g f-lcd");
  if (LIVE) {
    o += TX(v, L + 25, T - 37, "OLTC T1", 5.5, "t-lcd t-dim");
    o += TX(v, L + 25, T - 74, "09", 30, "t-lcd t-big", "start", ` data-hmjk-tap`);
    o += TX(v, L + 139, T - 40, "OPS 01247", 6, "t-lcd", "end", ` data-hmjk-ops`);
    o += TX(v, L + 139, T - 55, "0.00 A", 6, "t-lcd", "end", ` data-hmjk-i`);
    o += TX(v, L + 139, T - 70, "MOTOR IDLE", 6, "t-lcd", "end", ` data-hmjk-motor`);
    o += TX(v, L + 25, T - 93, "BCD OK · 4–20 mA OK", 5, "t-lcd t-dim");
  }
  [["RUN", "g", 40], ["WARNING", "a", 62], ["ALARM", "r", 84]].forEach(([name, c, t]) => {
    o += LIVE ? C(v, L + 168, T - t, 3, `led led-${c}`, ` data-hmjk-led="${name}"${name === "RUN" ? ' data-on="1"' : ""}`) : C(v, L + 168, T - t, 3, "d");
    o += label(v, L + 176, T - t - 2, name, 5);
  });
  const kx = L + 282, kh = T - 52, k = 6;
  for (const [dx, dh] of [[0, 17], [0, -17], [-17, 0], [17, 0]]) o += R(v, kx + dx - k, kh + dh - k + 1, kx + dx + k, kh + dh + k - 1, "d f-key", 1.5);
  o += C(v, kx, kh, 5.5, "d f-key");
  o += R(v, kx - 36, T - 108, kx - 10, T - 96, "d f-key", 1.5) + R(v, kx + 10, T - 108, kx + 36, T - 96, "d f-key", 1.5);
  if (LIVE) o += TX(v, kx - 23, T - 104, "ESC", 4.2, "t-mute", "middle") + TX(v, kx + 23, T - 104, "RST", 4.2, "t-mute", "middle");
  o += label(v, L + 16, B + 10, "SHANGHAI HUAMING", 4);
  return o;
}

// SHM-KX controller (SHM-D manual, appendix 6): flange 243 × 95, front 226, cutout 210 × 96, 169 deep.
export const SHMKX = { fw: 243, fh: 95, w: 226, d: 169, cw: 210, ch: 96 };
function shmkx(v, cx, hc) {
  const L = cx - SHMKX.fw / 2, B = hc - SHMKX.fh / 2, T = hc + SHMKX.fh / 2;
  let o = R(v, L, B, L + SHMKX.fw, T, "o f-flange", 3);
  for (const x of [L + 4.5, L + SHMKX.fw - 4.5]) for (const h of [hc - 35, hc + 35]) o += C(v, x, h, 2.6, "d f-hole");
  o += R(v, cx - SHMKX.w / 2, B + 1.5, cx + SHMKX.w / 2, T - 1.5, "ok f-dev-w", 2.5);
  o += label(v, cx - 100, T - 11, "SHM-KX", 6, "t-ink t-b");
  const rows = [22, 36, 50, 64, 78];
  const left = ["LOC/REM", "AUTO/MAN", "1-N", "STOP", "N-1"];
  rows.forEach((t, i) => {
    o += R(v, cx - 106, T - t - 5, cx - 88, T - t + 5, "d f-tag", 1) + C(v, cx - 79, T - t, 5, "d f-key");
    if (LIVE) o += TX(v, cx - 97, T - t - 1.3, left[i], 3, "t-ink", "middle");
    o += R(v, cx + 60, T - t - 5, cx + 76, T - t + 5, "d f-tag", 1) + C(v, cx + 85, T - t, 5, "d f-key");
  });
  o += R(v, cx - 68, T - 84, cx + 52, T - 16, "d f-bezel", 1) + R(v, cx - 66, T - 82, cx + 50, T - 18, "g f-lcd-w");
  if (LIVE) {
    o += TX(v, cx - 63, T - 24, "SHM-KX · T1", 4, "t-ink");
    o += TX(v, cx - 63, T - 31, "Work mode: Remote manual", 4, "t-mute", "start", ` data-kx-mode`);
    o += TX(v, cx - 8, T - 64, "9", 32, "t-ink t-kx", "middle", ` data-kx-tap`);
    o += R(v, cx - 66, T - 82, cx + 50, T - 74, "f-kx-bar") + TX(v, cx - 8, T - 79.6, "Main   Measure   Register   Event", 3.4, "t-mute", "middle");
  }
  o += label(v, cx - 40, B + 6, "SHANGHAI HUAMING POWER EQUIPMENT", 3.2, "t-mute");
  return o;
}

function plateScrews(v, a, b) {
  const PX = 241.3;
  const hs = b - a > 60 ? [a + 12, b - 12] : [(a + b) / 2];
  let o = "";
  for (const x of [-PX + 9, PX - 9]) for (const h of hs) o += C(v, x, h, 3, "d f-hole");
  return o;
}
const plate = (v, s) => R(v, -241.3, s.a + 0.4, 241.3, s.b - 0.4, "o f-plate", 1) + plateScrews(v, s.a + 0.4, s.b - 0.4);
function rackUnits(v) {
  let o = "";
  for (const s of SLOTS) {
    let d = "";
    if (s.kind === "avr") d = hmiet(v, s.hc, s.unit);
    if (s.kind === "rcm") d = rcm(v, s);
    if (s.kind === "spare") d = plate(v, s) + (LIVE ? TX(v, 0, s.hc - 2, "SPARE", 6, "t-faint", "middle") : "");
    if (s.kind === "hmjk") d = plate(v, s) + hmjk(v, 0, s.hc);
    if (s.kind === "kx") d = plate(v, s) + (LIVE ? "" : R(v, -SHMKX.cw / 2, s.hc - SHMKX.ch / 2, SHMKX.cw / 2, s.hc + SHMKX.ch / 2, "h")) + shmkx(v, 0, s.hc);
    o += LIVE ? `<g class="sys" data-sys="${s.kind === "spare" ? "spare" : s.no}">${d}</g>` : d;
  }
  return o;
}
function rails(v) {
  return R(v, -250, 270, 250, RACK_TOP, "o f-bay") + R(v, -250, 270, -237, RACK_TOP, "d f-rail") + R(v, 237, 270, 250, RACK_TOP, "d f-rail");
}
function uLadder(v, lx, every = 1) {
  let o = line(lx, v.Y(U0), lx, v.Y(uTop(RACK_U)), "d");
  for (let i = 0; i <= RACK_U; i++) o += line(lx - (i % 5 === 0 ? 1.4 : 0.8), v.Y(U0 + i * U), lx, v.Y(U0 + i * U), "d");
  for (let i = 1; i <= RACK_U; i += every) o += text(lx - 1.8, v.Y(U0 + (i - 0.5) * U), `U${i}`, "ul", "end", ` dy="0.35em"`);
  return o;
}

// ---------- front elevation (sheet 1 and the website) ----------
function frontElevation(v) {
  let o = "";
  for (const c of [-250, 250]) {
    o += R(v, c - 30, 92, c + 30, 100, "o f-metal") + R(v, c - 12, 0, c + 12, 76, "o f-wheel", 5);
    o += R(v, c - 16, 38, c - 12, 92, "d f-metal") + R(v, c + 12, 38, c + 16, 92, "d f-metal") + R(v, c - 16, 84, c + 16, 92, "d f-metal");
    o += R(v, c + 16, 58, c + 34, 68, "d f-brake", 1.5);
  }
  o += R(v, -300, 100, 300, 1340, "o f-frame");
  o += line(v.X(-300), v.Y(118), v.X(300), v.Y(118), "d f-seam");
  o += line(v.X(-275), v.Y(118), v.X(-275), v.Y(1340), "d f-seam") + line(v.X(275), v.Y(118), v.X(275), v.Y(1340), "d f-seam");
  o += R(v, -270, 120, 270, 255, "o f-panel", 1) + R(v, -80, 181, 80, 193, "d f-handle", 3) + C(v, 220, 187, 7, "d f-lock");
  if (LIVE) o += TX(v, -255, 134, "CABLE LOCKER · 13 A EXTENSION", 6.5, "t-faint");
  o += rails(v) + rackUnits(v);
  o += R(v, -250, RACK_TOP, 250, 1340, "o f-panel");
  o += R(v, -230, 1275, 230, 1310, "d f-slot") + R(v, -220, 1275, 220, 1295, "o f-tray", 1) + R(v, -40, 1281, 40, 1288, "d f-handle", 3);
  o += R(v, -307.5, 1340, 307.5, 1355, "o f-top");
  o += R(v, -285, 1355, 285, 1780, "nf f-mesh");
  let dots = "";
  for (let x = -272.5; x <= 272.5; x += 25) for (let h = 1367.5; h <= 1770; h += 25) {
    if (Math.abs(x) < 240 && h > 1382 && h < 1678) continue;
    if (Math.abs(x) < 80 && h < 1392) continue;
    dots += `<circle cx="${n(v.X(x))}" cy="${n(v.Y(h))}" r="${n(1.44 * v.s)}"/>`;
  }
  o += `<g class="dot">${dots}</g>`;
  o += R(v, -300, 1355, -285, 1780, "o f-frame") + R(v, 285, 1355, 300, 1780, "o f-frame") + R(v, -300, 1780, 300, 1800, "o f-frame");
  o += R(v, -70, 1355, 70, 1365, "o f-stand", 2) + R(v, -13, 1365, 13, 1390, "d f-stand");
  o += R(v, -230, 1390, 230, 1670, "o f-monitor", 3) + R(v, -218, 1408, 218, 1658, "d f-screen", 1);
  if (LIVE) {
    [["T1", -110, 0], ["T2", 110, 1]].forEach(([t, x, i]) => {
      o += R(v, x - 95, 1440, x + 95, 1620, "f-tile", 6);
      o += TX(v, x - 80, 1595, `${t} TAP`, 13, "t-scr t-dim");
      o += TX(v, x + 80, 1468, "09", 96, "t-scr t-big", "end", ` data-scr-tap="${i}"`);
    });
  }
  o += R(v, 300, 130, 318, 1180, "d f-duct") + R(v, 300, 1198, 323, 1222, "d f-metal", 2);
  return o;
}
// The website's cabinet front: model mm, y = -height.
export function cabinetFront() {
  LIVE = true;
  try {
    return frontElevation(view(0, 0, 1));
  } finally {
    LIVE = false;
  }
}
export const CAB_BOX = { x0: -320, x1: 330, h0: 0, h1: 1800 };

function sideElevation(v) {
  // here X(z): z is depth back from the cabinet front
  let o = "", defs = "";
  [100, 400].forEach((z, i) => {
    const fork = [[z - 13, 84], [z + 13, 84], [z + 9, 38], [z - 9, 38]];
    const forkD = `M${fork.map((p) => `${n(v.X(p[0]))} ${n(v.Y(p[1]))}`).join(" L")} Z`;
    defs += `<clipPath id="cw${i}"><path clip-rule="evenodd" d="M${n(v.X(z - 45))} ${n(v.Y(90))} H${n(v.X(z + 45))} V${n(v.Y(-5))} H${n(v.X(z - 45))} Z ${forkD}"/></clipPath>`;
    o += `<g clip-path="url(#cw${i})">` + circle(v.X(z), v.Y(38), 38 * v.s, "o") + circle(v.X(z), v.Y(38), 27 * v.s, "d") + `</g>`;
    o += R(v, z - 30, 92, z + 30, 100, "o") + R(v, z - 14, 84, z + 14, 92, "d") + `<path class="d" d="${forkD}"/>`;
    if (z === 100) o += R(v, z - 42, 63, z - 14, 70, "d") + R(v, z - 50, 60, z - 38, 73, "d", 1.5);
  });
  o += R(v, 0, 100, 500, 1340, "o");
  o += line(v.X(0), v.Y(750), v.X(75), v.Y(750), "d") + line(v.X(140), v.Y(750), v.X(500), v.Y(750), "d");
  o += `<path class="d" d="M${n(v.X(0))} ${n(v.Y(181))} H${n(v.X(-25))} V${n(v.Y(193))} H${n(v.X(0))}"/>`;
  o += R(v, -200, 1275, 0, 1295, "o", 1) + R(v, -182, 1295, -22, 1306, "d", 2);
  o += R(v, -7.5, 1340, 507.5, 1355, "o") + R(v, 0, 1355, 15, 1780, "o") + R(v, 485, 1355, 500, 1780, "o") + R(v, 0, 1780, 500, 1800, "o");
  o += R(v, 95, 1355, 185, 1365, "o", 2) + R(v, 127, 1365, 153, 1560, "d") + R(v, 120, 1505, 127, 1555, "d") + R(v, 100, 1390, 120, 1670, "o", 2);
  // hidden: rack units behind the side panel (front plate 3 thick + body), BCD box on the back panel
  const H = { avr: [AVR_H, 4], rcm: [88.1, 6], hmjk: [HMJK.h, 4], kx: [SHMKX.fh, 6] };
  for (const s of SLOTS) {
    if (!H[s.kind]) continue;
    const [h, pad] = H[s.kind];
    o += R(v, 0, s.hc - h / 2, 3, s.hc + h / 2, "h") + R(v, 3, s.hc - h / 2 + pad, s.depth, s.hc + h / 2 - pad, "h");
  }
  o += R(v, 425, 1000, 497, 1120, "h");
  o += R(v, 497, 300, 503, 345, "o");                                     // rear brush plate, edge on
  o += R(v, 75, 130, 140, 1180, "o", 2) + line(v.X(80), v.Y(140), v.X(80), v.Y(1170), "d");
  o += R(v, 230, 150, 450, 195, "o", 3) + R(v, 240, 164, 256, 181, "d", 1);
  for (let i = 0; i < 4; i++) o += R(v, 270 + i * 44, 160, 302 + i * 44, 186, "d", 2);
  o += `<path class="d" d="M${n(v.X(445))} ${n(v.Y(150))} V${n(v.Y(24))} Q${n(v.X(445))} ${n(v.Y(4))} ${n(v.X(465))} ${n(v.Y(4))} H${n(v.X(505))}"/>`;
  o += R(v, 505, 0, 540, 30, "o", 2);
  const fz = 380, fh = 560;
  o += R(v, fz - 60, fh - 60, fz + 60, fh + 60, "o", 4);
  for (const r of [54, 40, 26]) o += circle(v.X(fz), v.Y(fh), r * v.s, "d");
  o += circle(v.X(fz), v.Y(fh), 12 * v.s, "o");
  o += R(v, 300, 1180, 470, 1300, "o", 2);
  for (const h of [1184, 1228, 1240, 1252, 1264, 1276, 1288]) o += R(v, 310, h, 460, h + 6, "d", 1);
  o += R(v, 232, 1203, 428, 1217, "o") + R(v, 210, 1198, 232, 1222, "o", 2) + R(v, 428, 1198, 450, 1222, "o", 2);
  o += circle(v.X(470), v.Y(150), 8 * v.s, "o");
  return { o, defs };
}

// ---------- sheet 1: general arrangement ----------
function sheet1() {
  const F = view(70, 172, 1 / 12);       // front: x from the centre
  const Sd = view(192, 172, 1 / 12);     // side: x = depth from the front face
  let o = line(14, F.Y(0), 240, F.Y(0), "fl") + text(15, F.Y(0) + 2.6, "FLOOR", "dt");
  o += frontElevation(F);
  const side = sideElevation(Sd);
  o += side.o;
  o += uLadder(F, 42, 2);
  o += dimV(20, F.Y(0), F.Y(1800), "1800", { extB: F.X(-300) });
  o += dimV(26, F.Y(0), F.Y(1340), "1340 worktop", { extB: F.X(-307.5) });
  o += dimV(32, F.Y(0), F.Y(100), "100", { extB: F.X(-300) });
  o += dimV(32, F.Y(270), F.Y(RACK_TOP), `rack 270–${RACK_TOP} · ${RACK_U}U`, { extA: F.X(-250), extB: F.X(-250) });
  o += dimH(18, F.X(-300), F.X(300), "600", { extA: F.Y(1800), extB: F.Y(1800) });
  const kx = 104;
  const pt = (x, h) => ({ px: F.X(x), py: F.Y(h) });
  const sys = (s, x) => ({ ...pt(x, s.hc), accent: true, lines: [`${slotLabel(s)} · U${s.u[0]}–${s.u[1]}`] });
  const fc = [
    [pt(260, 1790), ["top frame 1780–1800"]],
    [pt(292, 1745), ["posts 15 × 15"]],
    [pt(272.5, 1717.5), ["perforated back panel"]],
    [pt(230, 1600), ["screen ≈22″, 460 × 280"]],
    [pt(70, 1360), ["screen stand"]],
    [pt(307.5, 1347), ["worktop 15 thk"]],
    [pt(220, 1285), ["retractable keyboard tray 440 W"]],
    [pt(323, 1215), ["push handle (R side)"]],
    { ...sys(slot("kx"), 121.5) },
    { ...sys(slot("hmjk"), 170.2) },
    [pt(241.3, slot("spare").hc), ["spare 2U, blank panel"]],
    { ...sys(slot("rcm", 1), 241.3) },
    { ...sys(slot("rcm", 0), 241.3) },
    { ...sys(slot("avr", 1), 241.4) },
    { ...sys(slot("avr", 0), 241.4) },
    [pt(318, 230), ["cable box down to the locker (R side)"]],
    [pt(227, 187), ["cable locker + lock, 13 A extension"]],
    [pt(288, 109), ["kick plate"]],
    [pt(284, 63), ["3″ castor, lockable"]],
  ].map((it) => (Array.isArray(it) ? { ...it[0], want: it[0].py, lines: it[1] } : { ...it, want: it.py }));
  o += callouts(fc, kx, 22, F.Y(0) - 1);
  o += dimV(170, Sd.Y(0), Sd.Y(1295), "tray 1295", { extB: Sd.X(-200) });
  o += dimV(170, Sd.Y(1390), Sd.Y(1670), "screen 1390–1670", { extA: Sd.X(100), extB: Sd.X(100) });
  o += dimH(Sd.Y(1712), Sd.X(0), Sd.X(100), "100", { extB: Sd.Y(1670) });
  o += dimH(F.Y(0) + 5.2, Sd.X(-200), Sd.X(0), "200 pull-out", { extA: Sd.Y(1275) });
  o += dimH(F.Y(0) + 5.2, Sd.X(0), Sd.X(500), "500", { extB: Sd.Y(100) });
  const zp = (z, h) => ({ px: Sd.X(z), py: Sd.Y(h) });
  const sc = [
    [zp(480, 1790), ["top frame bars"]],
    [zp(470, 1270), ["louvres (exhaust)"]],
    [zp(450, 1210), ["push handle, 23 proud"]],
    [{ ...zp(SHMKX.d, slot("kx").hc), accent: true }, ["SHM-KX (hidden), 169 deep"]],
    [{ ...zp(461, 1060), accent: true }, ["BCD box, inside on back panel", "200 × 120 × 75, size TBC"]],
    [{ ...zp(HMJK.d, slot("hmjk").hc), accent: true }, ["HMJK-II (hidden), 200 deep"]],
    [{ ...zp(150, slot("rcm", 1).hc), accent: true }, ["remote control modules (hidden)", "150 deep assumed, TBC"]],
    [{ ...zp(AVR_D, slot("avr", 1).hc), accent: true }, ["HMIET-I × 2 (hidden), 267 deep"]],
    [zp(140, 880), ["cable box 65 × 18"]],
    [zp(420, 750), ["side panel seam"]],
    [zp(440, 560), ["intake fan Ø120"]],
    [zp(503, 322), ["cable entry, brush plate on back"]],
    [zp(450, 195), ["13 A power extension"]],
    [zp(473.6, 150), ["earth stud"]],
    [zp(530, 30), ["13 A plug, lead to floor"]],
  ].map(([p, lines]) => ({ ...p, want: p.py, lines }));
  o += callouts(sc, 244, 22, F.Y(0) - 1);
  o += text(F.X(0), 184, "FRONT ELEVATION", "vt", "middle") + text(Sd.X(250), 184, "RIGHT SIDE ELEVATION", "vt", "middle");
  return { body: o, defs: side.defs, title: "General arrangement", scale: "1:12" };
}

// ---------- sheet 2: rack front ----------
function sheet2() {
  const v = view(84, 30 + RACK_TOP / 6, 1 / 6);
  let o = R(v, -300, 255, 300, RACK_TOP + 6, "d");
  o += rails(v) + rackUnits(v);
  o += uLadder(v, v.X(-300) - 3);
  const dx = v.X(-300) - 13;
  for (const s of SLOTS) o += dimV(dx, v.Y(s.a + 0.4), v.Y(s.b - 0.4), `${Math.round(s.b - s.a - 0.8)}`);
  o += dimV(dx - 7, v.Y(270), v.Y(RACK_TOP), `270–${RACK_TOP} · ${RACK_U}U`, { extA: v.X(-300) - 4.2, extB: v.X(-300) - 4.2 });
  o += dimH(20, v.X(-241.3), v.X(241.3), "482.6 (19″)", { extA: v.Y(RACK_TOP), extB: v.Y(RACK_TOP) });
  o += dimH(14.5, v.X(-250), v.X(250), "500 rack opening", { extA: v.Y(RACK_TOP), extB: v.Y(RACK_TOP) });
  const K = slot("kx"), J = slot("hmjk");
  o += dimH(v.Y(K.hc - SHMKX.fh / 2) + 2.6, v.X(-SHMKX.fw / 2), v.X(SHMKX.fw / 2), "243");
  o += dimH(v.Y(J.hc - HMJK.h / 2) + 2.6, v.X(-HMJK.w / 2), v.X(HMJK.w / 2), "340.4");
  const kx = v.X(250) + 6;
  o += callouts(SLOTS.map((s) => ({
    px: v.X(241.3), py: v.Y(s.hc), want: v.Y(s.hc) - 1.2, accent: !!s.no,
    lines: [slotLabel(s), `U${s.u[0]}–${s.u[1]} · ${s.size} · ${Math.round(s.a + 1)}–${Math.round(s.b - 1)} mm${s.depth ? ` · ${s.depth} deep${s.tbc ? " (TBC)" : ""}` : ""}`, `front ${s.front}${s.kind === "hmjk" ? " on a 3U plate" : s.kind === "kx" ? ", cutout 210 × 96 in a 3U plate" : ""}`],
  })), kx, 26, 182);
  const NX = 200;
  const notes = [
    "Rev C changes",
    "Order as Gerrick's sketch, system 1 at the bottom.",
    "Remote control modules × 2 added, 2U each.",
    "HMJK-II now one unit, landscape, on a 3U plate.",
    "SHM-KX added, panel-mounted in a 3U plate.",
    "Systems 5 and 6 stacked: 340.4 + 243 = 583,",
    "wider than the 450 between the rails.",
    "Removed: simulator, HMC-3C × 2, 2nd HMJK-II.",
    "Rack 22U → 20U, top 1250 → 1160 mm.",
  ];
  o += notes.map((t, i) => text(NX, 140 + i * 3.6, t, i ? "lb" : "lb lb-h")).join("");
  o += text(v.X(0), 197, "RACK FRONT ELEVATION", "vt", "middle");
  return { body: o, defs: "", title: "Rack front", scale: "1:6" };
}

// ---------- sheet 3: system layout ----------
export const SHMD = { w: 750, h: 816, d: 359 };
export const JB = { w: 300, h: 400, d: 150 };
export const BCD = { w: 200, h: 120, d: 75 };
export const CABLES = [
  ["W1", "Junction box", "BCD box", "BCD tap position", "10 × 1.5"],
  ["W2", "Junction box", "HMJK-II", "Motor voltage + current", "8 × 1.5"],
  ["W3", "Junction box", "AVR, SHM-KX", "Raise / lower / status", "TBC"],
  ["W4", "Cabinet", "Junction box → SHM-D", "Supply 230 V", "3 × 2.5"],
];
function sheet3() {
  const SC = 1 / 15, FY = 154;
  const v = view(0, FY, SC);
  let o = line(14, FY, 180, FY, "fl") + text(15, FY + 2.6, "FLOOR", "dt");
  const C3 = view(37, FY, SC);
  o += R(C3, -300, 100, 300, 1340, "o") + R(C3, -250, 270, 250, RACK_TOP, "d") + R(C3, -307.5, 1340, 307.5, 1355, "o");
  o += R(C3, -300, 1355, -285, 1780, "o") + R(C3, 285, 1355, 300, 1780, "o") + R(C3, -300, 1780, 300, 1800, "o") + R(C3, -230, 1390, 230, 1670, "d", 3);
  for (const s of SLOTS) o += R(C3, -241.3, s.a + 0.4, 241.3, s.b - 0.4, "d") + (s.no ? text(C3.X(0), C3.Y(s.hc), s.no, "ts", "middle", ` dy="0.35em"`) : "");
  for (const c of [-250, 250]) o += R(C3, c - 12, 0, c + 12, 76, "d", 5) + R(C3, c - 30, 92, c + 30, 100, "d");
  o += R(C3, -100, 1000, 100, 1120, "h") + text(C3.X(-96), C3.Y(1000) - 1, "BCD box (back panel)", "ts", "start");
  o += text(C3.X(0), FY + 8, "DEMO CABINET", "vt", "middle");
  const mdBottom = 900, jbTop = mdBottom - 120, jbBottom = jbTop - JB.h;
  let wires = "";
  [["T1", 98], ["T2", 150]].forEach(([t, mx], i) => {
    const M = view(mx, FY, SC);
    o += R(M, -SHMD.w / 2, mdBottom, SHMD.w / 2, mdBottom + SHMD.h, "ok", 30);
    o += R(M, -110, mdBottom + 520, -10, mdBottom + 700, "d", 8) + circle(M.X(-60), M.Y(mdBottom + 640), 1.2, "d");
    o += circle(M.X(0), M.Y(mdBottom + SHMD.h - 446.5), 0.8, "d");
    o += text(M.X(0), M.Y(mdBottom + 300), `SHM-D ${t}`, "ts", "middle");
    o += line(M.X(-300), M.Y(mdBottom), M.X(-300), FY, "c") + line(M.X(300), M.Y(mdBottom), M.X(300), FY, "c");
    o += R(M, -JB.w / 2, jbBottom, JB.w / 2, jbTop, "ok", 8) + text(M.X(0), M.Y((jbTop + jbBottom) / 2), "JB", "ts", "middle", ` dy="0.35em"`);
    o += line(M.X(-60), M.Y(jbTop), M.X(-60), M.Y(mdBottom), "w") + line(M.X(60), M.Y(jbTop), M.X(60), M.Y(mdBottom), "w");
    const run = 100 - i * 60;
    wires += `<path class="w" d="M${n(M.X(0))} ${n(M.Y(jbBottom))} V${n(v.Y(run))} H${n(C3.X(300) + 2.4 - i * 1.2)} V${n(C3.Y(322))} H${n(C3.X(300))}"/>`;
    o += text(M.X(0) + 2.4, M.Y(jbBottom) + 1, `W1–W4 ${t}`, "ts", "end", ` transform="rotate(-90 ${n(M.X(0) + 2.4)} ${n(M.Y(jbBottom) + 1)})"`);
  });
  o += wires + text(C3.X(300) + 4, C3.Y(322) - 3, "to rear brush plate", "ts");
  const M1 = view(98, FY, SC), M2 = view(150, FY, SC);
  o += dimH(M1.Y(mdBottom + SHMD.h) - 3, M1.X(-SHMD.w / 2), M1.X(SHMD.w / 2), "750", { extA: M1.Y(mdBottom + SHMD.h), extB: M1.Y(mdBottom + SHMD.h) });
  o += dimV(M2.X(SHMD.w / 2) + 4, M2.Y(mdBottom), M2.Y(mdBottom + SHMD.h), "816", { extA: M2.X(SHMD.w / 2), extB: M2.X(SHMD.w / 2) });
  o += dimV(M2.X(JB.w / 2) + 4, M2.Y(jbBottom), M2.Y(jbTop), "400", { extA: M2.X(JB.w / 2), extB: M2.X(JB.w / 2) });
  o += text(124, FY + 8, "OUTSIDE: 2 × SHM-D, ONE JUNCTION BOX EACH", "vt", "middle");
  o += text(124, FY + 11.4, "positions schematic · number of SHM-D TBC", "lb lb2", "middle");
  const tx = 15, ty = 172, cw = [11, 25, 36, 44, 16];
  const hdr = ["Cable", "From", "To", "Signal", "Cores"];
  let x = tx;
  o += line(tx, ty + 1.4, tx + cw.reduce((a, b) => a + b), ty + 1.4, "d");
  hdr.forEach((h, i) => { o += text(x, ty, h, "lb lb-h"); x += cw[i]; });
  CABLES.forEach((row, r) => {
    x = tx;
    row.forEach((c, i) => { o += text(x, ty + 5 + r * 3.6, c, i ? "lb" : "lb lb-k"); x += cw[i]; });
  });
  o += text(tx, ty + 5 + CABLES.length * 3.6 + 0.4, "One set per motor drive. W2 and the SHM-KX on T1 only.", "lb lb2");
  // details: HMJK-II and SHM-KX 1:5, junction box 1:10, BCD box 1:5
  const D = view(236, 54, 1 / 5);
  o += hmjk(D, 0, HMJK.h / 2);
  o += dimH(D.Y(HMJK.h) - 3, D.X(-HMJK.w / 2), D.X(HMJK.w / 2), "340.4", { extA: D.Y(HMJK.h), extB: D.Y(HMJK.h) });
  o += dimV(D.X(-HMJK.w / 2) - 4, D.Y(0), D.Y(HMJK.h), "130", { extA: D.X(-HMJK.w / 2), extB: D.X(-HMJK.w / 2) });
  o += text(D.X(0), 60, "HMJK-II OLTC MONITOR × 1 · 1:5", "vt", "middle");
  o += text(D.X(0), 63.4, "landscape, 200 deep, on a 3U plate", "lb lb2", "middle");
  const K = view(236, 94, 1 / 5);
  o += shmkx(K, 0, SHMKX.fh / 2);
  o += dimH(K.Y(SHMKX.fh) - 3, K.X(-SHMKX.fw / 2), K.X(SHMKX.fw / 2), "243 flange", { extA: K.Y(SHMKX.fh), extB: K.Y(SHMKX.fh) });
  o += dimV(K.X(-SHMKX.fw / 2) - 4, K.Y(0), K.Y(SHMKX.fh), "95", { extA: K.X(-SHMKX.fw / 2), extB: K.X(-SHMKX.fw / 2) });
  o += text(K.X(0), 100, "SHM-KX CONTROLLER × 1 · 1:5", "vt", "middle");
  o += text(K.X(0), 103.4, "cutout 210 × 96, 169 deep", "lb lb2", "middle");
  const J = view(205, 155, 1 / 10);
  o += R(J, -JB.w / 2, 0, JB.w / 2, JB.h, "ok", 10) + R(J, -JB.w / 2 + 20, 20, JB.w / 2 - 20, JB.h - 20, "d", 4);
  for (const h of [120, 280]) o += R(J, -JB.w / 2 + 40, h - 15, JB.w / 2 - 40, h + 15, "d");
  for (const x of [-90, -30, 30, 90]) o += circle(J.X(x), J.Y(-12), 1, "o");
  o += dimH(J.Y(JB.h) - 3, J.X(-JB.w / 2), J.X(JB.w / 2), "300 (TBC)", { extA: J.Y(JB.h), extB: J.Y(JB.h) });
  o += dimV(J.X(-JB.w / 2) - 4, J.Y(0), J.Y(JB.h), "400 (TBC)", { extA: J.X(-JB.w / 2), extB: J.X(-JB.w / 2) });
  const Js = view(J.X(JB.w / 2) + 6, 155, 1 / 10);
  o += R(Js, 0, 0, JB.d, JB.h, "ok", 6);
  o += dimH(Js.Y(JB.h) - 3, Js.X(0), Js.X(JB.d), "150", { extA: Js.Y(JB.h), extB: Js.Y(JB.h) });
  o += text(J.X(0) + 8, 162, "JUNCTION BOX × 2 · 1:10", "vt", "middle");
  const Bc = view(262, 139, 1 / 5);
  o += R(Bc, -BCD.w / 2, 0, BCD.w / 2, BCD.h, "ok", 4) + line(Bc.X(-BCD.w / 2), Bc.Y(BCD.h / 2), Bc.X(BCD.w / 2), Bc.Y(BCD.h / 2), "c");
  for (let i = 0; i < 12; i++) o += R(Bc, -85 + i * 14.5, 20, -75 + i * 14.5, 48, "d");
  o += dimH(Bc.Y(BCD.h) - 3, Bc.X(-BCD.w / 2), Bc.X(BCD.w / 2), "200 (TBC)", { extA: Bc.Y(BCD.h), extB: Bc.Y(BCD.h) });
  o += dimV(Bc.X(BCD.w / 2) + 4, Bc.Y(0), Bc.Y(BCD.h), "120", { extA: Bc.X(BCD.w / 2), extB: Bc.X(BCD.w / 2) });
  o += text(Bc.X(0), 146, "BCD BOX × 1 · 1:5", "vt", "middle");
  o += text(Bc.X(0), 150, "inside, back panel, 75 deep", "lb lb2", "middle");
  return { body: o, defs: "", title: "System layout", scale: "1:15" };
}

// ---------- frame and title block ----------
function frame(sheet, no, total) {
  let o = rect(10, 10, 287, 200, "fr");
  const x = 177, y = 186, w = 110, h = 14;
  o += rect(x, y, x + w, y + h, "fr") + line(x, y + 7, x + w, y + 7, "d") + line(x + 62, y, x + 62, y + h, "d") + line(x + 86, y, x + 86, y + h, "d");
  o += text(x + 2, y + 5, "AVR DEMO CABINET", "tb tb-b");
  o += text(x + 2, y + 12, sheet.title.toUpperCase(), "tb");
  o += text(x + 64, y + 3, "SCALE", "tb-s") + text(x + 64, y + 6.2, `${sheet.scale} (A4)`, "tb");
  o += text(x + 64, y + 10, "UNITS", "tb-s") + text(x + 64, y + 13.2, "mm", "tb");
  o += text(x + 88, y + 3, "SHEET", "tb-s") + text(x + 88, y + 6.2, `${no} OF ${total}`, "tb");
  o += text(x + 88, y + 10, "REV", "tb-s") + text(x + 88, y + 13.2, `${REV} · ${DATE}`, "tb");
  return o;
}

export const STYLE = `
.sh{background:#fff}
.nf{fill:none}
.sh text{font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;fill:#111}
.o,.ok{fill:none;stroke:#111;stroke-width:.3;stroke-linejoin:round}
.ok{stroke:#1d4ed8}
.d{fill:none;stroke:#555;stroke-width:.13;stroke-linejoin:round}
.g{fill:#e9ecef;stroke:#555;stroke-width:.1}
.kf{fill:#dbe4ff;stroke:#1d4ed8;stroke-width:.2}
.h{fill:none;stroke:#1d4ed8;stroke-width:.15;stroke-dasharray:1 .6}
.c{fill:none;stroke:#777;stroke-width:.12;stroke-dasharray:3 .7 .5 .7}
.w{fill:none;stroke:#1d4ed8;stroke-width:.35;stroke-linejoin:round}
.pr{stroke:#666;stroke-linecap:round;stroke-dasharray:.5 .25}
.dm{stroke:#333;stroke-width:.1}
.ar{fill:#333}
.ld{fill:none;stroke:#555;stroke-width:.1}
.ld-dot{fill:#333}
.dot{fill:#777}
.fl{stroke:#111;stroke-width:.3}
.fr{fill:none;stroke:#111;stroke-width:.4}
.dt{font-size:1.9px;fill:#333}
.lb{font-size:2px}
.lb2{fill:#555 !important}
.lb-k{fill:#1d4ed8 !important;font-weight:700}
.lb-h{font-weight:700}
.ts{font-size:1.8px}
.ul{font-size:1.6px;fill:#555 !important}
.vt{font-size:2.6px;font-weight:700;letter-spacing:.12px}
.tb{font-size:2.2px}
.tb-b{font-size:2.8px;font-weight:700}
.tb-s{font-size:1.5px;fill:#666 !important;letter-spacing:.1px}
`;

export function sheets() {
  const list = [sheet1(), sheet2(), sheet3()];
  return list.map((s, i) => ({
    title: s.title,
    scale: s.scale,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" class="sh" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}mm" height="${SHEET_H}mm" role="img" aria-label="Sheet ${i + 1}: ${esc(s.title)}">` +
      `<style>${STYLE}</style><defs>${s.defs}</defs><rect x="0" y="0" width="${SHEET_W}" height="${SHEET_H}" fill="#fff"/>${s.body}${frame(s, i + 1, list.length)}</svg>`,
  }));
}

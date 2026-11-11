// A4 drawing sheets for the AVR demo cabinet, rev B.
// Each sheet is an SVG in millimetres (297 × 210, landscape), so it prints 1:1 on A4.
// Sheet 1: general arrangement (front and right side, 1:12).
// Sheet 2: rack front (1:8) with the slot list.
// Sheet 3: system layout (1:20) with the SHM-D motor drives, junction boxes, BCD box and cables,
//          and the HMJK-II, junction box and BCD box details.
// Model values are mm; heights are above the floor; x is from the cabinet centre.

export const SHEET_W = 297;
export const SHEET_H = 210;
export const REV = "B";
export const DATE = "11 NOV 2026";

const n = (v) => Math.round(v * 1000) / 1000;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A view maps model mm (x from the centre, h above the floor) to sheet mm.
const view = (ox, oy, s) => ({ s, X: (x) => ox + x * s, Y: (h) => oy - h * s });

function rect(x1, y1, x2, y2, cls, extra = "") {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  return `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(Math.abs(x2 - x1))}" height="${n(Math.abs(y2 - y1))}"${extra}/>`;
}
const R = (v, x1, h1, x2, h2, cls, r = 0) => rect(v.X(x1), v.Y(h1), v.X(x2), v.Y(h2), cls, r ? ` rx="${n(r * v.s)}"` : "");
const line = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const circle = (x, y, r, cls) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
const text = (x, y, s, cls, anchor = "start", extra = "") =>
  `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;
// a run of printed text on a device front, drawn as a dashed bar
const print = (v, x1, x2, h) => `<line class="pr" x1="${n(v.X(x1))}" y1="${n(v.Y(h))}" x2="${n(v.X(x2))}" y2="${n(v.Y(h))}" style="stroke-width:${n(Math.max(0.12, 3 * v.s))}"/>`;

// ---------- rack (rev B) ----------
export const U0 = 270.5;
export const U = 44.45;
const uBottom = (u) => U0 + (u - 1) * U;
const uTop = (u) => U0 + u * U;
export const RACK_TOP = 1250;
export const RACK_U = 22;
export const SLOTS = [
  { id: "S1", u: [1, 3], name: "Tap-changer simulator", depth: 300, kind: "sim" },
  { id: "S2", u: [4, 11], name: "HMJK-II OLTC monitor × 2, T1 and T2", depth: 200, kind: "hmjk" },
  { id: "S3", u: [12, 15], name: "HMIET-I AVR, T1 master", depth: 267, kind: "avr" },
  { id: "S4", u: [16, 19], name: "HMIET-I AVR, T2 follower", depth: 267, kind: "avr" },
  { id: "S5, S6", u: [20, 22], name: "HMC-3C tap indicator × 2", depth: 110, kind: "hmc" },
].map((s) => ({ ...s, a: uBottom(s.u[0]), b: uTop(s.u[1]), hc: (uBottom(s.u[0]) + uTop(s.u[1])) / 2, size: `${s.u[1] - s.u[0] + 1}U` }));
const slot = (kind, i = 0) => SLOTS.filter((s) => s.kind === kind)[i];
export const RACK_ROWS = [...SLOTS].reverse().map((s) => ({
  slot: s.id,
  u: `U${s.u[0]}–${s.u[1]}`,
  size: s.size,
  mm: `${Math.round(s.a + 1)}–${Math.round(s.b - 1)}`,
  name: s.name,
  key: s.kind === "avr" || s.kind === "hmjk",
}));

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
function hmiet(v, hc) {
  const L = -AVR_W / 2, T = hc + AVR_H / 2;
  const P = (x1, t1, x2, t2, cls, r) => R(v, L + x1, T - t2, L + x2, T - t1, cls, r);
  let o = R(v, L, hc - AVR_H / 2, -L, T, "ok", 1);
  for (const x of [-232.5, 232.5]) for (const dh of [-50.8, 50.8]) o += R(v, x - 5, hc + dh - 3.25, x + 5, hc + dh + 3.25, "d", 3.25);
  for (let i = 0; i < 10; i++) {
    const t = 26 + i * 14;
    o += circle(v.X(L + 36), v.Y(T - t), Math.max(0.16, 2.5 * v.s), "d");
    o += print(v, L + 44, L + 78, T - t);
  }
  o += P(115, 10, 197, 91, "d", 1) + P(121, 16, 191, 85, "g");
  const kx = 317, kt = 57.5, k = 5;
  for (const [dx, dt] of [[0, -15], [0, 15], [-15, 0], [15, 0]]) o += P(kx + dx - k, kt + dt - k, kx + dx + k, kt + dt + k, "d", 1);
  o += circle(v.X(L + kx), v.Y(T - kt), 5 * v.s, "d");
  o += P(352, 38, 367, 50, "d", 1) + P(352, 65, 367, 77, "d", 1);
  o += print(v, L + 300, L + 466, T - 12);
  return o;
}
function hmc3c(v, cx, hc) {
  const L = cx - 96, T = hc + 48;
  let o = R(v, L, hc - 48, cx + 96, T, "o", 1.5);
  o += R(v, L + 118, T - 40, L + 160, T - 17, "g") + R(v, L + 123, T - 37, L + 137, T - 20, "d") + R(v, L + 141, T - 37, L + 155, T - 20, "d");
  o += print(v, L + 10, L + 100, T - 14) + print(v, L + 10, L + 80, T - 24);
  for (const k of [30, 62, 94, 126, 164]) o += R(v, L + k - 6.5, T - 72.5, L + k + 6.5, T - 59.5, "d", 1);
  return o;
}
// HMJK-II module, upright: front 130 × 340.4 (body 322.3), 200 deep.
export const HMJK = { w: 130, h: 340.4, body: 322.3, d: 200, x: 75 };
function hmjk(v, cx, hc) {
  const L = cx - HMJK.w / 2, Rr = cx + HMJK.w / 2, T = hc + HMJK.h / 2, B = hc - HMJK.h / 2;
  let o = R(v, L, B, Rr, T, "ok", 2);
  o += R(v, L + 6, B + 9, Rr - 6, T - 9, "d", 1);                       // body edge (322.3)
  for (const h of [T - 4.5, B + 4.5]) for (const x of [L + 10, Rr - 10]) o += circle(v.X(x), v.Y(h), Math.max(0.15, 2 * v.s), "d");
  o += print(v, L + 14, L + 70, T - 22);                                // HMJK-Ⅱ legend
  o += R(v, cx - 28.5, T - 82, cx + 28.5, T - 34, "d", 1) + R(v, cx - 25, T - 78, cx + 25, T - 38, "g"); // LCD 57 wide
  for (let i = 0; i < 7; i++) {
    const h = T - 100 - i * 13;
    o += circle(v.X(L + 20), v.Y(h), Math.max(0.15, 2.4 * v.s), "d");
    o += print(v, L + 28, L + 70, h);
  }
  const kh = B + 95, k = 9;
  for (const [dx, dh] of [[0, 16], [0, -16], [-16, 0], [16, 0]]) o += R(v, cx + dx - k / 2 - 2, kh + dh - k / 2, cx + dx + k / 2 + 2, kh + dh + k / 2, "d", 1);
  o += circle(v.X(cx), v.Y(kh), 5 * v.s, "d");
  o += R(v, cx - 26, B + 40, cx - 6, B + 52, "d", 1) + R(v, cx + 6, B + 40, cx + 26, B + 52, "d", 1); // ESC, RST
  return o;
}
function plateScrews(v, a, b) {
  const PX = 241.3;
  const hs = b - a > 60 ? [a + 12, b - 12] : [(a + b) / 2];
  let o = "";
  for (const x of [-PX + 9, PX - 9]) for (const h of hs) o += circle(v.X(x), v.Y(h), Math.max(0.2, 3 * v.s), "d");
  return o;
}
function simulator(v, s) {
  const a = s.a + 1, b = s.b - 1, hc = (a + b) / 2;
  let o = R(v, -241.3, a, 241.3, b, "o", 1) + plateScrews(v, a, b);
  const dx = -150;
  o += circle(v.X(dx), v.Y(hc), 55 * v.s, "d") + circle(v.X(dx), v.Y(hc), 44 * v.s, "d");
  for (let t = 1; t <= 17; t++) {
    const ang = ((-135 + ((t - 1) * 270) / 16) * Math.PI) / 180;
    const r1 = 44, r2 = t % 4 === 1 ? 52 : 48;
    o += line(v.X(dx + r1 * Math.sin(ang)), v.Y(hc + r1 * Math.cos(ang)), v.X(dx + r2 * Math.sin(ang)), v.Y(hc + r2 * Math.cos(ang)), "d");
  }
  o += line(v.X(dx), v.Y(hc), v.X(dx), v.Y(hc + 38), "o");
  o += R(v, -60, hc + 18, 40, hc + 48, "d", 2) + R(v, -55, hc + 22, 35, hc + 44, "g");   // operations counter
  o += R(v, -60, hc - 40, -40, hc - 20, "d", 2) + R(v, -30, hc - 40, -10, hc - 20, "d", 2); // RAISE, LOWER lamps
  o += circle(v.X(110), v.Y(hc), 32 * v.s, "d") + circle(v.X(110), v.Y(hc), 6 * v.s, "d"); // motor window
  o += circle(v.X(40), v.Y(hc - 30), 12 * v.s, "d");                                       // crank socket
  for (let i = 0; i < 6; i++) o += R(v, 170 + i * 10, hc - 35, 175 + i * 10, hc + 35, "d", 2.5);
  return o;
}
function rackUnits(v) {
  let o = "";
  for (const s of SLOTS) {
    if (s.kind === "sim") o += simulator(v, s);
    if (s.kind === "avr") o += hmiet(v, s.hc);
    if (s.kind === "hmjk") {
      o += R(v, -241.3, s.a + 1, 241.3, s.b - 1, "o", 1) + plateScrews(v, s.a + 1, s.b - 1);
      o += hmjk(v, -HMJK.x, s.hc) + hmjk(v, HMJK.x, s.hc);
    }
    if (s.kind === "hmc") o += R(v, -241.3, s.a + 1, 241.3, s.b - 1, "o", 1) + plateScrews(v, s.a + 1, s.b - 1) + hmc3c(v, -125, s.hc) + hmc3c(v, 125, s.hc);
  }
  return o;
}
function rails(v) {
  return R(v, -250, 270, 250, RACK_TOP, "o") + line(v.X(-241.3), v.Y(270), v.X(-241.3), v.Y(RACK_TOP), "d") + line(v.X(241.3), v.Y(270), v.X(241.3), v.Y(RACK_TOP), "d");
}
function uLadder(v, lx, every = 1) {
  let o = line(lx, v.Y(U0), lx, v.Y(uTop(RACK_U)), "d");
  for (let i = 0; i <= RACK_U; i++) o += line(lx - (i % 5 === 0 ? 1.4 : 0.8), v.Y(U0 + i * U), lx, v.Y(U0 + i * U), "d");
  for (let i = 1; i <= RACK_U; i += every) o += text(lx - 1.8, v.Y(U0 + (i - 0.5) * U), `U${i}`, "ul", "end", ` dy="0.35em"`);
  return o;
}

// ---------- sheet 1: general arrangement ----------
function frontElevation(v) {
  let o = "";
  for (const c of [-250, 250]) {
    o += R(v, c - 30, 92, c + 30, 100, "o") + R(v, c - 12, 0, c + 12, 76, "o", 5);
    o += R(v, c - 16, 38, c - 12, 92, "d") + R(v, c + 12, 38, c + 16, 92, "d") + R(v, c - 16, 84, c + 16, 92, "d");
    o += R(v, c + 16, 58, c + 34, 68, "d", 1.5);
  }
  o += R(v, -300, 100, 300, 1340, "o");
  o += line(v.X(-300), v.Y(118), v.X(300), v.Y(118), "d");
  o += line(v.X(-275), v.Y(118), v.X(-275), v.Y(1340), "d") + line(v.X(275), v.Y(118), v.X(275), v.Y(1340), "d");
  o += R(v, -270, 120, 270, 255, "o") + R(v, -80, 181, 80, 193, "d", 3) + circle(v.X(220), v.Y(187), 7 * v.s + 0.1, "d");
  o += rails(v) + rackUnits(v);
  o += R(v, -230, 1275, 230, 1310, "d") + R(v, -220, 1275, 220, 1295, "o", 1) + R(v, -40, 1281, 40, 1288, "d", 3);
  o += R(v, -307.5, 1340, 307.5, 1355, "o");
  o += R(v, -300, 1355, -285, 1780, "o") + R(v, 285, 1355, 300, 1780, "o") + R(v, -300, 1780, 300, 1800, "o");
  let dots = "";
  for (let x = -272.5; x <= 272.5; x += 25) for (let h = 1367.5; h <= 1770; h += 25) {
    if (Math.abs(x) < 240 && h > 1382 && h < 1678) continue;
    if (Math.abs(x) < 80 && h < 1392) continue;
    dots += `<circle cx="${n(v.X(x))}" cy="${n(v.Y(h))}" r="0.12"/>`;
  }
  o += `<g class="dot">${dots}</g>`;
  o += R(v, -70, 1355, 70, 1365, "o", 2) + R(v, -13, 1365, 13, 1390, "d");
  o += R(v, -230, 1390, 230, 1670, "o", 3) + R(v, -218, 1408, 218, 1658, "d", 1);
  o += R(v, 300, 130, 318, 1180, "d") + R(v, 300, 1198, 323, 1222, "d", 2);
  return o;
}
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
  for (const s of SLOTS) {
    const h = s.kind === "avr" ? AVR_H : s.kind === "hmjk" ? HMJK.h : s.b - s.a - 2;
    const pad = s.kind === "hmjk" ? 9 : 4;
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

function sheet1() {
  const F = view(70, 172, 1 / 12);       // front: x from the centre
  const Sd = view(192, 172, 1 / 12);     // side: x = depth from the front face
  let o = line(14, F.Y(0), 240, F.Y(0), "fl") + text(15, F.Y(0) + 2.6, "FLOOR", "dt");
  o += frontElevation(F);
  const side = sideElevation(Sd);
  o += side.o;
  o += uLadder(F, 42);
  // front dimensions
  o += dimV(20, F.Y(0), F.Y(1800), "1800", { extB: F.X(-300) });
  o += dimV(26, F.Y(0), F.Y(1340), "1340 worktop", { extB: F.X(-307.5) });
  o += dimV(32, F.Y(0), F.Y(100), "100", { extB: F.X(-300) });
  o += dimV(32, F.Y(270), F.Y(RACK_TOP), `rack 270–${RACK_TOP} · ${RACK_U}U`, { extA: F.X(-250), extB: F.X(-250) });
  o += dimH(18, F.X(-300), F.X(300), "600", { extA: F.Y(1800), extB: F.Y(1800) });
  // front callouts
  const kx = 104;
  const pt = (x, h) => ({ px: F.X(x), py: F.Y(h) });
  const S1 = slot("sim"), S2 = slot("hmjk"), S3 = slot("avr", 0), S4 = slot("avr", 1), S5 = slot("hmc");
  const fc = [
    [pt(260, 1790), ["top frame 1780–1800"]],
    [pt(292, 1745), ["posts 15 × 15"]],
    [pt(272.5, 1717.5), ["perforated back panel"]],
    [pt(230, 1600), ["monitor ≈22″, 460 × 280"]],
    [pt(70, 1360), ["monitor stand"]],
    [pt(307.5, 1347), ["worktop 15 thk"]],
    [pt(220, 1285), ["keyboard tray 440 W"]],
    [pt(323, 1215), ["push handle (R side)"]],
    [{ ...pt(221, S5.hc), accent: true }, [`S5 · S6 · HMC-3C × 2 · U20–22`, "T1 · T2 tap indicators, 192 × 96"]],
    [{ ...pt(241.4, S4.hc), accent: true }, [`S4 · HMIET-I AVR · U16–19`, "T2 follower"]],
    [{ ...pt(241.4, S3.hc), accent: true }, [`S3 · HMIET-I AVR · U12–15`, "T1 master, 482.8 × 177"]],
    [{ ...pt(140, S2.hc), accent: true }, [`S2 · HMJK-II × 2 · U4–11`, "OLTC monitors T1 · T2", "each 130 × 340, 8U plate"]],
    [pt(241.3, S1.hc), [`S1 · tap-changer simulator · U1–3`]],
    [pt(318, 230), ["cable duct (R side)"]],
    [pt(227, 187), ["locker drawer + lock"]],
    [pt(288, 109), ["kick plate"]],
    [pt(284, 63), ["3″ castor, lockable"]],
  ].map(([p, lines]) => ({ ...p, want: p.py, lines }));
  o += callouts(fc, kx, 22, F.Y(0) - 1);
  // side dimensions
  o += dimV(170, Sd.Y(0), Sd.Y(1295), "tray 1295", { extB: Sd.X(-200) });
  o += dimV(170, Sd.Y(1390), Sd.Y(1670), "monitor 1390–1670", { extA: Sd.X(100), extB: Sd.X(100) });
  o += dimH(Sd.Y(1712), Sd.X(0), Sd.X(100), "100", { extB: Sd.Y(1670) });
  o += dimH(F.Y(0) + 5.2, Sd.X(-200), Sd.X(0), "200 pull-out", { extA: Sd.Y(1275) });
  o += dimH(F.Y(0) + 5.2, Sd.X(0), Sd.X(500), "500", { extB: Sd.Y(100) });
  const zp = (z, h) => ({ px: Sd.X(z), py: Sd.Y(h) });
  const sc = [
    [zp(480, 1790), ["top frame bars"]],
    [zp(470, 1270), ["louvres (exhaust)"]],
    [zp(450, 1210), ["push handle, 23 proud"]],
    [{ ...zp(461, 1060), accent: true }, ["BCD box, inside on back panel", "200 × 120 × 75, size TBC"]],
    [{ ...zp(AVR_D, S4.hc), accent: true }, ["HMIET-I × 2 (hidden), 267 deep"]],
    [{ ...zp(HMJK.d, S2.hc + 120), accent: true }, ["HMJK-II × 2 (hidden), 200 deep"]],
    [zp(140, 880), ["cable duct 65 × 18"]],
    [zp(420, 750), ["side panel seam"]],
    [zp(440, 560), ["intake fan Ø120"]],
    [zp(503, 322), ["cable entry, brush plate on back"]],
    [zp(450, 195), ["13 A power strip"]],
    [zp(473.6, 150), ["earth stud"]],
    [zp(530, 30), ["13 A plug, lead to floor"]],
  ].map(([p, lines]) => ({ ...p, want: p.py, lines }));
  o += callouts(sc, 244, 22, F.Y(0) - 1);
  o += text(F.X(0), 184, "FRONT ELEVATION", "vt", "middle") + text(Sd.X(250), 184, "RIGHT SIDE ELEVATION", "vt", "middle");
  return { body: o, defs: side.defs, title: "General arrangement", scale: "1:12" };
}

// ---------- sheet 2: rack front ----------
function sheet2() {
  const v = view(84, 28 + RACK_TOP / 6, 1 / 6);
  let o = R(v, -300, 255, 300, RACK_TOP + 6, "d");
  o += rails(v) + rackUnits(v);
  o += uLadder(v, v.X(-300) - 3);
  // slot heights at the left
  const dx = v.X(-300) - 13;
  for (const s of SLOTS) o += dimV(dx, v.Y(s.a + 1), v.Y(s.b - 1), `${Math.round(s.b - s.a - 2)}`);
  o += dimV(dx - 7, v.Y(270), v.Y(RACK_TOP), `270–${RACK_TOP} · ${RACK_U}U`, { extA: v.X(-300) - 4.2, extB: v.X(-300) - 4.2 });
  o += dimH(20, v.X(-241.3), v.X(241.3), "482.6 (19″)", { extA: v.Y(RACK_TOP), extB: v.Y(RACK_TOP) });
  o += dimH(14.5, v.X(-250), v.X(250), "500 rack opening", { extA: v.Y(RACK_TOP), extB: v.Y(RACK_TOP) });
  const S2 = slot("hmjk");
  o += dimV(v.X(HMJK.x + HMJK.w / 2) + 4, v.Y(S2.hc - HMJK.h / 2), v.Y(S2.hc + HMJK.h / 2), "340.4");
  // slot labels at the right of the rack
  const kx = v.X(250) + 6;
  o += callouts(SLOTS.map((s) => ({ px: v.X(241.3), py: v.Y(s.hc), want: v.Y(s.hc) - 1.2, accent: s.kind === "avr" || s.kind === "hmjk", lines: [`${s.id} · ${s.name}`, `U${s.u[0]}–${s.u[1]} · ${s.size} · ${Math.round(s.a + 1)}–${Math.round(s.b - 1)} mm · ${s.depth} deep`, ...(s.kind === "hmjk" ? ["each 130 × 340.4, centres 150 apart"] : [])] })), kx, 26, 182);
  // notes
  const NX = 200;
  const notes = [
    "Rev B changes",
    "Grid source removed.",
    "Tap-changer simulator 4U → 3U.",
    "HMJK-II × 2 added, upright on one 8U plate.",
    "Rack 20U → 22U, top 1160 → 1250 mm;",
    "fascia vents dropped, side louvres vent.",
    "Front U20 brush panel moved to the back.",
    "BCD box added inside, on the back panel.",
  ];
  o += notes.map((t, i) => text(NX, 146 + i * 3.6, t, i ? "lb" : "lb lb-h")).join("");
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
  ["W3", "Junction box", "AVR", "Raise / lower / status", "TBC"],
  ["W4", "Cabinet", "Junction box → SHM-D", "Supply 230 V", "3 × 2.5"],
];
function sheet3() {
  const SC = 1 / 15, FY = 154;
  const v = view(0, FY, SC);
  let o = line(14, FY, 180, FY, "fl") + text(15, FY + 2.6, "FLOOR", "dt");
  // cabinet, simplified
  const C = view(37, FY, SC);
  o += R(C, -300, 100, 300, 1340, "o") + R(C, -250, 270, 250, RACK_TOP, "d") + R(C, -307.5, 1340, 307.5, 1355, "o");
  o += R(C, -300, 1355, -285, 1780, "o") + R(C, 285, 1355, 300, 1780, "o") + R(C, -300, 1780, 300, 1800, "o") + R(C, -230, 1390, 230, 1670, "d", 3);
  for (const s of SLOTS) o += R(C, -241.3, s.a + 1, 241.3, s.b - 1, "d");
  for (const c of [-250, 250]) o += R(C, c - 12, 0, c + 12, 76, "d", 5) + R(C, c - 30, 92, c + 30, 100, "d");
  o += R(C, -100, 1000, 100, 1120, "kf") + text(C.X(0), C.Y(1060), "BCD", "ts", "middle", ` dy="0.35em"`);
  o += text(C.X(0), FY + 8, "DEMO CABINET", "vt", "middle");
  // two motor drives (outside), each with its junction box under it
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
    wires += `<path class="w" d="M${n(M.X(0))} ${n(M.Y(jbBottom))} V${n(v.Y(run))} H${n(C.X(300) + 2.4 - i * 1.2)} V${n(C.Y(322))} H${n(C.X(300))}"/>`;
    o += text(M.X(0) + 2.4, M.Y(jbBottom) + 1, `W1–W4 ${t}`, "ts", "end", ` transform="rotate(-90 ${n(M.X(0) + 2.4)} ${n(M.Y(jbBottom) + 1)})"`);
  });
  o += wires + text(C.X(300) + 4, C.Y(322) - 3, "to rear brush plate", "ts");
  const M1 = view(98, FY, SC), M2 = view(150, FY, SC);
  o += dimH(M1.Y(mdBottom + SHMD.h) - 3, M1.X(-SHMD.w / 2), M1.X(SHMD.w / 2), "750", { extA: M1.Y(mdBottom + SHMD.h), extB: M1.Y(mdBottom + SHMD.h) });
  o += dimV(M2.X(SHMD.w / 2) + 4, M2.Y(mdBottom), M2.Y(mdBottom + SHMD.h), "816", { extA: M2.X(SHMD.w / 2), extB: M2.X(SHMD.w / 2) });
  o += dimV(M2.X(JB.w / 2) + 4, M2.Y(jbBottom), M2.Y(jbTop), "400", { extA: M2.X(JB.w / 2), extB: M2.X(JB.w / 2) });
  o += text(124, FY + 8, "OUTSIDE: 2 × SHM-D, ONE JUNCTION BOX EACH", "vt", "middle");
  o += text(124, FY + 11.4, "positions schematic", "lb lb2", "middle");
  // cable schedule
  const tx = 15, ty = 172, cw = [11, 25, 36, 44, 16];
  const hdr = ["Cable", "From", "To", "Signal", "Cores"];
  let x = tx;
  o += line(tx, ty + 1.4, tx + cw.reduce((a, b) => a + b), ty + 1.4, "d");
  hdr.forEach((h, i) => { o += text(x, ty, h, "lb lb-h"); x += cw[i]; });
  CABLES.forEach((row, r) => {
    x = tx;
    row.forEach((c, i) => { o += text(x, ty + 5 + r * 3.6, c, i ? "lb" : "lb lb-k"); x += cw[i]; });
  });
  o += text(tx, ty + 5 + CABLES.length * 3.6 + 0.4, "One set per motor drive (T1, T2).", "lb lb2");
  // details: HMJK-II 1:5, junction box 1:10, BCD box 1:5
  const D = view(205, 92, 1 / 5);
  o += hmjk(D, 0, HMJK.h / 2);
  o += dimH(D.Y(HMJK.h) - 3, D.X(-HMJK.w / 2), D.X(HMJK.w / 2), "130", { extA: D.Y(HMJK.h), extB: D.Y(HMJK.h) });
  o += dimV(D.X(-HMJK.w / 2) - 4, D.Y(0), D.Y(HMJK.h), "340.4", { extA: D.X(-HMJK.w / 2), extB: D.X(-HMJK.w / 2) });
  const Ds = view(D.X(HMJK.w / 2) + 10, 92, 1 / 5);
  o += R(Ds, 0, 0, 4, HMJK.h, "o") + R(Ds, 4, 9, HMJK.d, HMJK.h - 9, "o", 2);
  for (let i = 0; i < 5; i++) o += R(Ds, HMJK.d - 4, 40 + i * 55, HMJK.d, 80 + i * 55, "d");
  o += dimH(Ds.Y(HMJK.h) - 3, Ds.X(0), Ds.X(HMJK.d), "200", { extA: Ds.Y(HMJK.h), extB: Ds.Y(HMJK.h - 9) });
  o += text(Ds.X(HMJK.d / 2) - 13, 99, "HMJK-II OLTC MONITOR · 1:5", "vt", "middle");
  const J = view(205, 152, 1 / 10);
  o += R(J, -JB.w / 2, 0, JB.w / 2, JB.h, "ok", 10) + R(J, -JB.w / 2 + 20, 20, JB.w / 2 - 20, JB.h - 20, "d", 4);
  for (const h of [120, 280]) o += R(J, -JB.w / 2 + 40, h - 15, JB.w / 2 - 40, h + 15, "d");
  for (const x of [-90, -30, 30, 90]) o += circle(J.X(x), J.Y(-12), 1, "o");
  o += dimH(J.Y(JB.h) - 3, J.X(-JB.w / 2), J.X(JB.w / 2), "300 (TBC)", { extA: J.Y(JB.h), extB: J.Y(JB.h) });
  o += dimV(J.X(-JB.w / 2) - 4, J.Y(0), J.Y(JB.h), "400 (TBC)", { extA: J.X(-JB.w / 2), extB: J.X(-JB.w / 2) });
  const Js = view(J.X(JB.w / 2) + 6, 152, 1 / 10);
  o += R(Js, 0, 0, JB.d, JB.h, "ok", 6);
  o += dimH(Js.Y(JB.h) - 3, Js.X(0), Js.X(JB.d), "150", { extA: Js.Y(JB.h), extB: Js.Y(JB.h) });
  o += text(J.X(0) + 8, 159, "JUNCTION BOX × 2 · 1:10", "vt", "middle");
  const Bc = view(262, 136, 1 / 5);
  o += R(Bc, -BCD.w / 2, 0, BCD.w / 2, BCD.h, "ok", 4) + line(Bc.X(-BCD.w / 2), Bc.Y(BCD.h / 2), Bc.X(BCD.w / 2), Bc.Y(BCD.h / 2), "c");
  for (let i = 0; i < 12; i++) o += R(Bc, -85 + i * 14.5, 20, -75 + i * 14.5, 48, "d");
  o += dimH(Bc.Y(BCD.h) - 3, Bc.X(-BCD.w / 2), Bc.X(BCD.w / 2), "200 (TBC)", { extA: Bc.Y(BCD.h), extB: Bc.Y(BCD.h) });
  o += dimV(Bc.X(BCD.w / 2) + 4, Bc.Y(0), Bc.Y(BCD.h), "120", { extA: Bc.X(BCD.w / 2), extB: Bc.X(BCD.w / 2) });
  o += text(Bc.X(0), 143, "BCD BOX × 1 · 1:5", "vt", "middle");
  o += text(Bc.X(0), 147, "inside, back panel, 75 deep", "lb lb2", "middle");
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

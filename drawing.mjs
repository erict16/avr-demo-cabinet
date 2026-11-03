// General-arrangement drawing of the mobile AVR demo cabinet.
// Front elevation (left) and right side elevation (right), one shared floor line,
// both at the same scale. Plain string building, no dependencies.
// All model values are mm; heights are above the floor.

const W = 1240;          // viewBox width
const H = 1000;          // viewBox height
const S = 0.45;          // px per mm, both views
const FLOOR = 880;       // floor line y
const CX = 330;          // front view: x = 0 (cabinet centre)
const SX0 = 800;         // side view: z = 0 (cabinet front face), back is +z

const n = (v) => Math.round(v * 100) / 100;
const fx = (x) => CX + x * S;
const fy = (h) => FLOOR - h * S;
const sx = (z) => SX0 + z * S;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function rect(x1, y1, x2, y2, cls, extra = "") {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  return `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(Math.abs(x2 - x1))}" height="${n(Math.abs(y2 - y1))}"${extra}/>`;
}
const FR = (x1, h1, x2, h2, cls, extra) => rect(fx(x1), fy(h1), fx(x2), fy(h2), cls, extra);
const SR = (z1, h1, z2, h2, cls, extra) => rect(sx(z1), fy(h1), sx(z2), fy(h2), cls, extra);
const line = (x1, y1, x2, y2, cls) =>
  `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const circle = (x, y, r, cls) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
const text = (x, y, s, cls, anchor = "start", extra = "") =>
  `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}"${extra}>${esc(s)}</text>`;

// ---------- dimensions ----------
function arrow(x, y, dir) {
  const L = 6, B = 2;
  const p = {
    u: [[x, y], [x - B, y + L], [x + B, y + L]],
    d: [[x, y], [x - B, y - L], [x + B, y - L]],
    l: [[x, y], [x + L, y - B], [x + L, y + B]],
    r: [[x, y], [x - L, y - B], [x - L, y + B]],
  }[dir];
  return `<path class="ga-arw" d="M${p.map((q) => `${n(q[0])} ${n(q[1])}`).join(" L")} Z"/>`;
}

// Vertical dimension at x between svg y values ya (lower) and yb (upper).
// extA / extB: x of the object point for extension lines (null = none).
function dimV(x, ya, yb, label, { extA = null, extB = null, side = "left" } = {}) {
  let o = "";
  for (const [ex, y] of [[extA, ya], [extB, yb]]) {
    if (ex == null) continue;
    const d = Math.sign(x - ex);
    o += line(ex + 2 * d, y, x + 3 * d, y, "ga-dim");
  }
  o += line(x, ya, x, yb, "ga-dim") + arrow(x, ya, "d") + arrow(x, yb, "u");
  const tx = side === "left" ? x - 4 : x + 11;
  const ty = (ya + yb) / 2;
  o += text(tx, ty, label, "ga-dt", "middle", ` transform="rotate(-90 ${n(tx)} ${n(ty)})"`);
  return o;
}

// Horizontal dimension at y between svg x values xa (left) and xb (right).
function dimH(y, xa, xb, label, { extA = null, extB = null } = {}) {
  let o = "";
  for (const [ey, x] of [[extA, xa], [extB, xb]]) {
    if (ey == null) continue;
    const d = Math.sign(y - ey);
    o += line(x, ey + 2 * d, x, y + 3 * d, "ga-dim");
  }
  o += line(xa, y, xb, y, "ga-dim") + arrow(xa, y, "l") + arrow(xb, y, "r");
  o += text((xa + xb) / 2, y - 4, label, "ga-dt", "middle");
  return o;
}

// Leader: dot on the part, line to an elbow column, short shoulder, label.
// label may be a string or an array of lines (first line sits on the shoulder).
function leader(px, py, kx, ty, label, cls = "ga-lb") {
  const lines = Array.isArray(label) ? label : [label];
  return (
    circle(px, py, 1.3, "ga-ldot") +
    `<path class="ga-ld" d="M${n(px)} ${n(py)} L${n(kx)} ${n(ty)} L${n(kx + 5)} ${n(ty)}"/>` +
    lines.map((t, i) => text(kx + 8, ty + i * 12, t, i ? `${cls} ga-lb2` : cls, "start", ` dy="0.35em"`)).join("")
  );
}

// ---------- device fronts (front elevation, mm, x from cabinet centre) ----------
// HMIET-I AVR, native 19″ 4U front 482.8 × 177 (drawing HMIET-I-E110), centred on (0, hc).
// Positions below are "from left" (x) and "from top" (t) of the panel, as on the drawing.
const AVR_W = 482.8, AVR_H = 177, AVR_D = 267;
function hmiet(hc) {
  const L = -AVR_W / 2, R = AVR_W / 2, B = hc - AVR_H / 2, T = hc + AVR_H / 2;
  const P = (x1, t1, x2, t2, cls, extra) => FR(L + x1, T - t2, L + x2, T - t1, cls, extra);
  let o = FR(L, B, R, T, "ga-acc", ` rx="1"`);
  // ear slots: centres 465 apart, 101.6 apart on each ear, 6.5 wide
  for (const x of [-232.5, 232.5]) for (const dh of [-50.8, 50.8]) o += FR(x - 5, hc + dh - 3.25, x + 5, hc + dh + 3.25, "ga-d", ` rx="3.25"`);
  // status LED column at 36 from the left (Run … Par.Block), labels to the right
  for (let i = 0; i < 10; i++) {
    const t = 26 + i * 14;
    o += circle(fx(L + 36), fy(T - t), 2.5 * S + 0.3, "ga-d");
    o += line(fx(L + 44), fy(T - t), fx(L + 78), fy(T - t), "ga-tx");
  }
  o += P(115, 10, 197, 91, "ga-d", ` rx="1"`);                           // LCD 82 × 80
  o += P(121, 16, 191, 85, "ga-d");                                      // display area
  // keypad 295–367 × 36–79: diamond of arrow keys round OK, ESC / RST beside
  const kx = 317, kt = 57.5, k = 5;
  for (const [dx, dt] of [[0, -15], [0, 15], [-15, 0], [15, 0]]) o += P(kx + dx - k, kt + dt - k, kx + dx + k, kt + dt + k, "ga-d", ` rx="1"`);
  o += circle(fx(L + kx), fy(T - kt), 5 * S, "ga-d");
  o += P(352, 38, 367, 50, "ga-d", ` rx="1"`) + P(352, 65, 367, 77, "ga-d", ` rx="1"`); // ESC, RST
  o += line(fx(L + 300), fy(T - 12), fx(L + 466), fy(T - 12), "ga-tx");     // "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR"
  return o;
}

// HMC-3C tap position indicator, DIN 192 × 96, centred on (cx, hc).
function hmc3c(cx, hc) {
  const L = cx - 96, R = cx + 96, B = hc - 48, T = hc + 48;
  let o = FR(L, B, R, T, "ga-o", ` rx="1.5"`);
  o += FR(L + 118, T - 40, L + 160, T - 17, "ga-d");                    // 2-digit LED window
  o += FR(L + 123, T - 37, L + 137, T - 20, "ga-d") + FR(L + 141, T - 37, L + 155, T - 20, "ga-d");
  for (const k of [30, 62, 94, 126, 164]) o += FR(L + k - 6.5, T - 72.5, L + k + 6.5, T - 59.5, "ga-d", ` rx="1"`); // TELECONTROL, 1-N, STOP, N-1, POWER
  return o;
}

// ---------- front elevation ----------
function frontView() {
  let o = "";

  // castors (front and rear coincide in this view)
  for (const c of [-250, 250]) {
    o += FR(c - 30, 92, c + 30, 100, "ga-o");                // top plate
    o += FR(c - 12, 0, c + 12, 76, "ga-o", ` rx="5"`);         // wheel, edge on
    o += FR(c - 16, 38, c - 12, 92, "ga-d");                  // fork cheeks
    o += FR(c + 12, 38, c + 16, 92, "ga-d");
    o += FR(c - 16, 84, c + 16, 92, "ga-d");                  // yoke
    o += FR(c - 19, 34, c - 16, 42, "ga-d") + FR(c + 16, 34, c + 19, 42, "ga-d"); // axle nuts
    o += FR(c + 16, 58, c + 34, 68, "ga-d", ` rx="1.5"`);      // brake pedal (front castor)
  }

  // lower cabinet
  o += FR(-300, 100, 300, 1340, "ga-o");
  o += line(fx(-300), fy(118), fx(300), fy(118), "ga-d");    // kick plate top
  o += line(fx(-275), fy(118), fx(-275), fy(1340), "ga-d");  // corner uprights
  o += line(fx(275), fy(118), fx(275), fy(1340), "ga-d");

  // cable locker drawer
  o += FR(-270, 120, 270, 255, "ga-o");
  o += FR(-80, 181, 80, 193, "ga-d", ` rx="3"`);
  o += circle(fx(220), fy(187), 7 * S + 1, "ga-d");
  o += line(fx(220), fy(191), fx(220), fy(183), "ga-d");

  // rack opening, rails
  o += FR(-250, 270, 250, 1160, "ga-o");
  o += line(fx(-241.3), fy(270), fx(-241.3), fy(1160), "ga-d");
  o += line(fx(241.3), fy(270), fx(241.3), fy(1160), "ga-d");

  // rack slots (SPEC rack layout); plates are full 19″ fronts, 482.6 wide
  const PX = 241.3;
  const slots = [
    { a: 272, b: 447, t: ["S1 · Grid source", "U1–4 · 4U"] },
    { a: 450, b: 625, t: ["S2 · Tap-changer simulator", "U5–8 · 4U"] },
    { a: 628, b: 803, dev: "avr" },                                  // S3 HMIET-I · T1 master
    { a: 806, b: 981, dev: "avr" },                                  // S4 HMIET-I · T2 follower
    { a: 984, b: 1115, dev: "hmc" },                                 // S5 + S6 HMC-3C × 2
    { a: 1117, b: 1159, dev: "brush" },                              // U20 cable entry
  ];
  for (const s of slots) {
    const hc = (s.a + s.b) / 2;
    if (s.dev === "avr") { o += hmiet(hc); continue; }               // native 4U unit, own ears
    o += FR(-PX, s.a, PX, s.b, "ga-o", ` rx="1"`);
    // mounting screws
    const hs = s.b - s.a > 60 ? [s.a + 12, s.b - 12] : [(s.a + s.b) / 2];
    for (const x of [-PX + 9, PX - 9]) for (const h of hs) o += circle(fx(x), fy(h), 1.3, "ga-scr");
    if (s.t) {
      const mx = fx(0), my = fy(hc);
      o += text(mx, my - 7, s.t[0], "ga-sl", "middle", ` dy="0.35em"`);
      o += text(mx, my + 7, s.t[1], "ga-sl ga-sl-dim", "middle", ` dy="0.35em"`);
    }
    if (s.dev === "hmc") o += hmc3c(-125, hc) + hmc3c(125, hc);
    if (s.dev === "brush") {
      o += FR(-185, hc - 7, 185, hc + 7, "ga-d", ` rx="3"`);         // brush slot
      o += line(fx(-180), fy(hc), fx(180), fy(hc), "ga-d");         // brush meeting line
    }
  }
  // small device dimensions in free space on the fronts:
  // AVR height in S3 (between LCD and keypad), AVR width along the foot of S4, HMC-3C height in the gap
  o += dimV(fx(-AVR_W / 2 + 248), fy(715.5 - AVR_H / 2), fy(715.5 + AVR_H / 2), "177");
  o += dimH(fy(893.5 + AVR_H / 2 - 166), fx(-AVR_W / 2), fx(AVR_W / 2), "482.8");
  o += dimV(fx(0), fy(1049.5 - 48), fy(1049.5 + 48), "96", { extA: fx(29), extB: fx(29) });

  // U ladder, left of the cabinet
  const LX = 186, U0 = 270.5, U = 44.45;
  o += line(LX, fy(U0), LX, fy(U0 + 20 * U), "ga-d");
  for (let i = 0; i <= 20; i++) {
    const y = fy(U0 + i * U);
    o += line(LX - (i % 5 === 0 ? 7 : 4), y, LX, y, "ga-d");
  }
  for (let i = 1; i <= 20; i++) {
    o += text(LX - 9, fy(U0 + (i - 0.5) * U), `U${i}`, "ga-ul", "end", ` dy="0.35em"`);
  }

  // fascia: vent slots and keyboard tray
  for (let i = 0; i < 22; i++) {
    const c = -210 + i * 20;
    o += FR(c - 5, 1190, c + 5, 1205, "ga-d", ` rx="1.5"`);
  }
  o += FR(-230, 1275, 230, 1310, "ga-d");                    // tray slot
  o += FR(-220, 1275, 220, 1295, "ga-o", ` rx="1"`);           // tray front (extended)
  o += FR(-40, 1281, 40, 1288, "ga-d", ` rx="3"`);             // finger pull

  // worktop
  o += FR(-307.5, 1340, 307.5, 1355, "ga-o");

  // upper open frame
  o += FR(-300, 1355, -285, 1780, "ga-o");
  o += FR(285, 1355, 300, 1780, "ga-o");
  o += FR(-300, 1780, 300, 1800, "ga-o");
  // perforated back panel: dots only where not hidden by monitor and stand
  let dots = "";
  for (let x = -272.5; x <= 272.5; x += 25) {
    for (let h = 1367.5; h <= 1770; h += 25) {
      if (Math.abs(x) < 240 && h > 1382 && h < 1678) continue;
      if (Math.abs(x) < 80 && h < 1392) continue;
      dots += `<circle cx="${n(fx(x))}" cy="${n(fy(h))}" r="0.9"/>`;
    }
  }
  o += `<g class="ga-dot">${dots}</g>`;

  // monitor and stand
  o += FR(-70, 1355, 70, 1365, "ga-o", ` rx="2"`);
  o += FR(-13, 1365, 13, 1390, "ga-d");
  o += FR(-230, 1390, 230, 1670, "ga-o", ` rx="3"`);
  o += FR(-218, 1408, 218, 1658, "ga-d", ` rx="1"`);

  // right side items seen end-on (they stand proud of the right side panel)
  o += FR(300, 130, 318, 1180, "ga-d");                      // cable duct
  o += FR(300, 1198, 323, 1222, "ga-d", ` rx="2"`);           // push handle

  // callouts, right of the view
  const KX = 492;
  const C = [
    [260, 1790, 1790, "top frame 1780–1800"],
    [292, 1745, 1745, "posts 15×15"],
    [272.5, 1717.5, 1700, "perforated back panel"],
    [230, 1600, 1600, "monitor ≈22″ 460×280"],
    [70, 1360, 1378, "monitor stand"],
    [307.5, 1347, 1328, "worktop 15 thk"],
    [220, 1285, 1287, "keyboard tray 440 W"],
    [323, 1215, 1245, "push handle (R side)"],
    [215, 1197, 1197, "vent slots"],
    [318, 520, 520, "cable duct (R side)"],
    [227, 187, 215, "locker drawer + lock"],
    [288, 109, 142, "kick plate"],
    [284, 63, 50, "3″ castor, lockable"],
  ];
  for (const [x, h, lh, t] of C) o += leader(fx(x), fy(h), KX, fy(lh), t);

  // rack device labels, same column (units sit in S3–S6)
  const D = [
    [200, 1138, 1146, ["U20 · cable entry · 1U", "brush strip"]],
    [229, 1049.5, 1064, ["S5 · S6 · HMC-3C ×2 · 3U", "T1 · T2 tap indicators", "each 192 × 96"]],
    [200, 893.5, 893.5, ["S4 · HMIET-I AVR · 4U", "T2 follower"], "ga-lb ga-lb-acc"],
    [200, 715.5, 728, ["S3 · HMIET-I AVR · 4U", "T1 master", "native 19″, 482.8 × 177"], "ga-lb ga-lb-acc"],
  ];
  for (const [x, h, lh, t, cls] of D) o += leader(fx(x), fy(h), KX, fy(lh), t, cls);

  // dimensions, left of the view
  o += dimV(40, fy(0), fy(1800), "1800", { extB: fx(-300) });
  o += dimV(70, fy(0), fy(1340), "1340 worktop", { extB: fx(-307.5) });
  o += dimV(100, fy(0), fy(100), "100", { extB: fx(-300) });
  o += dimV(100, fy(270), fy(1160), "rack 270–1160 · 20U", { extA: fx(-250), extB: fx(-250) });
  // widths, above the view
  o += dimH(26, fx(-300), fx(300), "600", { extA: fy(1800), extB: fy(1800) });
  o += dimH(50, fx(-250), fx(250), "500 rack opening", { extA: fy(1160), extB: fy(1160) });

  o += text(CX, 940, "FRONT ELEVATION", "ga-ti", "middle");
  return o;
}

// ---------- right side elevation ----------
function sideView() {
  let o = "";
  let defs = "";

  // castors at 100 and 400 from front
  [100, 400].forEach((z, i) => {
    const fork = [[z - 13, 84], [z + 13, 84], [z + 9, 38], [z - 9, 38]];
    const forkD = `M${fork.map((p) => `${n(sx(p[0]))} ${n(fy(p[1]))}`).join(" L")} Z`;
    defs += `<clipPath id="ga-cw${i}"><path clip-rule="evenodd" d="M${n(sx(z - 45))} ${n(fy(90))} H${n(sx(z + 45))} V${n(fy(-5))} H${n(sx(z - 45))} Z ${forkD}"/></clipPath>`;
    o += `<g clip-path="url(#ga-cw${i})">` + circle(sx(z), fy(38), 38 * S, "ga-o") + circle(sx(z), fy(38), 27 * S, "ga-d") + `</g>`;
    o += SR(z - 30, 92, z + 30, 100, "ga-o");
    o += SR(z - 14, 84, z + 14, 92, "ga-d");
    o += `<path class="ga-d" d="${forkD}"/>`;
    o += circle(sx(z), fy(38), 9 * S, "ga-d") + circle(sx(z), fy(38), 1.2, "ga-d");
    if (z === 100) {
      o += SR(z - 42, 63, z - 14, 70, "ga-d");                // brake lever
      o += SR(z - 50, 60, z - 38, 73, "ga-d", ` rx="1.5"`);    // pedal pad
    }
  });

  // lower cabinet body and side panel seam (hidden behind the duct)
  o += SR(0, 100, 500, 1340, "ga-o");
  o += line(sx(0), fy(750), sx(75), fy(750), "ga-d");
  o += line(sx(140), fy(750), sx(500), fy(750), "ga-d");

  // drawer pull seen in profile
  o += `<path class="ga-d" d="M${n(sx(0))} ${n(fy(181))} H${n(sx(-25))} V${n(fy(193))} H${n(sx(0))}"/>`;

  // keyboard tray, pulled out 200
  o += SR(-200, 1275, 0, 1295, "ga-o", ` rx="1"`);
  o += SR(-182, 1295, -22, 1306, "ga-d", ` rx="2"`);          // keyboard
  o += text(sx(-8), fy(1275) + 16, "tray ≈1295", "ga-lb", "end");
  o += text(sx(-8), fy(1275) + 29, "above floor", "ga-lb", "end");

  // worktop, posts, top frame
  o += SR(-7.5, 1340, 507.5, 1355, "ga-o");
  o += SR(0, 1355, 15, 1780, "ga-o");
  o += SR(485, 1355, 500, 1780, "ga-o");
  o += SR(0, 1780, 500, 1800, "ga-o");

  // monitor and stand
  o += SR(95, 1355, 185, 1365, "ga-o", ` rx="2"`);
  o += SR(127, 1365, 153, 1560, "ga-d");
  o += SR(120, 1505, 127, 1555, "ga-d");
  o += SR(100, 1390, 120, 1670, "ga-o", ` rx="2"`);

  // HMIET-I AVRs (S3, S4) behind the side panel, hidden: 3 front panel + body to 267 deep
  for (const hc of [715.5, 893.5]) {
    o += SR(0, hc - AVR_H / 2, 3, hc + AVR_H / 2, "ga-hid");
    o += SR(3, hc - AVR_H / 2 + 4, AVR_D, hc + AVR_H / 2 - 4, "ga-hid");
  }

  // cable duct
  o += SR(75, 130, 140, 1180, "ga-o", ` rx="2"`);
  o += line(sx(80), fy(140), sx(80), fy(1170), "ga-d");

  // 13 A power strip, lead and plug
  o += SR(230, 150, 450, 195, "ga-o", ` rx="3"`);
  o += SR(240, 164, 256, 181, "ga-d", ` rx="1"`);              // switch
  for (let i = 0; i < 4; i++) o += SR(270 + i * 44, 160, 302 + i * 44, 186, "ga-d", ` rx="2"`);
  o += `<path class="ga-d" d="M${n(sx(445))} ${n(fy(150))} V${n(fy(24))} Q${n(sx(445))} ${n(fy(4))} ${n(sx(465))} ${n(fy(4))} H${n(sx(505))}"/>`;
  o += SR(505, 0, 540, 30, "ga-o", ` rx="2"`);
  o += line(sx(540), fy(9), sx(552), fy(9), "ga-d") + line(sx(540), fy(21), sx(552), fy(21), "ga-d");

  // intake fan
  const fzc = 380, fhc = 560;
  o += SR(fzc - 60, fhc - 60, fzc + 60, fhc + 60, "ga-o", ` rx="4"`);
  for (const r of [54, 40, 26]) o += circle(sx(fzc), fy(fhc), r * S, "ga-d");
  o += circle(sx(fzc), fy(fhc), 12 * S, "ga-o");
  o += line(sx(fzc - 54), fy(fhc), sx(fzc - 12), fy(fhc), "ga-d") + line(sx(fzc + 12), fy(fhc), sx(fzc + 54), fy(fhc), "ga-d");
  o += line(sx(fzc), fy(fhc - 54), sx(fzc), fy(fhc - 12), "ga-d") + line(sx(fzc), fy(fhc + 12), sx(fzc), fy(fhc + 54), "ga-d");
  for (const [dz, dh] of [[-52.5, -52.5], [52.5, -52.5], [-52.5, 52.5], [52.5, 52.5]]) o += circle(sx(fzc + dz), fy(fhc + dh), 1.3, "ga-scr");

  // louvres (exhaust); the push handle (1198–1222) runs across the lower part, so no slats there
  o += SR(300, 1180, 470, 1300, "ga-o", ` rx="2"`);
  for (const h of [1184, 1228, 1240, 1252, 1264, 1276, 1288]) o += SR(310, h, 460, h + 6, "ga-d", ` rx="1"`);
  // push handle
  o += SR(232, 1203, 428, 1217, "ga-o");
  o += SR(210, 1198, 232, 1222, "ga-o", ` rx="2"`);
  o += SR(428, 1198, 450, 1222, "ga-o", ` rx="2"`);

  // earth stud
  o += circle(sx(470), fy(150), 8 * S, "ga-o") + circle(sx(470), fy(150), 1.2, "ga-d");

  // callouts, right of the view
  const KX = 1040;
  const C = [
    [480, 1790, 1790, "top frame bars"],
    [470, 1270, 1278, "louvres (exhaust)"],
    [450, 1210, 1212, "push handle, 23 proud"],
    [140, 1000, 1000, "cable duct 65×18"],
    [420, 750, 790, "side panel seam"],
    [440, 560, 560, "intake fan Ø120"],
    [450, 195, 238, "13 A power strip"],
    [473.6, 150, 150, "earth stud"],
    [530, 30, 70, "13 A plug, lead to floor"],
  ];
  for (const [z, h, lh, t] of C) o += leader(sx(z), fy(h), KX, fy(lh), t);
  o += leader(sx(AVR_D), fy(893.5), KX, fy(893.5), ["HMIET-I AVR ×2 (hidden)", "body 267 deep"]);

  // dimensions
  o += dimV(675, fy(0), fy(1295), "tray 1295", { extB: sx(-200) });
  o += dimV(675, fy(1390), fy(1670), "monitor 1390–1670", { extA: sx(100), extB: sx(100) });
  o += dimH(fy(1712), sx(0), sx(100), "100", { extB: fy(1670) });
  o += dimH(912, sx(-200), sx(0), "200 pull-out", { extA: fy(1275), extB: fy(100) });
  o += dimH(912, sx(0), sx(500), "500", { extB: fy(100) });

  o += text(sx(250), 940, "RIGHT SIDE ELEVATION", "ga-ti", "middle");
  return { o, defs };
}

function titleBlock() {
  const x = 800, y = 952, w = 430, h = 42, mid = 1010;
  let o = rect(x, y, x + w, y + h, "ga-o");
  o += line(x, y + h / 2, x + w, y + h / 2, "ga-d");
  o += line(mid, y, mid, y + h, "ga-d");
  o += text(x + 8, y + 15, "AVR DEMO CABINET", "ga-tb ga-tb-b");
  o += text(mid + 8, y + 15, "GENERAL ARRANGEMENT", "ga-tb");
  o += text(x + 8, y + 36, "DIMENSIONS IN mm", "ga-tb");
  o += text(mid + 8, y + 36, "CONCEPT, NOV 2026", "ga-tb");
  return o;
}

const STYLE = `
.ga-svg text{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace}
.ga-o{fill:none;stroke:var(--draw-ink,#1b1f22);stroke-width:1.2;stroke-linejoin:round}
.ga-d{fill:none;stroke:var(--draw-line,#8d989d);stroke-width:0.7;stroke-linejoin:round}
.ga-acc{fill:none;stroke:var(--draw-accent,#c46d00);stroke-width:1.2}
.ga-hid{fill:none;stroke:var(--draw-accent,#c46d00);stroke-width:0.7;stroke-dasharray:4 2.5}
.ga-tx{stroke:var(--draw-line,#8d989d);stroke-width:1.4;stroke-linecap:round;stroke-dasharray:2 1.2}
.ga-dim{stroke:var(--draw-dim,#5b676d);stroke-width:0.6}
.ga-arw{fill:var(--draw-dim,#5b676d);stroke:none}
.ga-ld{fill:none;stroke:var(--draw-line,#8d989d);stroke-width:0.6}
.ga-ldot{fill:var(--draw-dim,#5b676d);stroke:none}
.ga-scr{fill:none;stroke:var(--draw-line,#8d989d);stroke-width:0.6}
.ga-dot{fill:var(--draw-line,#8d989d)}
.ga-floor{stroke:var(--draw-ink,#1b1f22);stroke-width:1.2}
.ga-dt{font-size:10px;fill:var(--draw-dim,#5b676d)}
.ga-lb{font-size:10px;fill:var(--draw-ink,#1b1f22)}
.ga-lb-acc{fill:var(--draw-accent,#c46d00);font-weight:600}
.ga-lb2{fill:var(--draw-dim,#5b676d);font-weight:400}
.ga-ul{font-size:10px;fill:var(--draw-dim,#5b676d)}
.ga-sl{font-size:11px;fill:var(--draw-ink,#1b1f22)}
.ga-sl-acc{fill:var(--draw-accent,#c46d00)}
.ga-sl-dim{fill:var(--draw-dim,#5b676d)}
.ga-ti{font-size:12px;font-weight:600;letter-spacing:0.08em;fill:var(--draw-ink,#1b1f22)}
.ga-tb{font-size:10px;letter-spacing:0.04em;fill:var(--draw-dim,#5b676d)}
.ga-tb-b{font-size:12px;font-weight:600;fill:var(--draw-ink,#1b1f22)}
`;

export function elevations() {
  const side = sideView();
  const body =
    line(20, FLOOR, 1070, FLOOR, "ga-floor") +
    text(22, FLOOR + 14, "FLOOR", "ga-dt") +
    frontView() +
    side.o +
    titleBlock();
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="ga-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" ` +
    `aria-label="AVR demo cabinet general arrangement: front and right side elevations, 600 wide, 500 deep, 1800 high, 20U rack with two HMIET-I AVRs and two HMC-3C tap indicators, dimensions in mm">` +
    `<style>${STYLE}</style><defs>${side.defs}</defs>${body}</svg>`
  );
}

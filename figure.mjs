// The AVR demo cabinet as an isometric figure. 1 world unit = 5 mm.
// Body 600 W × 500 D × 1700 H on 3″ castors, read off the concept sketch.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const WIDTH = 560;
export const HEIGHT = 800;

const FRONT = 50;
const SIDE = 60;
const ZB = 20; // underside of the body, on top of the castors
const ZW = 268; // worktop, 1240 mm above the body underside
const ZTOP = 360; // 1700 mm body
const BODY = { x: -60, y: -50, w: 120, d: 100, r: 1.2 };
const TRAY = { x: -44, y: FRONT, w: 88, d: 2, r: 1.2 }; // keyboard tray, pushed in
const TRAY_Z = 257;
const CAVITY = { x0: -50, x1: 50, z0: 54, z1: 232, r: 1.2, depth: 9 }; // 20U rack, 270–1160 mm
const RACK_F = FRONT - 1.6; // front of the rack units
const MON = { x0: -46, x1: 46, y0: 26, y1: 30, z0: 278, z1: 334 };
const PLUG = [70, -66];

// Rack slots, bottom to top, Gerrick's systems 1–6 (rev C, SPEC.md). 1U = 8.89 units, U1 starts at 54.1.
const uz = (u) => 54.1 + (u - 1) * 8.89;
const slotU = (a, b) => ({ z0: uz(a) + 0.2, z1: uz(b + 1) - 0.2 });
export const SLOTS = {
  s1: slotU(1, 4), // HMIET-I AVR, T1 master (native 19″ 4U)
  s2: slotU(5, 8), // HMIET-I AVR, T2 follower
  s3: slotU(9, 10), // remote control module T1, 2U
  s4: slotU(11, 12), // remote control module T2, 2U
  spare: slotU(13, 14), // blank panel, 2U
  s5: slotU(15, 17), // HMJK-II OLTC monitor, landscape on a 3U plate
  s6: slotU(18, 20), // SHM-KX controller in a 3U plate
};

export const P = k.fitProjection(
  [...k.boxCorners(BODY, 0, ZTOP), [TRAY.x, FRONT + TRAY.d, TRAY_Z], [TRAY.x + TRAY.w, FRONT + TRAY.d, TRAY_Z], [67, -40, 250], [PLUG[0] + 3, PLUG[1] - 3, 0]],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: 62, elevation: 20 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left"); // local (x, −z) on the face at y
const n = (v) => Math.round(v * 100) / 100;
// A rounded rectangle in face coordinates (x along the face, z up).
const fr = (x0, z0, x1, z1, r, steps = 5) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const circle = (cx, cz, r, steps = 40) => k.pathOf(Array.from({ length: steps }, (_, i) => [cx + r * Math.cos((i / steps) * 2 * Math.PI), -cz + r * Math.sin((i / steps) * 2 * Math.PI)]), true);
const onFace = (y, inner) => `<g transform="${planeOf(y)}">${inner}</g>`;
const fl = (d, tone = "lo", extra = "") => `<path class="iso-line" data-tone="${tone}" d="${d}"${extra}/>`;
const part = (name, inner) => `<g data-part="${name}">${inner}</g>`;
// A closed slot on the side face (x = SIDE + off), y along the face.
const sideSlot = (y0, y1, z0, z1, r = 0.8, x = SIDE) =>
  k.pathOf(k.roundedPlan({ x: y0, y: z0, w: y1 - y0, d: z1 - z0, r }, 4).map(([y, z]) => at([x, y, z])), true);
const byDepth = (list, of) => [...list].sort((a, b) => k.depthOf(of(a), P) - k.depthOf(of(b), P));

let clips = 0;
function recess({ x0, x1, z0, z1, r, depth }, y, inside = "", backClass = "dc-well") {
  const id = `dc-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = fr(x0, z0, x1, z1, r, 6);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${fl(shape, "faint")}</g>`,
    inside,
    `</g>`,
    onFace(y, fl(shape, "lo")),
  ].join("");
}

// ---------- castors ----------
function castor([cx, cy], front) {
  const out = [];
  out.push(S(k.slabOf({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 1 }, ZB - 2, 2, P, 3, 0.3), { tone: "lo" }));
  out.push(D(k.corners({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 1 }, 1.8).map(([x, y]) => at([x, y, ZB])), { size: 0.4 }));
  out.push(S(k.cylinder(cx, cy, 3.4, ZB - 4, 2, P, 24), { tone: "mid" }));
  out.push(S(k.slabOf({ x: cx - 3.6, y: cy - 4.2, w: 7.2, d: 8.4, r: 1 }, 15, 1.2, P, 2), { tone: "mid" }));
  const plate = (x) => S(k.slabOf({ x, y: cy - 4.2, w: 0.8, d: 8.4, r: 0.3 }, 5.4, 9.8, P, 2), { tone: "mid", crease: "none" });
  out.push(plate(cx - 3.6));
  const F = G.frameOf([cx - 2.6, cy, 7.6], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 5.2, 7.6, F, P), { tone: "lo", inner: L(G.arcOf(F, 2.6, 7.6, P), { tone: "faint" }) }));
  out.push(L(G.circleOf(F, 5.2, 3.6, P), { tone: "faint" }));
  out.push(plate(cx + 2.8));
  out.push(D([at([cx + 3.6, cy, 7.6])], { size: 0.55, tone: "mid" }));
  if (front) {
    out.push(S(k.slabOf({ x: cx - 2.2, y: cy + 4.2, w: 4.4, d: 4.6, r: 0.8 }, 12.4, 1.6, P, 2, 0.3), { tone: "mid" }));
    out.push(L(k.lineOnTop([cx - 1.6, cy + 6], [cx + 1.6, cy + 6], 14, P), { tone: "faint" }) + L(k.lineOnTop([cx - 1.6, cy + 7.2], [cx + 1.6, cy + 7.2], 14, P), { tone: "faint" }));
  }
  return out.join("");
}
const CASTORS = [[-50, -40], [50, -40], [-50, 40], [50, 40]];
const backCastors = () => byDepth(CASTORS.filter(([, y]) => y < 0), ([x, y]) => [x, y, 0]).map((c) => castor(c, false)).join("");
const frontCastors = () => byDepth(CASTORS.filter(([, y]) => y > 0), ([x, y]) => [x, y, 0]).map((c) => castor(c, true)).join("");

// ---------- body ----------
function body() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BODY, 0, ZB, P)}"/>`];
  const seam = L(k.sideSeam(BODY, 52, P, 3), { tone: "faint" });
  out.push(S(k.slabOf(BODY, ZB, ZW - ZB, P, 3, 0.8), { tone: "mid", inner: seam }));
  // front frame uprights (40 × 40 profile) with fixing screws
  for (const x of [-60, 55]) {
    out.push(S(k.slabOf({ x, y: FRONT - 0.4, w: 5, d: 1.2, r: 0.3 }, ZB, ZW - ZB, P, 2, 0.3), { tone: "mid" }));
    const screws = [];
    for (let z = ZB + 8; z < ZW - 4; z += 30) screws.push(at([x + 2.5, FRONT + 0.8, z]));
    out.push(D(screws, { size: 0.42 }));
  }
  // kick plate under the locker
  out.push(S(k.slabOf({ x: -55, y: FRONT - 0.4, w: 110, d: 0.8, r: 0.2 }, ZB, 3.6, P, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}

function sideDetail() {
  const out = [];
  // two side panels: seam at the rack mid-height, screws round each panel
  out.push(L(k.segment([SIDE, -50, 150], [SIDE, 50, 150], P), { tone: "faint" }));
  const screws = [];
  for (const [z0, z1] of [[ZB, 150], [150, ZW]]) {
    for (const y of [-47, 47]) for (let z = z0 + 5; z <= z1 - 4; z += (z1 - z0 - 9) / 3) screws.push(at([SIDE, y, z]));
    for (let y = -30; y <= 30; y += 30) screws.push(at([SIDE, y, z0 + 2.6]), at([SIDE, y, z1 - 2.6]));
  }
  out.push(D(screws, { size: 0.4 }));
  // 120 mm intake fan with a wire guard
  const [fy, fz, fr] = [-26, 112, 12];
  const ringAt = (r, steps = 48) => k.pathOf(Array.from({ length: steps }, (_, i) => at([SIDE + 0.4, fy + r * Math.cos((i / steps) * 2 * Math.PI), fz + r * Math.sin((i / steps) * 2 * Math.PI)])), true);
  out.push(S(k.slabOf({ x: SIDE, y: fy - 13, w: 0.4, d: 26, r: 1.4 }, fz - 13, 26, P, 3), { tone: "lo", crease: "none" }));
  out.push(`<path class="dc-well" d="${ringAt(fr)}"/>`);
  out.push(L([fr, fr * 0.72, fr * 0.46, fr * 0.2].map((r) => ringAt(r)).join(""), { tone: "lo" }));
  out.push(L([0, 1, 2, 3].map((i) => {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    return k.segment([SIDE + 0.4, fy + fr * 0.2 * Math.cos(a), fz + fr * 0.2 * Math.sin(a)], [SIDE + 0.4, fy + fr * Math.cos(a), fz + fr * Math.sin(a)], P);
  }).join(""), { tone: "lo" }));
  out.push(D([[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => at([SIDE + 0.4, fy + a * 10.6, fz + b * 10.6])), { size: 0.42 }));
  // earth stud with nut
  const F = G.frameOf([SIDE, -44, 30], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 1, 2.6, F, P), { tone: "mid" }));
  out.push(S(G.disc(1, 3.4, 1, F, P), { tone: "mid" }));
  return part("side", out.join(""));
}

function sideFace() {
  const out = [];
  // side panel groove (closed) and louvres
  out.push(L(sideSlot(-44, 44, 58, 262, 2), { tone: "faint" }));
  for (let i = 0; i < 7; i++) out.push(L(sideSlot(-30, 4, 236 + i * 3.4, 237.6 + i * 3.4, 0.8), { tone: "lo" }));
  // label plate with rule lines standing for print
  const LP = { y0: -30, y1: -8, z0: 178, z1: 190 };
  out.push(S(k.slabOf({ x: SIDE, y: LP.y0, w: 0.6, d: LP.y1 - LP.y0, r: 0.4 }, LP.z0, LP.z1 - LP.z0, P, 2), { tone: "lo", crease: "none" }));
  out.push(L([186, 183, 180].map((z, i) => k.segment([SIDE + 0.6, LP.y0 + 3, z], [SIDE + 0.6, LP.y0 + 3 + [15, 11, 13][i], z], P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([SIDE + 0.6, LP.y1 - 2, LP.z0 + 2]), at([SIDE + 0.6, LP.y1 - 2, LP.z1 - 2])], { size: 0.4 }));
  return part("side", out.join(""));
}

function cableDuct() {
  const out = [];
  const duct = { x: SIDE, y: 22, w: 3.6, d: 13, r: 0.6 };
  const joints = L([32, 90, 150, 210].map((z) => k.sideSeam(duct, z, P, 2)).join(""), { tone: "faint" });
  out.push(S(k.slabOf(duct, 26, 236 - 26, P, 2, 0.4), { tone: "mid", inner: joints }));
  out.push(D([30, 120, 180, 230].flatMap((z) => [at([SIDE + 3.6, 24.4, z]), at([SIDE + 3.6, 32.6, z])]), { size: 0.4 }));
  return part("duct", out.join(""));
}

function powerStrip() {
  const out = [];
  const X = SIDE + 2.8;
  out.push(S(k.slabOf({ x: SIDE, y: -40, w: 2.8, d: 44, r: 0.8 }, 30, 9, P, 3, 0.4), { tone: "mid" }));
  [-34, -22, -10].forEach((y) => {
    out.push(L(k.pathOf([[y, 31.6], [y + 9, 31.6], [y + 9, 37.4], [y, 37.4]].map(([a, z]) => at([X, a, z])), true), { tone: "lo" }));
    out.push(L([[y + 3.2, 35.6, 2.4, 0.6], [y + 1.8, 33.2, 0.7, 1.4], [y + 6.5, 33.2, 0.7, 1.4]].map(([a, z, w, h]) => k.pathOf([[a, z], [a + w, z], [a + w, z + h], [a, z + h]].map(([p, q]) => at([X, p, q])), true)).join(""), { tone: "mid" }));
  });
  out.push(S(k.slabOf({ x: X, y: -1, w: 0.8, d: 3, r: 0.4 }, 32.4, 4.2, P, 2), { tone: "hi", lit: true }));
  // lead from the strip's end cap down to the 13 A plug on the floor
  out.push(S(k.slabOf({ x: SIDE, y: 4, w: 2.8, d: 2.4, r: 0.6 }, 31.4, 6.2, P, 2), { tone: "lo" }));
  out.push(L(k.pathOf([at([SIDE + 1.4, 6.4, 33]), at([SIDE + 1.4, 9, 33]), at([SIDE + 1.6, 10.4, 30]), at([SIDE + 2, 10.6, 2]), at([SIDE + 3, 10.6, 0.6]), at([PLUG[0] - 0.6, PLUG[1] + 3, 0.6]), at([PLUG[0] - 0.6, PLUG[1] + 3, 1.6])]), { tone: "mid" }).replace("<path", '<path style="stroke-width:1.2;stroke-linejoin:round"'));
  out.push(S(k.slabOf({ x: PLUG[0] - 3, y: PLUG[1] - 3, w: 6, d: 6, r: 1 }, 0, 4, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([PLUG[0], PLUG[1], 4])], { size: 0.45 }));
  return part("power", `<path class="iso-halo" d="${k.haloOf({ x: PLUG[0] - 3, y: PLUG[1] - 3, w: 6, d: 6, r: 1 }, 0, 0.1, P)}" style="filter:blur(2px)"/>` + out.join(""));
}

function pushHandle() {
  const out = [];
  for (const y of [-36, 4]) out.push(S(k.slabOf({ x: SIDE, y: y - 1.6, w: 4.6, d: 3.2, r: 0.6 }, 240.4, 3.2, P, 2, 0.3), { tone: "mid" }));
  const F = G.frameOf([SIDE + 4.6, -40, 242], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 48, 1.7, F, P), { tone: "mid" }));
  return part("handle", out.join(""));
}

// ---------- front of the lower body ----------
function locker() {
  const out = [];
  out.push(S(k.slabOf({ x: -54, y: FRONT - 1, w: 108, d: 2.2, r: 0.6 }, 24, 27, P, 2, 0.4), { tone: "mid" }));
  const y = FRONT + 1.2;
  let face = fl(fr(-20, 41, 20, 45.6, 2.2), "lo") + fl(fr(-19, 41.8, 19, 44.8, 1.5), "faint");
  for (let i = 0; i < 6; i++) face += fl(fr(-50 + i * 5, 28, -47 + i * 5, 36, 0.8), "lo");
  face += fl(circle(42, 36, 2.2, 24), "lo") + fl(fr(41.6, 34.6, 42.4, 37.4, 0.3), "mid");
  out.push(onFace(y, face));
  out.push(D([[-51.5, 27], [-51.5, 48], [51.5, 27], [51.5, 48]].map(([x, z]) => at([x, y, z])), { size: 0.45 }));
  return part("locker", out.join(""));
}

function fascia() {
  // blanking fascia between the rack and the tray slot, four screws
  let face = fl(fr(-48, 233.4, 48, 252.4, 0.8), "lo") + fl(fr(-46, 255.2, 46, 263.4, 1), "faint");
  const out = [onFace(FRONT, face)];
  out.push(D([[-46, 235.4], [-46, 250.4], [46, 235.4], [46, 250.4]].map(([x, z]) => at([x, FRONT, z])), { size: 0.42 }));
  return out.join("");
}

// ---------- rack units ----------
function unit(name, slot, face, { lit = false, handles = true } = {}) {
  const x0 = slot.x0 ?? -48;
  const x1 = slot.x1 ?? 48;
  const { z0, z1 } = slot;
  const out = [];
  out.push(S(k.slabOf({ x: x0, y: FRONT - CAVITY.depth, w: x1 - x0, d: RACK_F - FRONT + CAVITY.depth, r: 0.5 }, z0, z1 - z0, P, 2, 0.4), { tone: lit ? "hi" : "mid", lit, crease: lit ? "lo" : "faint" }));
  out.push(onFace(RACK_F, face));
  // M6 screws with cup washers in the ears
  const ears = [x0 + 1.8, x1 - 1.8];
  const screwsAt = ears.flatMap((x) => [[x, z0 + 2.4], [x, z1 - 2.4]]);
  out.push(onFace(RACK_F, fl(screwsAt.map(([x, z]) => circle(x, z, 0.95, 14)).join(""), "lo")));
  out.push(D(screwsAt.map(([x, z]) => at([x, RACK_F, z])), { size: 0.42 }));
  if (handles && z1 - z0 > 15) {
    for (const x of [x0 + 3.6, x1 - 5.2]) {
      out.push(S(k.slabOf({ x, y: RACK_F, w: 1.6, d: 1.6, r: 0.4 }, z0 + 3.4, 1.6, P, 2), { tone: "mid", crease: "none" }));
      out.push(S(k.slabOf({ x, y: RACK_F, w: 1.6, d: 1.6, r: 0.4 }, z1 - 5, 1.6, P, 2), { tone: "mid", crease: "none" }));
      out.push(S(k.slabOf({ x, y: RACK_F + 1.6, w: 1.6, d: 1.4, r: 0.6 }, z0 + 3.4, z1 - z0 - 6.8, P, 2, 0.3), { tone: "mid" }));
    }
  }
  return part(name, out.join(""));
}

const vents = (x0, z0, count, w = 2.2, h = 8, gap = 3.6) => Array.from({ length: count }, (_, i) => fl(fr(x0 + i * gap, z0, x0 + i * gap + w, z0 + h, w / 2.2), "lo")).join("");
const TX = (x, z, size, body, extra = "") => '<text x="' + n(x) + '" y="' + n(-z) + '" font-size="' + size + '" font-family="Inter,Arial,sans-serif"' + extra + ">" + body + "</text>";
const keyCap = (x, z, w, h, label, size = 1) => '<path fill="#e9ebec" d="' + fr(x - w / 2, z - h / 2, x + w / 2, z + h / 2, 0.45) + '"/>' + fl(fr(x - w / 2, z - h / 2, x + w / 2, z + h / 2, 0.45), "lo") + (label ? TX(x, z - 0.36, size, label, ' text-anchor="middle" fill="#2b3135" font-weight="600"') : "");
const axisY = (x, y, z) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const sysGroup = (no, inner) => `<g data-sys="${no}">${inner}</g>`;

// HMIET-I automatic voltage regulator, native 19″ 4U (drawing HMIET-I-E110).
// Front positions are mm from the panel's left and top edges, converted to figure units.
function hmiet(name, slot, { lit, unit: u }) {
  const { z0, z1 } = slot;
  const X = (mm) => -48 + mm / 5;
  const Z = (mm) => z1 - mm / 5;
  let f = '<path fill="#c9cdd0" d="' + fr(-48, z0, 48, z1, 0.5) + '"/>';
  f += TX(X(462), Z(14), 1.45, "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR", ' text-anchor="end" fill="#2b3135" font-weight="600"');
  const LEDS = [["Run", "#3fbf63"], ["Fault", "#e0333c"], ["Remote", "#3fbf63"], ["Auto", "#3fbf63"], ["Parallel", "#3fbf63"], ["U/I Block", "#e0333c"], ["Tap Block", "#e0333c"], ["AVR Failed", "#e0333c"], ["Regulating", "#e08a00"], ["Par.Block", "#e0333c"]];
  LEDS.forEach(([label, color], i) => {
    const z = Z(36 + i * 12.8);
    const on = label === "Run" || label === "Remote" || label === "Parallel";
    f += '<path fill="#3a4045" d="' + circle(X(36), z, 0.75, 12) + '"/>';
    f += '<path data-led="' + label + '" data-unit="' + u + '" class="dc-lamp"' + (on ? ' data-on="1"' : "") + ' style="--c:' + color + '" d="' + circle(X(36), z, 0.55, 12) + '"/>';
    f += TX(X(42), z - 0.45, 1.25, label, ' fill="#2b3135"');
  });
  const L = { x0: X(115), x1: X(197), z0: Z(91), z1: Z(10) };
  f += '<path fill="#14181b" d="' + fr(L.x0 - 0.8, L.z0 - 0.8, L.x1 + 0.8, L.z1 + 0.8, 0.6) + '"/>';
  f += '<path fill="#0b1a20" d="' + fr(L.x0, L.z0, L.x1, L.z1, 0.3) + '"/>';
  const lx = (L.x0 + L.x1) / 2;
  f += TX(L.x0 + 1, L.z1 - 2, 1.25, u ? "T2 FOLLOWER" : "T1 MASTER", ' data-avr-role="' + u + '" class="dc-mono" fill="#7fe0ff"');
  f += TX(L.x0 + 1, L.z1 - 3.9, 1.25, "MANUAL · REMOTE", ' data-avr-mode="' + u + '" class="dc-mono" fill="#eaf6ff"');
  f += TX(lx, L.z0 + 4.2, 7, "09", ' data-avr-tap="' + u + '" class="dc-mono" text-anchor="middle" fill="#eaf6ff" font-weight="700"');
  f += TX(lx, L.z0 + 2.2, 1.1, "TAP", ' class="dc-mono" text-anchor="middle" fill="#7fe0ff"');
  const kx = X(331), kz = Z(57.5);
  f += keyCap(kx, kz + 3.6, 3, 2.6, "▲") + keyCap(kx, kz - 3.6, 3, 2.6, "▼") + keyCap(kx - 3.8, kz, 2.6, 3, "◀") + keyCap(kx + 3.8, kz, 2.6, 3, "▶") + keyCap(kx, kz, 2.8, 2.8, "OK", 0.95);
  f += keyCap(kx + 9.6, kz + 2.2, 4.2, 2.6, "ESC") + keyCap(kx + 9.6, kz - 2.2, 4.2, 2.6, "RST");
  const cz = (z0 + z1) / 2;
  for (const ex of [X(8.9), X(473.9)]) for (const dz of [-10.16, 10.16]) f += '<path class="dc-well" d="' + fr(ex - 0.65, cz + dz - 1.3, ex + 0.65, cz + dz + 1.3, 0.65) + '"/>' + fl(fr(ex - 0.65, cz + dz - 1.3, ex + 0.65, cz + dz + 1.3, 0.65), "lo");
  return unit(name, slot, f, { lit, handles: false });
}

// HMIET-I remote control module, 19″ 2U (from the photo): POWER and RUN lamps, rotary switches
// SA1 Remote/Local, SA2 Auto/Manual, SA3 Parallel/Independent, buttons S1 1-N, S2 N-1, S3 Stop.
const RCM_SW = [["SA1", "REMOTE", "LOCAL", 129, 0], ["SA2", "AUTO", "MANUAL", 201, 1], ["SA3", "PARALLEL", "INDEPEND.", 273, 0]];
const RCM_BT = [["S1", "1-N", "green", 343], ["S2", "N-1", "green", 385], ["S3", "STOP", "red", 427]];
function rcm(name, slot, u) {
  const { z0, z1 } = slot;
  const X = (mm) => -48 + mm / 5;
  const Z = (mm) => z1 - mm / 5;
  const cz = Z(49), zTop = Z(20.5), zBot = Z(80.5);
  let f = '<path fill="#d3d6d8" d="' + fr(-48, z0, 48, z1, 0.5) + '"/>';
  f += TX(X(14), zBot, 0.95, "REMOTE CONTROL · T" + (u + 1), ' fill="#2b3135" font-weight="600"');
  const out = [];
  // pilot lamps in chrome bezels
  [["POWER", 41, "#f0a020"], ["RUN", 71, "#3fbf63"]].forEach(([label, mm, color]) => {
    f += TX(X(mm), zTop, 0.9, label, ' text-anchor="middle" fill="#2b3135"');
    out.push(S(G.disc(0, 0.9, 1.7, axisY(X(mm), RACK_F, cz), P), { tone: "mid" }));
    out.push(onFace(RACK_F + 0.9, '<path data-lamp="' + label + '" data-unit="' + u + '" class="dc-lamp" data-on="1" style="--c:' + color + '" d="' + circle(X(mm), cz, 1.2, 20) + '"/>' + fl(circle(X(mm), cz, 1.2, 20), "lo")));
  });
  // two-position rotary switches: dial plate, black knob, white pointer at ±40°
  for (const [id, p0, p1, mm, pos] of RCM_SW) {
    const x = X(mm);
    f += '<path fill="#bfc4c8" d="' + circle(x, cz, 3.3, 32) + '"/>' + fl(circle(x, cz, 3.3, 32), "lo");
    f += TX(x - 1.4, zTop, 0.82, p0, ' text-anchor="end" data-sw-l="' + id + "-" + u + '-0"' + (pos === 0 ? " data-on" : "") + ' class="dc-swl"');
    f += TX(x + 1.4, zTop, 0.82, p1, ' text-anchor="start" data-sw-l="' + id + "-" + u + '-1"' + (pos === 1 ? " data-on" : "") + ' class="dc-swl"');
    f += TX(x, zBot, 0.95, id, ' text-anchor="middle" fill="#5b6268"');
    const F = axisY(x, RACK_F, cz);
    const ptr = (a) => fl(`M${n(x)} ${n(-cz)}L${n(x + 2 * Math.sin(a))} ${n(-cz - 2 * Math.cos(a))}`, "lit", ' data-free="both" style="stroke-width:.9;stroke-linecap:round"');
    out.push(`<g class="sw" data-sw="${id}" data-unit="${u}" data-pos="${pos}" role="button" tabindex="0" aria-label="${id} T${u + 1}: ${pos ? p1 : p0}">` +
      S(G.disc(0, 2.2, 2.5, F, P), { tone: "lo", className: "dc-knob" }) +
      onFace(RACK_F + 2.2, `<g class="p0">${ptr((-40 * Math.PI) / 180)}</g><g class="p1">${ptr((40 * Math.PI) / 180)}</g><path class="dc-hit" d="${circle(x, cz, 4.6, 24)}"/>`) +
      `</g>`);
  }
  // mushroom push buttons in a chrome ring
  for (const [id, label, color, mm] of RCM_BT) {
    const x = X(mm);
    f += TX(x, zTop, 0.9, label, ' text-anchor="middle" fill="#2b3135" font-weight="600"');
    f += TX(x, zBot, 0.95, id, ' text-anchor="middle" fill="#5b6268"');
    out.push(S(G.disc(0, 0.8, 2.7, axisY(x, RACK_F, cz), P), { tone: "mid" }));
    out.push(`<g class="bt" data-btn="${id}" data-unit="${u}" role="button" tabindex="0" aria-label="${id} ${label} T${u + 1}">` +
      S(G.disc(0.8, 2.6, 2.15, axisY(x, RACK_F, cz), P), { tone: "lo", className: `dc-${color}` }) +
      onFace(RACK_F + 2.6, `<path class="dc-cap dc-${color}-cap" d="${circle(x, cz, 2.15, 32)}"/><path fill="#fff" opacity=".28" d="${circle(x - 0.6, cz + 0.6, 0.8, 16)}"/><path class="dc-hit" d="${circle(x, cz, 4.2, 24)}"/>`) +
      `</g>`);
  }
  return unit(name, slot, f, { handles: false }) + out.join("");
}

// HMJK-II OLTC monitor, landscape 340.4 × 130 mm, 200 deep, on a 3U plate.
function hmjk(slot) {
  const cz = (slot.z0 + slot.z1) / 2;
  const H = { x0: -34.04, x1: 34.04, z0: cz - 13, z1: cz + 13 };
  const out = [unit("s5", slot, vents(-46, slot.z0 + 4, 2, 1.4, slot.z1 - slot.z0 - 8, 3) + vents(42, slot.z0 + 4, 2, 1.4, slot.z1 - slot.z0 - 8, 3), { handles: false })];
  out.push(S(k.slabOf({ x: H.x0, y: RACK_F, w: H.x1 - H.x0, d: 1.2, r: 0.6 }, H.z0, H.z1 - H.z0, P, 3, 0.3), { tone: "mid" }));
  let f = '<path fill="#dcdfe0" d="' + fr(H.x0, H.z0, H.x1, H.z1, 0.6) + '"/>' + fl(fr(H.x0, H.z0, H.x1, H.z1, 0.6), "lo");
  f += TX(H.x0 + 2.8, H.z1 - 3.2, 1.6, "HMJK-Ⅱ", ' fill="#1b1f22" font-weight="700"') + TX(H.x0 + 11, H.z1 - 3.2, 1, "OLTC MONITOR · T1", ' fill="#3a4045"');
  const L = { x0: H.x0 + 2.8, x1: H.x0 + 28, z0: H.z0 + 3.2, z1: H.z1 - 5.2 };
  f += '<path fill="#14181b" d="' + fr(L.x0 - 0.7, L.z0 - 0.7, L.x1 + 0.7, L.z1 + 0.7, 0.5) + '"/><path fill="#0b1a20" d="' + fr(L.x0, L.z0, L.x1, L.z1, 0.3) + '"/>';
  f += TX(L.x0 + 1, L.z1 - 2, 1.1, "TAP", ' class="dc-mono" fill="#7fe0ff"');
  f += TX(L.x0 + 1, L.z0 + 3.4, 8.4, "09", ' data-hmjk-tap class="dc-mono" fill="#eaf6ff" font-weight="700"');
  f += TX(L.x1 - 1, L.z1 - 2, 1.1, "OPS 01247", ' data-hmjk-ops class="dc-mono" text-anchor="end" fill="#7fe0ff"');
  f += TX(L.x1 - 1, L.z1 - 4.4, 1.1, "0.00 A", ' data-hmjk-i class="dc-mono" text-anchor="end" fill="#eaf6ff"');
  f += TX(L.x1 - 1, L.z1 - 6.8, 1.1, "MOTOR IDLE", ' data-hmjk-motor class="dc-mono" text-anchor="end" fill="#7fe0ff"');
  f += TX(L.x0 + 1, L.z0 + 1.2, 0.95, "BCD OK · 4–20 mA OK", ' class="dc-mono" fill="#5fbfa5"');
  [["RUN", "#3fbf63", 5], ["WARNING", "#e08a00", 0], ["ALARM", "#e0333c", -5]].forEach(([label, color, dz]) => {
    f += '<path fill="#3a4045" d="' + circle(H.x0 + 33, cz + dz, 0.8, 12) + '"/>';
    f += '<path data-hmjk-led="' + label + '" class="dc-lamp"' + (label === "RUN" ? ' data-on="1"' : "") + ' style="--c:' + color + '" d="' + circle(H.x0 + 33, cz + dz, 0.6, 12) + '"/>';
    f += TX(H.x0 + 34.8, cz + dz - 0.4, 1, label, ' fill="#2b3135"');
  });
  const kx = H.x0 + 56, kz = cz + 2.4;
  f += keyCap(kx, kz + 3.4, 2.8, 2.4, "▲", 0.85) + keyCap(kx, kz - 3.4, 2.8, 2.4, "▼", 0.85) + keyCap(kx - 3.6, kz, 2.4, 2.8, "◀", 0.85) + keyCap(kx + 3.6, kz, 2.4, 2.8, "▶", 0.85) + keyCap(kx, kz, 2.6, 2.6, "OK", 0.8);
  f += keyCap(kx - 4, H.z0 + 3.2, 4.4, 2.4, "ESC") + keyCap(kx + 4, H.z0 + 3.2, 4.4, 2.4, "RST");
  f += TX(H.x0 + 41, H.z0 + 1.4, 0.8, "SHANGHAI HUAMING", ' fill="#5b6268"');
  f += fl([[H.x0 + 1.3, H.z0 + 1.3], [H.x1 - 1.3, H.z0 + 1.3], [H.x0 + 1.3, H.z1 - 1.3], [H.x1 - 1.3, H.z1 - 1.3]].map(([x, z]) => circle(x, z, 0.45, 10)).join(""), "lo");
  out.push(onFace(RACK_F + 1.2, f));
  return out.join("");
}

// SHM-KX controller (SHM-D manual, appendix 6): flange 243 × 95, front 226, cutout 210 × 96, 169 deep.
function shmkx(slot) {
  const cz = (slot.z0 + slot.z1) / 2;
  const out = [unit("s6", slot, fl(fr(-21, cz - 9.6, 21, cz + 9.6, 0.4), "faint"), { handles: false })];
  const FL = { x0: -24.3, x1: 24.3, z0: cz - 9.5, z1: cz + 9.5 };
  out.push(S(k.slabOf({ x: FL.x0, y: RACK_F, w: FL.x1 - FL.x0, d: 0.6, r: 0.6 }, FL.z0, FL.z1 - FL.z0, P, 3, 0.3), { tone: "mid" }));
  out.push(onFace(RACK_F + 0.6, fl([[-23.4, cz - 7], [-23.4, cz + 7], [23.4, cz - 7], [23.4, cz + 7]].map(([x, z]) => circle(x, z, 0.5, 12)).join(""), "lo")));
  out.push(D([[-23.4, cz - 7], [-23.4, cz + 7], [23.4, cz - 7], [23.4, cz + 7]].map(([x, z]) => at([x, RACK_F + 0.6, z])), { size: 0.38 }));
  const H = { x0: -22.6, x1: 22.6, z0: cz - 9.2, z1: cz + 9.2 };
  out.push(S(k.slabOf({ x: H.x0, y: RACK_F + 0.6, w: H.x1 - H.x0, d: 1.2, r: 0.6 }, H.z0, H.z1 - H.z0, P, 3, 0.3), { tone: "mid" }));
  let f = '<path fill="#f1f2f3" d="' + fr(H.x0, H.z0, H.x1, H.z1, 0.5) + '"/>' + fl(fr(H.x0, H.z0, H.x1, H.z1, 0.5), "lo");
  f += TX(H.x0 + 1.4, H.z1 - 1.9, 1.3, "SHM-KX", ' fill="#1b1f22" font-weight="700"');
  const rows = [4.4, 7.2, 10, 12.8, 15.6];
  const left = ["L/R", "A/M", "1-N", "STOP", "N-1"];
  rows.forEach((t, i) => {
    const z = H.z1 - t;
    f += '<path fill="#f7f8f8" d="' + fr(-21.6, z - 0.95, -17.8, z + 0.95, 0.25) + '"/>' + fl(fr(-21.6, z - 0.95, -17.8, z + 0.95, 0.25), "lo") + TX(-19.7, z - 0.3, 0.7, left[i], ' text-anchor="middle" fill="#2b3135"');
    f += '<path fill="#d6dadd" d="' + circle(-16.2, z, 1, 16) + '"/>' + fl(circle(-16.2, z, 1, 16), "lo");
    f += '<path fill="#f7f8f8" d="' + fr(12.4, z - 0.95, 15.6, z + 0.95, 0.25) + '"/>' + fl(fr(12.4, z - 0.95, 15.6, z + 0.95, 0.25), "lo") + fl(`M15 ${n(-z)}H13.2M13.9 ${n(-z - 0.5)}L13.2 ${n(-z)}L13.9 ${n(-z + 0.5)}`, "mid", ' data-free="both"');
    f += '<path fill="#d6dadd" d="' + circle(17.3, z, 1, 16) + '"/>' + fl(circle(17.3, z, 1, 16), "lo");
  });
  const L = { x0: -13.6, x1: 10.4, z0: H.z1 - 15.6, z1: H.z1 - 3.4 };
  f += '<path fill="#2b3035" d="' + fr(L.x0 - 0.4, L.z0 - 0.4, L.x1 + 0.4, L.z1 + 0.4, 0.3) + '"/><path fill="#e6f0f5" d="' + fr(L.x0, L.z0, L.x1, L.z1, 0.2) + '"/>';
  f += TX(L.x0 + 0.6, L.z1 - 1.1, 0.75, "SHM-KX · T1", ' fill="#1b1f22"') + TX(L.x0 + 0.6, L.z1 - 2.3, 0.75, "Work mode: Remote manual", ' data-kx-mode fill="#3a4045"');
  f += TX((L.x0 + L.x1) / 2, L.z0 + 2.5, 6.4, "9", ' data-kx-tap class="dc-mono" text-anchor="middle" fill="#1a237e" font-weight="700"');
  f += '<path fill="#c8d6df" d="' + fr(L.x0, L.z0, L.x1, L.z0 + 1.5, 0.15) + '"/>' + TX((L.x0 + L.x1) / 2, L.z0 + 0.45, 0.6, "Main   Measure   Register   Event   Set", ' text-anchor="middle" fill="#3a4045"');
  f += TX(-1.6, H.z0 + 0.75, 0.55, "SHANGHAI HUAMING POWER EQUIPMENT CO.", ' text-anchor="middle" fill="#5b6268"');
  out.push(onFace(RACK_F + 1.8, f));
  return out.join("");
}

function spare(slot) {
  const cz = (slot.z0 + slot.z1) / 2;
  return unit("spare", slot, vents(-27, cz - 3, 16, 1.4, 6, 3.6), { handles: false });
}

function rails() {
  // vertical 19″ rails behind the panel ears, with three square holes per U
  let out = "";
  for (const x of [-50, 46.6]) {
    out += S(k.slabOf({ x, y: FRONT - CAVITY.depth, w: 3.4, d: CAVITY.depth - 2.4, r: 0.3 }, CAVITY.z0, CAVITY.z1 - CAVITY.z0, P, 2), { tone: "lo", crease: "none" });
    const holes = [];
    for (let u = 0; u < 20; u++) for (const o of [1.27, 4.445, 7.62]) holes.push(at([x + 1.7, FRONT - 2.4, CAVITY.z0 + 0.1 + u * 8.89 + o]));
    out += D(holes, { size: 0.35, tone: "lo" });
  }
  return out;
}

function rack() {
  const inside = [
    rails(),
    sysGroup("1", hmiet("s1", SLOTS.s1, { lit: true, unit: 0 })),
    sysGroup("2", hmiet("s2", SLOTS.s2, { lit: false, unit: 1 })),
    sysGroup("3", rcm("s3", SLOTS.s3, 0)),
    sysGroup("4", rcm("s4", SLOTS.s4, 1)),
    sysGroup("spare", spare(SLOTS.spare)),
    sysGroup("5", hmjk(SLOTS.s5)),
    sysGroup("6", shmkx(SLOTS.s6)),
  ].join("");
  return recess(CAVITY, FRONT, inside);
}

// Screen boxes of each system and the rack (for the page's zoom), in figure px.
function boxOf(x0, x1, z0, z1) {
  const pts = [[x0, RACK_F + 3, z0], [x1, RACK_F + 3, z0], [x0, RACK_F + 3, z1], [x1, RACK_F + 3, z1], [x0, RACK_F - 9, z1], [x1, RACK_F - 9, z0]].map(at);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((v) => Math.round(v * 10) / 10);
}
export const BOXES = {
  ...Object.fromEntries(Object.entries({ 1: "s1", 2: "s2", 3: "s3", 4: "s4", spare: "spare", 5: "s5", 6: "s6" }).map(([no, key]) => [no, boxOf(-50, 50, SLOTS[key].z0, SLOTS[key].z1)])),
  rack: boxOf(-60, 60, CAVITY.z0 - 2, ZW + 4),
};

// ---------- worktop, tray and keyboard ----------
function worktop() {
  const top = { x: -61.5, y: -51, w: 123, d: 103.5, r: 1.6 };
  const out = [S(k.slabOf(top, ZW, 3, P, 4, 0.8), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(top, 3.4), ZW + 3, P, 4), { tone: "faint" }));
  out.push(S(k.cylinder(-42, -36, 4.4, ZW + 3, 0.5, P, 28), { tone: "lo" }));
  out.push(`<path class="dc-well" d="${k.pathOf(k.circleRing(-42, -36, 3, 28).map(([x, y]) => at([x, y, ZW + 3.5])), true)}"/>`);
  out.push(L(k.ring(-42, -36, 3, ZW + 3.5, P, 28), { tone: "lo" }));
  return part("worktop", out.join(""));
}

function tray() {
  // tray pushed in: front lip with a finger pull in the fascia slot
  const out = [];
  out.push(S(k.slabOf({ x: TRAY.x, y: FRONT, w: TRAY.w, d: 1.6, r: 0.4 }, TRAY_Z - 1, 4.6, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -10, y: FRONT + 1.6, w: 20, d: 1.2, r: 0.6 }, TRAY_Z + 0.4, 1.8, P, 3, 0.3), { tone: "mid" }));
  return part("tray", out.join(""));
}

// ---------- upper frame and screen ----------
function upperBack() {
  const out = [];
  out.push(S(k.slabOf({ x: -57, y: -50, w: 114, d: 2.4, r: 0.4 }, ZW + 3, ZTOP - 4 - ZW - 3, P, 2), { tone: "lo" }));
  const holes = [];
  for (let x = -50; x <= 50; x += 5) for (let z = ZW + 10; z <= ZTOP - 10; z += 5) holes.push(at([x, -47.6, z]));
  out.push(D(holes, { size: 0.32, tone: "lo" }));
  for (const [x, y] of [[-60, -50], [57, -50]]) out.push(S(k.slabOf({ x, y, w: 3, d: 3, r: 0.4 }, ZW + 3, ZTOP - 4 - ZW - 3, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function monitor() {
  const out = [];
  const { x0, x1, y0, y1, z0, z1 } = MON;
  const foot = { x: -14, y: 6, w: 28, d: 18, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(foot, ZW + 3, 0.1, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(foot, ZW + 3, 1.6, P, 5, 0.5), { tone: "mid" }));
  out.push(D(k.corners(foot, 3).map(([x, y]) => at([x, y, ZW + 4.6])), { size: 0.4 }));
  out.push(S(k.cylinder(0, 16, 2.6, ZW + 4.6, 22, P, 24), { tone: "mid", crease: "none", inner: L(k.sideArc(0, 16, 2.6, ZW + 12, P, 16), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: -8, y: 18, w: 16, d: y0 - 18 - 2.4, r: 1 }, 300, 14, P, 3, 0.4), { tone: "mid" }));
  // tilt hinge between the stand head and the screen
  const H = G.frameOf([-6, y0 - 1.4, 307], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 12, 1.4, H, P), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 1.2 }, z0, z1 - z0, P, 4, 0.5), { tone: "mid" }));
  const SC = { x0: x0 + 2.6, x1: x1 - 2.6, z0: z0 + 4, z1: z1 - 2.6, r: 0.6, depth: 0.7 };
  out.push(recess(SC, y1, onFace(y1 - 0.7, screen(SC)), "dc-glass"));
  out.push(onFace(y1, `<path class="dc-led" data-on="1" d="${circle(x1 - 4, z0 + 2, 0.6, 12)}"/>` + fl([0, 1, 2, 3, 4].map((i) => circle(x1 - 8 - i * 2.4, z0 + 2, 0.55, 10)).join(""), "lo")));
  return part("screen", out.join(""));
}

// HMI in the screen plane: header, two transformer tiles, a tap trend (T1 solid, T2 dashed).
export const CHART = { x0: -12, x1: 41, z0: 286, z1: 324, lo: 1, hi: 17 };
function screen(SC) {
  const { x0, x1, z1 } = SC;
  let s = "";
  s += `<rect class="dc-hmi-bar" x="${x0}" y="${-z1}" width="${x1 - x0}" height="4.4"/>`;
  s += `<text class="dc-hmi-h" x="${x0 + 2}" y="${n(-z1 + 3.2)}">TAP CONTROL · T1 ∥ T2</text>`;
  s += `<text data-clock class="dc-hmi-h" x="${x1 - 2}" y="${n(-z1 + 3.2)}" text-anchor="end">LIVE</text>`;
  [["T1", "MASTER", 310], ["T2", "FOLLOWER", 289]].forEach(([t, role, z], i) => {
    s += `<rect class="dc-hmi-tile" x="${x0 + 2}" y="${-(z + 14)}" width="26" height="15" rx="1"/>`;
    s += `<text class="dc-hmi-s" x="${x0 + 4}" y="${-(z + 10.4)}">${t} · ${role}</text>`;
    s += `<text data-scr-tap="${i}" class="dc-hmi-big" x="${x0 + 4}" y="${-(z + 2)}">09</text>`;
    s += `<text data-hmi-ops="${i}" class="dc-hmi-s" x="${x0 + 26}" y="${-(z + 2.4)}" text-anchor="end">OPS 01247</text>`;
  });
  const { x0: cx0, x1: cx1, z0: cz0, z1: cz1, lo, hi } = CHART;
  const zOf = (v) => cz0 + ((v - lo) / (hi - lo)) * (cz1 - cz0);
  s += `<path class="dc-hmi-grid" d="M${cx0} ${-cz0}H${cx1}M${cx0} ${-cz1}H${cx1}M${cx0} ${-cz0}V${-cz1}M${cx1} ${-cz0}V${-cz1}"/>`;
  s += `<path class="dc-hmi-set" d="M${cx0} ${n(-zOf(9))}H${cx1}"/>`;
  s += `<text class="dc-hmi-s" x="${cx0 + 1}" y="${n(-cz1 + 2.6)}">17</text><text class="dc-hmi-s" x="${cx0 + 1}" y="${n(-zOf(9) - 0.8)}">09</text><text class="dc-hmi-s" x="${cx0 + 1}" y="${n(-cz0 - 0.8)}">01</text>`;
  s += `<polyline data-trend2 class="dc-hmi-trend2" points=""/>`;
  s += `<polyline data-trend class="dc-hmi-trend" points=""/>`;
  s += `<text data-hmi-motor class="dc-hmi-s" x="${cx1}" y="${n(-cz0 + 3.2)}" text-anchor="end">MOTOR 0.00 A</text>`;
  return s;
}

function upperFront() {
  const out = [];
  out.push(S(k.slabOf({ x: -60, y: 47, w: 3, d: 3, r: 0.4 }, ZW + 3, ZTOP - 4 - ZW - 3, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 57, y: 47, w: 3, d: 3, r: 0.4 }, ZW + 3, ZTOP - 4 - ZW - 3, P, 2, 0.3), { tone: "mid" }));
  // open top frame: four bars on the posts
  for (const bar of [{ x: -60, y: -50, w: 3, d: 100 }, { x: -60, y: -50, w: 120, d: 3 }, { x: 57, y: -50, w: 3, d: 100 }, { x: -60, y: 47, w: 120, d: 3 }])
    out.push(S(k.slabOf({ ...bar, r: 0.4 }, ZTOP - 4, 4, P, 2, 0.4), { tone: "mid" }));
  // corner plates on the top frame, two screws each
  for (const [x, y] of [[-60, -50], [52, -50], [-60, 42], [52, 42]]) {
    out.push(S(k.slabOf({ x, y, w: 8, d: 8, r: 0.6 }, ZTOP, 0.6, P, 2), { tone: "mid", crease: "none" }));
    out.push(D([at([x + (x < 0 ? 1.5 : 6.5), y + 4, ZTOP + 0.6]), at([x + 4, y + (y < 0 ? 1.5 : 6.5), ZTOP + 0.6])], { size: 0.4 }));
  }
  // angle brackets where the posts meet the worktop
  for (const [x, y] of [[-57, 47], [57, 47]]) out.push(S(k.slabOf({ x: x < 0 ? x : x - 5, y: y - 0.6, w: 5, d: 0.6, r: 0.1 }, ZW + 3, 5, P, 2), { tone: "mid", crease: "none" }));
  return part("frame", out.join(""));
}

const FIG_STYLE = '<style>.dc-lamp{fill:#5b6268;transition:fill .2s}.dc-lamp[data-on]{fill:var(--c)}</style>';
export function figureBody() {
  return [
    FIG_STYLE,
    backCastors(),
    body(),
    sideFace(),
    sideDetail(),
    cableDuct(),
    powerStrip(),
    pushHandle(),
    locker(),
    rack(),
    fascia(),
    worktop(),
    upperBack(),
    monitor(),
    upperFront(),
    tray(),
    part("castors", frontCastors()),
  ];
}

export function figure() {
  return k.figureSvg({
    className: "cab",
    width: WIDTH,
    height: HEIGHT,
    label:
      "An isometric drawing of a mobile AVR demo cabinet, 600 mm wide, 500 mm deep and 1700 mm tall on lockable castors. A screen sits in an open frame at the top above a keyboard tray. The 20U rack holds, from the bottom, two HMIET-I AVRs, their two remote control modules with switches and buttons, a spare panel, an HMJK-II OLTC monitor and an SHM-KX controller. A cable locker is at the bottom and a power strip and cable box run on the side.",
    body: figureBody(),
  });
}

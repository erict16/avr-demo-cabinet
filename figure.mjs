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
const TRAY = { x: -44, y: FRONT, w: 88, d: 40, r: 1.2 };
const TRAY_Z = 257;
const CAVITY = { x0: -50, x1: 50, z0: 54, z1: 232, r: 1.2, depth: 9 };
const RACK_F = FRONT - 1.6; // front of the rack units
const MON = { x0: -46, x1: 46, y0: 26, y1: 30, z0: 278, z1: 334 };
const PLUG = [70, -66];

// Rack slots, bottom to top, from the sketch (≈U in comments).
export const SLOTS = {
  s1: { z0: 54.4, z1: 89.4 }, // U1–4 grid source
  s2: { z0: 90, z1: 125 }, // U5–8 tap-changer simulator
  s3: { z0: 125.6, z1: 160.6 }, // U9–12 HMIET-I AVR, T1 master (native 19″ 4U)
  s4: { z0: 161.2, z1: 196.2 }, // U13–16 HMIET-I AVR, T2 follower
  s56: { z0: 196.8, z1: 223 }, // U17–19 two HMC-3C position indicators on a 3U plate
  brush: { z0: 223.4, z1: 231.8 }, // U20 brush-strip cable entry
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
  let face = "";
  for (let i = 0; i < 10; i++) face += fl(fr(-46 + i * 9.4, 238, -40.4 + i * 9.4, 241, 1), "lo");
  face += fl(fr(-46, 255.2, 46, 263.4, 1), "faint");
  return onFace(FRONT, face);
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

function source() {
  const s = SLOTS.s1;
  const kx = -30;
  const kz = (s.z0 + s.z1) / 2;
  let face = "";
  // knob scale: ring with ticks growing from it
  face += fl(circle(kx, kz, 8.2, 60), "faint");
  let minor = "";
  let major = "";
  for (let i = 0; i <= 24; i++) {
    const a = ((-135 + (i * 270) / 24) * Math.PI) / 180;
    const len = i % 6 === 0 ? 2 : 1.1;
    const seg = `M${n(kx + 8.2 * Math.sin(a))} ${n(-kz - 8.2 * Math.cos(a))}L${n(kx + (8.2 + len) * Math.sin(a))} ${n(-kz - (8.2 + len) * Math.cos(a))}`;
    if (i % 6 === 0) major += seg;
    else minor += seg;
  }
  face += fl(minor, "lo") + fl(major, "mid");
  // analogue meter: grid voltage in %
  const mz = s.z0 + 6;
  face += `<path class="dc-dial" d="${fr(-14, s.z0 + 4, 14, s.z1 - 4, 1.4)}"/>` + fl(fr(-14, s.z0 + 4, 14, s.z1 - 4, 1.4), "lo");
  let mt = "";
  let mM = "";
  for (let i = 0; i <= 20; i++) {
    const a = ((-50 + i * 5) * Math.PI) / 180;
    const r0 = 18;
    const len = i % 5 === 0 ? 2.2 : 1.2;
    const seg = `M${n(Math.sin(a) * r0)} ${n(-mz - Math.cos(a) * r0)}L${n(Math.sin(a) * (r0 + len))} ${n(-mz - Math.cos(a) * (r0 + len))}`;
    if (i % 5 === 0) mM += seg;
    else mt += seg;
  }
  const arc = Array.from({ length: 21 }, (_, i) => {
    const a = ((-50 + i * 5) * Math.PI) / 180;
    return `${i ? "L" : "M"}${n(Math.sin(a) * 18)} ${n(-mz - Math.cos(a) * 18)}`;
  }).join("");
  const mclip = `dc-meter-clip`;
  face += `<clipPath id="${mclip}"><path d="${fr(-14, s.z0 + 4, 14, s.z1 - 4, 1.4)}"/></clipPath><g clip-path="url(#${mclip})">`;
  face += fl(arc, "mid") + fl(mt, "lo") + fl(mM, "hi");
  face += `<path data-meter class="iso-line" data-tone="lit" data-free="end" style="stroke-width:.7" transform="rotate(0 0 ${-mz})" d="M0 ${-mz}L0 ${n(-mz - 19.6)}"/>`;
  face += `<path class="dc-hub" d="${circle(0, mz, 1.2, 16)}"/></g>`;
  face += `<text class="dc-scale" x="-12.4" y="${n(-(s.z0 + 5.2))}">GRID %</text>`;
  // switch, lamp, vents
  face += fl(fr(22, s.z1 - 12, 30, s.z1 - 5, 0.8), "lo");
  face += `<path class="dc-led" data-on="1" d="${circle(36, s.z1 - 8.5, 1.4, 16)}"/>`;
  face += vents(21, s.z0 + 5, 7);
  const out = [unit("s1", s, face)];
  // the grid knob: a turned knob standing proud of the panel
  const F = G.frameOf([kx, RACK_F, kz], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 0.8, 7.2, F, P), { tone: "mid" }));
  out.push(S(G.disc(0.8, 4.4, 6, F, P), { tone: "hi", lit: true, inner: k.fadedSvg(G.ribsOf(F, 0.8, 4.4, 6, 44, P, { fade: [0.04, 0.4] }), { tone: "lo" }) }));
  out.push(onFace(RACK_F + 4.4, `<g data-knob transform="rotate(0 ${kx} ${-kz})">${fl(`M${kx} ${-kz}L${kx} ${n(-kz - 4.6)}`, "lit", ` data-free="both" style="stroke-width:.9"`)}</g>`));
  return out.join("");
}

function tapSim() {
  const s = SLOTS.s2;
  const cx = -22;
  const cz = (s.z0 + s.z1) / 2;
  let face = "";
  face += fl(circle(cx, cz, 15.6, 72), "lo");
  face += `<path class="dc-dial" d="${circle(cx, cz, 14.4, 72)}"/>` + fl(circle(cx, cz, 14.4, 72), "mid");
  face += fl(circle(cx, cz, 11.4, 72), "faint");
  let minor = "";
  let major = "";
  let labels = "";
  for (let t = 1; t <= 17; t++) {
    const a = ((-135 + ((t - 1) * 270) / 16) * Math.PI) / 180;
    const len = t % 4 === 1 ? 2.4 : 1.3;
    const seg = `M${n(cx + 11.4 * Math.sin(a))} ${n(-cz - 11.4 * Math.cos(a))}L${n(cx + (11.4 + len) * Math.sin(a))} ${n(-cz - (11.4 + len) * Math.cos(a))}`;
    if (t % 4 === 1) {
      major += seg;
      labels += `<text class="dc-scale" x="${n(cx + 8.2 * Math.sin(a))}" y="${n(-cz - 8.2 * Math.cos(a) + 1)}" text-anchor="middle">${t}</text>`;
    } else minor += seg;
  }
  face += fl(minor, "lo") + fl(major, "hi") + labels;
  face += `<g data-tap-pointer transform="rotate(0 ${cx} ${-cz})">${fl(`M${cx} ${n(-cz + 2.4)}L${cx} ${n(-cz - 10.8)}`, "lit", ` data-free="both" style="stroke-width:1.1"`)}</g>`;
  face += `<path class="dc-hub" d="${circle(cx, cz, 1.6, 20)}"/>`;
  // operation counter
  face += `<path class="dc-lcd" d="${fr(4, s.z1 - 13, 30, s.z1 - 5, 0.8)}"/>` + fl(fr(4, s.z1 - 13, 30, s.z1 - 5, 0.8), "lo");
  face += `<text data-ops class="dc-digits" x="17" y="${n(-(s.z1 - 7.2))}" text-anchor="middle">01247</text>`;
  // raise / lower lamps as arrows
  face += `<path data-raise class="dc-led" d="M6 ${n(-(s.z0 + 17))}l3 -5l3 5z"/>`;
  face += `<path data-lower class="dc-led" d="M16 ${n(-(s.z0 + 17 - 5))}l3 5l3 -5z"/>`;
  // motor window with a turning rotor
  const mx = 37;
  const mz = s.z0 + 12;
  face += `<path class="dc-well" d="${circle(mx, mz, 6.2, 36)}"/>` + fl(circle(mx, mz, 6.2, 36), "lo");
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return `M${n(mx + 1.4 * Math.cos(a))} ${n(-mz + 1.4 * Math.sin(a))}L${n(mx + 5.4 * Math.cos(a))} ${n(-mz + 5.4 * Math.sin(a))}`;
  }).join("");
  face += `<g data-rotor transform="rotate(0 ${mx} ${-mz})">${fl(spokes, "mid")}${fl(circle(mx, mz, 1.4, 16), "mid")}${fl(circle(mx, mz, 5.4, 36), "faint")}</g>`;
  face += vents(4, s.z0 + 4, 5, 2, 6, 3.4);
  const out = [unit("s2", s, face)];
  // hand-crank socket
  const F = G.frameOf([24, RACK_F, s.z0 + 14], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 1.4, 3, F, P), { tone: "mid" }));
  out.push(onFace(RACK_F + 1.4, fl(circle(24, s.z0 + 14, 1.4, 16), "lo") + fl(`M22.9 ${-(s.z0 + 14)}h2.2`, "lo", ` data-free="both"`)));
  return out.join("");
}

// HMIET-I automatic voltage regulator, native 19″ 4U (drawing HMIET-I-E110).
// Front positions are mm from the panel's left and top edges, converted to figure units.
function hmiet(name, slot, { lit, role }) {
  const { z0, z1 } = slot;
  const X = (mm) => -48 + mm / 5;
  const Z = (mm) => z1 - mm / 5;
  const T = (x, z, size, body, extra = "") => '<text x="' + n(x) + '" y="' + n(-z) + '" font-size="' + size + '" font-family="Barlow,Arial,sans-serif"' + extra + ">" + body + "</text>";
  let f = '<path fill="#c9cdd0" d="' + fr(-48, z0, 48, z1, 0.5) + '"/>';
  f += T(X(462), Z(14), 1.45, "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR", ' text-anchor="end" fill="#2b3135" font-weight="600"');
  // status LEDs with labels
  const LEDS = [["Run", "#3fbf63", "run"], ["Fault", "#e0333c"], ["Remote", "#3fbf63"], ["Auto", "#3fbf63"], ["Parallel", "#3fbf63", "par"], ["U/I Block", "#e0333c"], ["Tap Block", "#e0333c"], ["AVR Failed", "#e0333c"], ["Regulating", "#e08a00", "reg"], ["Par.Block", "#e0333c"]];
  LEDS.forEach(([label, color, key], i) => {
    const z = Z(36 + i * 12.8);
    const on = key === "run" || key === "par" || label === "Remote" || label === "Auto";
    f += '<path fill="#3a4045" d="' + circle(X(36), z, 0.75, 12) + '"/>';
    f += '<path' + (key ? ' data-led="' + key + '"' : "") + ' class="dc-lamp"' + (on ? ' data-on="1"' : "") + ' style="--c:' + color + '" d="' + circle(X(36), z, 0.55, 12) + '"/>';
    f += T(X(42), z - 0.45, 1.25, label, ' fill="#2b3135"');
  });
  // LCD
  const L = { x0: X(115), x1: X(197), z0: Z(91), z1: Z(10) };
  f += '<path fill="#14181b" d="' + fr(L.x0 - 0.8, L.z0 - 0.8, L.x1 + 0.8, L.z1 + 0.8, 0.6) + '"/>';
  f += '<path fill="#0b1a20" d="' + fr(L.x0, L.z0, L.x1, L.z1, 0.3) + '"/>';
  const lx = (L.x0 + L.x1) / 2;
  f += T(L.x0 + 1, L.z1 - 2.2, 1.5, role, ' data-lcd2 fill="#7fe0ff"');
  f += T(lx, L.z0 + 5.2, 9, "09", ' data-avr-tap text-anchor="middle" fill="#eaf6ff" font-weight="700"');
  f += T(lx, L.z0 + 3, 1.3, "TAP", ' text-anchor="middle" fill="#7fe0ff"');
  f += T(L.x0 + 1, L.z1 - 4.4, 1.6, "11.00 kV", ' data-lcd1 fill="#eaf6ff"');
  f += '<rect fill="#ffffff26" x="' + n(L.x0 + 1) + '" y="' + n(-(L.z0 + 1.6)) + '" width="' + n(L.x1 - L.x0 - 2) + '" height=".7" rx=".35"/>';
  f += '<rect data-bar data-bar-max="' + n(L.x1 - L.x0 - 2) + '" fill="#e08a00" x="' + n(L.x0 + 1) + '" y="' + n(-(L.z0 + 1.6)) + '" width="0" height=".7" rx=".35"/>';
  // navigation keypad: diamond of arrows round OK, with ESC and RST
  const kx = X(331);
  const kz = Z(57.5);
  const key = (x, z, w, h, label, size = 1) => '<path fill="#e9ebec" d="' + fr(x - w / 2, z - h / 2, x + w / 2, z + h / 2, 0.5) + '"/>' + fl(fr(x - w / 2, z - h / 2, x + w / 2, z + h / 2, 0.5), "lo") + (label ? T(x, z - 0.4, size, label, ' text-anchor="middle" fill="#2b3135" font-weight="600"') : "");
  f += key(kx, kz + 3.6, 3, 2.6, "▲") + key(kx, kz - 3.6, 3, 2.6, "▼") + key(kx - 3.8, kz, 2.6, 3, "◀") + key(kx + 3.8, kz, 2.6, 3, "▶") + key(kx, kz, 2.8, 2.8, "OK", 0.95);
  f += key(kx + 9.6, kz + 2.2, 4.2, 2.6, "ESC", 1) + key(kx + 9.6, kz - 2.2, 4.2, 2.6, "RST", 1);
  // slotted ears (hole centres 465 apart, slots 6.5 wide, 101.6 apart)
  const cz = (z0 + z1) / 2;
  for (const ex of [X(8.9), X(473.9)]) for (const dz of [-10.16, 10.16]) f += '<path class="dc-well" d="' + fr(ex - 0.65, cz + dz - 1.3, ex + 0.65, cz + dz + 1.3, 0.65) + '"/>' + fl(fr(ex - 0.65, cz + dz - 1.3, ex + 0.65, cz + dz + 1.3, 0.65), "lo");
  return unit(name, slot, f, { lit, handles: false });
}

// Two HMC-3C tap position indicators (DIN 192 × 96 mm) on one 3U plate.
function hmcPair() {
  const s = SLOTS.s56;
  const cz = (s.z0 + s.z1) / 2;
  const out = [unit("s56", s, "", { handles: false })];
  const yH = RACK_F + 1;
  const T = (x, z, size, body, extra = "") => '<text x="' + n(x) + '" y="' + n(-z) + '" font-size="' + size + '" font-family="Barlow,Arial,sans-serif"' + extra + ">" + body + "</text>";
  [["s5", -22, "T1"], ["s6", 22, "T2"]].forEach(([name, cx, t]) => {
    const H = { x0: cx - 19.2, x1: cx + 19.2, z0: cz - 9.6, z1: cz + 9.6 };
    const g = [S(k.slabOf({ x: H.x0, y: RACK_F, w: H.x1 - H.x0, d: 1, r: 0.6 }, H.z0, H.z1 - H.z0, P, 3, 0.3), { tone: "mid" })];
    let f = '<path fill="#d9dcdc" d="' + fr(H.x0, H.z0, H.x1, H.z1, 0.6) + '"/>' + fl(fr(H.x0, H.z0, H.x1, H.z1, 0.6), "lo");
    f += '<path fill="none" stroke="#1b1f22" stroke-width=".25" d="' + circle(cx - 16.4, cz + 7, 1, 14) + '"/>';
    f += T(cx - 14.8, cz + 6.3, 2, "HMC-3C", ' fill="#1b1f22" font-weight="700"');
    f += T(cx - 17.4, cz + 3.6, 1.05, "有载分接开关位置指示器", ' fill="#3a4045"');
    f += T(cx - 17.4, cz + 2.2, 1.05, "LOAD TAP POSITION INDICATOR · " + t, ' fill="#3a4045"');
    f += '<path fill="#2a0707" d="' + fr(cx + 5, cz + 0.8, cx + 17, cz + 8.4, 0.4) + '"/>';
    f += '<text x="' + n(cx + 11) + '" y="' + n(-(cz + 1.8)) + '" text-anchor="middle" fill="#ff2a2a22" font-size="7" font-weight="700" font-family="\'JetBrains Mono\',monospace">88</text>';
    f += '<text data-tpi x="' + n(cx + 11) + '" y="' + n(-(cz + 1.8)) + '" text-anchor="middle" fill="#ff2a2a" font-size="7" font-weight="700" font-family="\'JetBrains Mono\',monospace">09</text>';
    [["TELECONTROL", "#3fbf63"], ["1-N", "#3fbf63"], ["STOP", "#3fbf63"], ["N-1", "#3fbf63"], ["POWER", "#e0333c"]].forEach(([label, color], i) => {
      const kx = cx - 15.6 + i * 7.6;
      f += '<path fill="' + color + '" d="' + fr(kx - 1.6, cz - 6.2, kx + 1.6, cz - 3, 0.3) + '"/>';
      f += T(kx, cz - 1.9, 0.95, label, ' text-anchor="middle" fill="#3a4045"');
    });
    g.push(onFace(yH, f));
    out.push(part(name, g.join("")));
  });
  return out.join("");
}

function brushPanel() {
  const s = SLOTS.brush;
  const mid = (s.z0 + s.z1) / 2;
  const face = '<path class="dc-well" d="' + fr(-40, s.z0 + 2.4, 40, s.z1 - 2.4, 1.2) + '"/>' + fl(fr(-40, s.z0 + 2.4, 40, s.z1 - 2.4, 1.2), "lo") + fl("M-39 " + n(-mid) + "H39", "mid", ' data-free="both"');
  return unit("brush", s, face, { handles: false });
}

function rails() {
  // vertical 19″ rails behind the panel ears, with one hole per U
  let out = "";
  for (const x of [-50, 46.6]) {
    out += S(k.slabOf({ x, y: FRONT - CAVITY.depth, w: 3.4, d: CAVITY.depth - 2.4, r: 0.3 }, CAVITY.z0, CAVITY.z1 - CAVITY.z0, P, 2), { tone: "lo", crease: "none" });
    const holes = [];
    // EIA-310 pattern: three square holes per U (44.45 mm = 8.89 units)
    for (let u = 0; u < 20; u++) for (const o of [1.27, 4.445, 7.62]) holes.push(at([x + 1.7, FRONT - 2.4, CAVITY.z0 + 0.6 + u * 8.89 + o]));
    out += D(holes, { size: 0.35, tone: "lo" });
  }
  return out;
}

function rack() {
  const inside = [
    rails(),
    source(),
    tapSim(),
    hmiet("s3", SLOTS.s3, { lit: true, role: "T1 · MASTER · AUTO" }),
    hmiet("s4", SLOTS.s4, { lit: false, role: "T2 · FOLLOWER" }),
    hmcPair(),
    brushPanel(),
  ].join("");
  return recess(CAVITY, FRONT, inside);
}

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
  const out = [];
  // two-stage ball-bearing slides under each side
  for (const x of [TRAY.x + 1.4, TRAY.x + TRAY.w - 3.6]) {
    out.push(S(k.slabOf({ x, y: FRONT, w: 2.2, d: 24, r: 0.2 }, TRAY_Z - 2.4, 1.2, P, 2), { tone: "lo", crease: "none" }));
    out.push(S(k.slabOf({ x: x + 0.3, y: FRONT, w: 1.6, d: TRAY.d - 3, r: 0.2 }, TRAY_Z - 1.2, 1.2, P, 2), { tone: "mid", crease: "none" }));
    out.push(D([at([x + 2.2, FRONT + 6, TRAY_Z - 1.8]), at([x + 2.2, FRONT + 18, TRAY_Z - 1.8])], { size: 0.32 }));
  }
  out.push(S(k.slabOf(TRAY, TRAY_Z, 2, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TRAY.x, y: FRONT + TRAY.d - 2, w: TRAY.w, d: 2, r: 0.6 }, TRAY_Z + 2, 1.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -10, y: FRONT + TRAY.d - 1.4, w: 20, d: 1.8, r: 0.8 }, TRAY_Z + 0.4, 2.2, P, 3, 0.3), { tone: "mid" }));
  const KB = { x: -34, y: FRONT + 7, w: 62, d: 22, r: 1.2 };
  out.push(S(k.slabOf(KB, TRAY_Z + 2, 1.6, P, 3, 0.4), { tone: "mid" }));
  const keys = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) keys.push(k.planOutline({ x: KB.x + 2 + c * 4.2, y: KB.y + 2 + r * 3.8, w: 3.4, d: 3, r: 0.5 }, TRAY_Z + 3.6, P, 2));
  out.push(L(keys.join(""), { tone: "lo" }));
  const MOUSE = { x: 32, y: FRONT + 14, w: 6, d: 9, r: 2.8 };
  out.push(S(k.slabOf(MOUSE, TRAY_Z + 2, 2, P, 6, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([35, FRONT + 14], [35, FRONT + 17.6], TRAY_Z + 4, P), { tone: "faint" }));
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

// HMI in the screen plane: header, two transformer tiles, a voltage trend.
export const CHART = { x0: -12, x1: 41, z0: 286, z1: 324, lo: 10.6, hi: 11.4 };
function screen(SC) {
  const { x0, x1, z0, z1 } = SC;
  let s = "";
  s += `<rect class="dc-hmi-bar" x="${x0}" y="${-z1}" width="${x1 - x0}" height="4.4"/>`;
  s += `<text class="dc-hmi-h" x="${x0 + 2}" y="${n(-z1 + 3.2)}">VOLTAGE CONTROL · T1 ∥ T2</text>`;
  s += `<text data-clock class="dc-hmi-h" x="${x1 - 2}" y="${n(-z1 + 3.2)}" text-anchor="end">LIVE</text>`;
  [["T1", "MASTER", 310], ["T2", "FOLLOWER", 289]].forEach(([t, role, z], i) => {
    s += `<rect class="dc-hmi-tile" x="${x0 + 2}" y="${-(z + 14)}" width="26" height="15" rx="1"/>`;
    s += `<text class="dc-hmi-s" x="${x0 + 4}" y="${-(z + 10.4)}">${t} · ${role}</text>`;
    s += `<text data-hmi-tap="${i}" class="dc-hmi-big" x="${x0 + 4}" y="${-(z + 2)}">09</text>`;
    s += `<text data-hmi-kv="${i}" class="dc-hmi-s" x="${x0 + 26}" y="${-(z + 2.4)}" text-anchor="end">11.00 kV</text>`;
  });
  const { x0: cx0, x1: cx1, z0: cz0, z1: cz1, lo, hi } = CHART;
  const zOf = (v) => cz0 + ((v - lo) / (hi - lo)) * (cz1 - cz0);
  s += `<rect class="dc-hmi-band" x="${cx0}" y="${n(-zOf(11.11))}" width="${cx1 - cx0}" height="${n(zOf(11.11) - zOf(10.89))}"/>`;
  s += `<path class="dc-hmi-grid" d="M${cx0} ${-cz0}H${cx1}M${cx0} ${-cz1}H${cx1}M${cx0} ${-cz0}V${-cz1}M${cx1} ${-cz0}V${-cz1}"/>`;
  s += `<path class="dc-hmi-set" d="M${cx0} ${n(-zOf(11))}H${cx1}"/>`;
  s += `<text class="dc-hmi-s" x="${cx0 + 1}" y="${n(-zOf(11.11) - 0.8)}">+1 %</text><text class="dc-hmi-s" x="${cx0 + 1}" y="${n(-zOf(10.89) + 2.6)}">−1 %</text>`;
  s += `<polyline data-trend class="dc-hmi-trend" points=""/>`;
  s += `<text data-hmi-grid class="dc-hmi-s" x="${cx1}" y="${n(-cz0 + 3.2)}" text-anchor="end">GRID 100.0 %</text>`;
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
    width: WIDTH,
    height: HEIGHT,
    label:
      "An isometric drawing of a mobile AVR demo cabinet, 600 mm wide, 500 mm deep and 1700 mm tall on lockable castors. A monitor sits in an open frame at the top above a pull-out keyboard tray. The rack below holds a grid source with a knob, a tap-changer simulator with a position dial, a master and a follower AVR, a spare slot and two tap displays. A cable locker is at the bottom and a 13 A power strip and cable duct run on the side.",
    body: figureBody(),
  });
}

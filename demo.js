// Live demo on the cabinet front, rev C. The remote control modules drive the AVRs:
// S1 (1-N) raises, S2 (N-1) lowers, S3 stops. They work with SA1 on Remote and SA2 on Manual.
// SA3 on Parallel (both modules): T1 is master and T2 follows one step later.
// The AVR LCDs, the HMJK-II, the SHM-KX and the screen show the taps.
const M = { STEP: 1.6, FOLLOW: 0.6, MIN: 1, MAX: 17, PEAK: 2.6, RUN: 1.4 };
const svg = document.querySelector("svg.cab");
const CH = JSON.parse(svg.closest("[data-chart]").dataset.chart);
const q = (s) => svg.querySelector(s);
const qa = (s) => [...svg.querySelectorAll(s)];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const statusEl = document.querySelector("[data-status]");
const readout = document.querySelectorAll("[data-tap-out]");

const SW_POS = { SA1: ["REMOTE", "LOCAL"], SA2: ["AUTO", "MANUAL"], SA3: ["PARALLEL", "INDEPENDENT"] };
const S = {
  tap: [9, 9],
  ops: [1247, 1183],
  sw: [{ SA1: 0, SA2: 1, SA3: 0 }, { SA1: 0, SA2: 1, SA3: 0 }],
  move: null, // { unit, dir, t }
  pending: null, // follower step { dir, at }
  stopped: false,
};
const pad = (t) => String(t).padStart(2, "0");
const ops5 = (n) => String(n).padStart(5, "0");
const parallel = () => S.sw[0].SA3 === 0 && S.sw[1].SA3 === 0;
const busy = () => S.move || S.pending;
const text = (el, t) => el && el.textContent !== t && (el.textContent = t);
const on = (el, yes) => el && (yes ? el.setAttribute("data-on", "1") : el.removeAttribute("data-on"));

let noteTimer = 0;
function say(msg, keep = false) {
  clearTimeout(noteTimer);
  statusEl.textContent = msg;
  statusEl.toggleAttribute("data-warn", /Turn|Wait|limit|follows/.test(msg));
  if (!keep) noteTimer = setTimeout(() => (statusEl.textContent = ""), 5000);
}

function press(unit, id) {
  const t = `T${unit + 1}`;
  if (id === "S3") {
    if (busy()) {
      S.pending = null;
      S.stopped = true;
      say(`${t} stop: the running step finishes, then nothing more.`);
    } else say(`${t} stop.`);
    return draw();
  }
  const dir = id === "S1" ? 1 : -1;
  const sw = S.sw[unit];
  if (sw.SA1 === 1) return say(`${t}: SA1 is on Local. Turn it to Remote.`);
  if (sw.SA2 === 0) return say(`${t}: SA2 is on Auto. Turn it to Manual.`);
  if (parallel() && unit === 1) return say("T2 follows T1 in parallel. Use T1, or turn both SA3 to Independent.");
  if (busy()) return say("Wait for the step to finish.");
  const next = S.tap[unit] + dir;
  if (next < M.MIN || next > M.MAX) return say(`${t} is at the ${dir > 0 ? "top" : "bottom"} tap limit.`);
  S.stopped = false;
  if (still.matches) {
    finish(unit, dir);
    if (parallel() && unit === 0) finish(1, dir);
    say(`${t} ${dir > 0 ? "raised" : "lowered"} to tap ${pad(S.tap[unit])}.`);
    return draw();
  }
  S.move = { unit, dir, t: 0 };
  say(`${t} ${dir > 0 ? "raising" : "lowering"}…`, true);
  if (!visible) run();
}
function finish(unit, dir) {
  S.tap[unit] += dir;
  S.ops[unit] += 1;
}
function turn(unit, id) {
  if (busy()) return say("Wait for the step to finish.");
  S.sw[unit][id] ^= 1;
  say(`T${unit + 1} ${id}: ${SW_POS[id][S.sw[unit][id]]}.`);
  draw();
}

function step(dt) {
  if (S.move) {
    S.move.t += dt / M.STEP;
    if (S.move.t >= 1) {
      const { unit, dir } = S.move;
      finish(unit, dir);
      S.move = null;
      if (unit === 0 && parallel() && !S.stopped) S.pending = { dir, at: M.FOLLOW };
      else say(`T${unit + 1} at tap ${pad(S.tap[unit])}.`);
    }
  } else if (S.pending) {
    S.pending.at -= dt;
    if (S.pending.at <= 0) {
      S.move = { unit: 1, dir: S.pending.dir, t: 0 };
      S.pending = null;
      say("T2 following…", true);
    }
  }
}
const amps = (t) => (t < 0.08 ? M.PEAK * (t / 0.08) : t < 0.25 ? M.PEAK - (M.PEAK - M.RUN) * ((t - 0.08) / 0.17) : t < 0.95 ? M.RUN : M.RUN * ((1 - t) / 0.05));

const els = {
  avrTap: [0, 1].map((u) => q(`[data-avr-tap="${u}"]`)),
  avrMode: [0, 1].map((u) => q(`[data-avr-mode="${u}"]`)),
  avrRole: [0, 1].map((u) => q(`[data-avr-role="${u}"]`)),
  led: (u, name) => q(`[data-led="${name}"][data-unit="${u}"]`),
  sw: qa("[data-sw]"),
  hmjkTap: q("[data-hmjk-tap]"),
  hmjkOps: q("[data-hmjk-ops]"),
  hmjkI: q("[data-hmjk-i]"),
  hmjkMotor: q("[data-hmjk-motor]"),
  kxTap: q("[data-kx-tap]"),
  kxMode: q("[data-kx-mode]"),
  scr: [0, 1].map((u) => q(`[data-scr-tap="${u}"]`)),
  hmiOps: [0, 1].map((u) => q(`[data-hmi-ops="${u}"]`)),
  hmiMotor: q("[data-hmi-motor]"),
  trend: q("[data-trend]"),
  trend2: q("[data-trend2]"),
};

function draw() {
  const par = parallel();
  [0, 1].forEach((u) => {
    const sw = S.sw[u];
    const moving = S.move && S.move.unit === u;
    text(els.avrTap[u], pad(S.tap[u]));
    text(els.avrMode[u], moving ? (S.move.dir > 0 ? "RAISE ▲" : "LOWER ▼") : `${sw.SA2 ? "MANUAL" : "AUTO"} · ${sw.SA1 ? "LOCAL" : "REMOTE"}`);
    text(els.avrRole[u], par ? (u ? "T2 FOLLOWER" : "T1 MASTER") : `T${u + 1} INDEPENDENT`);
    on(els.led(u, "Run"), true);
    on(els.led(u, "Remote"), sw.SA1 === 0);
    on(els.led(u, "Auto"), sw.SA2 === 0);
    on(els.led(u, "Parallel"), par);
    on(els.led(u, "Regulating"), moving);
    text(els.scr[u], pad(S.tap[u]));
  });
  for (const g of els.sw) {
    const u = +g.dataset.unit, id = g.dataset.sw, pos = S.sw[u][id];
    if (g.dataset.pos !== String(pos)) {
      g.dataset.pos = pos;
      g.setAttribute("aria-label", `${id} T${u + 1}: ${SW_POS[id][pos]}`);
      on(svg.querySelector(`[data-sw-l="${id}-${u}-${pos}"]`), true);
      on(svg.querySelector(`[data-sw-l="${id}-${u}-${1 - pos}"]`), false);
    }
  }
  const t1 = S.move && S.move.unit === 0;
  text(els.hmjkTap, pad(S.tap[0]));
  text(els.hmjkOps, `OPS ${ops5(S.ops[0])}`);
  text(els.hmjkI, `${(t1 ? amps(S.move.t) : 0).toFixed(2)} A`);
  text(els.hmjkMotor, t1 ? "MOTOR RUN" : "MOTOR IDLE");
  text(els.kxTap, String(S.tap[0]));
  text(els.kxMode, `Work mode: ${S.sw[0].SA1 ? "Local" : "Remote"} ${S.sw[0].SA2 ? "manual" : "auto"}`);
  readout.forEach((el, i) => text(el, pad(S.tap[i])));
  els.hmiOps.forEach((el, i) => text(el, `OPS ${ops5(S.ops[i])}`));
  text(els.hmiMotor, `MOTOR T1 ${(t1 ? amps(S.move.t) : 0).toFixed(2)} A`);
  trendLine(els.trend, 0);
  trendLine(els.trend2, 1);
}
// tap trend on the screen: T1 solid, T2 dashed, the last 140 samples
const shown = (u) => S.tap[u] + (S.move && S.move.unit === u ? S.move.dir * (S.move.t * S.move.t * (3 - 2 * S.move.t)) : 0);
const trendLog = [];
let sampleAt = 0;
function sample(dt) {
  sampleAt += dt;
  if (sampleAt < 0.12 && trendLog.length) return;
  sampleAt = 0;
  trendLog.push([shown(0), shown(1)]);
  if (trendLog.length > 140) trendLog.shift();
}
function trendLine(el, i) {
  if (!el || trendLog.length < 2) return;
  const { x0, x1, z0, z1, lo, hi } = CH;
  el.setAttribute("points", trendLog.map((h, j) => {
    const x = x1 - ((trendLog.length - 1 - j) / 139) * (x1 - x0);
    const z = z0 + ((h[i] - lo) / (hi - lo)) * (z1 - z0);
    return `${x.toFixed(1)},${(-z).toFixed(1)}`;
  }).join(" "));
}

let frame = 0, last = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  step(dt);
  sample(dt);
  draw();
  frame = visible || busy() ? requestAnimationFrame(tick) : 0;
}
let visible = false;
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting && !still.matches;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(svg);
function run() {
  if (!frame && (visible || busy())) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}

const act = (el) => {
  const u = +el.dataset.unit;
  if (el.dataset.btn) press(u, el.dataset.btn);
  else if (el.dataset.sw) turn(u, el.dataset.sw);
};
svg.addEventListener("click", (e) => {
  const el = e.target.closest("[data-btn],[data-sw]");
  if (el) act(el);
});
svg.addEventListener("keydown", (e) => {
  const el = e.target.closest("[data-btn],[data-sw]");
  if (el && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    act(el);
  }
});
document.querySelectorAll("[data-press]").forEach((b) => b.addEventListener("click", () => press(0, b.dataset.press)));
window.dcPress = press;
window.dcTurn = turn;
window.dcState = S;
draw();

// Live model: a grid source, a master AVR with a dead band and time delay,
// a tap changer that steps 1.25 % per tap, and a follower that copies it.
const M = { SET: 11.0, BAND: 1.0, DELAY: 2.4, STEP: 1.25, MOTOR: 1.3, FOLLOW: 0.6, MIN: 1, MAX: 17, NOM: 9 };
const GRID = { lo: 94, hi: 106 };
const TOUR = [100, 96.6, 96.6, 100, 103.4, 103.4];
const STAGE_S = 9;

const stage = document.querySelector(".dc-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const qa = (s) => [...svg.querySelectorAll(s)];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const spin = (el) => {
  const m = /rotate\([^ ]+ ([^ ]+) ([^ )]+)\)/.exec(el.getAttribute("transform"));
  const cx = m[1];
  const cy = m[2];
  return (deg) => el.setAttribute("transform", `rotate(${deg.toFixed(2)} ${cx} ${cy})`);
};
const knob = spin(q("[data-knob]"));
const meter = spin(q("[data-meter]"));
const pointer = spin(q("[data-tap-pointer]"));
const rotor = spin(q("[data-rotor]"));
const ops = q("[data-ops]");
const raiseLed = q("[data-raise]");
const lowerLed = q("[data-lower]");
const units = ["s3", "s4"].map((name) => {
  const g = q(`[data-part="${name}"]`);
  return { lcd1: g.querySelector("[data-lcd1]"), tap: g.querySelector("[data-avr-tap]"), bar: g.querySelector("[data-bar]"), led: (k) => g.querySelector(`[data-led="${k}"]`) };
});
const tpis = qa("[data-tpi]");
const hmiTap = qa("[data-hmi-tap]");
const hmiKv = qa("[data-hmi-kv]");
const hmiGrid = q("[data-hmi-grid]");
const trend = q("[data-trend]");
const CH = JSON.parse(stage.dataset.chart);

const on = (el, yes) => el && (yes ? el.setAttribute("data-on", "1") : el.removeAttribute("data-on"));
const text = (el, t) => {
  if (el.textContent !== t) el.textContent = t;
};
const pad = (t) => String(t).padStart(2, "0");

const S = {
  grid: 100,
  target: 100,
  tap: [M.NOM, M.NOM],
  timer: 0,
  move: null, // { who, dir, t }
  pending: null, // follower step waiting { dir, at }
  ops: 1247,
  history: [],
  sample: 0,
  phase: "steady",
};

const lvOf = (tap) => M.SET * (S.grid / 100) * (1 + ((tap - M.NOM) * M.STEP) / 100);
const devOf = (v) => ((v - M.SET) / M.SET) * 100;

function step(dt) {
  S.grid += (S.target - S.grid) * (1 - Math.exp(-dt / 0.7));
  if (Math.abs(S.target - S.grid) < 0.005) S.grid = S.target;
  const v = lvOf(S.tap[0]);
  const dev = devOf(v);
  const out = Math.abs(dev) > M.BAND;
  if (S.move) {
    S.move.t += dt / M.MOTOR;
    if (S.move.t >= 1) {
      const { who, dir } = S.move;
      S.tap[who] += dir;
      S.ops += who === 0 ? 1 : 0;
      S.move = null;
      if (who === 0) S.pending = { dir, at: M.FOLLOW };
    }
  } else if (S.pending) {
    S.pending.at -= dt;
    if (S.pending.at <= 0) {
      S.move = { who: 1, dir: S.pending.dir, t: 0 };
      S.pending = null;
    }
  } else if (out) {
    S.timer += dt;
    const dir = dev < 0 ? 1 : -1;
    const room = dir > 0 ? S.tap[0] < M.MAX : S.tap[0] > M.MIN;
    if (S.timer >= M.DELAY && room) {
      S.move = { who: 0, dir, t: 0 };
      S.timer = 0;
    }
  } else {
    S.timer = Math.max(0, S.timer - dt * 2);
  }
  S.phase = S.move ? (S.move.who === 0 ? "tap" : "follow") : S.pending ? "follow" : out ? (S.timer > 0.15 ? "timing" : "drift") : "steady";
  S.sample += dt;
  if (S.sample >= 0.12) {
    S.sample = 0;
    S.history.push(v);
    if (S.history.length > 140) S.history.shift();
  }
}

const ease = (t) => t * t * (3 - 2 * t);
let lastVT = "";
function draw() {
  const v = lvOf(S.tap[0]);
  const dev = devOf(v);
  const v2 = lvOf(S.tap[1]);
  knob(((S.grid - 100) / 6) * 135);
  meter(((S.grid - 100) / 10) * 50);
  const shown = S.tap[0] + (S.move && S.move.who === 0 ? S.move.dir * (still.matches ? 1 : ease(S.move.t)) : 0);
  pointer(-135 + ((shown - 1) * 270) / 16);
  const running = S.move && S.move.who === 0;
  if (running && !still.matches) rotor(S.move.t * 720 * S.move.dir);
  on(raiseLed, S.move && S.move.dir > 0);
  on(lowerLed, S.move && S.move.dir < 0);
  text(ops, String(S.ops).padStart(5, "0"));
  [v, v2].forEach((kv, i) => {
    const u = units[i];
    text(u.lcd1, `${kv.toFixed(2)} kV`);
    const moving = S.move && S.move.who === i;
    on(u.led("reg"), moving);
    if (u.tap) text(u.tap, pad(S.tap[i]));
    const barMax = Number(u.bar.dataset.barMax || 16);
    u.bar.setAttribute("width", i === 0 ? ((Math.min(S.timer, M.DELAY) / M.DELAY) * barMax).toFixed(2) : "0");
    text(tpis[i], pad(S.tap[i]));
    text(hmiTap[i], pad(S.tap[i]));
    text(hmiKv[i], `${kv.toFixed(2)} kV`);
  });
  text(hmiGrid, `GRID ${S.grid.toFixed(1)} %`);
  const { x0, x1, z0, z1, lo, hi } = CH;
  const n = S.history.length;
  if (n > 1) {
    const pts = S.history.map((kv, i) => {
      const x = x1 - ((n - 1 - i) / 139) * (x1 - x0);
      const z = z0 + ((Math.min(hi, Math.max(lo, kv)) - lo) / (hi - lo)) * (z1 - z0);
      return `${x.toFixed(1)},${(-z).toFixed(1)}`;
    });
    trend.setAttribute("points", pts.join(" "));
  }
  const band = Math.abs(dev) <= M.BAND ? "in band" : dev < 0 ? "below band" : "above band";
  text(readout, `tap ${pad(S.tap[0])} · ${v.toFixed(2)} kV`);
  const vt = `${S.target.toFixed(1)} %, tap ${pad(S.tap[0])}, ${band}`;
  if (vt !== lastVT) { lastVT = vt; stage.setAttribute("aria-valuenow", S.target.toFixed(1)); stage.setAttribute("aria-valuetext", vt); }
  document.dispatchEvent(new CustomEvent("avr", { detail: { phase: S.phase, grid: S.grid, target: S.target, touring, tap: S.tap[0], tap2: S.tap[1], kv: v, dev, timer: S.timer, delay: M.DELAY } }));
}

let frame = 0;
let last = 0;
let clock = 0;
let touring = !still.matches;
let visible = false;
still.addEventListener("change", () => { if (still.matches) touring = false; });
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    S.target = TOUR[Math.floor(clock / STAGE_S) % TOUR.length];
  }
  step(dt);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};
const steer = (pct) => {
  touring = false;
  S.target = Math.round(Math.min(GRID.hi, Math.max(GRID.lo, pct)) * 10) / 10;
  if (still.matches) S.grid = S.target;
  run();
};
window.dcSteer = steer;
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "160px 0px" }).observe(stage);
// Press or tap steers; a mostly sideways drag keeps steering; vertical swipes still scroll.
const steerAt = (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
  steer(GRID.lo + share * (GRID.hi - GRID.lo));
};
stage.style.touchAction = "pan-y";
let press = null;
stage.addEventListener("pointerdown", (e) => {
  press = { x: e.clientX, y: e.clientY, drag: false };
  if (e.pointerType === "mouse") { stage.setPointerCapture(e.pointerId); steerAt(e); }
});
stage.addEventListener("pointermove", (e) => {
  if (!press || !e.buttons) return;
  const dx = e.clientX - press.x;
  const dy = e.clientY - press.y;
  if (!press.drag && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5) press.drag = true;
  if (press.drag || e.pointerType === "mouse") steerAt(e);
});
stage.addEventListener("pointerup", (e) => {
  if (press && !press.drag && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10) steerAt(e);
  press = null;
});
stage.addEventListener("pointercancel", () => { press = null; });
stage.addEventListener("keydown", (event) => {
  const d = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[event.key];
  if (event.key === "Home") steer(100);
  else if (event.key === "End") steer(GRID.hi);
  else if (event.key === "PageUp") steer(S.target + 2);
  else if (event.key === "PageDown") steer(S.target - 2);
  else if (d) steer(S.target + d);
  else return;
  event.preventDefault();
});
draw();

// Highlight a part from the page.
window.dcFocus = (name) => {
  svg.classList.toggle("dc-dim", Boolean(name));
  qa("[data-part]").forEach((g) => g.toggleAttribute("data-focus", g.dataset.part === name || (name === "s56" && (g.dataset.part === "s5" || g.dataset.part === "s6"))));
};

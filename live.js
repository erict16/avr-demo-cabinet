// Live model, rev B (no grid source): the T1 master AVR is in manual. RAISE or LOWER runs the
// T1 motor drive one step; the T2 follower copies it; the HMC-3C indicators and both HMJK-II
// monitors show the new tap, the operation count and the motor current.
const M = { MOTOR: 1.6, FOLLOW: 0.6, MIN: 1, MAX: 17, NOM: 9, PEAK: 2.6, RUN: 1.4 };
const TOUR = [1, 1, -1, -1, -1, -1, 1, 1];
const TOUR_S = 3.2;

const stage = document.querySelector(".dc-stage");
const svg = stage.querySelector("svg");
const q = (s) => svg.querySelector(s);
const qa = (s) => [...svg.querySelectorAll(s)];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const spin = (el) => {
  const m = /rotate\([^ ]+ ([^ ]+) ([^ )]+)\)/.exec(el.getAttribute("transform"));
  return (deg) => el.setAttribute("transform", `rotate(${deg.toFixed(2)} ${m[1]} ${m[2]})`);
};
const pointer = spin(q("[data-tap-pointer]"));
const rotor = spin(q("[data-rotor]"));
const ops = q("[data-ops]");
const raiseLed = q("[data-raise]");
const lowerLed = q("[data-lower]");
const units = ["s3", "s4"].map((name) => {
  const g = q(`[data-part="${name}"]`);
  return { lcd1: g.querySelector("[data-lcd1]"), tap: g.querySelector("[data-avr-tap]"), bar: g.querySelector("[data-bar]"), led: (k) => g.querySelector(`[data-led="${k}"]`) };
});
const monitors = [0, 1].map((i) => {
  const g = q(`[data-hmjk="${i}"]`);
  return { tap: g.querySelector("[data-hmjk-tap]"), ops: g.querySelector("[data-hmjk-ops]"), amps: g.querySelector("[data-hmjk-i]"), motor: g.querySelector('[data-hmjk-led="motor"]') };
});
const tpis = qa("[data-tpi]");
const hmiTap = qa("[data-hmi-tap]");
const hmiOps = qa("[data-hmi-ops]");
const hmiMotor = q("[data-hmi-motor]");
const trend = q("[data-trend]");
const trend2 = q("[data-trend2]");
const CH = JSON.parse(stage.dataset.chart);

const on = (el, yes) => el && (yes ? el.setAttribute("data-on", "1") : el.removeAttribute("data-on"));
const text = (el, t) => {
  if (el && el.textContent !== t) el.textContent = t;
};
const pad = (t) => String(t).padStart(2, "0");
const ops5 = (n) => String(n).padStart(5, "0");

const S = {
  tap: [M.NOM, M.NOM],
  ops: [1247, 1247],
  move: null, // { who, dir, t }
  pending: null, // follower step waiting { dir, at }
  history: [],
  sample: 0,
  phase: "steady",
  note: "",
  queued: null,
};

// motor current during a step: inrush, then running current, then off
const ampsAt = (t) => (t < 0.08 ? M.PEAK * (t / 0.08) : t < 0.25 ? M.PEAK - (M.PEAK - M.RUN) * ((t - 0.08) / 0.17) : t < 0.95 ? M.RUN : M.RUN * ((1 - t) / 0.05));

function command(dir) {
  if (S.move || S.pending) {
    S.queued = dir; // one press waits for the current step to finish
    return true;
  }
  const next = S.tap[0] + dir;
  if (next < M.MIN || next > M.MAX) {
    S.note = dir > 0 ? "top" : "bottom";
    return false;
  }
  S.note = "";
  S.move = { who: 0, dir, t: 0 };
  return true;
}

function step(dt) {
  if (S.move) {
    S.move.t += dt / M.MOTOR;
    if (S.move.t >= 1) {
      const { who, dir } = S.move;
      S.tap[who] += dir;
      S.ops[who] += 1;
      S.move = null;
      if (who === 0) S.pending = { dir, at: M.FOLLOW };
    }
  } else if (S.pending) {
    S.pending.at -= dt;
    if (S.pending.at <= 0) {
      S.move = { who: 1, dir: S.pending.dir, t: 0 };
      S.pending = null;
    }
  }
  if (!S.move && !S.pending && S.queued) {
    const dir = S.queued;
    S.queued = null;
    command(dir);
  }
  S.phase = S.move ? (S.move.who === 0 ? "tap" : "follow") : S.pending ? "follow" : S.note ? "limit" : "steady";
  S.sample += dt;
  if (S.sample >= 0.12) {
    S.sample = 0;
    S.history.push([shownTap(0), shownTap(1)]);
    if (S.history.length > 140) S.history.shift();
  }
}

const ease = (t) => t * t * (3 - 2 * t);
const shownTap = (i) => S.tap[i] + (S.move && S.move.who === i ? S.move.dir * (still.matches ? 1 : ease(S.move.t)) : 0);

function line(el, k) {
  const { x0, x1, z0, z1, lo, hi } = CH;
  const n = S.history.length;
  if (n < 2) return;
  el.setAttribute("points", S.history.map((h, i) => {
    const x = x1 - ((n - 1 - i) / 139) * (x1 - x0);
    const z = z0 + ((h[k] - lo) / (hi - lo)) * (z1 - z0);
    return `${x.toFixed(1)},${(-z).toFixed(1)}`;
  }).join(" "));
}

function draw() {
  pointer(-135 + ((shownTap(0) - 1) * 270) / 16);
  const t1run = S.move && S.move.who === 0;
  if (t1run && !still.matches) rotor(S.move.t * 720 * S.move.dir);
  on(raiseLed, t1run && S.move.dir > 0);
  on(lowerLed, t1run && S.move.dir < 0);
  text(ops, ops5(S.ops[0]));
  [0, 1].forEach((i) => {
    const moving = S.move && S.move.who === i;
    const u = units[i];
    on(u.led("reg"), moving);
    text(u.tap, pad(S.tap[i]));
    text(u.lcd1, moving ? (S.move.dir > 0 ? "RAISE ▲" : "LOWER ▼") : i === 0 ? "MANUAL" : "FOLLOW");
    const barMax = Number(u.bar.dataset.barMax || 16);
    u.bar.setAttribute("width", moving ? (S.move.t * barMax).toFixed(2) : "0");
    text(tpis[i], pad(S.tap[i]));
    text(hmiTap[i], pad(S.tap[i]));
    text(hmiOps[i], `OPS ${ops5(S.ops[i])}`);
    const m = monitors[i];
    const amps = moving ? ampsAt(S.move.t) : 0;
    text(m.tap, pad(S.tap[i]));
    text(m.ops, `OPS ${ops5(S.ops[i])}`);
    text(m.amps, `${amps.toFixed(2)} A`);
    on(m.motor, moving);
    if (i === 0) text(hmiMotor, `MOTOR T1 ${amps.toFixed(2)} A`);
  });
  line(trend, 0);
  line(trend2, 1);
  text(readout, `T1 ${pad(S.tap[0])} · T2 ${pad(S.tap[1])}`);
  document.dispatchEvent(new CustomEvent("avr", { detail: { phase: S.phase, tap: S.tap[0], tap2: S.tap[1], dir: S.move ? S.move.dir : S.pending ? S.pending.dir : 0, note: S.note, touring, min: M.MIN, max: M.MAX } }));
}

let frame = 0;
let last = 0;
let clock = 0;
let tourAt = 0;
let touring = !still.matches;
let visible = false;
still.addEventListener("change", () => { if (still.matches) touring = false; });
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (touring && !S.move && !S.pending) {
    clock += dt;
    if (clock >= TOUR_S) {
      clock = 0;
      command(TOUR[tourAt++ % TOUR.length]);
    }
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
// Page buttons call this: +1 raises, -1 lowers.
window.dcStep = (dir) => {
  touring = false;
  if (still.matches) {
    // reduced motion: both units jump to the new tap at once
    const next = S.tap[0] + dir;
    if (next < M.MIN || next > M.MAX) S.note = dir > 0 ? "top" : "bottom";
    else { S.note = ""; S.tap = [next, next]; S.ops[0] += 1; S.ops[1] += 1; }
    S.phase = S.note ? "limit" : "steady";
  } else command(dir);
  run();
  draw();
};
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "160px 0px" }).observe(stage);
stage.addEventListener("keydown", (event) => {
  const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
  if (!d) return;
  event.preventDefault();
  window.dcStep(d);
});
draw();

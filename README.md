# AVR Demo Cabinet

A concept for a mobile 19″ cabinet (rev B, 22U) with two HMIET-I AVRs (master and follower), two HMJK-II OLTC monitors, two HMC-3C tap position indicators, a tap-changer simulator, a BCD box and a screen, for live demonstrations of Huaming tap-changer control and monitoring. Two SHM-D motor drives sit outside, each with its own junction box.

**Live site:** https://erict16.github.io/avr-demo-cabinet/

- `SPEC.md` is the shared spec: sizes, the 22U rack layout, the real device fronts and the rev B changes.
- `blender/cabinet.py` builds the 3D model in Blender and exports `models/cabinet.glb` (web, animated), `models/cabinet.usdz` (iPhone AR) and `models/poster.webp`:
  `blender -b --factory-startup -P blender/cabinet.py -- models/cabinet.glb models/poster.webp`
- `figure.mjs` draws the live isometric with the Anatomy kit in `kit/`; `live.js` runs the manual raise/lower demo in the page.
- `drawing.mjs` draws the three A4 sheets (general arrangement 1:12, rack front 1:6, system layout 1:15).
- `pdf.mjs` writes `drawings/sheet-N.svg` and prints `drawings/avr-demo-cabinet-rev-B.pdf` with headless Edge or Chrome (`node pdf.mjs`).
- `build.mjs` writes `index.html` (`node pdf.mjs && node build.mjs`).

Sizes are read off a hand sketch and Huaming device drawings. The junction box and BCD box sizes are assumed until confirmed.

# AVR Demo Cabinet

A mobile 19″ demo cabinet (rev C, 20U) built to Gerrick's sketch "Control Panel for AVR": two HMIET-I AVRs (systems 1, 2), their two remote control modules (3, 4), a spare 2U, an HMJK-II OLTC monitor (5) and an SHM-KX controller (6), with a screen, keyboard tray, cable locker and a BCD box inside. The SHM-D motor drives and their junction boxes sit outside.

**Live site:** https://erict16.github.io/avr-demo-cabinet/

- `SPEC.md` is the shared spec: sizes, the rack layout, the device fronts and what is still TBC.
- `figure.mjs` draws the live isometric cabinet on the website with the Anatomy kit in `kit/`.
- `drawing.mjs` draws the three A4 sheets (general arrangement 1:12, rack front 1:6, system layout 1:15).
- `demo.js` runs the live demo: the remote control module switches and buttons drive the AVRs, and the HMJK-II, SHM-KX and screen follow.
- `pdf.mjs` writes `drawings/sheet-N.svg` and prints `drawings/avr-demo-cabinet-rev-C.pdf` with headless Edge or Chrome.
- `build.mjs` writes `index.html`: `node pdf.mjs && node build.mjs`
- `blender/cabinet.py` builds the 3D model and exports `models/cabinet.glb`, `models/cabinet.usdz` and `models/poster.webp`:
  `blender -b --factory-startup -P blender/cabinet.py -- models/cabinet.glb models/poster.webp`

Sizes come from the sketch, Eric's photo of the equipment and Huaming device drawings. The remote control module depth, the junction box and BCD box sizes and the number of SHM-D are TBC.

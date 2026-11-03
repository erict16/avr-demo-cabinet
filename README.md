# AVR Demo Cabinet

A concept for a mobile 19″ cabinet with two working HMIET-I AVRs (master and follower), two HMC-3C tap position indicators, a tap-changer simulator, a grid source and a screen, for live demonstrations of automatic voltage regulation.

**Live site:** https://erict16.github.io/avr-demo-cabinet/

- `SPEC.md` is the shared spec: sizes, the 20U rack layout and the real device fronts.
- `blender/cabinet.py` builds the 3D model in Blender and exports `models/cabinet.glb` (web, animated), `models/cabinet.usdz` (iPhone AR) and `models/poster.webp`:
  `blender -b --factory-startup -P blender/cabinet.py -- models/cabinet.glb models/poster.webp`
- `figure.mjs` draws the live isometric with the Anatomy kit in `kit/`; `live.js` runs the regulation model in the page.
- `drawing.mjs` draws the dimensioned front and side elevations.
- `build.mjs` writes `index.html` (`node build.mjs`): the 2D drawing first, with a switch to the 3D model.

Sizes are read off a hand sketch and device drawings; slot contents are a working assumption until the build list is fixed.

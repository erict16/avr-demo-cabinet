# AVR demo cabinet — shared build spec, rev C

One source of truth for the 3D model, the drawings and the website. All heights are mm above the floor unless noted.

Rev C (11 Nov 2026) follows Gerrick's sketch "Control Panel for AVR" (2 Nov 2026) and Eric's photo of the real equipment. Removed from rev B: the tap-changer simulator, the two HMC-3C indicators and the second HMJK-II (none of them are in the sketch or the photo).

## Equipment in the cabinet (from the photo)

| Sketch | Device | Qty | Front W × H | Depth |
|---|---|---|---|---|
| System 1, 2 | HMIET-I automatic voltage regulator (T1, T2) | 2 | 482.8 × 177 (4U) | 267 |
| System 3, 4 | HMIET-I remote control module (T1, T2) | 2 | 482.6 × 88.1 (2U) | 150 assumed, **TBC** |
| System 5 | HMJK-II OLTC monitor | 1 | 340.4 × 130 | 200 |
| System 6 | SHM-KX controller | 1 | 243 × 95 (cutout 210 × 96) | 169 |

## Cabinet
- Body 600 W × 500 D × 1700 H, on 4 × 3″ (Ø76) lockable castors, castor height 100 → overall 1800.
- Lower cabinet 100–1340: sheet-steel side panels RAL 7035 light grey, front uprights and top frame RAL 7016 anthracite, kick plate 100–118, cable locker drawer 120–255 (540 wide, pull handle, lock), 13 A power extension inside the locker.
- Rack opening 270–1160, 19″ rails, **20U**.
- Fascia 1160–1340 with the keyboard tray slot. Keyboard tray top ≈1295, 440 wide, pulls out 200 on two-stage slides.
- Worktop 1340–1355. Upper open frame: four 15×15 posts to 1800, top frame 1780–1800, perforated back panel. Monitor ≈22″ (460 × 280, 1390–1670) on a desk stand, 100 behind the front.
- Right side: cable box 65 × 18 from the worktop down to the cable locker (130–1180 high), intake fan Ø120, exhaust louvres 1180–1300, push handle at 1210, earth stud at 150. Cable entry: brush plate on the back panel at 300–345.

## Rack layout, bottom to top (1U = 44.45, U1 starts at 270.5)

Same order as Gerrick's sketch, System 1 at the bottom.

| Slot | U | mm from floor | Unit |
|---|---|---|---|
| 1 | U1–4 (4U) | 272–447 | HMIET-I AVR, T1 (master) |
| 2 | U5–8 (4U) | 449–625 | HMIET-I AVR, T2 (follower) |
| 3 | U9–10 (2U) | 627–714 | Remote control module, T1 |
| 4 | U11–12 (2U) | 716–803 | Remote control module, T2 |
| — | U13–14 (2U) | 805–892 | Spare, blank panel |
| 5 | U15–17 (3U) | 894–1025 | HMJK-II OLTC monitor on a 3U plate, centred |
| 6 | U18–20 (3U) | 1027–1158 | SHM-KX controller in a 3U plate (cutout 210 × 96), centred |

**Systems 5 and 6 are stacked, not side by side.** The sketch shows them next to each other, but 340.4 + 243 = 583 mm, wider than the 450 mm between 19″ rails (and the 560 mm inside the cabinet). Stacking on two 3U plates keeps the 20U rack.

## Device fronts

### HMIET-I AVR (4U, drawing HMIET-I-E110)
- Front 482.8 × 177, body 426.4 W × 267 D. Light grey panel.
- Left: column of 10 LEDs (Run, Fault, Remote, Auto, Parallel, U/I Block, Tap Block, AVR Failed, Regulating, Par.Block). LCD ≈ 82 × 80 at 115–197 from the left. Keypad: four arrows round OK, ESC and RST beside it.

### HMIET-I remote control module (2U, from the photo)
- 19″ panel, about 2U. From the left: POWER and RUN lamps; three two-position rotary switches SA1 Remote/Local, SA2 Auto/Manual, SA3 Parallel/Independent; push buttons S1 1-N (green), S2 N-1 (green), S3 Stop (red).
- Wired to the AVR's remote inputs: raise, lower, stop, remote/local, auto/manual, parallel/independent.

### HMJK-II OLTC monitor
- Landscape 340.4 W × 130 H, 200 deep. LCD centre-left, Run / Warning / Alarm LEDs, keypad with arrows, ESC and RST.
- Inputs: BCD tap position, motor voltage and current from the MDU, 4–20 mA tap position.

### SHM-KX controller (SHM-D manual, Appendix 6)
- Flange 243 × 95, front 226, depth 162 + 7 = 169. Panel cutout 210 × 96.
- Left column of five keys (Local/Remote, Auto/Manual, 1-N, Stop, N-1), LCD in the middle with the tap number, five keys on the right.

## Inside: BCD box
- One box on a DIN rail on the back panel, 1000–1120 high, 200 × 120 × 75. **Size TBC.**
- Takes the BCD tap position from the junction boxes and shares it to the AVRs, the HMJK-II and the SHM-KX.

## Outside: SHM-D motor drives and junction boxes
- 2 × SHM-D (T1, T2), 750 × 816 × 359. **Count TBC** (the photo has one HMJK-II and one SHM-KX, both on T1).
- One junction box per SHM-D, outside, about 1/5 of the SHM-D: 300 × 400 × 150 (TBC).
- Cables per SHM-D, junction box to the cabinet back: W1 BCD 10 × 1.5, W2 motor V + I 8 × 1.5, W3 control (cores TBC), W4 supply 3 × 2.5.

## Live behaviour (website)
- Each remote control module drives its own AVR. Raise (S1 1-N) and lower (S2 N-1) work only with SA1 on Remote and SA2 on Manual. Stop (S3) ends a running step.
- SA3 on Parallel (both modules): T1 is master, T2 follows one step later. On Independent each transformer moves alone.
- Displays: AVR LCD (tap, mode), HMJK-II (T1 tap, operation count, motor current), SHM-KX (T1 tap, big). Taps 1–17, 9 nominal, one step ≈ 1.6 s.

## Palette
RAL 7035 `#c9ccc8` body · RAL 7016 `#383e42` frame · rails `#aeb2b5` · device grey `#dfe2e4` · LCD `#0f2a33` with `#9ef0c5` text · key green `#2fa45a` · stop red `#d93a3a` · lamp amber `#e08a00`.

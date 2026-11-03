# AVR demo cabinet — shared build spec

One source of truth for the 3D model, the 2D isometric figure, the dimensioned drawing and the website. All heights are mm above the floor unless noted.

## Cabinet
- Body 600 W × 500 D × 1700 H, standing on 4 × 3″ (Ø76) lockable castors, castor height 100 → overall 1800.
- Lower cabinet 100–1340: sheet-steel side panels in RAL 7035 light grey, front corner uprights and top frame in RAL 7016 anthracite, kick plate 100–118, cable locker drawer 120–255 (540 wide, pull handle, lock).
- Rack opening 270–1160, 19″ rails (EIA-310 square holes, 3 per U), **20U**.
- Fascia 1160–1340 with vent slots and the keyboard tray slot. Keyboard tray top ≈1295, 440 wide, pulls out 200 on two-stage slides.
- Worktop 1340–1355. Upper open frame: four 15×15 posts to 1800, top frame bars 1780–1800, perforated back panel. Monitor ≈22″ (460 × 280, bottom 1390, top 1670) on a desk stand, face 100 mm behind the cabinet front.
- Right side: cable duct 65 × 18 (75–140 back from the front, 130–1180 high), 13 A power strip (230–450 back, 150–195 high) with lead to a 13 A plug, intake fan Ø120 (380 back, 560 high), exhaust louvres 1180–1300 high, push handle at 1210, earth stud at 150, side panel seam at 750.

## Rack layout (bottom to top), 1U = 44.45 mm
| Slot | U | mm from floor | Unit | Front |
|---|---|---|---|---|
| S1 | U1–4 (4U) | 272–447 | Grid source | Light-grey 19″ instrument: big black knob (grid %), analogue voltmeter, power switch and lamp, vents |
| S2 | U5–8 (4U) | 450–625 | Tap-changer simulator | Light-grey 19″ panel: round tap-position dial (1–17), operations counter, RAISE/LOWER lamps, motor window with a rotor, hand-crank socket |
| S3 | U9–12 (4U) | 628–803 | **HMIET-I AVR, T1 master** | native 19″ 4U unit, front below |
| S4 | U13–16 (4U) | 806–981 | **HMIET-I AVR, T2 follower** | same as S3 |

**UPDATE (supersedes the SHM-K choice for S3/S4):** The maker drawing HMIET-I-E110 shows the HMIET-I is a native 19″ rack AVR, so S3/S4 use it, no adapter plate. The SHM-K/SHM-KX below stays documented as the panel-mount alternative.

### HMIET-I automatic voltage regulator (front face, 19″ 4U) — from drawing HMIET-I-E110
- Front panel **482.8 W × 177 H mm** (4U), body behind 426.4 W × 267 D. Mounting ears with slots, hole centres 465 apart, slot 6.5 wide, 10.5 from the panel edge, 101.6 between the two slots on each ear.
- Panel colour: light grey/silver anodised (`#c9cdd0`), dark text.
- Text top-right: "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR" (small caps line).
- Left: a **column of 10 status LEDs** at ≈36 mm from the left edge, from top: Run, Fault, Remote, Auto, Parallel, U/I Block, Tap Block, AVR Failed, Regulating, Par.Block (green for Run/Auto/Remote/Parallel, red for Fault/Failed/Block ones, amber Regulating), each with its label to the right.
- **LCD** ≈ 82 W × 80 H mm, from ≈115 to 197 mm from the left, 10 to 91 mm from the top; dark display with white/cyan text (show voltage, tap, mode).
- **Navigation keypad** right of centre (≈295–367 mm from the left, 36–79 mm from the top): a diamond of four arrow keys around a centre OK key, with **ESC** and **RST** keys beside it.
- Rear (only if visible): modular cards with terminal blocks XA–XH, two IEC 61850 LC fibre TX/RX ports, RS232/RS485, power AC/DC 85–265 V.
- Functions: auto/manual, local/remote, master/follower parallel (CAN link to the second unit), BCD tap input, >U <U >I blocking, raise/lower/stop outputs, IEC 61850.
| S5 + S6 | U17–19 (3U) | 984–1115 | **HMC-3C tap position indicators, T1 and T2** | one 19″ 3U plate holding two HMC-3C side by side |
| — | U20 (1U) | 1117–1159 | Brush-strip cable entry panel | black 1U panel with a brush slot |

## Real devices (copy these looks)

### SHM-K AVR controller (front face, panel-mount)
Source: product photo (DirectIndustry "Controller module SHM-K") and SHM-KX unit photos.
- Front bezel ≈ 300 W × 145 H mm (about 2.1 : 1), vivid **blue-violet** `#4f3ad8`, four corner screws.
- White text "SHM-K" top-left.
- Colour **touchscreen** ≈ 150 × 90 mm, left-centre: sky-blue gradient background (`#bfe6ff` top → `#e9f7ff` horizon → `#2a7fd4` lower band), the **tap position number very large in dark navy** `#1a237e` in the centre, small green and amber icons in the bottom corners.
- Right column: three square keys ≈ 18 mm, stacked: **green "1→N"** (raise), **red "STOP"**, **green "N→1"** (lower), with a small "Reset" text beside the lowest one.
- Body behind the bezel: brushed-aluminium box (≈ 270 × 190 mm label face, ≈ 120 mm deep) with green pluggable terminal blocks, RJ45 TCP/IP, RS485 and black fibre-optic RX/TX ports; a black mounting flange. Modes: manual/automatic, parallel master, parallel follower. IEC 61850 on the network port.

### HMC-3C tap position indicator (front face, DIN 192 × 96 mm)
Source: product photo (DirectIndustry "Position indicator HMC-3C").
- Light-grey panel `#d9dcdc`, thin darker bezel.
- Top-left: "HMC-3C 型", Chinese line 有载分接开关位置指示器, English line "LOAD TAP POSITION INDICATOR".
- Top-right: **red 2-digit 7-segment LED** (`#ff2a2a` on a dark-red window) showing the tap.
- Bottom row of square keys: green lamp "TELECONTROL", green "1-N", green "STOP", green "N-1", **red "POWER"**.

## Palette (for the model and the site)
RAL 7035 `#c9ccc8` body · RAL 7016 `#383e42` frame · zinc rails `#aeb2b5` · SHM-K blue `#4f3ad8` · indicator amber `#e08a00` · LED red `#ff2a2a` · key green `#2fa45a` · page ground `#e3e6e3` · sheet `#fbfbfa` · ink `#1b1f22`.

## Live behaviour (same story everywhere)
Grid drops 3.4 % → master AVR waits its time delay → RAISE (1→N) one tap (1.25 % per tap) → follower copies → grid recovers → LOWER back. Tap 9 is nominal; taps 1–17.

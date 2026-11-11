# AVR demo cabinet — shared build spec

One source of truth for the 3D model, the 2D isometric figure, the dimensioned drawing and the website. All heights are mm above the floor unless noted.

## Cabinet
- Body 600 W × 500 D × 1700 H, standing on 4 × 3″ (Ø76) lockable castors, castor height 100 → overall 1800.
- Lower cabinet 100–1340: sheet-steel side panels in RAL 7035 light grey, front corner uprights and top frame in RAL 7016 anthracite, kick plate 100–118, cable locker drawer 120–255 (540 wide, pull handle, lock).
- Rack opening 270–1250, 19″ rails (EIA-310 square holes, 3 per U), **22U** (rev B, Nov 2026: was 20U to 1160; the fascia vent slots are gone, the side louvres do the venting).
- Fascia 1250–1340 with the keyboard tray slot only. Keyboard tray top ≈1295, 440 wide, pulls out 200 on two-stage slides.
- Worktop 1340–1355. Upper open frame: four 15×15 posts to 1800, top frame bars 1780–1800, perforated back panel. Monitor ≈22″ (460 × 280, bottom 1390, top 1670) on a desk stand, face 100 mm behind the cabinet front.
- Right side: cable duct 65 × 18 (75–140 back from the front, 130–1180 high), 13 A power strip (230–450 back, 150–195 high) with lead to a 13 A plug, intake fan Ø120 (380 back, 560 high), exhaust louvres 1180–1300 high, push handle at 1210, earth stud at 150, side panel seam at 750.

## Rack layout, rev B (bottom to top), 1U = 44.45 mm, U1 starts at 270.5
No grid source (removed, rev B): the AVRs get no moving voltage, so the demo is manual raise/lower with master–follower, the tap indicators and the OLTC monitors. Cable entry moved from the front U20 brush panel to a brush plate on the back panel.

| Slot | U | mm from floor | Unit | Front |
|---|---|---|---|---|
| S1 | U1–3 (3U) | 272–403 | Tap-changer simulator | Light-grey 19″ panel, now 3U: tap dial Ø110 (1–17), operations counter, RAISE/LOWER lamps, motor window with a rotor, hand-crank socket |
| S2 | U4–11 (8U) | 405–758 | **HMJK-II OLTC monitor ×2, T1 and T2** | one 19″ 8U plate (482.6 × 355.6) holding two HMJK-II modules upright, centres 75 left and right of the cabinet centre |
| S3 | U12–15 (4U) | 760–937 | **HMIET-I AVR, T1 master** | native 19″ 4U unit, centre 848.4 |
| S4 | U16–19 (4U) | 938–1115 | **HMIET-I AVR, T2 follower** | same, centre 1026.2 |
| S5 + S6 | U20–22 (3U) | 1116–1248 | **HMC-3C tap position indicators, T1 and T2** | one 19″ 3U plate, two HMC-3C side by side, centre 1181.7 |

### HMJK-II OLTC monitor (from drawings HMJK-Ⅱ-20231214 and "HMJK智能装置")
- Module front **130 W × 340.4 H** (body 322.3 H), **200 deep**. Upright: LCD near the top, LED column, keypad below; terminal blocks XA–XG at the back.
- Inputs used here: BCD tap position (XF 8–16), motor voltage and motor current from the MDU (XE), 4–20 mA tap position (XC). Outputs: device status, yellow warning, red alarm. IEC 61850 on LC fibre, RS485 Modbus.
- Supply AC/DC 85–265 V.
- (The wall-mounted HMJK-II box, 600 × 720 outside the ears, cabinet 550 × 320 × 750, is not used: the modules go in the rack.)

### BCD box (inside, one)
- One box inside the cabinet, on a DIN rail on the back panel, centred, 1000–1120 above the floor (clear of the side fan), 200 W × 120 H × 75 D. **Size TBC.**
- Takes the BCD tap position from both junction boxes and shares it to the AVRs, the HMC-3Cs and the HMJK-IIs.

### Outside the cabinet: SHM-D motor drives and junction boxes
- 2 × SHM-D motor drive unit (T1, T2): 750 W × 816 H × 359 D (manual HM0.460.1381, Appendix 1).
- **One junction box per SHM-D, outside**, about 1/5 of the SHM-D front: **300 W × 400 H × 150 D** (size assumed, TBC).
- Cables, junction box to cabinet (rear brush plate): BCD 10 × 1.5, motor voltage + current 8 × 1.5 (4 × 1.5 each, per the HMJK-II drawing), raise/lower/status control (cores TBC), supply 3 × 2.5.

**S3/S4 AVR choice:** The maker drawing HMIET-I-E110 shows the HMIET-I is a native 19″ rack AVR, so S3/S4 use it, no adapter plate. The SHM-K/SHM-KX below stays documented as the panel-mount alternative.

### HMIET-I automatic voltage regulator (front face, 19″ 4U) — from drawing HMIET-I-E110
- Front panel **482.8 W × 177 H mm** (4U), body behind 426.4 W × 267 D. Mounting ears with slots, hole centres 465 apart, slot 6.5 wide, 10.5 from the panel edge, 101.6 between the two slots on each ear.
- Panel colour: light grey/silver anodised (`#c9cdd0`), dark text.
- Text top-right: "HMIET-Ⅰ AUTOMATIC VOLTAGE REGULATOR" (small caps line).
- Left: a **column of 10 status LEDs** at ≈36 mm from the left edge, from top: Run, Fault, Remote, Auto, Parallel, U/I Block, Tap Block, AVR Failed, Regulating, Par.Block (green for Run/Auto/Remote/Parallel, red for Fault/Failed/Block ones, amber Regulating), each with its label to the right.
- **LCD** ≈ 82 W × 80 H mm, from ≈115 to 197 mm from the left, 10 to 91 mm from the top; dark display with white/cyan text (show voltage, tap, mode).
- **Navigation keypad** right of centre (≈295–367 mm from the left, 36–79 mm from the top): a diamond of four arrow keys around a centre OK key, with **ESC** and **RST** keys beside it.
- Rear (only if visible): modular cards with terminal blocks XA–XH, two IEC 61850 LC fibre TX/RX ports, RS232/RS485, power AC/DC 85–265 V.
- Functions: auto/manual, local/remote, master/follower parallel (CAN link to the second unit), BCD tap input, >U <U >I blocking, raise/lower/stop outputs, IEC 61850.

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

## Live behaviour (same story everywhere, rev B)
No grid source, so no automatic regulation. The demo is manual: RAISE (1→N) or LOWER (N→1) on the T1 master → the T1 MDU runs one step (1.25 % per tap) → the follower copies → both HMC-3C show the new tap → each HMJK-II logs the operation and the motor current. Tap 9 is nominal; taps 1–17.

"""AVR demo cabinet in Blender, exported as GLB + USDZ for the website.

Run:  blender -b --factory-startup -P blender/cabinet.py -- <out.glb> [<poster.webp> [<shots dir>]]
Sizes follow SPEC.md / figure.mjs: 1 figure unit = 5 mm, front of the cabinet faces -Y.
Rev B (Nov 2026), 22U rack 270-1250 mm, bottom to top: S1 tap-changer simulator 3U (U1-3),
S2 two HMJK-II OLTC monitors on one 8U plate (U4-11), S3 HMIET-I AVR T1 master 4U (U12-15),
S4 HMIET-I AVR T2 follower 4U (U16-19), S5+S6 two HMC-3C on a 3U plate (U20-22).
No grid source: the loop is a manual raise on the T1 master, the follower copies, then a lower.
Inside on the back panel: brush-strip cable entry plate and the BCD box. Fascia 1250-1340 holds
only the keyboard tray slot.
"""
import math
import os
import sys
import tempfile

import bpy
import bmesh
import blf
import imbuf
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
# absolute paths: Blender's renderer resolves a relative output path from the drive root
OUT = os.path.abspath(argv[0] if argv else "cabinet.glb")
RENDER = os.path.abspath(argv[1]) if len(argv) > 1 and argv[1] else None
SHOTS = os.path.abspath(argv[2]) if len(argv) > 2 and argv[2] else None

U = 0.005  # metres per figure unit
FPS = 24
LOOP = 12 * FPS

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = LOOP
COLL = scene.collection


# ---------- fonts ----------
def first(*paths):
    for p in paths:
        if p and os.path.exists(p):
            return p
    return None


FONT_DIR = bpy.utils.system_resource("DATAFILES", path="fonts")
WINF = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
F_SANS = first(os.path.join(WINF, "arial.ttf"), os.path.join(FONT_DIR, "Inter.woff2"))
F_BOLD = first(os.path.join(WINF, "arialbd.ttf"), os.path.join(FONT_DIR, "Inter.woff2"))
F_CJK = first(os.path.join(FONT_DIR, "Noto Sans CJK Regular.woff2"), os.path.join(WINF, "msyh.ttc"), F_SANS)
VF_SANS = bpy.data.fonts.load(F_SANS)
VF_BOLD = bpy.data.fonts.load(F_BOLD)
VF_CJK = bpy.data.fonts.load(F_CJK)
VF_ROMAN = bpy.data.fonts.load(first(os.path.join(WINF, "timesbd.ttf"), F_BOLD))


# ---------- materials ----------
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = strength
    return m


def tex_mat(name, img, rough=0.5, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    t.extension = "EXTEND"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if emit:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    return m


M = {
    "ral7035": mat("RAL7035 powder coat", "#c9ccc8", 0.62),
    "ral7016": mat("RAL7016 anthracite", "#383e42", 0.55),
    "zinc": mat("Zinc rail", "#b3b7ba", 0.38, 1.0),
    "steel": mat("Bright steel", "#d4d7da", 0.24, 1.0),
    "alu": mat("Brushed aluminium", "#c4c8cc", 0.32, 1.0),
    "panel": mat("Instrument panel grey", "#c0c5c7", 0.5),
    "anod": mat("Silver anodised", "#c9cdd0", 0.36, 0.55),
    "panelDark": mat("Anodised dark", "#2c3134", 0.42, 0.2),
    "black": mat("Black plastic", "#17191b", 0.42),
    "gloss": mat("Gloss black", "#0b0c0d", 0.12),
    "keyGrey": mat("Keycap grey", "#3a3f44", 0.3, 0.0, coat=0.4),
    "rubber": mat("Rubber", "#1c1d1e", 0.85),
    "bristle": mat("Brush bristle", "#141516", 1.0),
    "hole": mat("Hole", "#0b0c0d", 0.9),
    "face": mat("Dial face", "#f3f2ec", 0.55),
    "white": mat("Print white", "#f4f4f1", 0.45),
    "ink": mat("Print ink", "#1b1f22", 0.6),
    "lcd": mat("LCD glass", "#0a2a24", 0.25, 0.0, "#0b3a31", 0.5),
    "lcdText": mat("LCD text", "#8ff0d0", 0.4, 0.0, "#8ff0d0", 1.6),
    "screen": mat("Screen", "#03090a", 0.2, 0.0, "#06201c", 1.0),
    "amberOff": mat("Amber lens off", "#6b4a12", 0.2, coat=0.6),
    "amber": mat("Amber lamp", "#ffb347", 0.25, 0.0, "#ffa22a", 2.2),
    "greenOff": mat("Green lens off", "#1f4a2d", 0.2, coat=0.6),
    "green": mat("Green lamp", "#5ad98a", 0.25, 0.0, "#3fd27a", 2.0),
    "redOff": mat("Red lens off", "#4a1512", 0.2, coat=0.6),
    "redLed": mat("Red lamp", "#ff4a3a", 0.25, 0.0, "#ff2a2a", 2.0),
    "red": mat("Red paint", "#c8372a", 0.4),
    "worktop": mat("Worktop laminate", "#50565a", 0.5),
    "label": mat("Label plate", "#ecede8", 0.45),
    # HMC-3C
    "hmcBezel": mat("HMC bezel", "#a7acae", 0.45),
    "ledWin": mat("LED window", "#240707", 0.1, coat=1.0),
    "ledOff": mat("LED segment off", "#2c0a08", 0.3),
    "ledOn": mat("LED segment on", "#ff3a2a", 0.3, 0.0, "#ff2a2a", 2.4),
    "keyCollar": mat("Key collar", "#3a3e41", 0.4),
    "hmcGreen": mat("HMC key green", "#2fa45a", 0.18, coat=0.8),
    "hmcGreenLit": mat("HMC key green lit", "#6ef09c", 0.2, 0.0, "#41e07e", 1.4),
    "hmcRedLit": mat("HMC key red lit", "#ff5040", 0.2, 0.0, "#ff2a1e", 1.3),
    # HMJK-II, BCD box
    "hmjk": mat("HMJK panel grey", "#d3d6d5", 0.48),
    "bcd": mat("BCD box grey", "#9ca2a5", 0.5),
    "terminal": mat("Terminal block", "#7d8a83", 0.45),
}
NO_BEVEL = {M[k] for k in ("hole", "ink", "white", "lcdText", "bristle", "ledOff", "ledOn")}


# ---------- geometry helpers (all in figure units) ----------
def finish(obj, smooth):
    me = obj.data
    if smooth:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(50))
        wn = obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
        wn.mode = "FACE_AREA"
        wn.keep_sharp = True
    else:
        me.shade_flat()


def link(obj, material=None, parent=None):
    if material:
        obj.data.materials.clear()
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj


def box(name, x0, x1, y0, y1, z0, z1, material, parent=None, bevel=None):
    """Axis box; figure y (front +50) maps to Blender -Y. bevel=None picks a small 0.8 mm edge."""
    sx, sy, sz = abs(x1 - x0) * U, abs(y1 - y0) * U, abs(z1 - z0) * U
    cx, cy, cz = (x0 + x1) / 2 * U, -(y0 + y1) / 2 * U, (z0 + z1) / 2 * U
    if bevel is None:
        bevel = 0.0 if material in NO_BEVEL else 0.16
    off = min(bevel * U, min(sx, sy, sz) / 2.4)
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    if off > 0.0001:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=off, segments=1 if bevel < 0.3 else 2,
                        affect="EDGES", profile=0.5, clamp_overlap=True)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx, cy, cz)
    COLL.objects.link(obj)
    finish(obj, off > 0.0001)
    return link(obj, material, parent)


def cyl(name, x, y, z, r, depth, axis, material, parent=None, verts=32, bevel=0.0):
    """Cylinder. axis 'y' faces the front, 'x' sideways, 'z' up. bevel rounds both cap edges."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts,
                          radius1=r * U, radius2=r * U, depth=depth * U)
    if bevel > 0:
        bm.normal_update()
        rim = [e for e in bm.edges if len(e.link_faces) == 2
               and e.link_faces[0].normal.angle(e.link_faces[1].normal) > 1.0]
        bmesh.ops.bevel(bm, geom=rim, offset=min(bevel, r * 0.45, depth * 0.45) * U, segments=2,
                        affect="EDGES", profile=0.5, clamp_overlap=True)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (x * U, -y * U, z * U)
    if axis == "y":
        obj.rotation_euler = (math.pi / 2, 0, 0)
    elif axis == "x":
        obj.rotation_euler = (0, math.pi / 2, 0)
    COLL.objects.link(obj)
    finish(obj, True)
    return link(obj, material, parent)


def text(name, body, x, y, z, size, material, align="LEFT", parent=None, font=None, res=3):
    """Flat text standing in the front plane at figure y, baseline at z."""
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.font = font or VF_SANS
    curve.size = size * U
    curve.align_x = align
    curve.resolution_u = res
    obj = bpy.data.objects.new(name, curve)
    obj.location = (x * U, -y * U, z * U)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    COLL.objects.link(obj)
    curve.materials.append(material)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    obj.select_set(False)
    if parent:
        obj.parent = parent
    return obj


def side_text(name, body, x, y, z, size, material, align="LEFT"):
    """Text on the right side panel (faces +X), reading front to back."""
    t = text(name, body, 0, 0, 0, size, material, align)
    t.location = (x * U, -y * U, z * U)
    t.rotation_euler = (math.pi / 2, 0, math.pi / 2)
    return t


def plane_front(name, x0, x1, z0, z1, y, material):
    """Quad facing the front (-Y) with a 0..1 UV map, origin at its centre."""
    hx, hz = (x1 - x0) / 2 * U, (z1 - z0) / 2 * U
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-hx, 0, -hz), (hx, 0, -hz), (hx, 0, hz), (-hx, 0, hz)], [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new(name="UVMap")
    for i, c in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = c
    obj = bpy.data.objects.new(name, mesh)
    obj.location = ((x0 + x1) / 2 * U, -y * U, (z0 + z1) / 2 * U)
    COLL.objects.link(obj)
    return link(obj, material)


def prism(name, pts, y0, y1, material):
    """Extrude a front-facing polygon [(x, z), ...] from figure y0 (back) to y1 (front)."""
    cx = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    fr = [bm.verts.new(((x - cx) * U, -y1 * U, (z - cz) * U)) for x, z in pts]
    bk = [bm.verts.new(((x - cx) * U, -y0 * U, (z - cz) * U)) for x, z in pts]
    bm.faces.new(fr)
    bm.faces.new(list(reversed(bk)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((fr[i], fr[j], bk[j], bk[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = (cx * U, 0, cz * U)
    COLL.objects.link(obj)
    return link(obj, material)


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.select_set(False)
    return o


def empty(name, x, y, z, parent=None):
    e = bpy.data.objects.new(name, None)
    e.location = (x * U, -y * U, z * U)
    COLL.objects.link(e)
    if parent:
        e.parent = parent
    return e


def screw(x, z, y, r=0.95, washer=True, cross=True):
    """Pan-head cage-nut screw with a nylon cup washer, standing on the front plane y."""
    d = 0.0
    if washer:
        cyl("cup washer", x, y + 0.12, z, r * 1.35, 0.24, "y", M["black"], verts=20, bevel=0.08)
        d = 0.24
    cyl("screw head", x, y + d + 0.22, z, r, 0.44, "y", M["steel"], verts=20, bevel=0.22)
    if cross:
        f = y + d + 0.42
        box("screw recess", x - r * 0.5, x + r * 0.5, f, f + 0.04, z - 0.08, z + 0.08, M["hole"], bevel=0)
        box("screw recess", x - 0.08, x + 0.08, f, f + 0.04, z - r * 0.5, z + r * 0.5, M["hole"], bevel=0)


# ---------- textures drawn in the script (numpy background + blf text) ----------
TMP = tempfile.mkdtemp(prefix="avr_tex_")
BLF = {}


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


class Canvas:
    """sRGB float canvas, origin bottom-left like Blender images and blf."""

    def __init__(self, w, h, color):
        self.w, self.h = w, h
        self.a = np.empty((h, w, 4), np.float32)
        self.a[..., :3] = hexrgb(color)
        self.a[..., 3] = 1
        self.yy, self.xx = np.mgrid[0:h, 0:w].astype(np.float32) + 0.5
        self.texts = []

    def paint(self, alpha, color, opacity=1.0):
        a = (np.clip(alpha, 0, 1) * opacity)[..., None]
        c = hexrgb(color) if isinstance(color, str) else np.asarray(color, np.float32)
        self.a[..., :3] = self.a[..., :3] * (1 - a) + c * a

    def rrect(self, x0, y0, x1, y1, r, color, opacity=1.0):
        cx, cy, hx, hy = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
        qx = np.abs(self.xx - cx) - hx + r
        qy = np.abs(self.yy - cy) - hy + r
        d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
        self.paint(0.5 - d, color, opacity)

    def ring(self, cx, cy, r, w, color):
        d = np.abs(np.hypot(self.xx - cx, self.yy - cy) - r) - w / 2
        self.paint(0.5 - d, color)

    def disc(self, cx, cy, r, color, opacity=1.0):
        self.paint(r + 0.5 - np.hypot(self.xx - cx, self.yy - cy), color, opacity)

    def text(self, s, x, y, size, color, font=None, align="left"):
        self.texts.append((s, x, y, size, color, font or F_SANS, align))

    def image(self, name):
        path = os.path.join(TMP, name.replace(" ", "_") + ".png")
        img = bpy.data.images.new(name + " bg", self.w, self.h, alpha=False)
        img.pixels.foreach_set(self.a.ravel())
        img.filepath_raw = path
        img.file_format = "PNG"
        img.save()
        bpy.data.images.remove(img)
        ib = imbuf.load(path)
        for s, x, y, size, color, font, align in self.texts:
            fid = BLF.setdefault(font, blf.load(font))
            with blf.bind_imbuf(fid, ib):
                blf.size(fid, size)
                w = blf.dimensions(fid, s)[0]
                x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
                c = hexrgb(color)
                blf.color(fid, float(c[0]), float(c[1]), float(c[2]), 1.0)
                blf.position(fid, x0, y, 0)
                blf.draw_buffer(fid, s)
        imbuf.write(ib, filepath=path)
        out = bpy.data.images.load(path)
        out.name = name
        out.pack()
        return out


# ---------- dimensions (figure units) ----------
FRONT, SIDE, ZB, ZW, ZTOP = 50, 60, 20, 268, 360
F = FRONT - 1.6  # front plane of the rack equipment
U1 = 8.89        # one rack unit
RACK0 = 54.0     # bottom of U1 (270 mm)
NU = 22          # rack units (rev B)
RACKTOP = 250.0  # top of the rack opening (1250 mm); 22U ends at 249.6


def uz(u):
    """Bottom of rack unit u (1-based)."""
    return RACK0 + (u - 1) * U1


# ---------- castors ----------
for cx, cy in [(-50, -40), (50, -40), (-50, 40), (50, 40)]:
    box("castor plate", cx - 6, cx + 6, cy - 6, cy + 6, ZB - 2, ZB, M["steel"], bevel=0.4)
    for bx in (cx - 4.6, cx + 4.6):
        for by in (cy - 4.6, cy + 4.6):
            cyl("castor bolt", bx, by, ZB - 2.2, 0.7, 0.4, "z", M["steel"], verts=6)
    cyl("castor swivel", cx, cy, ZB - 3, 3.4, 2, "z", M["steel"], bevel=0.3)
    box("castor fork top", cx - 3.6, cx + 3.6, cy - 4.2, cy + 4.2, 15, 16.2, M["steel"], bevel=0.3)
    for px in (cx - 3.6, cx + 2.8):
        box("castor fork", px, px + 0.8, cy - 4.2, cy + 4.2, 5.4, 15.2, M["steel"], bevel=0.2)
    cyl("castor wheel", cx, cy, 7.6, 7.6, 5.2, "x", M["rubber"], verts=40, bevel=1.0)
    cyl("castor hub", cx, cy, 7.6, 3.4, 5.6, "x", M["steel"], bevel=0.3)
    cyl("castor axle nut", cx + 3, cy, 7.6, 1.1, 0.8, "x", M["steel"], verts=6)
    by = cy + 4.2 if cy > 0 else cy - 8.8
    box("brake pedal", cx - 2.2, cx + 2.2, by, by + 4.6, 12.4, 14, M["red"], bevel=0.4)

# ---------- lower body: real panels so the rack is recessed ----------
T = 1.0  # sheet thickness, 5 mm
box("bottom pan", -60, 60, -50, 50, ZB, ZB + T, M["ral7035"], bevel=0)
box("back panel", -60, 60, -50, -50 + T, ZB, ZW, M["ral7035"])
for sx in (-60, 60 - T):
    box("side panel lower", sx, sx + T, -50, 50, ZB, 150, M["ral7035"], bevel=0.3)
    box("side panel upper", sx, sx + T, -50, 50, 150, ZW, M["ral7035"], bevel=0.3)
    box("side panel joint", sx - 0.06, sx + T + 0.06, -49.5, 49.5, 149.85, 150.15, M["hole"])
box("inner back (dark)", -55, 55, -49, -48.5, ZB + T, ZW, M["panelDark"], bevel=0)
for x0 in (-60, 55):
    box("front upright", x0, x0 + 5, 49.2, 50.4, ZB, ZW, M["ral7016"], bevel=0.3)
for x0, x1 in ((-55, -48.5), (48.5, 55)):
    box("rack filler", x0, x1, 48.6, 49.4, RACK0, RACKTOP, M["ral7016"], bevel=0.15)
box("kick plate", -55, 55, 49.4, 50.2, ZB, ZB + 3.6, M["ral7016"])
box("fascia", -55, 55, 49, 50, RACKTOP, 255, M["ral7035"])  # 1250-1275, then the tray slot
box("fascia top", -55, 55, 49, 50, 263.4, ZW, M["ral7035"])
box("rack floor", -55, 55, -48, 50, 51.5, RACK0, M["ral7035"])
box("rack ceiling", -55, 55, -48, 49, RACKTOP, RACKTOP + 1, M["ral7035"])

# cable locker drawer
box("locker front", -54, 54, 49, 51.2, 24, 51, M["ral7035"], bevel=0.4)
box("locker gap", -54.3, 54.3, 49.2, 49.3, 23.7, 51.3, M["hole"])
box("locker handle recess", -20, 20, 51.15, 51.3, 41, 45.6, M["hole"])
for x in (-19, 17.4):
    box("locker handle foot", x, x + 1.6, 51.2, 53.2, 42, 44.6, M["alu"], bevel=0.3)
cyl("locker handle bar", 0, 53.2, 43.3, 0.75, 38, "x", M["alu"], verts=16, bevel=0.3)
cyl("locker lock", 42, 51.8, 36, 2.2, 1.4, "y", M["steel"], bevel=0.3)
box("locker lock slot", 41.7, 42.3, 52.5, 52.6, 35.0, 37.0, M["hole"])
for i in range(6):
    box("locker vent", -50 + i * 5, -47 + i * 5, 51.15, 51.3, 28, 36, M["hole"])

# ---------- 19-inch rails, EIA-310 square holes ----------
for x0, x1, hx in ((-48.4, -45.0, -46.5), (45.0, 48.4, 46.5)):
    box("rack rail", x0, x1, 41, 47.6, RACK0, RACKTOP, M["zinc"], bevel=0.12)
    for u in range(NU):
        for o in (1.27, 4.445, 7.62):
            z = RACK0 + u * U1 + o
            box("rail hole", hx - 0.95, hx + 0.95, 47.55, 47.7, z - 0.95, z + 0.95, M["hole"])


def rack_panel(name, u0, n, material, chassis=(43, 20), thick=0.6):
    """19-inch front panel (482.6 wide) on the rails, cage-nut screws, a chassis behind."""
    z0, z1 = uz(u0), uz(u0 + n)
    box(name, -48.26, 48.26, F - thick, F, z0 + 0.04, z1 - 0.04, material, bevel=0.22)
    hw, depth = chassis
    box(name + " chassis", -hw, hw, F - thick - depth, F - thick, z0 + 0.6, z1 - 0.6, M["panelDark"], bevel=0)
    zs = [z0 + 4.445] if n == 1 else [z0 + 4.445, z1 - 4.445]
    for x in (-46.5, 46.5):
        for z in zs:
            screw(x, z, F)
    return z0, z1


def rack_handle(x, z0, z1):
    for z in (z0, z1):
        box("handle foot", x - 0.85, x + 0.85, F, F + 2.4, z - 0.9, z + 0.9, M["alu"], bevel=0.35)
    cyl("handle bar", x, F + 2.0, (z0 + z1) / 2, 0.8, z1 - z0 + 1.8, "z", M["alu"], verts=16, bevel=0.3)


def legend(body, x, z, size=1.5, material=None, align="LEFT", font=None, y=None):
    return text("legend " + body, body, x, F + 0.02 if y is None else y, z, size, material or M["ink"], align, font=font)


def lamp(x, z, off_mat, on_mat, r=1.25, y=F, lit=False):
    """Panel lamp: chrome bezel, dome lens; returns the lit lens (for toggling) or None."""
    cyl("lamp bezel", x, y + 0.3, z, r + 0.5, 0.6, "y", M["steel"], verts=24, bevel=0.2)
    if lit:
        cyl("lamp lens", x, y + 0.8, z, r, 0.8, "y", on_mat, verts=20, bevel=0.35)
        return None
    cyl("lamp lens", x, y + 0.8, z, r, 0.8, "y", off_mat, verts=20, bevel=0.35)
    return cyl("lamp lens lit", x, y + 0.82, z, r * 1.03, 0.86, "y", on_mat, verts=20, bevel=0.35)


# ===== S1 tap-changer simulator, 3U (U1-3) =====
z0, z1 = rack_panel("S1 tap-changer simulator", 1, 3, M["panel"])
for x in (-44, 44):
    rack_handle(x, z0 + 4, z1 - 4)
DX, DZ = -27, (z0 + z1) / 2
cyl("tap dial bezel", DX, F + 0.5, DZ, 11.0, 1.0, "y", M["steel"], verts=64, bevel=0.35)  # dial 110 mm
cyl("tap dial face", DX, F + 1.05, DZ, 10.0, 0.2, "y", M["face"], verts=64)
for t in range(1, 18):
    a = math.radians(-135 + (t - 1) * 270 / 16)
    L = 1.3 if t % 4 == 1 else 0.75
    m = box("tap tick", -0.2, 0.2, 0, 0, 0, 1, M["ink"])
    m.location = ((DX + math.sin(a) * (7.9 + L / 2)) * U, -(F + 1.17) * U, (DZ + math.cos(a) * (7.9 + L / 2)) * U)
    m.rotation_euler = (0, a, 0)
    m.dimensions = ((0.32 if L > 1 else 0.2) * U, 0.04 * U, L * U)
for t in (1, 5, 9, 13, 17):
    a = math.radians(-135 + (t - 1) * 270 / 16)
    legend(str(t), DX + math.sin(a) * 5.8, DZ + math.cos(a) * 5.8 - 0.55, 1.5, align="CENTER", y=F + 1.17)
legend("TAP", DX, DZ - 5.2, 1.1, align="CENTER", y=F + 1.17)
tap_pivot = empty("tap pointer pivot", DX, F + 1.3, DZ)
box("tap pointer", -0.4, 0.4, -0.1, 0.1, -2.0, 8.6, M["red"], parent=tap_pivot, bevel=0.12).location = (0, 0, 3.3 * U)
cyl("tap hub", DX, F + 1.6, DZ, 1.2, 0.6, "y", M["black"], verts=24, bevel=0.2)
legend("TAP-CHANGER SIMULATOR", -10, z1 - 4.0, 1.6)
box("ops counter frame", -11, 11, F, F + 0.4, z1 - 12.4, z1 - 6.4, M["black"], bevel=0.25)
box("ops counter", -10, 10, F + 0.4, F + 0.45, z1 - 11.7, z1 - 7.1, M["lcd"], bevel=0)
text("ops digits", "01247", 0, F + 0.47, z1 - 10.8, 3.4, M["lcdText"], "CENTER", font=VF_SANS)
legend("OPERATIONS", -11, z1 - 14.2, 1.0)
raise_lamp = lamp(17, z1 - 9.4, M["amberOff"], M["amber"])
lower_lamp = lamp(24, z1 - 9.4, M["amberOff"], M["amber"])
legend("RAISE", 17, z1 - 14.2, 1.0, align="CENTER")
legend("LOWER", 24, z1 - 14.2, 1.0, align="CENTER")
MX, MZ = 36, z1 - 10.6
cyl("motor window ring", MX, F + 0.3, MZ, 5.2, 0.6, "y", M["black"], verts=40, bevel=0.2)
cyl("motor window", MX, F + 0.55, MZ, 4.5, 0.1, "y", M["hole"], verts=40)
rotor = empty("motor rotor", MX, F + 0.7, MZ)
for i in range(3):
    b = box("rotor blade", -3.9, 3.9, -0.1, 0.1, -0.42, 0.42, M["steel"], parent=rotor, bevel=0.08)
    b.location = (0, 0, 0)
    b.rotation_euler = (0, i * math.pi / 3, 0)
cyl("rotor hub", 0, 0, 0, 0.9, 0.4, "y", M["steel"], parent=rotor, verts=16, bevel=0.1).location = (0, -0.1 * U, 0)
legend("MOTOR", MX, MZ - 7.0, 1.0, align="CENTER")
cyl("crank socket", -4, F + 0.7, z0 + 7.2, 2.2, 1.4, "y", M["steel"], verts=32, bevel=0.35)
cyl("crank hole", -4, F + 1.42, z0 + 7.2, 0.9, 0.06, "y", M["hole"], verts=6)
legend("HAND CRANK", -4, z0 + 2.4, 1.0, align="CENTER")
for i in range(6):
    box("S1 vent", 5 + i * 2.7, 6.3 + i * 2.7, F - 0.05, F + 0.03, z0 + 2.4, z0 + 10.0, M["hole"], bevel=0)


# ===== S2 two HMJK-II OLTC monitors upright on one 8U plate (U4-11) =====
def hmjk_lcd_texture(name, tag, tap):
    """57 x 45 mm dark LCD, same look as the HMIET-I screen."""
    c = Canvas(456, 360, "#08131b")
    c.paint(np.exp(-((c.xx - 228) ** 2 + (c.yy - 200) ** 2) / (2 * 230 ** 2)), "#10283a", 0.9)
    c.rrect(0, 312, 456, 360, 0, "#5fd6f2")
    c.text(f"{tag}  OLTC MONITOR", 14, 326, 25, "#06202c", F_BOLD)
    c.text("TAP", 18, 274, 23, "#5fd6f2", F_SANS)
    c.text(tap, 112, 112, 150, "#ffffff", F_BOLD, "center")
    c.rrect(222, 92, 225, 292, 0, "#2e6f84")
    for i, (k, v) in enumerate((("MODE", "MANUAL"), ("I MOTOR", "0.0 A"), ("STATUS", "OK"))):
        y = 256 - i * 62
        c.text(k, 238, y, 21, "#5fd6f2", F_SANS)
        c.text(v, 442, y - 30, 24, "#ffffff", F_BOLD, "right")
    c.rrect(14, 70, 442, 72, 0, "#2e6f84")
    c.text("IEC 61850   ONLINE", 18, 28, 21, "#5fd6f2", F_SANS)
    return c.image(name)


HMJK_LEDS = (("Power", "green", True), ("Run", "green", True), ("Comm", "green", True),
             ("Operating", "amber", None), ("Motor I", "green", None), ("Warning", "amber", False),
             ("Alarm", "red", False))  # None = lit only while the tap changer runs


def hmjk(tag, cx, cz):
    """HMJK-II module, front 130 x 340.4 mm on the plate, body 200 deep behind it."""
    W, H = 26.0, 68.08
    x0, zt = cx - W / 2, cz + H / 2
    P = F + 0.8  # module front face
    box(f"{tag} HMJK-II body", cx - 12.4, cx + 12.4, F - 0.6 - 40, F - 0.6, cz - 32.2, cz + 32.2, M["alu"], bevel=0.2)
    box(f"{tag} HMJK-II front", x0, x0 + W, F, P, zt - H, zt, M["hmjk"], bevel=0.3)

    def mx(mm):
        return x0 + mm / 5

    def mz(mm):
        return zt - mm / 5

    for x in (mx(7), mx(123)):
        for z in (mz(7), mz(333.4)):
            screw(x, z, P, r=0.5, washer=False)
    # legend "HMJK-II": bold sans plus a serif "II" that reads as the Roman numeral two
    a = legend("HMJK-", 0, 0, 1.5, font=VF_BOLD, y=P + 0.02)
    b = legend("II", 0, 0, 1.5, font=VF_ROMAN, y=P + 0.02)
    wa, wb = a.dimensions.x / U, b.dimensions.x / U
    left = mx(65) - (wa + 0.15 + wb) / 2
    a.location = (left * U, -(P + 0.02) * U, mz(22) * U)
    b.location = ((left + wa + 0.15) * U, -(P + 0.02) * U, mz(22) * U)
    # LCD 57 x 45 mm in a gloss-black frame
    lx0, lx1, lz1, lz0 = mx(36.5), mx(93.5), mz(34), mz(79)
    box("lcd frame", lx0 - 0.8, lx1 + 0.8, P, P + 0.35, lz0 - 0.8, lz1 + 0.8, M["gloss"], bevel=0.2)
    screens = []
    for tap in ("09", "10"):
        img = hmjk_lcd_texture(f"{tag} HMJK LCD {tap}", tag, tap)
        screens.append(plane_front(f"{tag} HMJK LCD {tap}", lx0, lx1, lz0, lz1, P + 0.36,
                                   tex_mat(f"{tag} HMJK LCD {tap}", img, 0.15, 1.0)))
    # status LED column
    busy = []
    for i, (label, colour, on) in enumerate(HMJK_LEDS):
        z = mz(100 + i * 11.5)
        x = mx(36)
        cyl("led bezel", x, P + 0.1, z, 0.62, 0.2, "y", M["black"], verts=16, bevel=0.06)
        off, lit = M[colour + "Off"], M[{"green": "green", "red": "redLed", "amber": "amber"}[colour]]
        cyl("led lens", x, P + 0.35, z, 0.42, 0.4, "y", lit if on else off, verts=16, bevel=0.15)
        if on is None:
            busy.append(cyl("led lens lit", x, P + 0.36, z, 0.44, 0.44, "y", lit, verts=16, bevel=0.15))
        text("led label", label, mx(44), P + 0.02, z - 0.36, 1.0, M["ink"])
    # 5-key navigation keypad: diamond of arrows round OK
    kx, kz = mx(65), mz(222)
    cyl("keypad ring", kx, P + 0.04, kz, 6.3, 0.08, "y", M["ink"], verts=48)
    cyl("keypad ring face", kx, P + 0.06, kz, 6.05, 0.08, "y", M["hmjk"], verts=48)
    for dx, dz, rot in ((0, 3.1, 0), (0, -3.1, 180), (-3.1, 0, -90), (3.1, 0, 90), (0, 0, None)):
        x, z = kx + dx, kz + dz
        box("key well", x - 1.2, x + 1.2, P, P + 0.15, z - 1.2, z + 1.2, M["black"], bevel=0.15)
        box("nav key", x - 1.0, x + 1.0, P + 0.15, P + 0.8, z - 1.0, z + 1.0, M["keyGrey"], bevel=0.3)
        if rot is None:
            text("key OK", "OK", x, P + 0.81, z - 0.33, 0.95, M["white"], "CENTER", font=VF_BOLD)
        else:
            r = math.radians(rot)
            tri = [(0, 0.5), (-0.45, -0.3), (0.45, -0.3)]
            pts = [(x + px * math.cos(r) + pz * math.sin(r), z - px * math.sin(r) + pz * math.cos(r)) for px, pz in tri]
            prism("arrow", pts, P + 0.79, P + 0.83, M["white"])
    # unit tag
    box("unit tag", mx(42), mx(88), P, P + 0.12, mz(296) - 1.9, mz(296) + 1.9, M["label"], bevel=0.08)
    text("unit tag text", tag, mx(65), P + 0.13, mz(296) - 0.6, 1.6, M["ink"], "CENTER", font=VF_BOLD)
    return screens, busy


z0, z1 = rack_panel("S2 HMJK-II plate", 4, 8, M["ral7016"], chassis=(1, 1))
JZ = (z0 + z1) / 2
hmjk_t1 = hmjk("T1", -15, JZ)
hmjk_t2 = hmjk("T2", 15, JZ)


# ===== S3 / S4 HMIET-I automatic voltage regulator, native 19-inch 4U =====
def lcd_texture(name, tag, role, tap):
    """82 x 80 mm dark graphic LCD with cyan/white text."""
    c = Canvas(512, 500, "#08131b")
    c.paint(np.exp(-((c.xx - 256) ** 2 + (c.yy - 280) ** 2) / (2 * 260 ** 2)), "#10283a", 0.9)
    c.rrect(0, 436, 512, 500, 0, "#5fd6f2")
    c.text(f"{tag}  {role}", 18, 456, 30, "#06202c", F_BOLD)
    c.text("MANUAL", 494, 456, 30, "#06202c", F_BOLD, "right")  # rev B: no grid source, manual demo
    c.text("TAP POSITION", 22, 392, 26, "#5fd6f2", F_SANS)
    c.text(tap, 256, 196, 210, "#ffffff", F_BOLD, "center")
    c.rrect(18, 176, 494, 179, 0, "#2e6f84")
    for i, (k, v) in enumerate((("U", "11.00 kV"), ("U set", "11.00 kV  \u00b11.0 %"), ("Delay", "T1 30 s"))):
        y = 136 - i * 44
        c.text(k, 22, y, 27, "#5fd6f2", F_SANS)
        c.text(v, 494, y, 27, "#ffffff", F_SANS, "right")
    c.rrect(18, 26, 494, 28, 0, "#2e6f84")
    return c.image(name)


HM_LEDS = (("Run", "green", True), ("Fault", "red", False), ("Remote", "green", True), ("Auto", "green", False),
           ("Parallel", "green", True), ("U/I Block", "red", False), ("Tap Block", "red", False),
           ("AVR Failed", "red", False), ("Regulating", "amber", False), ("Par.Block", "red", False))


def hmiet(u0, tag, role):
    z0, z1 = uz(u0), uz(u0 + 4)
    zt = z0 + 0.08 + 35.4  # top edge of the 177 mm panel
    cz = (z0 + z1) / 2
    box(f"{tag} HMIET-I panel", -48.28, 48.28, F - 0.8, F, zt - 35.4, zt, M["anod"], bevel=0.3)
    box(f"{tag} HMIET-I body", -42.64, 42.64, F - 0.8 - 53.4, F - 0.8, z0 + 0.4, z1 - 0.4, M["alu"], bevel=0.2)

    def hx(mm):
        return -48.28 + mm / 5

    def hz(mm):
        return zt - mm / 5

    # slotted ears: slots 6.5 wide, 101.6 apart, hole centres 465 apart
    for x in (-46.5, 46.5):
        for z in (cz - 10.16, cz + 10.16):
            box("ear slot", x - 1.3, x + 1.3, F - 0.05, F + 0.02, z - 0.65, z + 0.65, M["hole"], bevel=0)
            screw(x, z, F)
    # status LED column, 36 mm from the left edge
    regulating = None
    for i, (label, colour, on) in enumerate(HM_LEDS):
        z = hz(20 + i * 15.5)
        x = hx(36)
        cyl("led bezel", x, F + 0.1, z, 0.62, 0.2, "y", M["black"], verts=16, bevel=0.06)
        off, lit = M[colour + "Off"], M[{"green": "green", "red": "redLed", "amber": "amber"}[colour]]
        cyl("led lens", x, F + 0.35, z, 0.42, 0.4, "y", lit if on else off, verts=16, bevel=0.15)
        if label == "Regulating":
            regulating = cyl("led lens lit", x, F + 0.36, z, 0.44, 0.44, "y", lit, verts=16, bevel=0.15)
        text("led label", label, hx(41), F + 0.02, z - 0.36, 1.1, M["ink"])
    # LCD 82 x 80 mm in a gloss-black frame
    lx0, lx1, lz1, lz0 = hx(115), hx(197), hz(10), hz(91)
    box("lcd frame", lx0 - 1.0, lx1 + 1.0, F, F + 0.35, lz0 - 1.0, lz1 + 1.0, M["gloss"], bevel=0.2)
    screens = []
    for tap in ("09", "10"):
        img = lcd_texture(f"{tag} LCD {tap}", tag, role, tap)
        screens.append(plane_front(f"{tag} LCD {tap}", lx0, lx1, lz0, lz1, F + 0.36, tex_mat(f"{tag} LCD {tap}", img, 0.15, 1.0)))
    legend("MENU", (lx0 + lx1) / 2, lz0 - 2.6, 0.9, align="CENTER")
    # navigation keypad: diamond of arrows round OK, ESC and RST beside it
    kx, kz = hx(316.5), hz(57.5)
    cyl("keypad ring", kx, F + 0.04, kz, 6.3, 0.08, "y", M["ink"], verts=48)
    cyl("keypad ring face", kx, F + 0.06, kz, 6.05, 0.08, "y", M["anod"], verts=48)
    for dx, dz, rot in ((0, 3.1, 0), (0, -3.1, 180), (-3.1, 0, -90), (3.1, 0, 90), (0, 0, None)):
        x, z = kx + dx, kz + dz
        box("key well", x - 1.2, x + 1.2, F, F + 0.15, z - 1.2, z + 1.2, M["black"], bevel=0.15)
        box("nav key", x - 1.0, x + 1.0, F + 0.15, F + 0.8, z - 1.0, z + 1.0, M["keyGrey"], bevel=0.3)
        if rot is None:
            text("key OK", "OK", x, F + 0.81, z - 0.33, 0.95, M["white"], "CENTER", font=VF_BOLD)
        else:
            a = math.radians(rot)
            tri = [(0, 0.5), (-0.45, -0.3), (0.45, -0.3)]
            pts = [(x + px * math.cos(a) + pz * math.sin(a), z - px * math.sin(a) + pz * math.cos(a)) for px, pz in tri]
            prism("arrow", pts, F + 0.79, F + 0.83, M["white"])
    for label, ymm in (("ESC", 46), ("RST", 69)):
        x, z = hx(356), hz(ymm)
        box("key well", x - 1.4, x + 1.4, F, F + 0.15, z - 1.2, z + 1.2, M["black"], bevel=0.15)
        box("func key", x - 1.2, x + 1.2, F + 0.15, F + 0.8, z - 1.0, z + 1.0, M["keyGrey"], bevel=0.3)
        text("key " + label, label, x, F + 0.81, z - 0.3, 0.85, M["white"], "CENTER", font=VF_BOLD)
    # print: title top-right, unit tag
    legend("I", hx(452) - 25.95, hz(24), 1.9, font=VF_ROMAN, align="RIGHT")  # serif "I" reads as Roman numeral one
    legend("HMIET-", hx(452) - 26.5, hz(24), 1.9, font=VF_BOLD, align="RIGHT")
    legend("AUTOMATIC VOLTAGE REGULATOR", hx(452), hz(24), 1.5, align="RIGHT")

    box("unit tag", hx(392), hx(452), F, F + 0.12, hz(118) - 1.9, hz(118) + 1.9, M["label"], bevel=0.08)
    text("unit tag text", f"{tag}  {role}", hx(422), F + 0.13, hz(118) - 0.6, 1.6, M["ink"], "CENTER", font=VF_BOLD)
    return screens, regulating


t1_lcd, t1_reg = hmiet(12, "T1", "MASTER")
t2_lcd, t2_reg = hmiet(16, "T2", "FOLLOWER")


# ===== S5 + S6 two HMC-3C tap position indicators on one 3U plate =====
def hmc_face_texture():
    """Printed face of the HMC-3C, 187.5 x 91.5 mm (inside the bezel)."""
    W, H = 1024, 500
    s = W / 187.5
    c = Canvas(W, H, "#d9dcdc")

    def p(x, y):
        return x * s, y * s

    c.text("HMC-3C \u578b", *p(26, 72.5), 8.0 * s, "#1b1f22", F_CJK)
    c.text("\u6709\u8f7d\u5206\u63a5\u5f00\u5173\u4f4d\u7f6e\u6307\u793a\u5668", *p(8, 61), 5.6 * s, "#1b1f22", F_CJK)
    c.text("LOAD TAP POSITION INDICATOR", *p(8, 53.6), 4.4 * s, "#1b1f22", F_SANS)
    for x, zh, en in ((22, "\u8fdc\u63a7\u6307\u793a\u706f", "TELECONTROL"), (56, "\u5347\u538b", "1-N"),
                      (90, "\u505c\u6b62", "STOP"), (124, "\u964d\u538b", "N-1"), (164, "\u7535\u6e90", "POWER")):
        c.text(zh, *p(x, 42.4), 4.2 * s, "#1b1f22", F_CJK, "center")
        c.text(en, *p(x, 37.8), 3.3 * s, "#1b1f22", F_SANS, "center")
    c.rrect(*p(6, 18.5), *p(181.5, 18.8), 0, "#9ea4a6")
    return c.image("HMC-3C face")


M["hmcFace"] = tex_mat("HMC-3C face", hmc_face_texture(), 0.5)
SEGS = {"0": "abcdef", "1": "bc", "9": "abcdfg"}


def seven_seg(cx, cz, digit_set, y0, y1, material, W=2.8, H=4.4, t=0.62, slant=0.1):
    """Slanted hexagon segments; returns the objects for the segments in digit_set."""
    pos = {"a": (0, H / 2, True), "b": (W / 2, H / 4, False), "c": (W / 2, -H / 4, False),
           "d": (0, -H / 2, True), "e": (-W / 2, -H / 4, False), "f": (-W / 2, H / 4, False), "g": (0, 0, True)}
    out = []
    for sname in digit_set:
        ax, az, horiz = pos[sname]
        hl, ht = ((W if horiz else H / 2) - 0.28) / 2, t / 2
        base = [(-hl, 0), (-hl + ht, -ht), (hl - ht, -ht), (hl, 0), (hl - ht, ht), (-hl + ht, ht)]
        pts = [(px, pz) if horiz else (-pz, px) for px, pz in base]
        pts = [(cx + ax + px + (az + pz) * slant, cz + az + pz) for px, pz in pts]
        out.append(prism("segment", pts, y0, y1, material))
    return out


def hmc(tag, cx, cz):
    P = F
    box(f"{tag} HMC-3C bezel", cx - 19.2, cx + 19.2, P, P + 1.0, cz - 9.6, cz + 9.6, M["hmcBezel"], bevel=0.3)
    plane_front(f"{tag} HMC-3C face", cx - 18.75, cx + 18.75, cz - 9.15, cz + 9.15, P + 1.005, M["hmcFace"])

    def fx(mm):
        return cx - 18.75 + mm / 5

    def fz(mm):
        return cz - 9.15 + mm / 5

    Y = P + 1.0
    for x in (fx(4.0), fx(183.5)):
        screw(x, fz(46), Y, r=0.42, washer=False)
    # LED window and 7-segment digits
    box("led window frame", fx(111), fx(173), Y, Y + 0.12, fz(54), fz(86), M["black"], bevel=0.1)
    box("led window", fx(112), fx(172), Y + 0.12, Y + 0.24, fz(55), fz(85), M["ledWin"], bevel=0.06)
    dz = fz(70)
    digits = {}
    for x in (fx(132), fx(153)):
        seven_seg(x, dz, "abcdefg", Y + 0.24, Y + 0.25, M["ledOff"])
    for value in ("09", "10"):
        segs = seven_seg(fx(132), dz, SEGS[value[0]], Y + 0.24, Y + 0.28, M["ledOn"])
        segs += seven_seg(fx(153), dz, SEGS[value[1]], Y + 0.24, Y + 0.28, M["ledOn"])
        digits[value] = join(segs, f"{tag} HMC digits {value}")
    # lamp keys
    lit = {}
    for x, kind in ((22, "tele"), (56, "raise"), (90, "stop"), (124, "lower"), (164, "power")):
        kx, kz = fx(x), fz(28)
        box("key collar", kx - 1.5, kx + 1.5, Y, Y + 0.25, kz - 1.5, kz + 1.5, M["keyCollar"], bevel=0.12)
        m = {"tele": M["hmcGreenLit"], "power": M["hmcRedLit"]}.get(kind, M["hmcGreen"])
        box("lamp key", kx - 1.25, kx + 1.25, Y + 0.25, Y + 1.0, kz - 1.25, kz + 1.25, m, bevel=0.32)
        if kind in ("raise", "lower"):
            lit[kind] = box("lamp key lit", kx - 1.27, kx + 1.27, Y + 0.25, Y + 1.03, kz - 1.27, kz + 1.27, M["hmcGreenLit"], bevel=0.32)
    return digits, lit


z0, z1 = rack_panel("S5+S6 HMC plate", 20, 3, M["ral7016"])
HZ = (z0 + z1) / 2 + 0.8
hmc_t1, hmc_t1_keys = hmc("T1", -23.2, HZ)
hmc_t2, hmc_t2_keys = hmc("T2", 23.2, HZ)
for tag, x in (("T1  TAP POSITION", -23.2), ("T2  TAP POSITION", 23.2)):
    text("plate label", tag, x, F + 0.02, z0 + 1.1, 1.2, M["white"], "CENTER", font=VF_BOLD)

# ===== back panel: brush-strip cable entry plate, 400 x 45, 300-345 high =====
BY = -50.0  # outer face of the back panel (figure y)
bz = 64.5
box("rear brush plate", -40, 40, BY - 0.6, BY, bz - 4.5, bz + 4.5, M["black"], bevel=0.2)
box("rear brush slot", -37.6, 37.6, BY - 0.64, BY - 0.6, bz - 2.1, bz + 2.1, M["hole"], bevel=0)
box("rear brush upper", -37.2, 37.2, BY - 0.68, BY - 0.62, bz + 0.06, bz + 2.0, M["bristle"])
box("rear brush lower", -37.2, 37.2, BY - 0.68, BY - 0.62, bz - 2.0, bz - 0.06, M["bristle"])
for x in (-38.9, 38.9):
    cyl("rear brush screw", x, BY - 0.8, bz, 0.6, 0.4, "y", M["steel"], verts=16, bevel=0.15)
box("inner brush slot", -37.6, 37.6, -48.5, -48.44, bz - 2.1, bz + 2.1, M["hole"], bevel=0)
box("inner brush upper", -37.2, 37.2, -48.44, -48.3, bz + 0.06, bz + 2.0, M["bristle"])
box("inner brush lower", -37.2, 37.2, -48.44, -48.3, bz - 2.0, bz - 0.06, M["bristle"])

# ===== BCD box inside on the back panel: DIN rail, 200 W x 120 H x 75 D, 1000-1120 high =====
BB = -48.5  # inner face of the back panel
box("BCD DIN rail", -26, 26, BB, BB + 1.5, 208.5, 215.5, M["zinc"], bevel=0.1)
box("BCD box", -20, 20, BB + 1.5, BB + 15, 200, 224, M["bcd"], bevel=0.5)
BF = BB + 15  # front face of the BCD box
box("BCD lid", -17, 17, BF, BF + 0.3, 207, 217, M["label"], bevel=0.2)
text("BCD label", "BCD", 0, BF + 0.32, 211, 2.6, M["ink"], "CENTER", font=VF_BOLD)
for zr in (201.2, 218.6):
    for i in range(14):
        x = -17.5 + i * 2.7
        box("BCD terminal", x - 1.1, x + 1.1, BF, BF + 1.6, zr, zr + 4.2, M["terminal"], bevel=0.15)
        cyl("terminal screw", x, BF + 1.65, zr + 2.1, 0.55, 0.1, "y", M["steel"], verts=12)

# ---------- worktop, tray, keyboard ----------
box("worktop", -61.5, 61.5, -51, 52.5, ZW, ZW + 3, M["worktop"], bevel=0.6)
cyl("cable grommet", -42, 36, ZW + 3.1, 4.4, 0.4, "z", M["black"], bevel=0.15)
cyl("grommet hole", -42, 36, ZW + 3.3, 3, 0.2, "z", M["hole"])

tray = empty("keyboard tray", 0, 0, 0)
for x in (-42.6, 40.4):
    box("tray slide outer", x, x + 2.2, 26, 74, 254.6, 255.8, M["zinc"], bevel=0.1)
    box("tray slide inner", x + 0.3, x + 1.9, 50, 87, 255.8, 257, M["zinc"], parent=tray, bevel=0.1)
box("tray board", -44, 44, 50, 90, 257, 259, M["ral7016"], parent=tray, bevel=0.5)
box("tray lip", -44, 44, 88, 90, 259, 260.2, M["ral7016"], parent=tray, bevel=0.4)
box("tray pull", -10, 10, 88.6, 90.4, 257.4, 259.6, M["alu"], parent=tray, bevel=0.5)
box("keyboard", -34, 28, 57, 79, 259, 260.6, M["black"], parent=tray, bevel=0.6)
for r in range(5):
    for c in range(14):
        box("key", -32 + c * 4.2, -28.6 + c * 4.2, 59 + r * 3.8, 62 + r * 3.8, 260.6, 261.4, M["panelDark"], parent=tray, bevel=0.25)
box("space bar", -20, 2, 77.2, 78.6, 260.6, 261.4, M["panelDark"], parent=tray, bevel=0.25)
box("mouse", 32, 38, 64, 73, 259, 261, M["black"], parent=tray, bevel=1.2)

# ---------- upper frame, back panel, screen ----------
for x, y in ((-60, -50), (57, -50), (-60, 47), (57, 47)):
    box("frame post", x, x + 3, y, y + 3, ZW + 3, ZTOP - 4, M["ral7016"], bevel=0.3)
for bar in ((-60, -57, -50, 50), (-60, 60, -50, -47), (57, 60, -50, 50), (-60, 60, 47, 50)):
    box("top frame bar", bar[0], bar[1], bar[2], bar[3], ZTOP - 4, ZTOP, M["ral7016"], bevel=0.4)
for x, y in ((-60, -50), (52, -50), (-60, 42), (52, 42)):
    box("corner plate", x, x + 8, y, y + 8, ZTOP, ZTOP + 0.6, M["ral7016"], bevel=0.2)
box("perforated back", -57, 57, -50, -47.6, ZW + 3, ZTOP - 4, M["ral7035"])
for ix in range(21):
    for iz in range(15):
        box("perforation", -50 + ix * 5 - 0.6, -50 + ix * 5 + 0.6, -47.7, -47.5, ZW + 10 + iz * 5 - 0.6, ZW + 10 + iz * 5 + 0.6, M["hole"])

box("stand foot", -14, 14, 6, 24, ZW + 3, ZW + 4.6, M["black"], bevel=0.8)
cyl("stand pole", 0, 16, ZW + 4.6 + 11, 2.6, 22, "z", M["black"], bevel=0.3)
box("stand head", -8, 8, 18, 23.6, 300, 314, M["black"], bevel=0.6)
cyl("tilt hinge", 0, 24.6, 307, 1.4, 12, "x", M["steel"], bevel=0.2)
box("monitor", -46, 46, 26, 30, 278, 334, M["black"], bevel=0.8)
box("screen", -43.4, 43.4, 29.95, 30.1, 282, 331.4, M["screen"], bevel=0)
cyl("monitor led", 42, 30.2, 280, 0.6, 0.3, "y", M["amber"], verts=10)
SY = 30.15
box("hmi bar", -43.4, 43.4, SY - 0.02, SY + 0.02, 327, 331.4, M["lcd"], bevel=0)
text("hmi title", "TAP CONTROL  T1 | T2", -41.4, SY + 0.05, 328.2, 2.4, M["lcdText"])
hmi_taps = {}
for (t, role, z) in (("T1", "MASTER", 310), ("T2", "FOLLOWER", 289)):
    box("hmi tile", -41.4, -15.4, SY - 0.02, SY + 0.03, z, z + 15, M["lcd"], bevel=0)
    text("hmi role", f"{t}  {role}", -39.4, SY + 0.05, z + 10.6, 2.2, M["lcdText"])
    hmi_taps[t] = {v: text("hmi tap " + v, v, -39.4, SY + 0.05, z + 2, 7, M["lcdText"]) for v in ("09", "10")}
box("hmi chart", -12, 41, SY - 0.02, SY + 0.03, 286, 324, M["lcd"], bevel=0)
pts = [(-12, 296), (6, 296), (6, 312), (26, 312), (26, 296), (41, 296)]  # tap trend: 9, raise to 10, lower to 9
for (ax, az), (bx, bz) in zip(pts, pts[1:]):
    seg = box("hmi trend", 0, 1, 0, 0.1, -0.3, 0.3, M["amber"], bevel=0)
    length = math.hypot(bx - ax, bz - az)
    seg.dimensions = (length * U, 0.1 * U, 0.6 * U)
    seg.location = ((ax + bx) / 2 * U, -(SY + 0.08) * U, (az + bz) / 2 * U)
    seg.rotation_euler = (0, -math.atan2(bz - az, bx - ax), 0)
for i in range(5):
    cyl("monitor button", 36 - i * 2.4, 30.25, 279.8, 0.5, 0.3, "y", M["panelDark"], verts=10)

# ---------- right side: duct, power, handle, fan, louvres, label, earth ----------
X = SIDE
box("cable duct", X, X + 3.6, 15, 28, 26, 236, M["ral7016"], bevel=0.4)
for z in range(40, 230, 24):
    box("duct cover clip", X + 3.5, X + 3.8, 18, 25, z, z + 1.2, M["black"], bevel=0.1)
box("power strip", X, X + 2.8, -40, 4, 30, 39, M["black"], bevel=0.6)
for y in (-34, -22, -10):
    box("socket", X + 2.75, X + 2.95, y, y + 9, 31.6, 37.4, M["panelDark"], bevel=0.1)
    for (a, z, w, h) in ((y + 3.2, 35.6, 2.4, 0.6), (y + 1.8, 33.2, 0.7, 1.4), (y + 6.5, 33.2, 0.7, 1.4)):
        box("socket pin hole", X + 2.9, X + 3.0, a, a + w, z, z + h, M["hole"])
box("strip switch", X + 2.8, X + 3.6, -1, 2, 32.4, 36.6, M["red"], bevel=0.3)
box("plug", 67, 73, -69, -63, 0, 4, M["black"], bevel=0.8)
curve = bpy.data.curves.new("power lead", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.6 * U
curve.bevel_resolution = 3
spline = curve.splines.new("BEZIER")
lead = [(X + 1.4, 6, 33), (X + 2, 10.6, 20), (X + 3, 10.6, 1.2), (69, -10, 0.8), (70, -63, 2)]
spline.bezier_points.add(len(lead) - 1)
for p, (x, y, z) in zip(spline.bezier_points, lead):
    p.co = (x * U, -y * U, z * U)
    p.handle_left_type = p.handle_right_type = "AUTO"
lead_obj = bpy.data.objects.new("power lead", curve)
COLL.objects.link(lead_obj)
curve.materials.append(M["black"])
bpy.ops.object.select_all(action="DESELECT")
bpy.context.view_layer.objects.active = lead_obj
lead_obj.select_set(True)
bpy.ops.object.convert(target="MESH")
bpy.context.active_object.data.shade_smooth()
bpy.context.active_object.select_set(False)

for y in (-36, 4):
    box("handle standoff", X, X + 4.6, y - 1.6, y + 1.6, 240.4, 243.6, M["alu"], bevel=0.4)
cyl("push handle", X + 4.6, -16, 242, 1.7, 48, "y", M["alu"], bevel=0.4)
box("fan frame", X, X + 1.2, -39, -13, 99, 125, M["black"], bevel=0.6)
cyl("fan opening", X + 1.1, -26, 112, 11.6, 0.3, "x", M["hole"], verts=40)
for i in range(7):
    b = box("fan blade", X + 0.6, X + 0.9, -26 - 1.6, -26 + 1.6, 112, 112 + 10, M["black"], bevel=0)
    b.rotation_euler = (math.radians(i * 360 / 7), 0, 0)
    b.location = ((X + 0.75) * U, 26 * U - math.sin(math.radians(i * 360 / 7)) * 5 * U, 112 * U + math.cos(math.radians(i * 360 / 7)) * 5 * U)
for r in (12, 8.6, 5.4):
    bpy.ops.mesh.primitive_torus_add(major_radius=r * U, minor_radius=0.25 * U, minor_segments=8,
                                     location=((X + 1.5) * U, 26 * U, 112 * U), rotation=(0, math.pi / 2, 0))
    g = link(bpy.context.active_object, M["steel"])
    g.name = "fan guard ring"
    g.data.shade_smooth()
for a in (0, 90):
    b = box("fan guard spoke", X + 1.4, X + 1.6, -26 - 12, -26 + 12, 111.8, 112.2, M["steel"], bevel=0)
    b.rotation_euler = (math.radians(a), 0, 0)
for y, z in ((-37.4, 101), (-14.6, 101), (-37.4, 123), (-14.6, 123)):
    cyl("fan screw", X + 1.3, y, z, 0.7, 0.3, "x", M["steel"], verts=12, bevel=0.1)
box("louvre recess", X + 0.02, X + 0.12, -31, 5, 234.6, 261.4, M["hole"])
for i in range(7):
    z = 236.6 + i * 3.4
    l = box("louvre", X, X + 0.4, -30, 4, z - 1.1, z + 1.1, M["ral7035"], bevel=0.1)
    l.rotation_euler = (0, math.radians(-30), 0)
box("label plate", X, X + 0.4, -30, -8, 178, 190, M["label"], bevel=0.15)
side_text("label", "AVR DEMO CABINET", X + 0.42, -9.2, 186, 1.5, M["ink"], "LEFT")
for z, w in ((183, 15), (180.6, 11)):
    box("label print", X + 0.4, X + 0.45, -9.2 - w, -9.2, z - 0.25, z + 0.25, M["ink"])
for y in (-29, -9):
    for z in (179, 189):
        cyl("label rivet", X + 0.45, y, z, 0.4, 0.2, "x", M["steel"], verts=10, bevel=0.08)
cyl("earth stud", X + 0.5, -44, 30, 2.6, 1, "x", M["steel"], bevel=0.2)
cyl("earth nut", X + 2.2, -44, 30, 1.2, 2.4, "x", M["steel"], verts=6, bevel=0.1)
side_text("earth mark", "PE", X + 0.02, -42, 34.0, 1.6, M["ink"], "CENTER")

# ---------- detail pass ----------
for x in (-57.5, 57.5):
    for z in range(28, ZW - 4, 30):
        cyl("upright bolt", x, 50.6, z, 0.9, 0.5, "y", M["steel"], verts=6, bevel=0.1)
for z in (130, 210):
    box("lift handle recess", X + 0.95, X + 1.02, -10, 10, z - 1.6, z + 1.6, M["hole"])
    box("lift handle grip", X + 1.0, X + 1.3, -8, 8, z - 0.5, z + 0.5, M["alu"], bevel=0.1)
for z0_, z1_ in ((ZB, 150), (150, ZW)):
    for y in (-47, 47):
        for k in range(4):
            cyl("panel screw", X + 1.05, y, z0_ + 5 + k * (z1_ - z0_ - 9) / 3, 0.6, 0.3, "x", M["steel"], verts=12, bevel=0.1)
for x, y in ((-61.5, -51), (58.5, -51), (-61.5, 49.5), (58.5, 49.5)):
    box("corner bumper", x, x + 3, y, y + 3, ZW - 0.6, ZW + 3.6, M["rubber"], bevel=0.6)

# ---------- animation: one 12 s loop ----------
# rev B, no grid source: RAISE on the T1 master at 4 s, the T1 tap changer runs one step (simulator
# dial + rotor), the T2 follower copies 0.6 s later; LOWER at 9.4 s brings both back to tap 9.


def at(sec):
    return int(round(sec * FPS)) + 1


for f, t in ((0, 9), (4, 9), (5.3, 10), (9.4, 10), (10.7, 9), (12, 9)):
    tap_pivot.rotation_euler = (0, math.radians(-135 + (t - 1) * 270 / 16), 0)
    tap_pivot.keyframe_insert("rotation_euler", frame=at(f))
for f, spin in ((0, 0), (4, 0), (5.3, 6 * math.pi), (9.4, 6 * math.pi), (10.7, 0), (12, 0)):
    rotor.rotation_euler = (0, spin, 0)
    rotor.keyframe_insert("rotation_euler", frame=at(f))


def toggle(obj, spans):
    """Scale 1 inside the given spans of seconds, ~0 elsewhere (constant steps)."""
    times = [(0, spans[0][0] <= 0)]
    for a, b in spans:
        times += [(max(a, 0), True), (b, False)]
    for sec, on in times:
        obj.scale = (1, 1, 1) if on else (0.0001, 0.0001, 0.0001)
        obj.keyframe_insert("scale", frame=at(sec))
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "CONSTANT"


def tap_story(on09, on10, lag):
    """09 shown before the raise and after the lower; 10 in between. lag = follower delay."""
    toggle(on10, [(5.3 + lag, 10.7 + lag)])
    toggle(on09, [(0, 5.3 + lag), (10.7 + lag, 13)])


toggle(raise_lamp, [(4, 5.3)])
toggle(lower_lamp, [(9.4, 10.7)])
for lag, lcd, reg, digs, keys, hmi, mon in (
        (0, t1_lcd, t1_reg, hmc_t1, hmc_t1_keys, hmi_taps["T1"], hmjk_t1),
        (0.6, t2_lcd, t2_reg, hmc_t2, hmc_t2_keys, hmi_taps["T2"], hmjk_t2)):
    tap_story(lcd[0], lcd[1], lag)
    tap_story(mon[0][0], mon[0][1], lag)
    for led in mon[1]:  # HMJK-II logs the operation and the motor current
        toggle(led, [(4 + lag, 5.3 + lag), (9.4 + lag, 10.7 + lag)])
    tap_story(digs["09"], digs["10"], lag)
    tap_story(hmi["09"], hmi["10"], lag)
    toggle(reg, [(4 + lag, 5.3 + lag), (9.4 + lag, 10.7 + lag)])
    toggle(keys["raise"], [(4 + lag, 5.3 + lag)])
    toggle(keys["lower"], [(9.4 + lag, 10.7 + lag)])
for f, dy in ((0, 0), (1.5, 0), (2.5, 1), (9.5, 1), (10.5, 0), (12, 0)):
    tray.location = (0, (1 - dy) * 30 * U, 0)  # in = pushed 150 mm back
    tray.keyframe_insert("location", frame=at(f))

# ---------- bake modifiers, then merge static parts by material (fewer draw calls) ----------
bpy.ops.object.select_all(action="DESELECT")
mods = [o for o in scene.objects if o.type == "MESH" and o.modifiers]
for o in mods:
    o.select_set(True)
bpy.context.view_layer.objects.active = mods[0]
bpy.ops.object.convert(target="MESH")
groups = {}
for obj in list(scene.objects):
    if obj.type != "MESH" or obj.animation_data or not obj.data.materials:
        continue
    # static parts merge by material; parts riding on a moving parent merge within that parent
    key = (obj.parent.name if obj.parent else "", obj.data.materials[0].name)
    groups.setdefault(key, []).append(obj)
for name, objs in groups.items():
    if len(objs) > 1:
        join(objs, (name[0] + " " if name[0] else "") + name[1])
meshes = [o for o in scene.objects if o.type == "MESH"]
print("objects after merge:", len(meshes), "verts:", sum(len(o.data.vertices) for o in meshes))

# ---------- export ----------
bpy.ops.object.select_all(action="DESELECT")
scene.frame_set(1)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_animations=True,
    export_animation_mode="SCENE",
    export_anim_scene_split_object=False,  # one animation: model-viewer autoplays only the first
    export_force_sampling=True,
    export_frame_range=True,
    export_yup=True,
    export_image_format="JPEG",
    export_jpeg_quality=90,
)
print("exported", OUT)
try:
    bpy.ops.wm.usd_export(filepath=OUT.replace(".glb", ".usdz"), export_animation=False, selected_objects_only=False)
    print("exported usdz")
except Exception as error:  # iPhone AR is optional
    print("usdz skipped:", error)


# ---------- poster and check renders: soft studio light, AgX ----------
def studio():
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = srgb("#eef0ee")
    bg.inputs[1].default_value = 0.45
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = -0.35
    engines = bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys()
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    ee = scene.eevee
    ee.taa_render_samples = 64
    for attr, val in (("use_raytracing", True), ("use_shadows", True), ("shadow_ray_count", 2), ("shadow_step_count", 8)):
        if hasattr(ee, attr):
            setattr(ee, attr, val)
    target = empty("light target", 0, 0, 170)
    for name, loc, energy, size in (("key", (2.6, -2.8, 3.0), 950, 3.0), ("fill", (-3.0, -2.2, 1.5), 380, 3.5),
                                    ("rim", (1.4, 2.8, 3.2), 420, 2.5), ("top", (0.0, -0.8, 3.8), 180, 2.5)):
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy
        light.size = size
        o = bpy.data.objects.new(name, light)
        o.location = loc
        COLL.objects.link(o)
        c = o.constraints.new("TRACK_TO")
        c.target = target
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"


def shoot(path, loc, look, lens, size, transparent, fmt="PNG"):
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = lens
    cam.location = loc
    COLL.objects.link(cam)
    tgt = bpy.data.objects.new("cam target", None)
    tgt.location = look
    COLL.objects.link(tgt)
    c = cam.constraints.new("TRACK_TO")
    c.target = tgt
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    scene.camera = cam
    scene.render.film_transparent = transparent
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.image_settings.file_format = fmt
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    if fmt == "WEBP":
        scene.render.image_settings.quality = 82
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


if RENDER or SHOTS:
    scene.frame_set(at(6))
    studio()
    if RENDER:
        shoot(RENDER, (2.1, -3.0, 1.55), (0, 0, 0.9), 50, (900, 1200), True, "WEBP")
    if SHOTS:
        shoot(os.path.join(SHOTS, "blender-front.png"), (0, -3.1, 0.95), (0, 0, 0.9), 50, (900, 1200), False)
        shoot(os.path.join(SHOTS, "blender-34.png"), (2.1, -3.0, 1.55), (0, 0, 0.9), 50, (900, 1200), True)
        shoot(os.path.join(SHOTS, "blender-close.png"), (0.32, -1.25, 0.95), (0, -0.24, 0.86), 50, (1200, 900), False)

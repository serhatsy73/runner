"""
Kule Savaşı 3D modelleri — Blender betiği.

Bütün modeller bu betikte koddan üretilir ve tek bir GLB dosyasına aktarılır.
Böylece modeller sürüm kontrolünde okunabilir kalır ve her an yeniden üretilebilir.

Çalıştırma (Blender 4.2):
    blender --background --python assets/blender/kule_modelleri.py
ya da Blender'ı Python modülü olarak kullanarak (pip install bpy==4.2.0):
    python assets/blender/kule_modelleri.py

Çıktı: assets/models/kule.glb
Ardından oyuna gömmek için: python tools/modelleri_gom.py

Malzeme adları oyunda anlam taşır (render3d.js):
    team      : takım rengiyle boyanır (gövde, mazgallar)
    team_dark : takımın koyu rengiyle boyanır (bayrak, çatı, şerit)
    diğerleri : sabit renk (taş, kapı, göz, yanak, ahşap, yaprak...)

Nesneler (hepsi orijinde, tabanı z=0'da durur; Blender'ın -Y yönü oyunda kameraya bakar):
    castle_l1, castle_l2, castle_l3      kale (kule seviyesine göre)
    archer                               okçu kulesi (seviyeye göre ölçeklenir)
    soldier_body, soldier_helmet, soldier_eyes   asker (ayrı parçalar: oyunda toplu çizilir)
    tree, rock, bridge, grass, flower
"""
import math
import os
import sys

import bpy  # bmesh ve mathutils bpy'den sonra yüklenebilir
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'models', 'kule.glb'))

# Pastel palet (2D sürümle aynı aile)
COLORS = {
    'team': (1.0, 1.0, 1.0),          # oyunda boyanır
    'team_dark': (0.8, 0.8, 0.8),     # oyunda boyanır
    'stone': (0.89, 0.86, 0.80),
    'stone_dark': (0.74, 0.71, 0.66),
    'door': (0.42, 0.30, 0.24),
    'eye': (0.20, 0.18, 0.26),
    'eye_shine': (1.0, 1.0, 1.0),
    'cheek': (1.0, 0.62, 0.70),
    'wood': (0.66, 0.46, 0.30),
    'wood_light': (0.88, 0.69, 0.48),
    'leaf': (0.56, 0.82, 0.48),
    'leaf_dark': (0.42, 0.68, 0.36),
    'blossom': (1.0, 0.66, 0.74),
    'rock': (0.76, 0.74, 0.70),
    'grass': (0.55, 0.78, 0.42),
    'petal': (1.0, 1.0, 1.0),         # oyunda çiçek başına boyanır
    'pollen': (0.97, 0.78, 0.29),
}


# ---------------------------------------------------------------- yardımcılar
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_mats = {}


def mat(name):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    r, g, b = COLORS[name]
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.8
    _mats[name] = m
    return m


def active():
    return bpy.context.view_layer.objects.active


def finish(obj, name, material, smooth=False):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat(material))
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def cylinder(name, r, h, loc, material, verts=24, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    obj = finish(active(), name, material)
    if smooth:
        # yanlar yumuşak, kapaklar düz
        for p in obj.data.polygons:
            p.use_smooth = abs(p.normal.z) < 0.5
    return obj


def cone(name, r1, r2, h, loc, material, verts=24):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    obj = finish(active(), name, material)
    for p in obj.data.polygons:
        p.use_smooth = abs(p.normal.z) < 0.9
    return obj


def sphere(name, r, loc, material, scale=(1, 1, 1), seg=20, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    obj = finish(active(), name, material, smooth=True)
    obj.scale = scale
    return obj


def box(name, size, loc, material, bevel=0.0, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = finish(active(), name, material)
    obj.scale = size
    obj.rotation_euler = (0, 0, rot_z)
    if bevel:
        mod = obj.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = 'NONE'
    return obj


def ico(name, r, loc, material, subdiv=2, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=r, location=loc)
    obj = finish(active(), name, material, smooth=True)
    obj.scale = scale
    return obj


def apply_all(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def join(objs, name):
    for o in objs:
        apply_all(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = active()
    obj.name = name
    obj.data.name = name
    # orijin tabanda kalsın
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    return obj


def smile(name, r, loc):
    """Ağız: yarım halka (alt yarısı), -Y yönüne bakar."""
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=r * 0.28, major_segments=16, minor_segments=6,
                                     location=loc, rotation=(math.pi / 2, 0, 0))
    obj = finish(active(), name, 'eye', smooth=True)
    apply_all(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    cz = loc[2] - obj.location.z
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > cz + r * 0.15], context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def face(prefix, R, z, scale=1.0):
    """Kawaii yüz: iki göz + parıltı + yanaklar + gülümseme, R yarıçaplı gövdenin önünde (-Y)."""
    parts = []
    s = scale
    ey = -R * 0.97
    for sx in (-1, 1):
        parts.append(sphere(f'{prefix}_eye', 0.075 * s, (sx * 0.17 * s, ey, z), 'eye', scale=(1, 0.55, 1.15)))
        parts.append(sphere(f'{prefix}_shine', 0.026 * s, (sx * 0.17 * s + 0.025 * s, ey - 0.04 * s, z + 0.035 * s), 'eye_shine', seg=10, rings=6))
        parts.append(sphere(f'{prefix}_cheek', 0.07 * s, (sx * 0.31 * s, -R * 0.93, z - 0.09 * s), 'cheek', scale=(1, 0.35, 0.6)))
    parts.append(smile(f'{prefix}_mouth', 0.05 * s, (0, ey - 0.005, z - 0.07 * s)))
    return parts


def crenels(prefix, R, z, material, n=8, size=0.17):
    parts = []
    for i in range(n):
        a = i / n * math.pi * 2 + math.pi / n
        parts.append(box(f'{prefix}_cren', (size, size * 0.8, size * 0.9),
                         (math.cos(a) * R * 0.86, math.sin(a) * R * 0.86, z + size * 0.45), material, bevel=0.025, rot_z=a))
    return parts


def flag(prefix, base, h, size=0.32, side=1):
    pole = cylinder(f'{prefix}_pole', 0.022, h, base, 'wood', verts=8)
    top = base[2] + h
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    cloth = active()
    bm = bmesh.new()
    bm.from_mesh(cloth.data)
    bm.clear()
    # dalgalı üçgen bayrak
    v1 = bm.verts.new((base[0], base[1], top))
    v2 = bm.verts.new((base[0] + side * size, base[1] - 0.02, top - size * 0.28))
    v3 = bm.verts.new((base[0], base[1], top - size * 0.55))
    bm.faces.new((v1, v2, v3))
    bm.to_mesh(cloth.data)
    bm.free()
    finish(cloth, f'{prefix}_flag', 'team_dark')
    mod = cloth.modifiers.new('solid', 'SOLIDIFY')
    mod.thickness = 0.03
    return [pole, cloth]


def door(prefix, R, w=0.24, h=0.3):
    y = -R * 0.98
    parts = [
        box(f'{prefix}_door', (w, 0.08, h * 0.62), (0, y, h * 0.31 + 0.1), 'door'),
        cylinder(f'{prefix}_door_top', w / 2, 0.08, (0, y + 0.04, h * 0.62 + 0.1), 'door', verts=16, smooth=False),
    ]
    parts[1].rotation_euler = (math.pi / 2, 0, 0)
    parts[1].location = (0, y, h * 0.62 + 0.1)
    return parts


def castle(level):
    """Seviye 1: küçük kule · 2: büyük + bayrak + pencere · 3: ana kule + iki yan kule + bayraklar."""
    R = [0, 0.5, 0.56, 0.6][level]
    H = [0, 0.9, 1.0, 1.08][level]
    name = f'castle_l{level}'
    parts = []
    parts.append(cylinder(f'{name}_base', R * 1.16, 0.12, (0, 0, 0), 'stone', verts=24))
    parts.append(cylinder(f'{name}_base2', R * 1.08, 0.06, (0, 0, 0.12), 'stone_dark', verts=24))
    body = cylinder(f'{name}_body', R, H, (0, 0, 0.12), 'team', verts=28)
    mod = body.modifiers.new('bevel', 'BEVEL')
    mod.width = 0.04
    mod.segments = 2
    parts.append(body)
    top = 0.12 + H
    parts.append(cylinder(f'{name}_trim', R * 1.03, 0.07, (0, 0, top - 0.22), 'team_dark', verts=28))
    parts.append(cylinder(f'{name}_roof', R * 0.86, 0.04, (0, 0, top - 0.01), 'team_dark', verts=28))
    parts += crenels(name, R, top - 0.02, 'team', n=8 if level < 3 else 10)
    parts += face(name, R, 0.12 + H * 0.48, scale=1.0 + 0.08 * (level - 1))
    parts += door(name, R)
    if level >= 2:
        # pencereler (yanlarda)
        for sx in (-1, 1):
            a = -math.pi / 2 + sx * 0.95
            w = box(f'{name}_win', (0.09, 0.06, 0.16), (math.cos(a) * R * 0.99, math.sin(a) * R * 0.99, top - 0.42), 'door', bevel=0.02, rot_z=a)
            parts.append(w)
        parts += flag(name, (0, 0.05, top), 0.55 if level == 2 else 0.62, size=0.34)
    if level >= 3:
        for sx in (-1, 1):
            tx = sx * R * 1.02
            tr = 0.2
            parts.append(cylinder(f'{name}_turret', tr, H * 0.82, (tx, 0.08, 0.12), 'team', verts=18))
            parts.append(cone(f'{name}_turret_roof', tr * 1.35, 0.0, 0.38, (tx, 0.08, 0.12 + H * 0.82), 'team_dark', verts=18))
            parts += flag(f'{name}_t', (tx, 0.08, 0.12 + H * 0.82 + 0.34), 0.3, size=0.22, side=sx)
    return join(parts, name)


def archer():
    """Okçu kulesi: ahşap ayaklı gözetleme kulesi, takım renkli kulübe, sivri çatı, kawaii yüz ve yay."""
    parts = []
    parts.append(cylinder('archer_base', 0.5, 0.12, (0, 0, 0), 'stone', verts=24))
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        leg = cylinder('archer_leg', 0.045, 0.78, (sx * 0.3, sy * 0.3, 0.12), 'wood', verts=8)
        parts.append(leg)
    # çapraz destekler
    for sgn in (-1, 1):
        b = box('archer_brace', (0.04, 0.9, 0.04), (sgn * 0.3, 0, 0.5), 'wood')
        b.rotation_euler = (math.radians(50 * sgn), 0, 0)
        parts.append(b)
    parts.append(cylinder('archer_deck', 0.46, 0.07, (0, 0, 0.88), 'wood_light', verts=20))
    hut = cylinder('archer_hut', 0.34, 0.42, (0, 0, 0.95), 'team', verts=20)
    parts.append(hut)
    parts += face('archer', 0.34, 1.16, scale=0.75)
    # korkuluk
    for i in range(10):
        a = i / 10 * math.pi * 2
        parts.append(cylinder('archer_post', 0.018, 0.16, (math.cos(a) * 0.43, math.sin(a) * 0.43, 0.95), 'wood', verts=6))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.43, minor_radius=0.018, major_segments=24, minor_segments=6, location=(0, 0, 1.11))
    parts.append(finish(active(), 'archer_rail', 'wood', smooth=True))
    parts.append(cone('archer_roof', 0.5, 0.0, 0.45, (0, 0, 1.36), 'team_dark', verts=20))
    parts.append(sphere('archer_knob', 0.05, (0, 0, 1.83), 'team_dark', seg=10, rings=6))
    # yay: kulübenin önünde, hafif yana
    bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.014, major_segments=20, minor_segments=5,
                                     location=(0.26, -0.3, 1.2), rotation=(math.pi / 2, 0, 0))
    bow = finish(active(), 'archer_bow', 'wood', smooth=True)
    apply_all(bow)
    bm = bmesh.new()
    bm.from_mesh(bow.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x > 0.26 + 0.02], context='VERTS')   # yarım yay (-X yarısı)
    bm.to_mesh(bow.data)
    bm.free()
    parts.append(bow)
    parts.append(box('archer_string', (0.006, 0.006, 0.27), (0.27, -0.3, 1.2), 'eye'))
    return join(parts, 'archer')


def fence():
    """Çit: X ekseni boyunca 1 birim; iki direk ve iki kiriş. Oyun uzunluğa göre ölçekler/döşer."""
    parts = []
    for sx in (-1, 1):
        parts.append(box('fence_post', (0.07, 0.07, 0.46), (sx * 0.47, 0, 0.23), 'wood', bevel=0.01))
        parts.append(cone('fence_cap', 0.06, 0.0, 0.07, (sx * 0.47, 0, 0.46), 'wood', verts=8))
    for z in (0.18, 0.36):
        parts.append(box('fence_rail', (1.0, 0.035, 0.055), (0, 0, z), 'wood_light', bevel=0.008))
    return join(parts, 'fence')


def barrel():
    parts = [cylinder('barrel_body', 0.26, 0.5, (0, 0, 0), 'wood_light', verts=16)]
    for z in (0.12, 0.38):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.265, minor_radius=0.02, major_segments=20, minor_segments=6, location=(0, 0, z))
        parts.append(finish(active(), 'barrel_band', 'wood', smooth=True))
    parts.append(cylinder('barrel_lid', 0.22, 0.02, (0, 0, 0.5), 'wood', verts=16, smooth=False))
    return join(parts, 'barrel')


def soldier():
    """Asker üç parça: gövde (takım rengi), miğfer (koyu takım rengi), gözler. Oyunda toplu (instanced) çizilir."""
    body = sphere('soldier_body', 0.17, (0, 0, 0.2), 'team', scale=(1, 0.92, 1.15))
    feet = [sphere('foot', 0.06, (sx * 0.08, -0.02, 0.035), 'team', scale=(1, 1.3, 0.6), seg=10, rings=6) for sx in (-1, 1)]
    body = join([body] + feet, 'soldier_body')

    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.18, location=(0, 0, 0.27))
    helm = finish(active(), 'soldier_helmet', 'team_dark', smooth=True)
    apply_all(helm)
    bm = bmesh.new()
    bm.from_mesh(helm.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 0.02], context='VERTS')   # sadece üst kubbe
    bm.to_mesh(helm.data)
    bm.free()
    helm.scale = (1.02, 0.96, 0.9)
    knob = sphere('knob', 0.045, (0, 0, 0.45), 'team_dark', seg=10, rings=6)
    helm = join([helm, knob], 'soldier_helmet')

    eyes = []
    for sx in (-1, 1):
        eyes.append(sphere('eye', 0.032, (sx * 0.06, -0.15, 0.22), 'eye', scale=(1, 0.6, 1.25), seg=10, rings=6))
    eyes = join(eyes, 'soldier_eyes')
    return [body, helm, eyes]


def tree():
    parts = [cylinder('trunk', 0.08, 0.45, (0, 0, 0), 'wood', verts=10)]
    for (x, y, z, r, m) in [(0, 0, 0.62, 0.32, 'leaf'), (-0.2, 0.05, 0.48, 0.24, 'leaf_dark'), (0.21, -0.04, 0.5, 0.25, 'leaf'), (0.02, -0.02, 0.86, 0.22, 'leaf')]:
        parts.append(ico('canopy', r, (x, y, z), m, subdiv=2))
    for (x, y, z) in [(0.15, -0.27, 0.62), (-0.18, -0.2, 0.5), (0.05, -0.22, 0.85)]:
        parts.append(sphere('blossom', 0.035, (x, y, z), 'blossom', seg=8, rings=6))
    return join(parts, 'tree')


def rock():
    obj = ico('rock', 0.4, (0, 0, 0.18), 'rock', subdiv=2, scale=(1.0, 0.85, 0.62))
    apply_all(obj)
    # biraz düzensizlik (deterministik)
    for i, v in enumerate(obj.data.vertices):
        k = math.sin(i * 12.9898) * 43758.5453
        k -= math.floor(k)
        v.co *= 0.9 + 0.18 * k
        if v.co.z < 0:
            v.co.z = 0
    moss = sphere('moss', 0.14, (0.08, -0.05, 0.4), 'leaf', scale=(1.3, 1.0, 0.35), seg=12, rings=6)
    pebble = ico('pebble', 0.1, (0.42, -0.18, 0.05), 'rock', subdiv=1, scale=(1, 0.8, 0.6))
    return join([obj, moss, pebble], 'rock')


def bridge():
    """Köprü: X ekseni boyunca 1 birim uzun (nehrin karşısına), 0.5 genişlik."""
    parts = []
    n = 7
    for i in range(n):
        x = -0.5 + (i + 0.5) / n
        parts.append(box('plank', (1 / n - 0.012, 0.5, 0.05), (x, 0, 0.06 + 0.03 * math.sin(math.pi * (i + 0.5) / n)), 'wood_light', bevel=0.008))
    for sy in (-1, 1):
        parts.append(box('rail', (1.04, 0.04, 0.05), (0, sy * 0.25, 0.2), 'wood', bevel=0.01))
        for i in range(4):
            x = -0.5 + i / 3
            parts.append(box('post', (0.05, 0.05, 0.22), (x, sy * 0.25, 0.1), 'wood', bevel=0.01))
    return join(parts, 'bridge')


def grass():
    parts = []
    for (x, a, h) in [(-0.03, -0.35, 0.16), (0.0, 0.0, 0.22), (0.035, 0.4, 0.17)]:
        c = cone('blade', 0.025, 0.0, h, (x, 0, 0), 'grass', verts=5)
        c.rotation_euler = (0, a, 0)
        parts.append(c)
    return join(parts, 'grass')


def flower():
    parts = [cylinder('stem', 0.008, 0.1, (0, 0, 0), 'grass', verts=5, smooth=False)]
    for i in range(5):
        a = i / 5 * math.pi * 2
        parts.append(sphere('petal', 0.028, (math.cos(a) * 0.03, math.sin(a) * 0.03, 0.11), 'petal', scale=(1, 1, 0.45), seg=8, rings=5))
    parts.append(sphere('pollen', 0.02, (0, 0, 0.115), 'pollen', seg=8, rings=5))
    return join(parts, 'flower')


def main():
    reset_scene()
    objs = [castle(1), castle(2), castle(3), archer()] + soldier() + [tree(), rock(), bridge(), grass(), flower(), fence(), barrel()]
    # nesneleri yan yana diz (Blender'da bakarken karışmasınlar); oyun her birini orijine göre kullanır
    for i, o in enumerate(objs):
        o.location = (0, 0, 0)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    kwargs = dict(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True,
                  export_materials='EXPORT', export_texcoords=False, export_normals=True)
    try:
        bpy.ops.export_scene.gltf(**kwargs, export_vertex_color='NONE')
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)
    tris = sum(len(o.data.loop_triangles) if o.data.calc_loop_triangles() is None else 0 for o in objs)
    print(f'kule.glb yazıldı: {OUT} ({os.path.getsize(OUT) // 1024} KB, {len(objs)} nesne, {tris} üçgen)')


if __name__ == '__main__':
    main()

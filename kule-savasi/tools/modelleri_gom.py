"""
assets/models/kule.glb dosyasını js/models.js içine base64 olarak gömer.

Neden: oyun index.html'e çift tıklayınca (file://) da çalışmalı; tarayıcılar o durumda
ayrı bir .glb dosyasını yüklemeye izin vermez. Gömülü veri her yerde çalışır.

Kullanım: python tools/modelleri_gom.py
"""
import base64
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, '..', 'assets', 'models', 'kule.glb'))
DST = os.path.normpath(os.path.join(HERE, '..', 'js', 'models.js'))

with open(SRC, 'rb') as f:
    data = f.read()
b64 = base64.b64encode(data).decode('ascii')
with open(DST, 'w') as f:
    f.write('// Otomatik üretildi: tools/modelleri_gom.py — elle düzenleme.\n')
    f.write('// Kaynak: assets/models/kule.glb (assets/blender/kule_modelleri.py ile üretilir)\n')
    f.write('window.KS = window.KS || {};\n')
    f.write("KS.MODEL_GLB = '" + b64 + "';\n")
print(f'{DST}: {len(data) // 1024} KB glb -> {os.path.getsize(DST) // 1024} KB js')

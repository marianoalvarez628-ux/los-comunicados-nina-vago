#!/usr/bin/env python3
"""Test exhaustivo de las APIs de la Fase 6 — Moderación Admin."""
import json
import subprocess
import sys
import time
from pathlib import Path

BASE = "http://localhost:3000"
COOKIE_ADMIN = "/tmp/test-admin-fase6.txt"
COOKIE_V1 = "/tmp/test-v1-fase6.txt"
COOKIE_V2 = "/tmp/test-v2-fase6.txt"
COOKIE_V3 = "/tmp/test-v3-fase6.txt"
COOKIE_COM = "/tmp/test-com-fase6.txt"


def curl(method, url, cookie_file=None, data=None):
    """Ejecuta curl y devuelve (status_code, response_dict)."""
    cmd = ["curl", "-s", "-X", method, url, "-w", "\n%{http_code}"]
    if cookie_file:
        cmd.extend(["-b", cookie_file])
        if method in ("POST", "PATCH", "DELETE"):
            cmd.extend(["-c", cookie_file])  # guardar cookies actualizadas
    if data:
        cmd.extend(["-H", "Content-Type: application/json", "-d", json.dumps(data)])
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    output = result.stdout.strip()
    if not output:
        return 0, {}
    parts = output.rsplit("\n", 1)
    if len(parts) == 2:
        body, status = parts
    else:
        body = parts[0]
        status = "0"
    try:
        return int(status), json.loads(body)
    except json.JSONDecodeError:
        return int(status) if status.isdigit() else 0, {"raw": body}


def login(whatsapp, cookie_file):
    """Login OTP y devuelve True si exitoso."""
    s, d = curl("POST", f"{BASE}/api/auth/otp/send", data={"whatsapp": whatsapp})
    codigo = d.get("codigoDesarrollo")
    if not codigo:
        print(f"  ✗ No se pudo enviar OTP a {whatsapp}")
        return False
    s, d = curl("POST", f"{BASE}/api/auth/otp/verify", cookie_file=cookie_file, data={"whatsapp": whatsapp, "codigo": codigo})
    return d.get("ok") is True


def main():
    print("=" * 60)
    print("VERIFICACIÓN EXHAUSTIVA FASE 6 — MODERACIÓN ADMIN")
    print("=" * 60)

    # Limpiar cookies previas
    for f in [COOKIE_ADMIN, COOKIE_V1, COOKIE_V2, COOKIE_V3, COOKIE_COM]:
        Path(f).unlink(missing_ok=True)

    print("\n=== 1. LOGIN DE USUARIOS ===")
    print("  Admin...", end=" ")
    if not login("+5491100000000", COOKIE_ADMIN):
        print("✗")
        return 1
    print("✓")
    print("  Visitante 1...", end=" ")
    if not login("+5491100001111", COOKIE_V1):
        print("✗")
        return 1
    print("✓")
    print("  Visitante 2...", end=" ")
    if not login("+5491100002222", COOKIE_V2):
        print("✗")
        return 1
    print("✓")
    print("  Visitante 3...", end=" ")
    if not login("+5491100003333", COOKIE_V3):
        print("✗")
        return 1
    print("✓")
    print("  Comerciante (Comercio Demo Fase 3)...", end=" ")
    if not login("+5491100000060", COOKIE_COM):
        print("✗")
        return 1
    print("✓")

    print("\n=== 2. TEST API REPORTAR ===")

    # 2.1 Sin login
    print("  2.1 Reportar sin login → 401...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", data={"motivo": "SPAM"})
    if s == 401 and "logueado" in d.get("error", ""):
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.2 Motivo inválido
    print("  2.2 Motivo inválido → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", cookie_file=COOKIE_V1, data={"motivo": "INVALIDO"})
    if s == 400 and "no válid" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.3 Anuncio inexistente
    print("  2.3 Anuncio inexistente → 404...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/inexistente/reportar", cookie_file=COOKIE_V1, data={"motivo": "SPAM"})
    if s == 404 and "no encontrado" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.4 Reporte válido 1
    print("  2.4 Reporte 1 (ENGAÑOSO)...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", cookie_file=COOKIE_V1, data={"motivo": "ENGAÑOSO", "comentario": "Foto no real"})
    if s == 200 and d.get("ok"):
        print(f"✓ reportesCount={d.get('reportesCount')}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.5 Reporte duplicado mismo usuario
    print("  2.5 Mismo usuario reporta 2da vez → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", cookie_file=COOKIE_V1, data={"motivo": "SPAM"})
    if s == 400 and "ya reportaste" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.6 Reporte válido 2
    print("  2.6 Reporte 2 (SPAM)...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", cookie_file=COOKIE_V2, data={"motivo": "SPAM"})
    if s == 200 and d.get("ok"):
        print(f"✓ reportesCount={d.get('reportesCount')}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 2.7 Reporte válido 3 (debe auto-ocultar)
    print("  2.7 Reporte 3 (ILEGAL) → auto-ocultar...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/an-1/reportar", cookie_file=COOKIE_V3, data={"motivo": "ILEGAL", "comentario": "Producto ilegal"})
    if s == 200 and d.get("ok"):
        oculto = d.get("ocultado", False)
        print(f"✓ reportesCount={d.get('reportesCount')}, ocultado={oculto}")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 3. TEST API ADMIN ANUNCIOS REPORTADOS ===")

    # 3.1 Admin ve anuncios reportados
    print("  3.1 Admin ve anuncios reportados...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/anuncios-reportados", cookie_file=COOKIE_ADMIN)
    total = d.get("total", 0)
    if s == 200 and total >= 1:
        a = d["anuncios"][0]
        print(f"✓ total={total}, primer anuncio: \"{a['titulo']}\" ({a['reportesCount']} reportes, oculto={a['oculto']})")
    else:
        print(f"✗ status={s}, resp={d}")

    # 3.2 Comerciante intenta ver admin
    print("  3.2 Comerciante intenta ver admin → 403...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/anuncios-reportados", cookie_file=COOKIE_COM)
    if s == 403 and "denegado" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 3.3 Sin login
    print("  3.3 Sin login → 401...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/anuncios-reportados")
    if s == 401:
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 4. TEST API MODERAR (5 acciones) ===")

    # 4.1 Acción inválida
    print("  4.1 Acción inválida → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "invalida"})
    if s == 400 and "no válid" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 4.2 Comerciante intenta moderar
    print("  4.2 Comerciante intenta moderar → 403...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_COM, data={"accion": "pausar"})
    if s == 403 and "denegado" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 4.3 Marcar revisión
    print("  4.3 Marcar en revisión...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "marcar_revision"})
    if s == 200 and d.get("ok"):
        print(f"✓ {d.get('message', '')[:60]}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 4.4 Pausar
    print("  4.4 Pausar anuncio...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "pausar"})
    if s == 200 and d.get("ok"):
        print(f"✓ {d.get('message', '')[:60]}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 4.5 Advertir
    print("  4.5 Advertir comerciante...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "advertir"})
    if s == 200 and d.get("ok"):
        print(f"✓ {d.get('message', '')[:60]}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 4.6 Banear comerciante
    print("  4.6 Banear comerciante (30 días)...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/an-1/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "banear"})
    if s == 200 and d.get("ok"):
        com = d.get("comerciante", {})
        print(f"✓ baneado={com.get('baneado')}, banHasta={com.get('banHasta') is not None}")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 5. TEST API ADMIN COMERCIANTES ===")

    # 5.1 Listar comerciantes
    print("  5.1 Admin lista comerciantes...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/comerciantes", cookie_file=COOKIE_ADMIN)
    if s == 200 and "comerciantes" in d:
        stats = d.get("stats", {})
        print(f"✓ total={stats.get('total')}, con strikes={stats.get('conStrikes')}, baneados={stats.get('baneadosActivos')}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 5.2 Comerciante intenta listar
    print("  5.2 Comerciante intenta listar → 403...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/comerciantes", cookie_file=COOKIE_COM)
    if s == 403:
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 6. TEST API BANEAR COMERCIANTE ===")

    # Buscar el comerciante La Esquina (no el Comercio Demo que ya banearon)
    s, d = curl("GET", f"{BASE}/api/admin/comerciantes", cookie_file=COOKIE_ADMIN)
    comerciante_test = None
    for c in d.get("comerciantes", []):
        if c.get("nombre") == "La Esquina":
            comerciante_test = c
            break

    if comerciante_test:
        cid = comerciante_test["id"]
        # 6.1 Banear temporal
        print(f"  6.1 Banear temporal a {comerciante_test['nombre']}...", end=" ")
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "banear_temporal"})
        if s == 200 and d.get("ok") and d.get("comerciante", {}).get("baneado"):
            print(f"✓ baneado={d['comerciante']['baneado']}")
        else:
            print(f"✗ status={s}, resp={d}")

        # 6.2 Desbanear
        print(f"  6.2 Desbanear a {comerciante_test['nombre']}...", end=" ")
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "desbanear"})
        if s == 200 and d.get("ok") and not d.get("comerciante", {}).get("baneado"):
            print(f"✓ baneado={d['comerciante']['baneado']}, strikes={d['comerciante']['strikes']}")
        else:
            print(f"✗ status={s}, resp={d}")

        # 6.3 Acción inválida
        print(f"  6.3 Acción inválida → 400...", end=" ")
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "invalida"})
        if s == 400 and "no válid" in d.get("error", "").lower():
            print("✓")
        else:
            print(f"✗ status={s}, resp={d}")

        # 6.4 Comerciante inexistente
        print(f"  6.4 Comerciante inexistente → 404...", end=" ")
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/inexistente/banear", cookie_file=COOKIE_ADMIN, data={"accion": "desbanear"})
        if s == 404 and "no encontrado" in d.get("error", "").lower():
            print("✓")
        else:
            print(f"✗ status={s}, resp={d}")
    else:
        print("  ⚠ No se encontró comerciante La Esquina para testear banear")

    print("\n=== 7. TEST SISTEMA DE STRIKES ===")
    # Crear 3 anuncios y eliminarlos para sumar strikes
    print("  7.1 Crear comerciante nuevo para test de strikes...")
    OTP = subprocess.run(["curl", "-s", "-X", "POST", f"{BASE}/api/auth/otp/send", "-H", "Content-Type: application/json", "-d", '{"whatsapp":"+5491100000099"}'], capture_output=True, text=True).stdout
    codigo = json.loads(OTP).get("codigoDesarrollo")
    if not codigo:
        print("  ✗ No se pudo enviar OTP")
        return 1
    COOKIE_TEST = "/tmp/test-strikes-fase6.txt"
    Path(COOKIE_TEST).unlink(missing_ok=True)
    subprocess.run(["curl", "-s", "-c", COOKIE_TEST, "-X", "POST", f"{BASE}/api/auth/otp/verify", "-H", "Content-Type: application/json", "-d", json.dumps({"whatsapp": "+5491100000099", "codigo": codigo})], capture_output=True)
    # Registrar como comerciante
    subprocess.run(["curl", "-s", "-b", COOKIE_TEST, "-X", "POST", f"{BASE}/api/auth/registro-comerciante", "-H", "Content-Type: application/json", "-d", json.dumps({"nombre": "Test Strikes", "categoriaSlug": "restobares", "direccion": "Test 123", "barrio": "Test"})], capture_output=True)
    print("  ✓ Comerciante 'Test Strikes' creado")

    # Crear 3 anuncios y eliminarlos via admin
    for i in range(1, 4):
        s, d = curl("POST", f"{BASE}/api/anuncios", cookie_file=COOKIE_TEST, data={
            "titulo": f"Test strike {i}",
            "descripcion": f"Anuncio para test de strikes numero {i}.",
            "categoriaSlug": "restobares",
            "imagenes": ["http://test.jpg"]
        })
        if not d.get("ok"):
            print(f"  ✗ No se pudo crear anuncio {i}: {d}")
            return 1
        anuncio_id = d["anuncio"]["id"]
        # Crear reporte para que aparezca en admin
        s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=COOKIE_V1, data={"motivo": "SPAM"})
        # Eliminar via admin (suma strike)
        s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "eliminar"})
        com = d.get("comerciante", {})
        print(f"  Strike {i}/3: comerciante strikes={com.get('strikes')}, baneado={com.get('baneado')}")

    # Verificar que el comerciante quedó baneado automáticamente
    s, d = curl("GET", f"{BASE}/api/admin/comerciantes", cookie_file=COOKIE_ADMIN)
    test_com = None
    for c in d.get("comerciantes", []):
        if c.get("nombre") == "Test Strikes":
            test_com = c
            break
    if test_com:
        print(f"  ✓ Comerciante 'Test Strikes': strikes={test_com['strikes']}, baneado={test_com['baneado']}, banActivo={test_com['banActivo']}")
        if test_com["strikes"] >= 3 and test_com["baneado"]:
            print("  ✓ Sistema de strikes funcionando: 3 strikes → ban automático")
        else:
            print("  ✗ El sistema de strikes no activó el ban automático")
    else:
        print("  ✗ No se encontró el comerciante de test")

    print("\n" + "=" * 60)
    print("VERIFICACIÓN COMPLETADA")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())

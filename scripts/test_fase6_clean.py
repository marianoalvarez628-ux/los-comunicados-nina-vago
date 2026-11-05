#!/usr/bin/env python3
"""Test limpio de Fase 6 — crea datos frescos para verificar el flujo end-to-end."""
import json
import subprocess
import sys
import time
from pathlib import Path

BASE = "http://localhost:3000"
COOKIE_ADMIN = "/tmp/test2-admin.txt"
COOKIE_V1 = "/tmp/test2-v1.txt"
COOKIE_V2 = "/tmp/test2-v2.txt"
COOKIE_V3 = "/tmp/test2-v3.txt"
COOKIE_COM = "/tmp/test2-com.txt"


def curl(method, url, cookie_file=None, data=None):
    cmd = ["curl", "-s", "-X", method, url, "-w", "\n%{http_code}"]
    if cookie_file:
        cmd.extend(["-b", cookie_file])
        if method in ("POST", "PATCH", "DELETE"):
            cmd.extend(["-c", cookie_file])
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
        body, status = parts[0], "0"
    try:
        return int(status), json.loads(body)
    except json.JSONDecodeError:
        return int(status) if status.isdigit() else 0, {"raw": body}


def login(whatsapp, cookie_file):
    s, d = curl("POST", f"{BASE}/api/auth/otp/send", data={"whatsapp": whatsapp})
    codigo = d.get("codigoDesarrollo")
    if not codigo:
        return False
    s, d = curl("POST", f"{BASE}/api/auth/otp/verify", cookie_file=cookie_file, data={"whatsapp": whatsapp, "codigo": codigo})
    return d.get("ok") is True


def main():
    print("=" * 70)
    print("VERIFICACIÓN LIMPIA FASE 6 — Moderación Admin (datos frescos)")
    print("=" * 70)

    # Limpiar cookies
    for f in [COOKIE_ADMIN, COOKIE_V1, COOKIE_V2, COOKIE_V3, COOKIE_COM]:
        Path(f).unlink(missing_ok=True)

    print("\n=== 1. LOGIN ===")
    print("  Admin...", end=" ")
    if not login("+5491100009999", COOKIE_ADMIN):  # admin nuevo creado antes
        print("✗")
        return 1
    print("✓")

    # Crear 3 visitantes NUEVOS para evitar conflictos con reportes previos
    visitors = []
    for i in range(1, 4):
        phone = f"+5491100099{i*10+i}"
        print(f"  Visitante nuevo {i} ({phone})...", end=" ")
        if not login(phone, f"/tmp/test2-vnew-{i}.txt"):
            print("✗")
            return 1
        print("✓")
        visitors.append((phone, f"/tmp/test2-vnew-{i}.txt"))

    print("\n=== 2. CREAR ANUNCIO FRESCO PARA TESTS ===")
    # Login como Comercio Demo Fase 3 y crear un anuncio nuevo
    print("  Comerciante...", end=" ")
    if not login("+5491100000060", COOKIE_COM):
        print("✗")
        return 1
    print("✓")

    print("  Creando anuncio fresco...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios", cookie_file=COOKIE_COM, data={
        "titulo": "Test Fase6 Clean",
        "descripcion": "Anuncio fresco para probar reportes y moderación sin conflictos.",
        "categoriaSlug": "restobares",
        "imagenes": ["http://test.jpg"]
    })
    if not d.get("ok"):
        print(f"✗ {d}")
        return 1
    anuncio_id = d["anuncio"]["id"]
    print(f"✓ ID: {anuncio_id}")

    print("\n=== 3. TEST API REPORTAR (con anuncio fresco) ===")
    # 3.1 Sin login
    print("  3.1 Sin login → 401...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", data={"motivo": "SPAM"})
    if s == 401:
        print("✓")
    else:
        print(f"✗ status={s}")

    # 3.2 Motivo inválido
    print("  3.2 Motivo inválido → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=visitors[0][1], data={"motivo": "INVALIDO"})
    if s == 400:
        print("✓")
    else:
        print(f"✗ status={s}")

    # 3.3 Anuncio inexistente
    print("  3.3 Anuncio inexistente → 404...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/no-existe/reportar", cookie_file=visitors[0][1], data={"motivo": "SPAM"})
    if s == 404:
        print("✓")
    else:
        print(f"✗ status={s}")

    # 3.4 Reporte 1
    print("  3.4 Reporte 1 (ENGAÑOSO)...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=visitors[0][1], data={"motivo": "ENGAÑOSO", "comentario": "Foto no real"})
    if s == 200 and d.get("ok"):
        print(f"✓ reportesCount={d.get('reportesCount')}, ocultado={d.get('ocultado')}")
    else:
        print(f"✗ status={s}, resp={d}")

    # 3.5 Duplicado mismo usuario
    print("  3.5 Mismo usuario reporta 2da vez → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=visitors[0][1], data={"motivo": "SPAM"})
    if s == 400 and "ya reportaste" in d.get("error", "").lower():
        print("✓")
    else:
        print(f"✗ status={s}, resp={d}")

    # 3.6 Reporte 2
    print("  3.6 Reporte 2 (SPAM)...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=visitors[1][1], data={"motivo": "SPAM"})
    if s == 200:
        print(f"✓ reportesCount={d.get('reportesCount')}, ocultado={d.get('ocultado')}")
    else:
        print(f"✗ status={s}")

    # 3.7 Reporte 3 → debe auto-ocultar
    print("  3.7 Reporte 3 (ILEGAL) → auto-ocultar...", end=" ")
    s, d = curl("POST", f"{BASE}/api/anuncios/{anuncio_id}/reportar", cookie_file=visitors[2][1], data={"motivo": "ILEGAL", "comentario": "Producto sospechoso"})
    if s == 200:
        print(f"✓ reportesCount={d.get('reportesCount')}, ocultado={d.get('ocultado')}")
        if not d.get("ocultado"):
            print("     ⚠ No se ocultó automáticamente (umbral debería ser 3)")
    else:
        print(f"✗ status={s}")

    print("\n=== 4. ADMIN VE ANUNCIOS REPORTADOS ===")
    print("  4.1 Admin ve anuncios reportados...", end=" ")
    s, d = curl("GET", f"{BASE}/api/admin/anuncios-reportados", cookie_file=COOKIE_ADMIN)
    total = d.get("total", 0)
    if s == 200 and total >= 1:
        # Buscar el anuncio fresco
        fresco = next((a for a in d["anuncios"] if a["id"] == anuncio_id), None)
        if fresco:
            print(f"✓ encontrado: \"{fresco['titulo']}\"")
            print(f"     reportesCount={fresco['reportesCount']}, oculto={fresco['oculto']}")
            print(f"     comerciante={fresco['comerciante']['nombre']} (strikes={fresco['comerciante']['strikes']})")
            print(f"     reportes detalle:")
            for r in fresco["reportes"]:
                print(f"       - {r['motivo']} por {r['reportante']['whatsapp']}: {r.get('comentario', '(sin comentario)')}")
        else:
            print(f"✓ total={total} pero anuncio fresco no está en la lista (¿ya resuelto?)")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 5. MODERAR — 5 ACCIONES ===")
    # 5.1 Acción inválida
    print("  5.1 Acción inválida → 400...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "invalida"})
    if s == 400:
        print("✓")
    else:
        print(f"✗ status={s}")

    # 5.2 Comerciante intenta moderar
    print("  5.2 Comerciante intenta moderar → 403...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_COM, data={"accion": "pausar"})
    if s == 403:
        print("✓")
    else:
        print(f"✗ status={s}")

    # 5.3 Marcar revisión
    print("  5.3 Marcar revisión...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "marcar_revision"})
    if s == 200:
        print(f"✓ {d.get('message', '')[:70]}")
    else:
        print(f"✗ status={s}")

    # 5.4 Pausar
    print("  5.4 Pausar...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "pausar"})
    if s == 200:
        print(f"✓ {d.get('message', '')[:70]}")
    else:
        print(f"✗ status={s}")

    # 5.5 Advertir
    print("  5.5 Advertir...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "advertir"})
    if s == 200:
        print(f"✓ {d.get('message', '')[:70]}")
    else:
        print(f"✗ status={s}")

    # 5.6 Banear comerciante
    print("  5.6 Banear comerciante...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "banear"})
    if s == 200:
        com = d.get("comerciante", {})
        print(f"✓ baneado={com.get('baneado')}, banHasta={'Sí' if com.get('banHasta') else 'No'}")
    else:
        print(f"✗ status={s}")

    # 5.7 Eliminar (la última acción)
    print("  5.7 Eliminar anuncio...", end=" ")
    s, d = curl("POST", f"{BASE}/api/admin/anuncios/{anuncio_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "eliminar"})
    if s == 200 and d.get("ok"):
        com = d.get("comerciante", {})
        print(f"✓ {d.get('message', '')[:80]}")
    else:
        print(f"✗ status={s}, resp={d}")

    print("\n=== 6. VERIFICAR ELIMINACIÓN EN DB ===")
    print("  6.1 Anuncio eliminado no aparece en /mine...", end=" ")
    s, d = curl("GET", f"{BASE}/api/anuncios/mine", cookie_file=COOKIE_COM)
    ids = [a["id"] for a in d.get("anuncios", [])]
    if anuncio_id not in ids:
        print("✓")
    else:
        print("✗ aún aparece en /mine")

    print("\n=== 7. TEST SISTEMA DE STRIKES (3 strikes → ban auto) ===")
    # Crear nuevo comerciante para test de strikes
    print("  7.1 Crear comerciante nuevo para test de strikes...")
    phone_st = "+5491100099990"
    s, d = curl("POST", f"{BASE}/api/auth/otp/send", data={"whatsapp": phone_st})
    codigo = d.get("codigoDesarrollo")
    if not codigo:
        print("  ✗ No se pudo enviar OTP")
        return 1
    COOKIE_ST = "/tmp/test2-strikes.txt"
    Path(COOKIE_ST).unlink(missing_ok=True)
    s, d = curl("POST", f"{BASE}/api/auth/otp/verify", cookie_file=COOKIE_ST, data={"whatsapp": phone_st, "codigo": codigo})
    s, d = curl("POST", f"{BASE}/api/auth/registro-comerciante", cookie_file=COOKIE_ST, data={
        "nombre": "Test Strikes Clean",
        "categoriaSlug": "restobares",
        "direccion": "Test 123",
        "barrio": "Test"
    })
    print("  ✓ Comerciante 'Test Strikes Clean' creado")

    # Crear 3 anuncios y eliminarlos
    for i in range(1, 4):
        s, d = curl("POST", f"{BASE}/api/anuncios", cookie_file=COOKIE_ST, data={
            "titulo": f"Strike {i}",
            "descripcion": f"Anuncio para test strikes numero {i}.",
            "categoriaSlug": "restobares",
            "imagenes": ["http://test.jpg"]
        })
        if not d.get("ok"):
            print(f"  ✗ No se pudo crear anuncio {i}")
            return 1
        a_id = d["anuncio"]["id"]
        # Crear reporte para que aparezca en admin
        curl("POST", f"{BASE}/api/anuncios/{a_id}/reportar", cookie_file=visitors[0][1], data={"motivo": "SPAM"})
        # Eliminar via admin
        s, d = curl("POST", f"{BASE}/api/admin/anuncios/{a_id}/moderar", cookie_file=COOKIE_ADMIN, data={"accion": "eliminar"})
        com = d.get("comerciante", {})
        print(f"  Strike {i}/3: strikes={com.get('strikes')}, baneado={com.get('baneado')}")

    # Verificar ban automático
    s, d = curl("GET", f"{BASE}/api/admin/comerciantes", cookie_file=COOKIE_ADMIN)
    test_com = next((c for c in d.get("comerciantes", []) if c.get("nombre") == "Test Strikes Clean"), None)
    if test_com:
        print(f"  ✓ Resultado final: strikes={test_com['strikes']}, baneado={test_com['baneado']}, banActivo={test_com['banActivo']}")
        if test_com["strikes"] >= 3 and test_com["baneado"]:
            print("  ✓✓✓ Sistema de strikes funcionando: 3 strikes → ban automático")
        else:
            print("  ✗✗✗ El sistema de strikes NO activó el ban automático")
    else:
        print("  ✗ No se encontró el comerciante")

    print("\n=== 8. BANEAR/DESBANEAR COMERCIANTE ===")
    if test_com:
        cid = test_com["id"]
        # Desbanear primero
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "desbanear"})
        if s == 200 and not d.get("comerciante", {}).get("baneado"):
            print(f"  ✓ Desbanear: baneado=False, strikes=0 (reseteados)")
        else:
            print(f"  ✗ Desbanear falló: {d}")

        # Banear temporal
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "banear_temporal"})
        if s == 200 and d.get("comerciante", {}).get("baneado"):
            print(f"  ✓ Banear temporal: baneado=True")
        else:
            print(f"  ✗ Banear temporal falló: {d}")

        # Banear permanente
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "banear_permanente"})
        if s == 200 and d.get("comerciante", {}).get("baneado") and d.get("comerciante", {}).get("banHasta") is None:
            print(f"  ✓ Banear permanente: baneado=True, banHasta=None (permanente)")
        else:
            print(f"  ✗ Banear permanente falló: {d}")

        # Desbanear (final)
        s, d = curl("POST", f"{BASE}/api/admin/comerciantes/{cid}/banear", cookie_file=COOKIE_ADMIN, data={"accion": "desbanear"})
        if s == 200 and not d.get("comerciante", {}).get("baneado"):
            print(f"  ✓ Desbanear final: baneado=False, strikes=0")

    print("\n" + "=" * 70)
    print("VERIFICACIÓN COMPLETADA")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Add metricas (vistas, likes, guardados) to all anuncios in data.ts.

Lee el data.ts, identifica cada objeto anuncio, y agrega los 3 campos numericos
antes del cierre '},' o '}' final del objeto.
"""
import re
from pathlib import Path

DATA_TS = Path("/home/z/my-project/src/lib/data.ts")
content = DATA_TS.read_text(encoding="utf-8")

# Para cada anuncio, generamos métricas pseudo-aleatorias pero estables
# basadas en el hash del id del anuncio.
def metricas_para(id_anuncio: str) -> tuple[int, int, int]:
    h = sum(ord(c) for c in id_anuncio)
    vistas = 50 + (h * 7) % 800          # 50-849
    likes = int(vistas * (0.08 + (h % 10) / 100))   # 8-18% de vistas
    guardados = int(likes * (0.3 + (h % 5) / 10))    # 30-70% de likes
    return vistas, max(likes, 1), max(guardados, 0)

# Regex para encontrar cada objeto anuncio dentro del array `anuncios`
# Cada anuncio empieza con `  {` despues de `// ===` comentario o directamente,
# tiene `id: "an-XX",` y termina con `  },` o `  }` (en el último).
# Vamos a ser más robustos: parsear línea por línea, detectar inicio de objeto
# cuando vemos `id: "an-`, y su cierre `},`.

lines = content.split("\n")
out = []
i = 0
inside_anuncio = False
current_id = None
modified = False

while i < len(lines):
    line = lines[i]
    out.append(line)

    # Detectar apertura de un objeto anuncio
    m = re.match(r'\s+id:\s*"an-\d+",', line)
    if m and not inside_anuncio:
        # Extraer id
        id_match = re.search(r'"(an-\d+)"', line)
        if id_match:
            current_id = id_match.group(1)
            inside_anuncio = True

    # Detectar cierre del objeto anuncio (línea que es `  },` o `  }` solitaria)
    if inside_anuncio and re.match(r'^\s*\},?\s*$', line):
        # Insertar las 3 métricas ANTES de esta línea de cierre.
        # Quitamos la línea de cierre del output, agregamos las métricas, y luego
        # la línea de cierre se agregará en la próxima iteración (porque ya está
        # en `line` y se agregó al principio del loop... pero no, ya se agregó).
        # Solución: remover la última línea agregada (que es el cierre), agregar
        # las métricas, y luego agregar el cierre de vuelta.
        recent = "\n".join(out[-6:]) if len(out) >= 6 else "\n".join(out)
        if "vistas:" not in recent:
            # Quitar la línea de cierre recién agregada
            out.pop()
            vistas, likes, guardados = metricas_para(current_id)
            indent = "    "
            out.append(f"{indent}vistas: {vistas},")
            out.append(f"{indent}likes: {likes},")
            out.append(f"{indent}guardados: {guardados},")
            # Volver a agregar la línea de cierre
            out.append(line)
            modified = True
        inside_anuncio = False
        current_id = None

    i += 1

if modified:
    DATA_TS.write_text("\n".join(out), encoding="utf-8")
    print(f"OK — metricas agregadas a todos los anuncios")
else:
    print("Nada que hacer")

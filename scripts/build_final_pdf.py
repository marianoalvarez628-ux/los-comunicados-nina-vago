"""Genera un PDF con todas las capturas del proyecto para que el usuario lo vea."""
from pathlib import Path
from pypdf import PdfWriter
import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFont
import io
import textwrap

CAPTURAS = Path("/home/z/my-project/download/capturas-finales")
OUTPUT_PDF = Path("/home/z/my-project/download/los_comunicados_nina_vago.pdf")

# (filename, title, description)
SLIDES = [
    ("01-home.png", "1. Home — Los comunicados de Nina&Vago",
     "Pantalla principal con el nuevo título 'Los comunicados de Nina&Vago'. Lista las 6 categorías con imagen de referencia y contador de anuncios. Buscador arriba, bottom nav abajo."),
    ("02-login.png", "2. Login — Ingreso por WhatsApp",
     "Modal de login con input para el número de WhatsApp. Se envía un código OTP por WhatsApp para verificar. Sin contraseña."),
    ("03-categoria.png", "3. Categoría — Lista de anuncios",
     "Al entrar a una categoría, se ven los anuncios con: avatar + nombre + dirección + Instagram + estado, recuadro dashed coral con descripción + Leer más + miniaturas, action row Llamar/WhatsApp/Guardar."),
    ("04-detalle.png", "4. Detalle del anuncio",
     "Galería de 4 imágenes con flechas + thumbs. Barra de 3 métricas (Vistas / Me gusta / Compartir publicación). Datos del comercio. Descripción con word count. CTAs Llamar/WhatsApp."),
    ("05-mis-anuncios.png", "5. Mis Anuncios — Panel del comerciante",
     "Panel del comerciante con stats (Total/Activos/Vencidos/Disponibles). Lista de anuncios propios con métricas, días restantes y acciones: Republicar/Pausar/Cambiar estado/Eliminar."),
    ("08-metricas.png", "6. Dashboard de métricas",
     "Dashboard con KPIs de los últimos 14 días, día más activo, gráfico de barras de vistas por día, tabla detallada con vistas/likes/compartidos/guardados por día."),
    ("07-admin-comerciantes.png", "7. Panel Admin — Comerciantes",
     "Panel de admin (solo rol ADMIN) con stats de comerciantes (total, verificados, con strikes, baneados) y lista de comerciantes con acciones de banear/desbanear."),
]

PAGE_W, PAGE_H = 1240, 1754  # A4 a 150dpi
MARGIN_X = 80
MARGIN_TOP = 140
MARGIN_BOTTOM = 220

# Cargar fuentes
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.otf", 38)
    caption_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
except Exception:
    title_font = ImageFont.load_default()
    caption_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

writer = PdfWriter()

for img_name, title, description in SLIDES:
    img_path = CAPTURAS / img_name
    if not img_path.exists():
        print(f"  ⚠ No encontrado: {img_path}")
        continue

    img = Image.open(img_path)
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Canvas A4 con fondo blanco
    canvas = Image.new("RGB", (PAGE_W, PAGE_H), "white")
    draw = ImageDraw.Draw(canvas)

    # Título arriba
    draw.text((MARGIN_X, 60), title, fill="#14141A", font=title_font)

    # Imagen centrada
    avail_h = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
    avail_w = PAGE_W - 2 * MARGIN_X
    img_ratio = img.width / img.height
    target_h = avail_h
    target_w = int(target_h * img_ratio)
    if target_w > avail_w:
        target_w = avail_w
        target_h = int(target_w / img_ratio)
    img_resized = img.resize((target_w, target_h), Image.LANCZOS)
    x = (PAGE_W - target_w) // 2
    y = MARGIN_TOP
    canvas.paste(img_resized, (x, y))

    # Descripción abajo
    y_cap = MARGIN_TOP + target_h + 30
    wrapped = textwrap.wrap(description, width=75)
    for line in wrapped:
        draw.text((MARGIN_X, y_cap), line, fill="#3A3A33", font=caption_font)
        y_cap += 30

    # Footer
    draw.text((MARGIN_X, PAGE_H - 50), "Los comunicados de Nina&Vago · Prototipo mobile-first · Z.ai",
              fill="#8A8579", font=small_font)

    # Convertir a PDF page
    page_pdf_bytes = io.BytesIO()
    canvas.save(page_pdf_bytes, format="PDF", resolution=150.0)
    page_pdf_bytes.seek(0)
    from pypdf import PdfReader
    reader = PdfReader(page_pdf_bytes)
    writer.add_page(reader.pages[0])
    print(f"  ✓ {img_name} → agregada al PDF")

# Metadata
writer.add_metadata({
    "/Title": "Los comunicados de Nina&Vago — Prototipo",
    "/Author": "Z.ai",
    "/Subject": "Prototipo mobile-first de folleto clasificado",
    "/Creator": "Z.ai",
})

with open(OUTPUT_PDF, "wb") as f:
    writer.write(f)

print(f"\n✅ PDF generado: {OUTPUT_PDF}")
print(f"   Tamaño: {OUTPUT_PDF.stat().st_size / 1024 / 1024:.2f} MB")
print(f"   Páginas: {len(writer.pages)}")

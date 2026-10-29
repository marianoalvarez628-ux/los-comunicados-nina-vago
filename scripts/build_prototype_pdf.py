"""Build a single PDF from the 5 prototype screenshots so the user
can view the full mobile flow in one file."""
from pathlib import Path
from pypdf import PdfWriter
from pypdf import PageObject
import pypdfium2 as pdfium
from PIL import Image
import io

CAPTURAS_DIR = Path("/home/z/my-project/download/preview-capturas")
OUTPUT_PDF = Path("/home/z/my-project/download/folleto_clasificados_prototipo.pdf")

# Order matters: Home → Categoria → Detalle → Editor vacío → Editor con 4 imágenes
SLIDES = [
    ("01-home.png", "Pantalla 1 — Home", "Grilla 2×3 de comerciantes. Tocá una categoría para ver sus anuncios."),
    ("02-categoria.png", "Pantalla 2 — Categoría", "3 anuncios con avatar, título 3 palabras, contacto, recuadro dashed coral con 90 palabras + Leer más, action row Llamar/WhatsApp/Guardar."),
    ("03-detalle.png", "Pantalla 3 — Detalle del anuncio", "Galería de 4 imágenes con flechas + thumbs. Datos completos del comercio. Descripción con word count (X/90). CTAs fijos: Llamar ahora / WhatsApp."),
    ("04-editor.png", "Pantalla 4 — Editor (vacío)", "Formulario para publicar anuncio. 4 slots de imagen (1ª = portada). Validaciones en vivo: 3 palabras en título, 90 palabras en descripción."),
    ("05-editor-4-imgs.png", "Pantalla 4 — Editor con 4 imágenes cargadas", "Subidas 4 imágenes (PORTADA + 3). La vista previa en vivo se actualiza mientras escribís. Botón Publicar se habilita solo cuando todo es válido."),
]

writer = PdfWriter()

for img_name, title, caption in SLIDES:
    img_path = CAPTURAS_DIR / img_name
    if not img_path.exists():
        print(f"  ⚠ No encontrado: {img_path}")
        continue

    # Open image, build an A4-portrait page that fits the screenshot
    img = Image.open(img_path)
    if img.mode != "RGB":
        img = img.convert("RGB")

    # A4 portrait at 150dpi = 1240 × 1754 px
    PAGE_W, PAGE_H = 1240, 1754
    # Margins
    MARGIN_X = 80
    MARGIN_TOP = 140
    MARGIN_BOTTOM = 220  # space for caption

    # Phone screenshot is tall (iPhone 14: ~390x844 ratio). Fit by height.
    avail_h = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
    avail_w = PAGE_W - 2 * MARGIN_X
    img_ratio = img.width / img.height
    target_h = avail_h
    target_w = int(target_h * img_ratio)
    if target_w > avail_w:
        target_w = avail_w
        target_h = int(target_w / img_ratio)
    img_resized = img.resize((target_w, target_h), Image.LANCZOS)

    # Build a white canvas
    canvas = Image.new("RGB", (PAGE_W, PAGE_H), "white")
    # Center image horizontally
    x = (PAGE_W - target_w) // 2
    y = MARGIN_TOP
    canvas.paste(img_resized, (x, y))

    # Add title (top) and caption (bottom) — use default bitmap font
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(canvas)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.otf", 38)
        caption_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except Exception:
        title_font = ImageFont.load_default()
        caption_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Title
    draw.text((MARGIN_X, 60), title, fill="#14141A", font=title_font)
    # Caption (multi-line wrap)
    import textwrap
    wrapped = textwrap.wrap(caption, width=70)
    y_cap = MARGIN_TOP + target_h + 30
    for line in wrapped:
        draw.text((MARGIN_X, y_cap), line, fill="#3A3A33", font=caption_font)
        y_cap += 30
    # Footer mono
    draw.text((MARGIN_X, PAGE_H - 50), "Folleto Clasificados · Prototipo mobile-first · Z.ai", fill="#8A8579", font=small_font)

    # Convert PIL image → PDF page
    img_bytes = io.BytesIO()
    canvas.save(img_bytes, format="PNG")
    img_bytes.seek(0)
    # Use pdfium to render PNG into a PDF page
    temp_pdf = pdfium.PdfDocument.new()
    page = temp_pdf.new_page(PAGE_W, PAGE_H)
    # pdfium can't paste bitmap directly; use Image as JPEG embedded via page.add_image? actually pypdfium2 doesn't have that.
    # Simpler: use PIL's save as PDF page directly.
    temp_pdf.close()
    # Better approach: just save canvas as PDF directly via PIL
    page_pdf_bytes = io.BytesIO()
    canvas.save(page_pdf_bytes, format="PDF", resolution=150.0)
    page_pdf_bytes.seek(0)
    from pypdf import PdfReader
    reader = PdfReader(page_pdf_bytes)
    writer.add_page(reader.pages[0])
    print(f"  ✓ {img_name} → page added ({target_w}×{target_h} px)")

# Set metadata
writer.add_metadata({
    "/Title": "Folleto Clasificados — Prototipo mobile-first",
    "/Author": "Z.ai",
    "/Subject": "4 pantallas del folleto clasificados: Home, Categoría, Detalle, Editor",
    "/Creator": "Z.ai",
})

with open(OUTPUT_PDF, "wb") as f:
    writer.write(f)

print(f"\n✅ PDF generado: {OUTPUT_PDF}")
print(f"   Tamaño: {OUTPUT_PDF.stat().st_size / 1024 / 1024:.2f} MB")
print(f"   Páginas: {len(writer.pages)}")

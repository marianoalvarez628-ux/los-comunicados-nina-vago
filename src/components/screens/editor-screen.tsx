"use client";

import {
  X,
  Camera,
  Check,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  Loader2,
  Tag,
  Phone,
} from "lucide-react";
import { useNav } from "@/store/nav";
import { useField, useWordCounter, useImages } from "./editor-hooks";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const MAX_IMAGES = 4;
const MAX_WORDS = 90;
const MAX_TITULO = 24; // aprox 3 palabras en chars

type CategoriaOption = {
  id: string; // slug
  nombre: string;
  short: string;
  duracionDias: number;
};

export function EditorScreen({ editId }: { editId?: string }) {
  const { navigate, back } = useNav();
  const isEdit = Boolean(editId);

  // Campos del anuncio (los datos del comerciante ya los tenemos del registro)
  const titulo = useField("", MAX_TITULO);
  const descripcion = useField("", 600);
  const precio = useField("");
  const [estado, setEstado] = useState<"ABIERTO" | "CERRADO" | "PROMO">("ABIERTO");
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [showCats, setShowCats] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  const descCounter = useWordCounter(descripcion.value);
  const tituloPalabras = titulo.value.trim().split(/\s+/).filter(Boolean).length;
  const [imagenes, , addImage, removeImage] = useImages(MAX_IMAGES);

  // Estado de publicación
  const [publicando, setPublicando] = useState(false);
  const [errorPublicacion, setErrorPublicacion] = useState<string | null>(null);

  // Cargar categorías al montar
  useEffect(() => {
    fetch("/api/categorias", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setCategorias(data.categorias ?? []);
        setCatsLoading(false);
      })
      .catch((e) => {
        console.error("Error cargando categorías:", e);
        setCatsLoading(false);
      });
  }, []);

  const tituloValido = tituloPalabras >= 1 && tituloPalabras <= 3;
  const descValido = descCounter.count <= MAX_WORDS && descCounter.count > 0;
  const imagenesValido = imagenes.length > 0;
  const catValida = Boolean(categoriaSlug);
  const formValido = tituloValido && descValido && imagenesValido && catValida;

  const categoriaElegida = categorias.find((c) => c.id === categoriaSlug);

  async function handleSave() {
    if (!formValido || publicando) return;

    setPublicando(true);
    setErrorPublicacion(null);

    try {
      const res = await fetch("/api/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.value,
          descripcion: descripcion.value,
          categoriaSlug,
          imagenes,
          precio: precio.value || undefined,
          estado,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorPublicacion(data.error || "Error al publicar");
        setPublicando(false);
        return;
      }

      // Éxito: guardar mensaje y volver al Home (con toast de éxito)
      // TODO: cuando el DetalleScreen se conecte a la DB, navegar al detalle:
      // navigate({ name: "detalle", anuncioId: data.anuncio.id });
      try {
        sessionStorage.setItem("toast_exito", `Anuncio publicado: ${data.anuncio.titulo}. Vence en ${data.anuncio.duracionDias} días.`);
      } catch {}
      // Volver al Home (resetear navegación)
      window.location.href = "/?v=published";
    } catch (e) {
      setErrorPublicacion("No se pudo conectar con el servidor");
      setPublicando(false);
    }
  }

  function handleClose() {
    back();
  }

  return (
    <div className="animate-slide-in-right pb-2 min-h-screen">
      {/* Header */}
      <header className="px-4 pt-2 pb-3 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#14141A]/95 backdrop-blur z-10">
        <button
          onClick={handleClose}
          className="text-[#8A8579] hover:text-[#F5F0E8] transition-colors p-1 -ml-1"
          aria-label="Cancelar"
        >
          <X size={20} />
        </button>
        <h1 className="font-heading italic text-[16px] text-[#F5F0E8]">
          {isEdit ? "Editar anuncio" : "Publicar anuncio"}
        </h1>
        <button
          onClick={handleSave}
          disabled={!formValido || publicando}
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all",
            formValido && !publicando
              ? "bg-[#FF6B5C] text-[#14141A] active:scale-95"
              : "bg-[#2A2A33] text-[#5A554A] cursor-not-allowed"
          )}
        >
          {publicando ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Check size={14} />
              {isEdit ? "Guardar" : "Publicar"}
            </>
          )}
        </button>
      </header>

      <div className="px-4 pt-3 pb-4 space-y-4">
        {/* Error de publicación */}
        {errorPublicacion && (
          <div className="bg-[#FF6B5C]/10 border border-[#FF6B5C]/30 rounded-lg px-3 py-2.5 flex items-start gap-2">
            <AlertCircle size={14} className="text-[#FF6B5C] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#FF6B5C] leading-snug flex-1">{errorPublicacion}</p>
          </div>
        )}

        {/* 01. Imágenes del anuncio */}
        <section>
          <SectionLabel
            num="01"
            icon={<ImageIcon size={11} />}
            label="Imágenes del anuncio"
            hint={`${imagenes.length} / ${MAX_IMAGES}`}
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {imagenes.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-[#FF6B5C]/20"
              >
                { }
                <img
                  src={img}
                  alt={`Imagen ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-[#FF6B5C] text-[#14141A] text-[7.5px] font-bold px-1.5 py-0.5 rounded-full">
                    PORTADA
                  </span>
                )}
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 backdrop-blur rounded-full flex items-center justify-center text-white"
                  aria-label="Quitar imagen"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {imagenes.length < MAX_IMAGES && (
              <button
                onClick={addImage}
                className="aspect-square rounded-lg border-2 border-dashed border-white/15 hover:border-[#FF6B5C]/40 hover:bg-[#FF6B5C]/5 flex flex-col items-center justify-center gap-1 text-[#8A8579] hover:text-[#FF6B5C] transition-colors"
              >
                <Camera size={18} />
                <span className="text-[9px] font-medium">
                  {imagenes.length === 0 ? "Subir" : "Agregar"}
                </span>
              </button>
            )}
            {Array.from({ length: Math.max(0, MAX_IMAGES - imagenes.length - 1) }).map(
              (_, i) => (
                <div
                  key={`ph-${i}`}
                  className="aspect-square rounded-lg border border-dashed border-white/8 bg-[#1E1E26]/40"
                />
              )
            )}
          </div>
          <p className="mt-1.5 text-[9.5px] text-[#5A554A]">
            Primera imagen = portada. Baja resolución recomendada (≤200KB c/u).
          </p>
        </section>

        {/* 02. Categoría */}
        <section>
          <SectionLabel
            num="02"
            icon={<Tag size={11} />}
            label="Categoría"
            hint={categoriaElegida ? `${categoriaElegida.duracionDias} días` : undefined}
            hintTone={categoriaElegida ? "ok" : "muted"}
          />
          <button
            onClick={() => setShowCats((v) => !v)}
            className={cn(
              "mt-2 w-full bg-[#1E1E26] border rounded-lg px-3 py-2.5 text-left flex items-center justify-between transition-colors",
              categoriaSlug
                ? "border-[#FF6B5C]/30 text-[#F5F0E8]"
                : "border-white/8 text-[#5A554A]"
            )}
          >
            <span className="text-[13px] truncate">
              {categoriaElegida
                ? categoriaElegida.nombre
                : catsLoading
                ? "Cargando categorías..."
                : "Elegí la categoría"}
            </span>
            <ChevronDown
              size={14}
              className={cn("text-[#8A8579] transition-transform", showCats && "rotate-180")}
            />
          </button>
          {showCats && (
            <div className="bg-[#1E1E26] border border-white/8 rounded-lg overflow-hidden mt-1 max-h-64 overflow-y-auto">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoriaSlug(cat.id);
                    setShowCats(false);
                    setErrorPublicacion(null);
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 text-left border-b border-white/5 last:border-b-0 transition-colors flex items-center justify-between",
                    cat.id === categoriaSlug
                      ? "bg-[#FF6B5C]/10"
                      : "hover:bg-[#2A2A33]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#F5F0E8] font-medium">{cat.nombre}</p>
                    <p className="text-[9.5px] text-[#8A8579] mt-0.5">
                      Anuncios duran {cat.duracionDias} días
                    </p>
                  </div>
                  {cat.id === categoriaSlug && <Check size={14} className="text-[#FF6B5C]" />}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 03. Estado */}
        <section>
          <SectionLabel num="03" icon={<Check size={11} />} label="Estado del anuncio" />
          <div className="mt-2 flex gap-2">
            {(["ABIERTO", "CERRADO", "PROMO"] as const).map((est) => (
              <button
                key={est}
                onClick={() => setEstado(est)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10.5px] font-bold tracking-wide transition-all border",
                  estado === est
                    ? est === "ABIERTO"
                      ? "bg-[#5CD9A0]/15 text-[#5CD9A0] border-[#5CD9A0]/40"
                      : est === "CERRADO"
                      ? "bg-[#FF6B5C]/15 text-[#FF6B5C] border-[#FF6B5C]/40"
                      : "bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/40"
                    : "bg-[#2A2A33] text-[#8A8579] border-white/5"
                )}
              >
                {est}
              </button>
            ))}
          </div>
        </section>

        {/* 04. Título */}
        <section>
          <SectionLabel
            num="04"
            icon={<ImageIcon size={11} />}
            label="Título del anuncio"
            hint={`${tituloPalabras}/3 palabras`}
            hintTone={
              tituloPalabras === 0 ? "muted" : tituloValido ? "ok" : "warn"
            }
          />
          <input
            type="text"
            value={titulo.value}
            onChange={titulo.onChange}
            placeholder="Ej: Milanesa de la abuela"
            className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors font-heading italic"
          />
          {tituloPalabras > 3 && (
            <p className="mt-1.5 text-[9.5px] text-[#FF6B5C] inline-flex items-center gap-1">
              <AlertCircle size={10} />
              Máximo 3 palabras. Hoy tenés {tituloPalabras}.
            </p>
          )}
        </section>

        {/* 05. Precio (opcional) */}
        <section>
          <SectionLabel
            num="05"
            icon={<Tag size={11} />}
            label="Precio"
            hint="opcional"
          />
          <input
            type="text"
            value={precio.value}
            onChange={precio.onChange}
            placeholder="Ej: $1.250"
            className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors font-num"
          />
        </section>

        {/* 06. Descripción */}
        <section>
          <SectionLabel
            num="06"
            icon={<ImageIcon size={11} />}
            label="Descripción"
            hint={`${descCounter.count}/${MAX_WORDS} palabras`}
            hintTone={
              descCounter.count === 0 ? "muted" : descValido ? "ok" : "warn"
            }
          />
          <div className="mt-2">
            <textarea
              value={descripcion.value}
              onChange={descripcion.onChange}
              placeholder="Contá brevemente qué ofrecés, qué lo hace distinto, cómo comprar o contratar..."
              rows={5}
              className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors resize-none desc-box"
            />
            <div className="mt-2 h-1 bg-[#2A2A33] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-200 rounded-full",
                  descCounter.count > MAX_WORDS
                    ? "bg-[#FF6B5C]"
                    : descCounter.count > MAX_WORDS * 0.8
                    ? "bg-[#FFB547]"
                    : "bg-[#5CD9A0]"
                )}
                style={{
                  width: `${Math.min(100, (descCounter.count / MAX_WORDS) * 100)}%`,
                }}
              />
            </div>
          </div>
          {descCounter.count > MAX_WORDS && (
            <p className="mt-1.5 text-[9.5px] text-[#FF6B5C] inline-flex items-center gap-1">
              <AlertCircle size={10} />
              Te pasaste por {descCounter.count - MAX_WORDS} palabras. Recortá para publicar.
            </p>
          )}
        </section>

        {/* 07. Vista previa en vivo */}
        <section>
          <SectionLabel
            num="07"
            icon={<ImageIcon size={11} />}
            label="Vista previa"
          />
          <div className="mt-2 bg-[#1E1E26] rounded-xl p-3 border border-white/5 border-l-[3px] border-l-[#FF6B5C]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "text-[8px] px-2 py-0.5 rounded-full border font-bold tracking-wide",
                  estado === "ABIERTO"
                    ? "bg-[#5CD9A0]/12 text-[#5CD9A0] border-[#5CD9A0]/30"
                    : estado === "CERRADO"
                    ? "bg-[#FF6B5C]/12 text-[#FF6B5C] border-[#FF6B5C]/30"
                    : "bg-[#FFB547]/12 text-[#FFB547] border-[#FFB547]/30"
                )}
              >
                {estado}
              </span>
              {categoriaElegida && (
                <span className="text-[9px] text-[#8A8579]">
                  {categoriaElegida.short} · {categoriaElegida.duracionDias} días
                </span>
              )}
            </div>
            <h3 className="font-heading italic text-[14px] text-[#F5F0E8] leading-tight">
              {titulo.value || "Tu título (máx 3 palabras)"}
            </h3>
            {precio.value && (
              <p className="text-[14px] text-[#FF6B5C] font-num font-semibold mt-1">
                {precio.value}
              </p>
            )}
            <div className="desc-box mt-2">
              <p className="text-[10.5px] leading-[1.5] text-[#C9C2B6] line-clamp-2">
                {descripcion.value ||
                  "Tu descripción aparecerá aquí. Escribí algo breve y concreto..."}
              </p>
            </div>
          </div>
        </section>

        {/* Submit hint */}
        <div className="text-center pt-2">
          <p className="text-[9.5px] text-[#5A554A]">
            Al publicar, el anuncio aparece visible en la categoría elegida.
            {categoriaElegida && (
              <>
                {" "}
                Vence en {categoriaElegida.duracionDias} días. Podés republicarlo
                después.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  num,
  icon,
  label,
  hint,
  hintTone = "muted",
}: {
  num: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  hintTone?: "muted" | "ok" | "warn";
}) {
  const toneClass =
    hintTone === "ok"
      ? "text-[#5CD9A0]"
      : hintTone === "warn"
      ? "text-[#FF6B5C]"
      : "text-[#8A8579]";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF6B5C]/15 text-[#FF6B5C] text-[10px] font-bold font-num">
          {num}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.14em] text-[#8A8579] uppercase">
          {icon}
          {label}
        </span>
      </div>
      {hint && (
        <span className={cn("text-[9.5px] font-num font-medium", toneClass)}>
          {hint}
        </span>
      )}
    </div>
  );
}

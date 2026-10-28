"use client";

import {
  ArrowLeft,
  Camera,
  X,
  Check,
  Store,
  MapPin,
  Instagram,
  Phone,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useNav } from "@/store/nav";
import { useField, useWordCounter, useImages } from "./editor-hooks";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 4;
const MAX_WORDS = 90;
const MAX_TITULO = 24; // aprox 3 palabras

export function EditorScreen({ editId }: { editId?: string }) {
  const { back } = useNav();
  const isEdit = Boolean(editId);

  const nombre = useField("La Esquina");
  const titulo = useField("", MAX_TITULO);
  const direccion = useField("Av. Rivadavia 1234, Caballito");
  const instagram = useField("@laesquina");
  const whatsapp = useField("+54 11 5555-1234");
  const descripcion = useField("", 600);
  const descCounter = useWordCounter(descripcion.value);
  const tituloPalabras = titulo.value.trim().split(/\s+/).filter(Boolean).length;

  const [imagenes, , addImage, removeImage] = useImages(MAX_IMAGES);

  const tituloValido = tituloPalabras >= 1 && tituloPalabras <= 3;
  const descValido = descCounter.count <= MAX_WORDS && descCounter.count > 0;
  const imagenesValido = imagenes.length > 0;
  const formValido = tituloValido && descValido && imagenesValido && nombre.value.length > 0;

  function handleSave() {
    if (!formValido) return;
    // En prototipo: volvemos al home
    setTimeout(() => {
      back();
    }, 800);
  }

  return (
    <div className="animate-slide-in-right pb-2">
      {/* Header */}
      <header className="px-4 pt-2 pb-3 border-b border-white/5 flex items-center justify-between">
        <button
          onClick={back}
          className="text-[#FF6B5C] active:scale-95 transition-transform p-1 -ml-1"
          aria-label="Cancelar"
        >
          <X size={20} />
        </button>
        <h1 className="font-heading italic text-[16px] text-[#F5F0E8]">
          {isEdit ? "Editar anuncio" : "Publicar anuncio"}
        </h1>
        <button
          onClick={handleSave}
          disabled={!formValido}
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all",
            formValido
              ? "bg-[#FF6B5C] text-[#14141A] active:scale-95"
              : "bg-[#2A2A33] text-[#5A554A] cursor-not-allowed"
          )}
        >
          <Check size={14} />
          {isEdit ? "Guardar" : "Publicar"}
        </button>
      </header>

      <div className="px-4 pt-3 pb-4 space-y-4">
        {/* Hero images (4 max) */}
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
            {/* Placeholders vacíos */}
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

        {/* Nombre del comercio */}
        <section>
          <SectionLabel
            num="02"
            icon={<Store size={11} />}
            label="Nombre del comercio"
          />
          <input
            type="text"
            value={nombre.value}
            onChange={nombre.onChange}
            placeholder="Ej: La Esquina"
            className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
          />
        </section>

        {/* Título (máx 3 palabras) */}
        <section>
          <SectionLabel
            num="03"
            icon={<ImageIcon size={11} />}
            label="Título del anuncio"
            hint={`${tituloPalabras}/3 palabras`}
            hintTone={
              tituloPalabras === 0
                ? "muted"
                : tituloValido
                ? "ok"
                : "warn"
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

        {/* Dirección */}
        <section>
          <SectionLabel
            num="04"
            icon={<MapPin size={11} />}
            label="Dirección"
          />
          <input
            type="text"
            value={direccion.value}
            onChange={direccion.onChange}
            placeholder="Calle y número, barrio"
            className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
          />
        </section>

        {/* Instagram + WhatsApp en grilla 2 columnas */}
        <section className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel
              num="05"
              icon={<Instagram size={11} />}
              label="Instagram"
            />
            <input
              type="text"
              value={instagram.value}
              onChange={instagram.onChange}
              placeholder="@usuario"
              className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[12.5px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
            />
          </div>
          <div>
            <SectionLabel
              num="06"
              icon={<Phone size={11} />}
              label="WhatsApp"
            />
            <input
              type="tel"
              value={whatsapp.value}
              onChange={whatsapp.onChange}
              placeholder="+54 11 ..."
              className="mt-2 w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[12.5px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
            />
          </div>
        </section>

        {/* Descripción con contador */}
        <section>
          <SectionLabel
            num="07"
            icon={<ImageIcon size={11} />}
            label="Descripción"
            hint={`${descCounter.count}/${MAX_WORDS} palabras`}
            hintTone={
              descCounter.count === 0
                ? "muted"
                : descValido
                ? "ok"
                : "warn"
            }
          />
          <div className="mt-2 relative">
            <textarea
              value={descripcion.value}
              onChange={descripcion.onChange}
              placeholder="Contá brevemente qué ofrecés, qué lo hace distinto, cómo comprar o contratar..."
              rows={5}
              className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors resize-none desc-box"
            />
            {/* Barra de progreso */}
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

        {/* Preview card mini */}
        <section>
          <SectionLabel
            num="08"
            icon={<ImageIcon size={11} />}
            label="Vista previa"
          />
          <div className="mt-2 bg-[#1E1E26] rounded-xl p-3 border border-white/5 border-l-[3px] border-l-[#FF6B5C]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#2A2A33] flex items-center justify-center text-[#FF6B5C] text-[10px] font-bold">
                {nombre.value.charAt(0) || "?"}
              </div>
              <span className="text-[12px] font-semibold text-[#F5F0E8] flex-1">
                {nombre.value || "Tu comercio"}
              </span>
            </div>
            <h3 className="font-heading italic text-[14px] text-[#F5F0E8] leading-tight">
              {titulo.value || "Tu título (máx 3 palabras)"}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-[9.5px] text-[#8A8579]">
              <span className="inline-flex items-center gap-1">
                <MapPin size={9} className="text-[#FF6B5C]" />
                {direccion.value || "Tu dirección"}
              </span>
            </div>
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
            Al publicar, el anuncio aparece visible en la categoría de tu rubro.
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

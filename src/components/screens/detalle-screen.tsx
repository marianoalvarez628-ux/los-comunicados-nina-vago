"use client";

import {
  ArrowLeft,
  MapPin,
  Instagram,
  Phone,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Bookmark,
  Share2,
  Star,
} from "lucide-react";
import { useNav } from "@/store/nav";
import {
  getAnuncio,
  getComerciante,
  getGaleria,
  estadoChipColor,
} from "@/lib/data";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DetalleScreen({ anuncioId }: { anuncioId: string }) {
  const { back } = useNav();
  const anuncio = getAnuncio(anuncioId);
  const [imgIndex, setImgIndex] = useState(0);
  const [guardado, setGuardado] = useState(false);

  if (!anuncio) return null;
  const comerciante = getComerciante(anuncio.comercianteId);
  if (!comerciante) return null;
  const galeria = getGaleria(comerciante.id);

  return (
    <div className="animate-slide-in-right pb-2">
      {/* Header */}
      <header className="px-4 pt-2 pb-2 flex items-center justify-between sticky top-0 bg-[#14141A]/95 backdrop-blur z-10">
        <button
          onClick={back}
          className="text-[#FF6B5C] active:scale-95 transition-transform p-1 -ml-1"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGuardado((v) => !v)}
            className={cn(
              "p-1 transition-colors",
              guardado ? "text-[#FF6B5C]" : "text-[#8A8579]"
            )}
          >
            <Bookmark size={18} fill={guardado ? "currentColor" : "none"} />
          </button>
          <button className="text-[#8A8579] p-1" aria-label="Compartir">
            <Share2 size={16} />
          </button>
        </div>
      </header>

      {/* Galería de 4 imágenes */}
      <div className="px-4">
        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#2A2A33] relative">
          { }
          <img
            src={galeria[imgIndex]}
            alt={anuncio.titulo}
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Contador */}
          <span className="absolute top-3 right-3 bg-black/55 backdrop-blur text-[#F5F0E8] text-[10px] px-2.5 py-1 rounded-full font-medium">
            {imgIndex + 1} / {galeria.length}
          </span>

          {/* Flechas */}
          {galeria.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImgIndex((i) => (i - 1 + galeria.length) % galeria.length)
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
                aria-label="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setImgIndex((i) => (i + 1) % galeria.length)
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
                aria-label="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Estado badge */}
          <span
            className={cn(
              "absolute top-3 left-3 text-[9px] px-2.5 py-1 rounded-full border font-bold tracking-wide",
              estadoChipColor(anuncio.estado)
            )}
          >
            {anuncio.estado}
          </span>
        </div>

        {/* Thumbs */}
        <div className="mt-2 flex gap-2">
          {galeria.map((img, i) => (
            <button
              key={i}
              onClick={() => setImgIndex(i)}
              className={cn(
                "flex-1 aspect-square rounded-md overflow-hidden border-2 transition-all",
                i === imgIndex
                  ? "border-[#FF6B5C]"
                  : "border-transparent opacity-60"
              )}
              aria-label={`Imagen ${i + 1}`}
            >
              { }
              <img
                src={img}
                alt={`Miniatura ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Título + precio */}
      <div className="px-4 mt-4">
        <h1 className="font-heading italic text-[22px] text-[#F5F0E8] leading-tight">
          {anuncio.titulo}
        </h1>
        {anuncio.precio && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-heading text-[24px] text-[#FF6B5C] font-semibold">
              {anuncio.precio}
            </span>
            <span className="text-[10px] text-[#5A554A]">precio referencial</span>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={11}
              className={cn(
                i <= 4 ? "text-[#FFB547]" : "text-[#3A3A44]"
              )}
              fill={i <= 4 ? "currentColor" : "none"}
            />
          ))}
          <span className="text-[9.5px] text-[#8A8579] ml-1">(124)</span>
        </div>
      </div>

      {/* Datos comerciante */}
      <div className="px-4 mt-4">
        <div className="bg-[#1E1E26] rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF6B5C]/20 flex-shrink-0">
              { }
              <img
                src={comerciante.avatar}
                alt={comerciante.nombre}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading italic text-[13px] text-[#F5F0E8]">
                {comerciante.nombre}
              </p>
              <p className="text-[9.5px] text-[#8A8579]">
                {comerciante.rubro}
              </p>
            </div>
            <span
              className={cn(
                "text-[8px] px-2 py-0.5 rounded-full border font-bold tracking-wide",
                estadoChipColor(comerciante.abierto ? "ABIERTO" : "CERRADO")
              )}
            >
              {comerciante.abierto ? "ABIERTO" : "CERRADO"}
            </span>
          </div>

          {/* Datos con íconos */}
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            <div className="flex items-start gap-2 text-[11px] text-[#C9C2B6]">
              <MapPin size={12} className="text-[#FF6B5C] mt-0.5 flex-shrink-0" />
              <span className="leading-snug">
                {comerciante.direccion}
                <span className="text-[#5A554A] mx-1">·</span>
                <span className="text-[#8A8579]">{comerciante.barrio}</span>
              </span>
            </div>
            {comerciante.instagram && (
              <a
                href="#"
                className="flex items-center gap-2 text-[11px] text-[#C9C2B6] hover:text-[#FF6B5C] transition-colors"
              >
                <Instagram size={12} className="text-[#FF6B5C] flex-shrink-0" />
                <span>{comerciante.instagram}</span>
              </a>
            )}
            {comerciante.telefono && (
              <a
                href={`tel:${comerciante.telefono}`}
                className="flex items-center gap-2 text-[11px] text-[#C9C2B6] hover:text-[#FF6B5C] transition-colors"
              >
                <Phone size={12} className="text-[#FF6B5C] flex-shrink-0" />
                <span>{comerciante.telefono}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="px-4 mt-4">
        <h2 className="text-[10px] font-bold tracking-[0.18em] text-[#8A8579] uppercase mb-2">
          Descripción
        </h2>
        <div className="desc-box">
          <p className="text-[12px] leading-[1.55] text-[#F5F0E8]">
            {anuncio.descripcion}
          </p>
        </div>
        <p className="mt-1.5 text-[9px] text-[#5A554A] text-right font-num">
          {anuncio.descripcion.split(" ").length} / 90 palabras
        </p>
      </div>

      {/* CTA fijo en la parte inferior */}
      <div className="sticky bottom-0 px-4 py-3 bg-[#14141A]/95 backdrop-blur border-t border-white/5 flex gap-2">
        <button className="flex-1 bg-[#FF6B5C] text-[#14141A] text-[12px] font-bold py-3 rounded-lg inline-flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
          <Phone size={14} />
          Llamar ahora
        </button>
        <button className="flex-1 bg-[#2A2A33] text-[#F5F0E8] text-[12px] font-medium py-3 rounded-lg border border-white/5 inline-flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
          <MessageCircle size={14} className="text-[#FF6B5C]" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}

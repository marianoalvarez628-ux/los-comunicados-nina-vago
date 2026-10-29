"use client";

import { ArrowLeft, MapPin, Instagram, Phone, ChevronRight, Sliders } from "lucide-react";
import { useNav } from "@/store/nav";
import {
  getCategoria,
  getAnunciosByCategoria,
  estadoChipColor,
  type Anuncio,
  type Comerciante,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Filtro = "todos" | "cerca" | "envio";

export function CategoriaScreen({ categoriaId }: { categoriaId: string }) {
  const { navigate, back } = useNav();
  const categoria = getCategoria(categoriaId);
  const anuncios = getAnunciosByCategoria(categoriaId);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  if (!categoria) return null;

  const filtros: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "cerca", label: "Cerca de mí" },
    { id: "envio", label: "Con envío" },
  ];

  return (
    <div className="animate-slide-in-right pb-2">
      {/* Header con back */}
      <header className="px-4 pt-2 pb-2 border-b border-white/5 flex items-center justify-between">
        <button
          onClick={back}
          className="text-[#FF6B5C] active:scale-95 transition-transform p-1 -ml-1"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading italic text-[14px] text-[#F5F0E8] flex-1 text-center px-2 leading-tight">
          {categoria.short}
        </h1>
        <button
          className="text-[#FF6B5C] active:scale-95 transition-transform p-1"
          aria-label="Filtros"
        >
          <Sliders size={16} />
        </button>
      </header>

      {/* Banner de categoría */}
      <div className="px-4 py-3 flex items-center gap-3 bg-[#1E1E26]/40 border-b border-white/5">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          { }
          <img
            src={categoria.imagen}
            alt={categoria.nombre}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading italic text-[14px] text-[#F5F0E8] leading-tight">
            {categoria.nombre}
          </p>
          <p className="text-[10px] text-[#8A8579] mt-0.5 line-clamp-2">
            {categoria.descripcion}
          </p>
        </div>
        <span className="text-[9px] text-[#FF6B5C] bg-[#FF6B5C]/12 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
          {anuncios.length} {anuncios.length === 1 ? "anuncio" : "anuncios"}
        </span>
      </div>

      {/* Filtros */}
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              "text-[10px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border",
              filtro === f.id
                ? "bg-[#FF6B5C] text-[#14141A] border-[#FF6B5C]"
                : "bg-[#2A2A33] text-[#C9C2B6] border-white/5"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Anuncios */}
      <div className="px-4 pt-1 pb-4 flex flex-col gap-3">
        {anuncios.length === 0 ? (
          <div className="text-center py-12 text-[#5A554A] text-[12px]">
            Todavía no hay anuncios en esta categoría.
            <br />
            Sé el primero en publicar.
          </div>
        ) : (
          anuncios.map((a) => {
            const comerciante = getComercianteById(a.comercianteId);
            if (!comerciante) return null;
            return (
              <AdCard
                key={a.id}
                anuncio={a}
                comerciante={comerciante}
                onOpen={() =>
                  navigate({ name: "detalle", anuncioId: a.id })
                }
              />
            );
          })
        )}
      </div>

      <div className="px-4 text-center text-[10px] text-[#5A554A]">
        Fin de la categoría · {anuncios.length}{" "}
        {anuncios.length === 1 ? "anuncio publicado" : "anuncios publicados"}
      </div>
    </div>
  );
}

// Helper local para evitar imports circulares en el map
import { getComerciante as getComercianteById } from "@/lib/data";

function AdCard({
  anuncio,
  comerciante,
  onOpen,
}: {
  anuncio: Anuncio;
  comerciante: Comerciante;
  onOpen: () => void;
}) {
  const [expandido, setExpandido] = useState(false);

  return (
    <article className="bg-[#1E1E26] rounded-xl p-3 border border-white/5 border-l-[3px] border-l-[#FF6B5C]">
      {/* Header: avatar + nombre + estado */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FF6B5C]/20 flex-shrink-0">
          { }
          <img
            src={comerciante.avatar}
            alt={comerciante.nombre}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-[12px] font-semibold text-[#F5F0E8] flex-1 truncate">
          {comerciante.nombre}
        </span>
        <span
          className={cn(
            "text-[8px] px-2 py-0.5 rounded-full border font-bold tracking-wide whitespace-nowrap",
            estadoChipColor(anuncio.estado)
          )}
        >
          {anuncio.estado}
        </span>
      </div>

      {/* Imagen + título */}
      <button
        onClick={onOpen}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-[#2A2A33]">
          { }
          <img
            src={anuncio.imagen}
            alt={anuncio.titulo}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="font-heading italic text-[14px] text-[#F5F0E8] leading-tight">
          {anuncio.titulo}
        </h3>
      </button>

      {/* Datos contacto */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-[#8A8579]">
        <span className="inline-flex items-center gap-1">
          <MapPin size={9} className="text-[#FF6B5C]" />
          {comerciante.direccion}
        </span>
        {comerciante.instagram && (
          <span className="inline-flex items-center gap-1">
            <Instagram size={9} className="text-[#FF6B5C]" />
            {comerciante.instagram}
          </span>
        )}
      </div>

      {/* Recuadro descripción */}
      <div className="desc-box mt-2.5">
        <p
          className={cn(
            "text-[10.5px] leading-[1.5] text-[#C9C2B6]",
            !expandido && "line-clamp-2"
          )}
        >
          {anuncio.descripcion}
        </p>
        <button
          onClick={() => setExpandido((v) => !v)}
          className="text-[#FF6B5C] text-[9px] font-bold mt-1.5 inline-flex items-center gap-1"
        >
          {expandido ? "Leer menos" : "Leer más"}
          <ChevronRight
            size={9}
            className={cn(
              "transition-transform",
              expandido && "rotate-90"
            )}
          />
        </button>
      </div>

      {/* Precio */}
      {anuncio.precio && (
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-heading text-[18px] text-[#FF6B5C] font-semibold">
            {anuncio.precio}
          </span>
          <span className="text-[9px] text-[#5A554A]">precio referencial</span>
        </div>
      )}

      {/* Action row */}
      <div className="mt-2.5 flex gap-1.5">
        <button className="flex-1 bg-[#FF6B5C] text-[#14141A] text-[10px] font-bold py-2 rounded-lg inline-flex items-center justify-center gap-1 active:scale-95 transition-transform">
          <Phone size={11} />
          Llamar
        </button>
        <button className="flex-1 bg-[#2A2A33] text-[#F5F0E8] text-[10px] font-medium py-2 rounded-lg border border-white/5 active:scale-95 transition-transform">
          WhatsApp
        </button>
        <button className="px-3 bg-[#2A2A33] text-[#F5F0E8] text-[10px] py-2 rounded-lg border border-white/5 active:scale-95 transition-transform">
          Guardar
        </button>
      </div>
    </article>
  );
}

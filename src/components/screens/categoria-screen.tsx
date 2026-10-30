"use client";

import {
  ArrowLeft,
  MapPin,
  Instagram,
  Phone,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { useNav } from "@/store/nav";
import {
  getCategoria,
  getAnunciosByCategoria,
  getGaleria,
  estadoChipColor,
  type Anuncio,
  type Comerciante,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function CategoriaScreen({ categoriaId }: { categoriaId: string }) {
  const { navigate, back } = useNav();
  const categoria = getCategoria(categoriaId);
  const anuncios = getAnunciosByCategoria(categoriaId);

  if (!categoria) return null;

  return (
    <div className="animate-slide-in-right pb-2">
      {/* Header con back — se mantiene igual */}
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

      {/* Sin banner de categoría, sin chips de filtros — directo a los anuncios */}

      {/* Anuncios */}
      <div className="px-4 pt-2 pb-4 flex flex-col gap-2.5">
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
  // Galería de hasta 4 miniaturas: usamos la galería del comerciante y limitamos a 4
  const miniaturas = (getGaleria(comerciante.id) || []).slice(0, 4);
  const [thumbActiva, setThumbActiva] = useState(0);

  return (
    <article className="bg-[#1E1E26] rounded-xl p-2.5 border border-white/5 border-l-[3px] border-l-[#FF6B5C]">
      {/* Header: avatar + nombre + dirección + instagram + chip estado, en línea */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FF6B5C]/20 flex-shrink-0">
          { }
          <img
            src={comerciante.avatar}
            alt={comerciante.nombre}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-[#F5F0E8] truncate">
              {comerciante.nombre}
            </span>
            <span
              className={cn(
                "text-[7.5px] px-1.5 py-0.5 rounded-full border font-bold tracking-wide whitespace-nowrap",
                estadoChipColor(anuncio.estado)
              )}
            >
              {anuncio.estado}
            </span>
          </div>
          {/* Dirección + Instagram en la misma línea */}
          <div className="flex items-center gap-2 mt-0.5 text-[9px] truncate">
            <span className="inline-flex items-center gap-1 text-[#8A8579] min-w-0">
              <MapPin size={8} className="text-[#FF6B5C] flex-shrink-0" />
              <span className="truncate">{comerciante.direccion}</span>
            </span>
            {comerciante.instagram && (
              <a
                href="#"
                className="inline-flex items-center gap-1 text-[#C9C2B6] hover:text-[#FF6B5C] transition-colors flex-shrink-0"
              >
                <Instagram size={9} className="text-[#FF6B5C]" />
                <span className="text-[8.5px]">{comerciante.instagram}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Recuadro descripción + miniaturas al lado de "Leer más" */}
      <div className="desc-box">
        <p
          className={cn(
            "text-[10px] leading-[1.45] text-[#C9C2B6]",
            !expandido && "line-clamp-2"
          )}
        >
          {anuncio.descripcion}
        </p>
        {/* Fila inferior: "Leer más" a la izquierda + miniaturas linkeables a la derecha */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <button
            onClick={() => setExpandido((v) => !v)}
            className="text-[#FF6B5C] text-[9px] font-bold inline-flex items-center gap-1 flex-shrink-0"
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
          {/* Miniaturas linkeables (hasta 4) */}
          <div className="flex items-center gap-1">
            {miniaturas.map((img, i) => (
              <button
                key={i}
                onClick={onOpen}
                className={cn(
                  "w-6 h-6 rounded overflow-hidden border transition-all active:scale-90",
                  i === thumbActiva
                    ? "border-[#FF6B5C]"
                    : "border-white/10 opacity-70"
                )}
                aria-label={`Ver imagen ${i + 1}`}
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
      </div>

      {/* Action row — igual que antes */}
      <div className="mt-2 flex gap-1.5">
        <button className="flex-1 bg-[#FF6B5C] text-[#14141A] text-[9.5px] font-bold py-1.5 rounded-lg inline-flex items-center justify-center gap-1 active:scale-95 transition-transform">
          <Phone size={11} />
          Llamar
        </button>
        <button className="flex-1 bg-[#2A2A33] text-[#F5F0E8] text-[9.5px] font-medium py-1.5 rounded-lg border border-white/5 active:scale-95 transition-transform">
          WhatsApp
        </button>
        <button className="px-3 bg-[#2A2A33] text-[#F5F0E8] text-[9.5px] py-1.5 rounded-lg border border-white/5 active:scale-95 transition-transform">
          Guardar
        </button>
      </div>
    </article>
  );
}

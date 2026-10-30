"use client";

import { Search, ChevronRight } from "lucide-react";
import { useNav } from "@/store/nav";
import { categorias, countAnunciosByCategoria } from "@/lib/data";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const { navigate } = useNav();

  return (
    <div className="animate-fade-in-up pb-2">
      {/* Header — solo el título, sin renglón de subinfo */}
      <header className="px-5 pt-4 pb-3">
        <h1 className="font-heading italic text-[32px] leading-tight text-[#F5F0E8] font-semibold">
          Clasificados
        </h1>
      </header>

      {/* Search bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 rounded-full bg-[#2A2A33] px-4 py-2.5 border border-white/5">
          <Search size={14} className="text-[#FF6B5C]" />
          <input
            type="text"
            placeholder="Buscar producto, servicio o categoría..."
            className="flex-1 bg-transparent border-0 outline-none text-[12px] text-[#F5F0E8] placeholder:text-[#5A554A]"
          />
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.18em] text-[#8A8579] uppercase">
          Categorías
        </h2>
        <span className="text-[10px] text-[#8A8579]">
          {categorias.length} tipos
        </span>
      </div>

      {/* Lista de categorías — cada una con imagen de referencia grande */}
      <div className="px-5 flex flex-col gap-2.5">
        {categorias.map((cat) => {
          const count = countAnunciosByCategoria(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() =>
                navigate({ name: "categoria", categoriaId: cat.id })
              }
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden",
                "bg-[#1E1E26] rounded-xl border border-white/5",
                "transition-all duration-200 hover:bg-[#2A2A33] hover:border-[#FF6B5C]/20",
                "active:scale-[0.99]"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Imagen de referencia — rectangular, no circular */}
              <div className="w-[88px] h-[88px] flex-shrink-0 overflow-hidden bg-[#2A2A33]">
                { }
                <img
                  src={cat.imagen}
                  alt={cat.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0 text-left py-2 pr-3">
                <h3 className="font-heading italic text-[15px] text-[#F5F0E8] leading-tight">
                  {cat.nombre}
                </h3>
                <p className="text-[10px] text-[#8A8579] mt-1 leading-snug line-clamp-2">
                  {cat.descripcion}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[9.5px] text-[#FF6B5C] bg-[#FF6B5C]/12 px-2 py-0.5 rounded-full font-medium">
                  {count} {count === 1 ? "anuncio" : "anuncios"}
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight
                size={16}
                className="text-[#5A554A] mr-2 group-hover:text-[#FF6B5C] transition-colors flex-shrink-0"
              />
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-5 mt-5 text-center">
        <p className="text-[10px] text-[#5A554A] tracking-wide">
          Tocá una categoría para ver sus anuncios
        </p>
      </div>
    </div>
  );
}

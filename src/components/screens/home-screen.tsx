"use client";

import { Search, MapPin, Store } from "lucide-react";
import { useNav } from "@/store/nav";
import { comerciantes, countAnunciosByComerciante } from "@/lib/data";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const { navigate } = useNav();

  const totalComercios = comerciantes.length;
  const totalAnuncios = comerciantes.reduce(
    (acc, c) => acc + countAnunciosByComerciante(c.id),
    0
  );

  return (
    <div className="animate-fade-in-up pb-2">
      {/* Header */}
      <header className="px-5 pt-2 pb-3">
        <h1 className="font-heading italic text-[26px] leading-none text-[#F5F0E8]">
          Clasificados
        </h1>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8A8579]">
          <MapPin size={11} className="text-[#FF6B5C]" />
          <span>Caballito, CABA</span>
          <span className="mx-1 text-[#3A3A44]">·</span>
          <span>
            {totalComercios} comercios · {totalAnuncios} anuncios
          </span>
        </div>
      </header>

      {/* Search bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 rounded-full bg-[#2A2A33] px-4 py-2.5 border border-white/5">
          <Search size={14} className="text-[#FF6B5C]" />
          <input
            type="text"
            placeholder="Buscar producto, servicio o comercio..."
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
          {comerciantes.length} tipos
        </span>
      </div>

      {/* Grid 2x3 de comerciantes */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {comerciantes.map((c) => {
          const count = countAnunciosByComerciante(c.id);
          return (
            <button
              key={c.id}
              onClick={() =>
                navigate({ name: "categoria", comercianteId: c.id })
              }
              className={cn(
                "group relative flex flex-col items-center text-center",
                "bg-[#1E1E26] rounded-xl p-3 pt-4 border border-white/5",
                "transition-all duration-200 hover:bg-[#2A2A33] hover:border-[#FF6B5C]/20",
                "active:scale-[0.98]"
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#FF6B5C]/20"
                  style={{
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  { }
                  <img
                    src={c.avatar}
                    alt={c.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Indicador ABIERTO/CERRADO */}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1E1E26]",
                    c.abierto ? "bg-[#5CD9A0]" : "bg-[#FF6B5C]/60"
                  )}
                />
              </div>

              {/* Nombre */}
              <h3 className="font-heading italic text-[13px] text-[#F5F0E8] mt-2 leading-tight">
                {c.nombre}
              </h3>
              {/* Categoría */}
              <p className="text-[9.5px] tracking-[0.06em] text-[#8A8579] mt-0.5">
                {c.rubro}
              </p>

              {/* Count chip */}
              <span className="mt-2 inline-flex items-center gap-1 text-[8.5px] text-[#FF6B5C] bg-[#FF6B5C]/12 px-2 py-0.5 rounded-full font-medium">
                <Store size={9} />
                {count} anuncios
              </span>
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

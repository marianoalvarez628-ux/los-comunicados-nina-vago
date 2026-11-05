"use client";

import { useState, useEffect } from "react";
import { BarChart3, X, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricaDia = {
  fecha: string;
  dia: string;
  vistas: number;
  likes: number;
  compartidos: number;
  guardados: number;
  total: number;
};

type MetricasData = {
  anuncio: { id: string; titulo: string; publicadoEn: string };
  dias: MetricaDia[];
  totales: { vistas: number; likes: number; compartidos: number; guardados: number };
  promedios: { vistasPorDia: number; likesPorDia: number };
  diaMasActivo: { fecha: string; dia: string; total: number } | null;
};

export function MetricasDashboard({ anuncioId, onClose }: { anuncioId: string; onClose: () => void }) {
  const [data, setData] = useState<MetricasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/anuncios/${anuncioId}/metricas`, { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al cargar métricas");
        }
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    cargar();
    return () => {
      cancelled = true;
    };
  }, [anuncioId]);

  if (loading) {
    return (
      <div className="bg-[#14141A] fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-[#FF6B5C] mx-auto mb-3" />
          <p className="text-[12px] text-[#8A8579]">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#14141A] fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[13px] text-[#FF6B5C] mb-3">{error}</p>
          <button
            onClick={onClose}
            className="bg-[#2A2A33] text-[#F5F0E8] text-[11px] px-4 py-2 rounded-lg font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxVistas = Math.max(...data.dias.map((d) => d.vistas), 1);
  const maxTotal = Math.max(...data.dias.map((d) => d.total), 1);

  return (
    <div className="bg-[#14141A] fixed inset-0 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#14141A]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#FF6B5C]" />
          <h2 className="font-heading italic text-[16px] text-[#F5F0E8]">Métricas</h2>
        </div>
        <button
          onClick={onClose}
          className="text-[#8A8579] hover:text-[#F5F0E8] transition-colors p-1"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto">
        {/* Título del anuncio */}
        <p className="text-[12px] text-[#8A8579] mb-1">Anuncio</p>
        <h3 className="font-heading italic text-[18px] text-[#F5F0E8] mb-4 leading-tight">
          {data.anuncio.titulo}
        </h3>

        {/* Período */}
        <p className="text-[10px] text-[#5A554A] mb-3">Últimos 14 días</p>

        {/* KPIs grandes */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <BigKPI
            label="Vistas totales"
            value={data.totales.vistas}
            sub={`Prom: ${data.promedios.vistasPorDia}/día`}
            tone="muted"
          />
          <BigKPI
            label="Me gusta totales"
            value={data.totales.likes}
            sub={`Prom: ${data.promedios.likesPorDia}/día`}
            tone="accent"
          />
          <BigKPI
            label="Compartidos"
            value={data.totales.compartidos}
            sub="14 días"
            tone="ok"
          />
          <BigKPI
            label="Guardados"
            value={data.totales.guardados}
            sub="14 días"
            tone="warn"
          />
        </div>

        {/* Día más activo */}
        {data.diaMasActivo && (
          <div className="bg-[#1E1E26] rounded-xl p-3 border border-white/5 mb-5 flex items-center gap-3">
            <TrendingUp size={20} className="text-[#5CD9A0] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-[#8A8579] uppercase tracking-wide font-bold">Día más activo</p>
              <p className="text-[13px] text-[#F5F0E8] font-medium">
                {data.diaMasActivo.dia} {data.diaMasActivo.fecha.slice(8)}
                <span className="text-[#5CD9A0] ml-2 font-num">{data.diaMasActivo.total} interacciones</span>
              </p>
            </div>
          </div>
        )}

        {/* Gráfico de barras */}
        <div className="bg-[#1E1E26] rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-[#8A8579] uppercase tracking-wide font-bold mb-3">
            Vistas por día
          </p>
          <div className="flex items-end justify-between gap-1 h-32">
            {data.dias.map((d, i) => {
              const altura = Math.max(2, (d.vistas / maxVistas) * 100);
              const esHoy = i === data.dias.length - 1;
              return (
                <div key={d.fecha} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <div className="text-[8px] text-[#5A554A] font-num h-3">
                    {d.vistas > 0 ? d.vistas : ""}
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${altura}%`,
                      background: esHoy
                        ? "linear-gradient(to top, #FF6B5C, #FF8C7A)"
                        : d.vistas > 0
                        ? "linear-gradient(to top, #2A2A33, #3A3A44)"
                        : "#2A2A33",
                      minHeight: "2px",
                    }}
                    title={`${d.dia} ${d.fecha.slice(8)}: ${d.vistas} vistas`}
                  />
                  <div className={cn("text-[7px] font-medium", esHoy ? "text-[#FF6B5C]" : "text-[#5A554A]")}>
                    {d.dia}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle por día (tabla compacta) */}
        <div className="mt-5">
          <p className="text-[10px] text-[#8A8579] uppercase tracking-wide font-bold mb-2">
            Detalle por día
          </p>
          <div className="bg-[#1E1E26] rounded-xl overflow-hidden border border-white/5">
            <div className="grid grid-cols-5 gap-1 px-2 py-2 bg-[#2A2A33] text-[8.5px] font-bold text-[#8A8579] uppercase tracking-wide">
              <div>Día</div>
              <div className="text-right">Vistas</div>
              <div className="text-right">Likes</div>
              <div className="text-right">Comp.</div>
              <div className="text-right">Guard.</div>
            </div>
            {data.dias.slice().reverse().map((d, i) => {
              const esHoy = i === 0;
              return (
                <div
                  key={d.fecha}
                  className={cn(
                    "grid grid-cols-5 gap-1 px-2 py-1.5 text-[10px] border-b border-white/5 last:border-b-0",
                    esHoy && "bg-[#FF6B5C]/5"
                  )}
                >
                  <div className="text-[#C9C2B6]">
                    {d.dia} {d.fecha.slice(8)}
                    {esHoy && <span className="text-[#FF6B5C] ml-1">(hoy)</span>}
                  </div>
                  <div className="text-right font-num text-[#F5F0E8]">{d.vistas || "·"}</div>
                  <div className="text-right font-num text-[#FF6B5C]">{d.likes || "·"}</div>
                  <div className="text-right font-num text-[#5CD9A0]">{d.compartidos || "·"}</div>
                  <div className="text-right font-num text-[#FFB547]">{d.guardados || "·"}</div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[9px] text-[#5A554A] text-center mt-5 leading-snug">
          Las métricas se actualizan en tiempo real. El boletín diario por WhatsApp
          te resume esto todos los días a las 9 AM.
        </p>
      </div>
    </div>
  );
}

function BigKPI({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "muted" | "accent" | "ok" | "warn";
}) {
  const toneClass = {
    muted: "text-[#8A8579]",
    accent: "text-[#FF6B5C]",
    ok: "text-[#5CD9A0]",
    warn: "text-[#FFB547]",
  }[tone];

  return (
    <div className="bg-[#1E1E26] rounded-xl p-3 border border-white/5">
      <p className="text-[9px] text-[#5A554A] uppercase tracking-wide font-bold mb-1">{label}</p>
      <p className={cn("font-num text-[24px] font-bold leading-none", toneClass)}>{value}</p>
      <p className="text-[9px] text-[#5A554A] mt-1">{sub}</p>
    </div>
  );
}

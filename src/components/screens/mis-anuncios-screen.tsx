"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  Pause,
  Play,
  Eye,
  ThumbsUp,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
  HelpCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

type MineAnuncio = {
  id: string;
  titulo: string;
  imagen: string;
  estado: "ABIERTO" | "CERRADO" | "PROMO";
  descripcion: string;
  precio?: string;
  publicadoEn: string;
  venceEn: string;
  diasRestantes: number;
  vencido: boolean;
  pausado: boolean;
  oculto: boolean;
  reportes: number;
  metricas: {
    vistas: number;
    likes: number;
    guardados: number;
    compartidos: number;
  };
  categoria: {
    slug: string;
    short: string;
    nombre: string;
    duracionDias: number;
  };
  galeria: string[];
};

type MineResponse = {
  anuncios: MineAnuncio[];
  comerciante: {
    id: string;
    nombre: string;
    verificado: boolean;
    strikes: number;
    baneado: boolean;
  };
  stats: {
    total: number;
    activos: number;
    vencidos: number;
    pausados: number;
    disponibles: number;
  };
};

const WHATSAPP_ADMIN = "+5491100000000"; // número del admin

export function MisAnunciosScreen() {
  const { navigate, back } = useNav();
  const { usuario } = useAuth();
  const [data, setData] = useState<MineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // id del anuncio en acción
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/anuncios/mine", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar");
      }
      const d = await res.json();
      setData(d);
    } catch (e: any) {
      setToast({ msg: e.message || "Error al cargar", tone: "err" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function showToast(msg: string, tone: "ok" | "err" = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3000);
  }

  async function republicar(id: string) {
    setActionLoading(`rep-${id}`);
    try {
      const res = await fetch(`/api/anuncios/${id}/republicar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al republicar", "err");
        return;
      }
      showToast(data.message || "Republicado ✓");
      await cargar();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function eliminar(id: string, titulo: string) {
    if (!confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return;
    setActionLoading(`del-${id}`);
    try {
      const res = await fetch(`/api/anuncios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al eliminar", "err");
        return;
      }
      showToast("Anuncio eliminado ✓");
      await cargar();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePausa(a: MineAnuncio) {
    const accion = a.pausado ? "reanudar" : "pausar";
    setActionLoading(`pausa-${a.id}`);
    try {
      const res = await fetch(`/api/anuncios/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al pausar", "err");
        return;
      }
      showToast(accion === "pausar" ? "Anuncio pausado" : "Anuncio reanudado");
      await cargar();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function cambiarEstado(a: MineAnuncio) {
    const estados = ["ABIERTO", "CERRADO", "PROMO"] as const;
    const idxActual = estados.indexOf(a.estado);
    const nuevoEstado = estados[(idxActual + 1) % estados.length];
    setActionLoading(`est-${a.id}`);
    try {
      const res = await fetch(`/api/anuncios/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "cambiar_estado", estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al cambiar estado", "err");
        return;
      }
      showToast(`Estado: ${nuevoEstado}`);
      await cargar();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
  }

  function abrirAyuda() {
    const msg = encodeURIComponent(
      `Hola, soy ${usuario?.nombre ?? "un comerciante"} (${usuario?.whatsapp}). Necesito ayuda con el folleto clasificados.`
    );
    window.open(`https://wa.me/${WHATSAPP_ADMIN.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  }

  return (
    <div className="animate-slide-in-right pb-2 min-h-screen">
      {/* Header */}
      <header className="px-4 pt-2 pb-2 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#14141A]/95 backdrop-blur z-10">
        <button
          onClick={() => navigate({ name: "home" })}
          className="text-[#8A8579] hover:text-[#F5F0E8] transition-colors p-1 -ml-1"
          aria-label="Volver"
        >
          <X size={20} />
        </button>
        <h1 className="font-heading italic text-[16px] text-[#F5F0E8]">
          Mis anuncios
        </h1>
        <button
          onClick={abrirAyuda}
          className="text-[#8A8579] hover:text-[#FF6B5C] transition-colors p-1"
          aria-label="Ayuda"
        >
          <HelpCircle size={18} />
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg text-[11px] font-medium animate-fade-in-up"
          style={{
            background: toast.tone === "ok" ? "rgba(92,217,160,0.15)" : "rgba(255,107,92,0.15)",
            color: toast.tone === "ok" ? "#5CD9A0" : "#FF6B5C",
            border: `1px solid ${toast.tone === "ok" ? "rgba(92,217,160,0.3)" : "rgba(255,107,92,0.3)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Stats Header */}
      {data && (
        <div className="px-4 pt-3 pb-3 border-b border-white/5">
          <div className="bg-[#1E1E26] rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-heading italic text-[14px] text-[#F5F0E8]">
                  {data.comerciante.nombre}
                </p>
                <p className="text-[9.5px] text-[#8A8579] mt-0.5">
                  {data.comerciante.verificado ? "✓ Verificado" : "Sin verificar"} · {data.comerciante.strikes} strikes
                </p>
              </div>
              {data.comerciante.baneado && (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#FF6B5C]/15 text-[#FF6B5C] border border-[#FF6B5C]/30 font-bold">
                  BANEADO
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Total" value={data.stats.total} tone="muted" />
              <StatPill label="Activos" value={data.stats.activos} tone="ok" />
              <StatPill label="Vencidos" value={data.stats.vencidos} tone="warn" />
              <StatPill label="Disp." value={data.stats.disponibles} tone="accent" />
            </div>
          </div>
        </div>
      )}

      {/* Botón publicar nuevo */}
      {data && data.stats.disponibles > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={() => navigate({ name: "nuevo" })}
            className="w-full bg-[#FF6B5C] text-[#14141A] py-2.5 rounded-lg font-bold text-[12px] inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Plus size={14} />
            Publicar nuevo anuncio
            <span className="text-[10px] opacity-70">
              ({data.stats.disponibles} disponible{data.stats.disponibles === 1 ? "" : "s"})
            </span>
          </button>
        </div>
      )}

      {/* Lista de anuncios */}
      <div className="px-4 pt-3 pb-4">
        {loading ? (
          <div className="text-center py-12 text-[#5A554A] text-[12px]">
            <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#8A8579]" />
            Cargando tus anuncios...
          </div>
        ) : !data || data.anuncios.length === 0 ? (
          <div className="text-center py-12 text-[#5A554A] text-[12px]">
            <AlertCircle size={28} className="mx-auto mb-3 text-[#3A3A44]" />
            Todavía no publicaste ningún anuncio.
            {data && data.stats.disponibles > 0 && (
              <button
                onClick={() => navigate({ name: "nuevo" })}
                className="block mx-auto mt-3 text-[#FF6B5C] font-semibold underline"
              >
                Publicar mi primer anuncio
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.anuncios.map((a) => (
              <AnuncioCard
                key={a.id}
                anuncio={a}
                actionLoading={actionLoading}
                onRepublicar={republicar}
                onEliminar={eliminar}
                onTogglePausa={togglePausa}
                onCambiarEstado={cambiarEstado}
                onOpen={() => navigate({ name: "home" })} // TODO: navegar al detalle cuando esté conectado a DB
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "ok" | "warn" | "accent";
}) {
  const toneClass = {
    muted: "text-[#8A8579]",
    ok: "text-[#5CD9A0]",
    warn: "text-[#FFB547]",
    accent: "text-[#FF6B5C]",
  }[tone];

  return (
    <div className="bg-[#2A2A33] rounded-lg py-1.5 px-2 text-center">
      <p className={cn("font-num text-[16px] font-bold leading-none", toneClass)}>
        {value}
      </p>
      <p className="text-[8.5px] text-[#5A554A] uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function AnuncioCard({
  anuncio,
  actionLoading,
  onRepublicar,
  onEliminar,
  onTogglePausa,
  onCambiarEstado,
  onOpen,
}: {
  anuncio: MineAnuncio;
  actionLoading: string | null;
  onRepublicar: (id: string) => void;
  onEliminar: (id: string, titulo: string) => void;
  onTogglePausa: (a: MineAnuncio) => void;
  onCambiarEstado: (a: MineAnuncio) => void;
  onOpen: () => void;
}) {
  const diasRestantes = anuncio.diasRestantes;
  const porVencer = diasRestantes <= 3 && diasRestantes >= 0 && !anuncio.vencido;
  const vencido = anuncio.vencido;
  const pausado = anuncio.pausado;
  const oculto = anuncio.oculto;

  // Estado visual del anuncio
  const estadoVisual = vencido
    ? "VENCIDO"
    : pausado
    ? "PAUSADO"
    : oculto
    ? "OCULTO"
    : anuncio.estado;

  const estadoColor =
    estadoVisual === "VENCIDO"
      ? "bg-[#FF6B5C]/15 text-[#FF6B5C] border-[#FF6B5C]/30"
      : estadoVisual === "PAUSADO"
      ? "bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/30"
      : estadoVisual === "OCULTO"
      ? "bg-[#8A8579]/15 text-[#8A8579] border-[#8A8579]/30"
      : estadoVisual === "ABIERTO"
      ? "bg-[#5CD9A0]/15 text-[#5CD9A0] border-[#5CD9A0]/30"
      : estadoVisual === "PROMO"
      ? "bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/30"
      : "bg-[#FF6B5C]/15 text-[#FF6B5C] border-[#FF6B5C]/30";

  return (
    <article className={cn(
      "bg-[#1E1E26] rounded-xl overflow-hidden border",
      porVencer ? "border-[#FFB547]/30" : vencido ? "border-[#FF6B5C]/20" : "border-white/5"
    )}>
      {/* Imagen portada + badge */}
      <div className="relative h-28 bg-[#2A2A33] overflow-hidden" onClick={onOpen}>
        { }
        <img
          src={anuncio.imagen}
          alt={anuncio.titulo}
          className={cn(
            "w-full h-full object-cover",
            (pausado || vencido) && "opacity-50"
          )}
        />
        {/* Estado badge */}
        <span className={cn(
          "absolute top-2 left-2 text-[8.5px] px-2 py-0.5 rounded-full border font-bold tracking-wide",
          estadoColor
        )}>
          {estadoVisual}
        </span>
        {/* Días restantes */}
        <span className={cn(
          "absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-num font-medium",
          vencido
            ? "bg-[#FF6B5C] text-white"
            : porVencer
            ? "bg-[#FFB547] text-[#14141A]"
            : "bg-black/55 text-white backdrop-blur"
        )}>
          {vencido ? "Vencido" : `${diasRestantes}d`}
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5">
        <button onClick={onOpen} className="block w-full text-left">
          <h3 className="font-heading italic text-[13px] text-[#F5F0E8] leading-tight">
            {anuncio.titulo}
          </h3>
        </button>
        <p className="text-[9px] text-[#8A8579] mt-0.5">
          {anuncio.categoria.short} · {anuncio.categoria.duracionDias} días
          {anuncio.precio && <span className="ml-1 text-[#FF6B5C] font-num font-medium">· {anuncio.precio}</span>}
        </p>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <Metric icon={<Eye size={11} />} value={anuncio.metricas.vistas} label="Vistas" tone="muted" />
          <Metric icon={<ThumbsUp size={11} />} value={anuncio.metricas.likes} label="Likes" tone="accent" />
          <Metric icon={<MessageCircle size={11} />} value={anuncio.metricas.compartidos} label="Compart." tone="ok" />
          <Metric icon={<TrendingUp size={11} />} value={anuncio.reportes} label="Reportes" tone={anuncio.reportes > 0 ? "warn" : "muted"} />
        </div>

        {/* Aviso de reportes */}
        {anuncio.reportes > 0 && (
          <div className="mt-2 bg-[#FFB547]/10 border border-[#FFB547]/20 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
            <AlertCircle size={11} className="text-[#FFB547] flex-shrink-0" />
            <p className="text-[9.5px] text-[#FFB547] leading-snug">
              {anuncio.reportes === 1 ? "1 reporte pendiente" : `${anuncio.reportes} reportes pendientes`} de revisión
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {/* Republicar */}
          <ActionButton
            icon={<RefreshCw size={12} />}
            label="Rep."
            onClick={() => onRepublicar(anuncio.id)}
            loading={actionLoading === `rep-${anuncio.id}`}
            disabled={!vencido && !porVencer}
            tone="ok"
          />
          {/* Pausar/Reanudar */}
          <ActionButton
            icon={pausado ? <Play size={12} /> : <Pause size={12} />}
            label={pausado ? "Rean." : "Pausar"}
            onClick={() => onTogglePausa(anuncio)}
            loading={actionLoading === `pausa-${anuncio.id}`}
            tone="warn"
          />
          {/* Cambiar estado */}
          <ActionButton
            icon={<Clock size={12} />}
            label={anuncio.estado}
            onClick={() => onCambiarEstado(anuncio)}
            loading={actionLoading === `est-${anuncio.id}`}
            tone="muted"
          />
          {/* Eliminar */}
          <ActionButton
            icon={<Trash2 size={12} />}
            label="Elim."
            onClick={() => onEliminar(anuncio.id, anuncio.titulo)}
            loading={actionLoading === `del-${anuncio.id}`}
            tone="err"
          />
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "muted" | "accent" | "ok" | "warn";
}) {
  const toneClass = {
    muted: "text-[#8A8579]",
    accent: "text-[#FF6B5C]",
    ok: "text-[#5CD9A0]",
    warn: "text-[#FFB547]",
  }[tone];

  return (
    <div className="bg-[#2A2A33] rounded-md py-1.5 px-1 text-center">
      <div className={cn("flex items-center justify-center gap-0.5 mb-0.5", toneClass)}>
        {icon}
      </div>
      <p className="font-num text-[10.5px] font-bold text-[#F5F0E8] leading-none">
        {value}
      </p>
      <p className="text-[7.5px] text-[#5A554A] uppercase mt-0.5">{label}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  loading,
  disabled,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  tone: "ok" | "warn" | "muted" | "err";
}) {
  const toneClass = {
    ok: "bg-[#5CD9A0]/10 text-[#5CD9A0] hover:bg-[#5CD9A0]/20 border-[#5CD9A0]/20",
    warn: "bg-[#FFB547]/10 text-[#FFB547] hover:bg-[#FFB547]/20 border-[#FFB547]/20",
    muted: "bg-[#2A2A33] text-[#C9C2B6] hover:bg-[#3A3A44] border-white/5",
    err: "bg-[#FF6B5C]/10 text-[#FF6B5C] hover:bg-[#FF6B5C]/20 border-[#FF6B5C]/20",
  }[tone];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "border rounded-md py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all text-[8.5px] font-medium",
        toneClass,
        (disabled || loading) && "opacity-40 cursor-not-allowed"
      )}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}

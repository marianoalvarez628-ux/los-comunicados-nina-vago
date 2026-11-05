"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  AlertTriangle,
  Users,
  Trash2,
  Pause,
  Eye,
  Bell,
  Ban,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Flag,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

type Reporte = {
  id: string;
  motivo: string;
  comentario: string | null;
  createdAt: string;
  resuelto: boolean;
  reportante: {
    id: string;
    whatsapp: string;
    nombre: string | null;
  };
};

type AnuncioReportado = {
  id: string;
  titulo: string;
  imagen: string;
  estado: string;
  descripcion: string;
  publicadoEn: string;
  diasRestantes: number;
  vencido: boolean;
  pausado: boolean;
  oculto: boolean;
  enRevision: boolean;
  reportesCount: number;
  metricas: { vistas: number; likes: number; guardados: number; compartidos: number };
  comerciante: {
    id: string;
    nombre: string;
    whatsapp: string;
    strikes: number;
    baneado: boolean;
    banHasta: string | null;
  };
  categoria: { slug: string; short: string; nombre: string };
  reportes: Reporte[];
};

type ComercianteAdmin = {
  id: string;
  nombre: string;
  avatar: string;
  whatsapp: string;
  instagram: string | null;
  barrio: string;
  direccion: string;
  verificado: boolean;
  strikes: number;
  baneado: boolean;
  banHasta: string | null;
  banVencido: boolean;
  banActivo: boolean;
  anunciosCount: number;
  createdAt: string;
};

const MOTIVOS_COLOR: Record<string, string> = {
  ENGAÑOSO: "bg-[#FF6B5C]/15 text-[#FF6B5C] border-[#FF6B5C]/30",
  ILEGAL: "bg-[#E0503F]/15 text-[#E0503F] border-[#E0503F]/30",
  SPAM: "bg-[#FFB547]/15 text-[#FFB547] border-[#FFB547]/30",
  NO_RESPONDE: "bg-[#8A8579]/15 text-[#8A8579] border-[#8A8579]/30",
  LENGUAJE: "bg-[#FF6B5C]/15 text-[#FF6B5C] border-[#FF6B5C]/30",
};

export function AdminScreen() {
  const { navigate } = useNav();
  const [tab, setTab] = useState<"reportados" | "comerciantes">("reportados");

  // Anuncios reportados
  const [anuncios, setAnuncios] = useState<AnuncioReportado[]>([]);
  const [loadingReportados, setLoadingReportados] = useState(true);

  // Comerciantes
  const [comerciantes, setComerciantes] = useState<ComercianteAdmin[]>([]);
  const [statsComerciantes, setStatsComerciantes] = useState({ total: 0, conStrikes: 0, baneadosActivos: 0, verificados: 0 });
  const [loadingComerciantes, setLoadingComerciantes] = useState(true);

  // Acción en proceso
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" | "warn" } | null>(null);

  const cargarReportados = useCallback(async () => {
    setLoadingReportados(true);
    try {
      const res = await fetch("/api/admin/anuncios-reportados", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar");
      }
      const d = await res.json();
      setAnuncios(d.anuncios ?? []);
    } catch (e: any) {
      showToast(e.message || "Error al cargar anuncios reportados", "err");
    } finally {
      setLoadingReportados(false);
    }
  }, []);

  const cargarComerciantes = useCallback(async () => {
    setLoadingComerciantes(true);
    try {
      const res = await fetch("/api/admin/comerciantes", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar");
      }
      const d = await res.json();
      setComerciantes(d.comerciantes ?? []);
      setStatsComerciantes(d.stats ?? { total: 0, conStrikes: 0, baneadosActivos: 0, verificados: 0 });
    } catch (e: any) {
      showToast(e.message || "Error al cargar comerciantes", "err");
    } finally {
      setLoadingComerciantes(false);
    }
  }, []);

  useEffect(() => {
    cargarReportados();
    cargarComerciantes();
  }, [cargarReportados, cargarComerciantes]);

  function showToast(msg: string, tone: "ok" | "err" | "warn" = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  }

  async function moderar(anuncioId: string, accion: string) {
    const accionesTexto: Record<string, string> = {
      eliminar: "eliminar definitivamente",
      pausar: "pausar",
      marcar_revision: "marcar en revisión",
      advertir: "advertir al comerciante",
      banear: "banear al comerciante por 30 días",
    };
    if (!confirm(`¿Confirmás ${accionesTexto[accion]} este anuncio?`)) return;

    setActionLoading(`mod-${anuncioId}-${accion}`);
    try {
      const res = await fetch(`/api/admin/anuncios/${anuncioId}/moderar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al moderar", "err");
        return;
      }
      showToast(data.message || "Acción realizada", data.message?.includes("baneado") ? "warn" : "ok");
      await cargarReportados();
      await cargarComerciantes();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function banearComerciante(comercianteId: string, accion: "banear_temporal" | "banear_permanente" | "desbanear") {
    const texto: Record<string, string> = {
      banear_temporal: "banear por 30 días",
      banear_permanente: "banear permanentemente",
      desbanear: "desbanear y resetear strikes",
    };
    if (!confirm(`¿Confirmás ${texto[accion]} a este comerciante?`)) return;

    setActionLoading(`ban-${comercianteId}-${accion}`);
    try {
      const res = await fetch(`/api/admin/comerciantes/${comercianteId}/banear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al banear", "err");
        return;
      }
      showToast(data.message || "Acción realizada");
      await cargarComerciantes();
    } catch {
      showToast("Error de conexión", "err");
    } finally {
      setActionLoading(null);
    }
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
        <h1 className="font-heading italic text-[16px] text-[#F5F0E8] flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-[#FF6B5C]" />
          Panel Admin
        </h1>
        <div className="w-6" />
      </header>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg text-[11px] font-medium animate-fade-in-up max-w-[300px] text-center"
          style={{
            background:
              toast.tone === "ok"
                ? "rgba(92,217,160,0.15)"
                : toast.tone === "warn"
                ? "rgba(255,181,71,0.15)"
                : "rgba(255,107,92,0.15)",
            color: toast.tone === "ok" ? "#5CD9A0" : toast.tone === "warn" ? "#FFB547" : "#FF6B5C",
            border: `1px solid ${
              toast.tone === "ok"
                ? "rgba(92,217,160,0.3)"
                : toast.tone === "warn"
                ? "rgba(255,181,71,0.3)"
                : "rgba(255,107,92,0.3)"
            }`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-white/5">
        <button
          onClick={() => setTab("reportados")}
          className={cn(
            "flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5",
            tab === "reportados"
              ? "bg-[#FF6B5C]/15 text-[#FF6B5C] border border-[#FF6B5C]/30"
              : "bg-[#2A2A33] text-[#8A8579] border border-white/5"
          )}
        >
          <AlertTriangle size={13} />
          Reportados
          {anuncios.length > 0 && (
            <span className="bg-[#FF6B5C] text-[#14141A] text-[8.5px] px-1.5 py-0.5 rounded-full font-bold">
              {anuncios.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("comerciantes")}
          className={cn(
            "flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5",
            tab === "comerciantes"
              ? "bg-[#FF6B5C]/15 text-[#FF6B5C] border border-[#FF6B5C]/30"
              : "bg-[#2A2A33] text-[#8A8579] border border-white/5"
          )}
        >
          <Users size={13} />
          Comerciantes
          <span className="text-[9px] opacity-70">({statsComerciantes.total})</span>
        </button>
      </div>

      {/* Contenido */}
      <div className="px-4 pt-3 pb-4">
        {tab === "reportados" ? (
          loadingReportados ? (
            <div className="text-center py-12 text-[#5A554A] text-[12px]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#8A8579]" />
              Cargando anuncios reportados...
            </div>
          ) : anuncios.length === 0 ? (
            <div className="text-center py-12 text-[#5A554A] text-[12px]">
              <ShieldCheck size={28} className="mx-auto mb-3 text-[#5CD9A0]" />
              No hay anuncios reportados pendientes.
              <p className="text-[10px] mt-2 text-[#3A3A44]">Todo en orden ✨</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {anuncios.map((a) => (
                <AnuncioReportadoCard
                  key={a.id}
                  anuncio={a}
                  actionLoading={actionLoading}
                  onModerar={moderar}
                />
              ))}
            </div>
          )
        ) : (
          loadingComerciantes ? (
            <div className="text-center py-12 text-[#5A554A] text-[12px]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#8A8579]" />
              Cargando comerciantes...
            </div>
          ) : comerciantes.length === 0 ? (
            <div className="text-center py-12 text-[#5A554A] text-[12px]">
              No hay comerciantes registrados.
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <StatPill label="Total" value={statsComerciantes.total} tone="muted" />
                <StatPill label="Verificados" value={statsComerciantes.verificados} tone="ok" />
                <StatPill label="Con strikes" value={statsComerciantes.conStrikes} tone="warn" />
                <StatPill label="Baneados" value={statsComerciantes.baneadosActivos} tone="err" />
              </div>

              {/* Lista */}
              <div className="flex flex-col gap-2">
                {comerciantes.map((c) => (
                  <ComercianteAdminCard
                    key={c.id}
                    comerciante={c}
                    actionLoading={actionLoading}
                    onBanear={banearComerciante}
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// CARD ANUNCIO REPORTADO
// ============================================================
function AnuncioReportadoCard({
  anuncio,
  actionLoading,
  onModerar,
}: {
  anuncio: AnuncioReportado;
  actionLoading: string | null;
  onModerar: (anuncioId: string, accion: string) => void;
}) {
  return (
    <article className="bg-[#1E1E26] rounded-xl overflow-hidden border border-[#FF6B5C]/20">
      {/* Header */}
      <div className="px-3 py-2 bg-[#FF6B5C]/5 border-b border-[#FF6B5C]/15 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={13} className="text-[#FF6B5C]" />
          <span className="text-[10px] font-bold text-[#FF6B5C] uppercase tracking-wide">
            {anuncio.reportesCount} {anuncio.reportesCount === 1 ? "reporte" : "reportes"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {anuncio.oculto && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#8A8579]/15 text-[#8A8579] font-bold">OCULTO</span>}
          {anuncio.enRevision && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FFB547]/15 text-[#FFB547] font-bold">REVISIÓN</span>}
          {anuncio.pausado && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FFB547]/15 text-[#FFB547] font-bold">PAUSADO</span>}
        </div>
      </div>

      {/* Anuncio info */}
      <div className="p-3">
        <div className="flex gap-3 mb-2">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#2A2A33]">
            { }
            <img src={anuncio.imagen} alt={anuncio.titulo} className={cn("w-full h-full object-cover", anuncio.oculto && "opacity-50")} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading italic text-[13px] text-[#F5F0E8] leading-tight">
              {anuncio.titulo}
            </h3>
            <p className="text-[9.5px] text-[#8A8579] mt-0.5">
              {anuncio.categoria.short} · por {anuncio.comerciante.nombre}
            </p>
            <p className="text-[9px] text-[#5A554A] mt-0.5">
              WhatsApp: <span className="font-num text-[#8A8579]">{anuncio.comerciante.whatsapp}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[8px] px-1.5 py-0.5 rounded font-bold",
                anuncio.comerciante.strikes > 0 ? "bg-[#FFB547]/15 text-[#FFB547]" : "bg-[#5CD9A0]/15 text-[#5CD9A0]"
              )}>
                {anuncio.comerciante.strikes} strikes
              </span>
              {anuncio.comerciante.baneado && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FF6B5C]/15 text-[#FF6B5C] font-bold">
                  BANEADO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Descripción del anuncio */}
        <div className="bg-[#2A2A33] rounded-md p-2 mb-2">
          <p className="text-[10px] text-[#C9C2B6] leading-snug line-clamp-2">
            {anuncio.descripcion}
          </p>
        </div>

        {/* Reportes */}
        <div className="space-y-1.5 mb-3">
          {anuncio.reportes.slice(0, 3).map((r) => (
            <div key={r.id} className="bg-[#2A2A33] rounded-md p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn("text-[8px] px-1.5 py-0.5 rounded border font-bold", MOTIVOS_COLOR[r.motivo] || MOTIVOS_COLOR.LENGUAJE)}>
                  {r.motivo}
                </span>
                <span className="text-[8px] text-[#5A554A] font-num">
                  {new Date(r.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
              {r.comentario && (
                <p className="text-[9.5px] text-[#C9C2B6] italic mt-0.5">&quot;{r.comentario}&quot;</p>
              )}
              <p className="text-[8.5px] text-[#5A554A] mt-0.5">
                Por: <span className="font-num text-[#8A8579]">{r.reportante.whatsapp}</span>
              </p>
            </div>
          ))}
          {anuncio.reportes.length > 3 && (
            <p className="text-[9px] text-[#5A554A] text-center">
              +{anuncio.reportes.length - 3} reportes más
            </p>
          )}
        </div>

        {/* Acciones de moderación */}
        <div className="grid grid-cols-5 gap-1.5">
          <ModButton
            icon={<Trash2 size={12} />}
            label="Eliminar"
            onClick={() => onModerar(anuncio.id, "eliminar")}
            loading={actionLoading === `mod-${anuncio.id}-eliminar`}
            tone="err"
          />
          <ModButton
            icon={<Pause size={12} />}
            label="Pausar"
            onClick={() => onModerar(anuncio.id, "pausar")}
            loading={actionLoading === `mod-${anuncio.id}-pausar`}
            tone="warn"
          />
          <ModButton
            icon={<Eye size={12} />}
            label="Revisión"
            onClick={() => onModerar(anuncio.id, "marcar_revision")}
            loading={actionLoading === `mod-${anuncio.id}-marcar_revision`}
            tone="info"
          />
          <ModButton
            icon={<Bell size={12} />}
            label="Advertir"
            onClick={() => onModerar(anuncio.id, "advertir")}
            loading={actionLoading === `mod-${anuncio.id}-advertir`}
            tone="muted"
          />
          <ModButton
            icon={<Ban size={12} />}
            label="Banear"
            onClick={() => onModerar(anuncio.id, "banear")}
            loading={actionLoading === `mod-${anuncio.id}-banear`}
            tone="err"
          />
        </div>
      </div>
    </article>
  );
}

// ============================================================
// CARD COMERCIANTE ADMIN
// ============================================================
function ComercianteAdminCard({
  comerciante,
  actionLoading,
  onBanear,
}: {
  comerciante: ComercianteAdmin;
  actionLoading: string | null;
  onBanear: (id: string, accion: "banear_temporal" | "banear_permanente" | "desbanear") => void;
}) {
  return (
    <article className={cn(
      "bg-[#1E1E26] rounded-xl p-3 border",
      comerciante.banActivo ? "border-[#FF6B5C]/30" : comerciante.strikes > 0 ? "border-[#FFB547]/20" : "border-white/5"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF6B5C]/20 flex-shrink-0 bg-[#2A2A33] flex items-center justify-center text-[#FF6B5C] text-[14px] font-bold">
          {comerciante.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading italic text-[13px] text-[#F5F0E8] leading-tight">{comerciante.nombre}</p>
          <p className="text-[9px] text-[#8A8579] mt-0.5">
            <span className="font-num">{comerciante.whatsapp}</span> · {comerciante.anunciosCount} anuncios
          </p>
        </div>
        {/* Status badges */}
        <div className="flex flex-col gap-1 items-end">
          {comerciante.verificado ? (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#5CD9A0]/15 text-[#5CD9A0] font-bold flex items-center gap-0.5">
              <ShieldCheck size={9} /> Verif.
            </span>
          ) : (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#8A8579]/15 text-[#8A8579] font-bold">
              Sin verif.
            </span>
          )}
          {comerciante.strikes > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FFB547]/15 text-[#FFB547] font-bold">
              {comerciante.strikes} strikes
            </span>
          )}
          {comerciante.banActivo && (
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FF6B5C]/15 text-[#FF6B5C] font-bold flex items-center gap-0.5">
              <Ban size={9} /> Ban {comerciante.banHasta ? "temp" : "perm"}
            </span>
          )}
        </div>
      </div>

      {/* Info adicional */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] mb-2">
        <div className="bg-[#2A2A33] rounded px-2 py-1 text-[#8A8579]">
          <span className="text-[#5A554A]">📍</span> {comerciante.barrio}
        </div>
        <div className="bg-[#2A2A33] rounded px-2 py-1 text-[#8A8579]">
          {comerciante.instagram ? `📷 ${comerciante.instagram}` : "Sin Instagram"}
        </div>
      </div>

      {/* Ban info si aplica */}
      {comerciante.banActivo && comerciante.banHasta && (
        <div className="bg-[#FF6B5C]/10 border border-[#FF6B5C]/20 rounded-md px-2 py-1.5 mb-2 flex items-center gap-1.5">
          <Clock size={11} className="text-[#FF6B5C] flex-shrink-0" />
          <p className="text-[9.5px] text-[#FF6B5C]">
            Ban hasta: <span className="font-num font-medium">{new Date(comerciante.banHasta).toLocaleDateString("es-AR")}</span>
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-1.5">
        <ModButton
          icon={<Ban size={12} />}
          label="Ban 30d"
          onClick={() => onBanear(comerciante.id, "banear_temporal")}
          loading={actionLoading === `ban-${comerciante.id}-banear_temporal`}
          disabled={comerciante.banActivo}
          tone="err"
        />
        <ModButton
          icon={<ShieldAlert size={12} />}
          label="Ban perm."
          onClick={() => onBanear(comerciante.id, "banear_permanente")}
          loading={actionLoading === `ban-${comerciante.id}-banear_permanente`}
          disabled={comerciante.banActivo && !comerciante.banVencido}
          tone="err"
        />
        <ModButton
          icon={<ShieldCheck size={12} />}
          label="Desbanear"
          onClick={() => onBanear(comerciante.id, "desbanear")}
          loading={actionLoading === `ban-${comerciante.id}-desbanear`}
          disabled={!comerciante.baneado}
          tone="ok"
        />
      </div>
    </article>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatPill({ label, value, tone }: { label: string; value: number; tone: "muted" | "ok" | "warn" | "err" }) {
  const toneClass = {
    muted: "text-[#8A8579]",
    ok: "text-[#5CD9A0]",
    warn: "text-[#FFB547]",
    err: "text-[#FF6B5C]",
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

function ModButton({
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
  tone: "ok" | "warn" | "muted" | "err" | "info";
}) {
  const toneClass = {
    ok: "bg-[#5CD9A0]/10 text-[#5CD9A0] hover:bg-[#5CD9A0]/20 border-[#5CD9A0]/20",
    warn: "bg-[#FFB547]/10 text-[#FFB547] hover:bg-[#FFB547]/20 border-[#FFB547]/20",
    muted: "bg-[#2A2A33] text-[#C9C2B6] hover:bg-[#3A3A44] border-white/5",
    err: "bg-[#FF6B5C]/10 text-[#FF6B5C] hover:bg-[#FF6B5C]/20 border-[#FF6B5C]/20",
    info: "bg-[#8A8579]/10 text-[#8A8579] hover:bg-[#8A8579]/20 border-[#8A8579]/20",
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

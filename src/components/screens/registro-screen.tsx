"use client";

import { useState, useEffect } from "react";
import {
  X,
  Store,
  Tag,
  MapPin,
  Instagram,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

type CategoriaOption = {
  id: string; // slug
  nombre: string;
  short: string;
  duracionDias: number;
};

export function RegistroComercianteScreen() {
  const { usuario, refresh, closeAuth } = useAuth();
  const { navigate } = useNav();

  const [nombre, setNombre] = useState("");
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catsLoading, setCatsLoading] = useState(true);
  const [showCats, setShowCats] = useState(false);

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

  const categoriaElegida = categorias.find((c) => c.id === categoriaSlug);

  async function registrar() {
    if (!nombre || nombre.length < 3) {
      setError("Ingresá el nombre de tu comercio (mínimo 3 caracteres)");
      return;
    }
    if (!categoriaSlug) {
      setError("Elegí una categoría");
      return;
    }
    if (!direccion || direccion.length < 5) {
      setError("Ingresá tu dirección (mínimo 5 caracteres)");
      return;
    }
    if (!barrio || barrio.length < 3) {
      setError("Ingresá tu barrio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/registro-comerciante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          categoriaSlug,
          direccion,
          barrio,
          instagram: instagram || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar");
        return;
      }

      // Refrescar el usuario (ahora es COMERCIANTE)
      await refresh();
      // Cerrar cualquier modal de auth
      closeAuth();
      // Ir al Editor para que publique su primer anuncio
      navigate({ name: "nuevo" });
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  function cerrar() {
    // Volver al Home (sin registrar)
    closeAuth();
    navigate({ name: "home" });
  }

  return (
    <div className="animate-slide-in-right pb-2 min-h-screen">
      {/* Header */}
      <header className="px-4 pt-2 pb-2 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#14141A]/95 backdrop-blur z-10">
        <h1 className="font-heading italic text-[16px] text-[#F5F0E8] flex-1 text-center">
          Registrá tu comercio
        </h1>
        <button
          onClick={cerrar}
          className="text-[#8A8579] hover:text-[#F5F0E8] transition-colors p-1"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </header>

      {/* Intro */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[12px] text-[#C9C2B6] leading-relaxed">
          Para publicar anuncios necesitamos unos datos básicos de tu comercio.
          Los vas a poder editar después desde tu panel.
        </p>
        <p className="text-[10px] text-[#FF6B5C] mt-2">
          WhatsApp verificado: <span className="font-num font-semibold">{usuario?.whatsapp}</span>
        </p>
      </div>

      {/* Formulario */}
      <div className="px-4 pt-2 pb-8 space-y-4">
        {/* 1. Nombre del comercio */}
        <SectionLabel num="01" icon={<Store size={11} />} label="Nombre del comercio" />
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: La Esquina"
          maxLength={50}
          className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[14px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
          autoFocus
        />

        {/* 2. Categoría */}
        <SectionLabel num="02" icon={<Tag size={11} />} label="Categoría" />
        <button
          onClick={() => setShowCats((v) => !v)}
          className={cn(
            "w-full bg-[#1E1E26] border rounded-lg px-3 py-2.5 text-left flex items-center justify-between transition-colors",
            categoriaSlug ? "border-[#FF6B5C]/30 text-[#F5F0E8]" : "border-white/8 text-[#5A554A]"
          )}
        >
          <span className="text-[13px] truncate">
            {categoriaElegida
              ? categoriaElegida.nombre
              : catsLoading
              ? "Cargando categorías..."
              : "Elegí tu categoría"}
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
                  setError(null);
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

        {/* 3. Dirección */}
        <SectionLabel num="03" icon={<MapPin size={11} />} label="Dirección" />
        <input
          type="text"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Calle y número, ciudad"
          maxLength={80}
          className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
        />

        {/* 4. Barrio */}
        <SectionLabel num="04" icon={<MapPin size={11} />} label="Barrio" />
        <input
          type="text"
          value={barrio}
          onChange={(e) => setBarrio(e.target.value)}
          placeholder="Ej: Caballito, CABA"
          maxLength={50}
          className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
        />

        {/* 5. Instagram (opcional) */}
        <SectionLabel
          num="05"
          icon={<Instagram size={11} />}
          label="Instagram"
          hint="opcional"
        />
        <input
          type="text"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@tu_comercio"
          maxLength={40}
          className="w-full bg-[#1E1E26] border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-[#F5F0E8] placeholder:text-[#5A554A] focus:outline-none focus:border-[#FF6B5C]/40 transition-colors"
        />

        {/* Error */}
        {error && (
          <p className="text-[11px] text-[#FF6B5C] bg-[#FF6B5C]/10 px-3 py-2 rounded-lg border border-[#FF6B5C]/20 inline-flex items-center gap-2">
            <AlertCircle size={12} />
            {error}
          </p>
        )}

        {/* Botón Registrar */}
        <button
          onClick={registrar}
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-lg font-bold text-[13px] transition-all flex items-center justify-center gap-2 mt-4",
            loading
              ? "bg-[#2A2A33] text-[#5A554A] cursor-not-allowed"
              : "bg-[#FF6B5C] text-[#14141A] active:scale-95"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Check size={16} />
              Registrar comercio
            </>
          )}
        </button>

        <p className="text-[10px] text-[#5A554A] text-center leading-snug">
          Al registrar aceptás las reglas del folleto. Tu comercio estará sujeto
          a moderación si recibe reportes.
        </p>
      </div>
    </div>
  );
}

function SectionLabel({
  num,
  icon,
  label,
  hint,
}: {
  num: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
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
        <span className="text-[9.5px] text-[#5A554A] font-medium">{hint}</span>
      )}
    </div>
  );
}

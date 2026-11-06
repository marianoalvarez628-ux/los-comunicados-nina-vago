"use client";

import { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export function AuthOtpScreen() {
  const { closeAuth, openLogin, whatsappPendiente, refresh, closeAuth: closeAll } = useAuth();
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);
  const [reenviando, setReenviando] = useState(false);

  // SIEMPRE leer el código del sessionStorage (el backend lo guarda ahí
  // cuando Twilio no está configurado, incluso en producción)
  const [codigoDesarrollo, setCodigoDev] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("otp_codigo_desarrollo");
      if (stored) {
        setCodigoDev(stored);
      }
    }
  }, []);

  function handleCodigoChange(i: number, value: string) {
    // Solo dígitos, máximo 1
    if (!/^\d?$/.test(value)) return;

    const nuevo = [...codigo];
    nuevo[i] = value;
    setCodigo(nuevo);

    // Auto-focus al siguiente input
    if (value !== "" && i < 5) {
      const next = document.getElementById(`otp-input-${i + 1}`);
      next?.focus();
    }

    // Si completo los 6, limpiar error
    if (nuevo.every((c) => c !== "")) {
      setError(null);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    // Backspace: si está vacío, ir al anterior
    if (e.key === "Backspace" && codigo[i] === "" && i > 0) {
      const prev = document.getElementById(`otp-input-${i - 1}`);
      prev?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (texto.length === 6) {
      setCodigo(texto.split(""));
      setError(null);
    }
  }

  async function verificar() {
    const codigoCompleto = codigo.join("");
    if (codigoCompleto.length !== 6) {
      setError("Ingresá los 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp: whatsappPendiente,
          codigo: codigoCompleto,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.intentosRestantes !== undefined) {
          setIntentosRestantes(data.intentosRestantes);
          setError(`${data.error}. Intentos restantes: ${data.intentosRestantes}`);
        } else {
          setError(data.error || "Error al verificar");
        }
        // Limpiar código para reintentar
        setCodigo(["", "", "", "", "", ""]);
        document.getElementById("otp-input-0")?.focus();
        return;
      }

      // Login exitoso: refresh del store y cerrar modal
      await refresh();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("otp_codigo_desarrollo");
      }
      closeAll();
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function reenviarCodigo() {
    setReenviando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: whatsappPendiente }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al reenviar código");
        return;
      }

      // Actualizar el código guardado (siempre, incluso en producción sin Twilio)
      if (data.codigoDesarrollo && typeof window !== "undefined") {
        sessionStorage.setItem("otp_codigo_desarrollo", data.codigoDesarrollo);
        setCodigoDev(data.codigoDesarrollo);
      }

      setIntentosRestantes(null);
      setCodigo(["", "", "", "", "", ""]);
      document.getElementById("otp-input-0")?.focus();
    } catch (e) {
      setError("No se pudo reenviar el código");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-[#1E1E26] rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
          <button
            onClick={openLogin}
            className="text-[#FF6B5C] active:scale-95 transition-transform p-1 -ml-1"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-heading italic text-[16px] text-[#F5F0E8]">
            Verificación
          </h2>
          <button
            onClick={closeAuth}
            className="text-[#8A8579] hover:text-[#F5F0E8] transition-colors p-1"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6">
          <p className="text-[12px] text-[#C9C2B6] leading-relaxed mb-1">
            Ingresá el código de 6 dígitos que enviamos por WhatsApp a:
          </p>
          <p className="text-[13px] font-semibold text-[#FF6B5C] mb-4 font-num">
            {whatsappPendiente}
          </p>

          {/* Aviso de código en pantalla (modo testing sin Twilio) */}
          {codigoDesarrollo && (
            <div className="mb-4 p-3 bg-[#FFB547]/10 border border-[#FFB547]/30 rounded-lg">
              <p className="text-[10px] font-bold text-[#FFB547] tracking-wide uppercase mb-1">
                📱 Tu código de verificación
              </p>
              <p className="text-[11px] text-[#C9C2B6]">
                Tu código es: <span className="font-num font-bold text-[#FFB547] text-[14px] tracking-wider">{codigoDesarrollo}</span>
              </p>
              <p className="text-[9px] text-[#8A8579] mt-1">
                (Cuando configures Twilio, este código llegará por WhatsApp automáticamente)
              </p>
            </div>
          )}

          {/* Inputs OTP */}
          <div className="flex justify-between gap-2 mb-4" onPaste={handlePaste}>
            {codigo.map((d, i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleCodigoChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-11 h-12 text-center text-[18px] font-num font-bold",
                  "bg-[#2A2A33] border-2 rounded-lg outline-none transition-colors",
                  d
                    ? "border-[#FF6B5C] text-[#FF6B5C]"
                    : "border-white/10 text-[#F5F0E8]",
                  "focus:border-[#FF6B5C]"
                )}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-[#FF6B5C] bg-[#FF6B5C]/10 px-3 py-2 rounded-lg border border-[#FF6B5C]/20 mb-4">
              {error}
            </p>
          )}

          {/* Botón Verificar */}
          <button
            onClick={verificar}
            disabled={loading || codigo.join("").length !== 6}
            className={cn(
              "w-full py-3 rounded-lg font-bold text-[13px] transition-all flex items-center justify-center gap-2",
              loading || codigo.join("").length !== 6
                ? "bg-[#2A2A33] text-[#5A554A] cursor-not-allowed"
                : "bg-[#FF6B5C] text-[#14141A] active:scale-95"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar código
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Reenviar */}
          <button
            onClick={reenviarCodigo}
            disabled={reenviando}
            className="mt-3 w-full text-center text-[11px] text-[#8A8579] hover:text-[#FF6B5C] transition-colors py-2 inline-flex items-center justify-center gap-1.5"
          >
            {reenviando ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                Reenviar código
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

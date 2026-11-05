"use client";

import { useState } from "react";
import { X, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export function AuthLoginScreen() {
  const { closeAuth, openOtp } = useAuth();
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validarWhatsApp(w: string): boolean {
    const limpio = w.replace(/[\s\-()]/g, "").trim();
    return limpio.length >= 10 && /^\+?\d+$/.test(limpio);
  }

  async function enviarCodigo() {
    if (!validarWhatsApp(whatsapp)) {
      setError("Ingresá un número válido con código de país (ej: +54 11...)");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar el código");
        return;
      }

      // En desarrollo mostramos el código en pantalla (enviado desde el server)
      const codigoDesarrollo = data.codigoDesarrollo;
      if (codigoDesarrollo && typeof window !== "undefined") {
        sessionStorage.setItem("otp_codigo_desarrollo", codigoDesarrollo);
      }

      // Avanzar a la pantalla OTP
      openOtp(whatsapp);
    } catch (e) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-[#1E1E26] rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
          <h2 className="font-heading italic text-[18px] text-[#F5F0E8]">
            Ingresá a Clasificados
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
          <p className="text-[12px] text-[#C9C2B6] leading-relaxed mb-4">
            Te enviaremos un código por WhatsApp para verificarte. Lo usás cada
            vez que entres (sin contraseña).
          </p>

          {/* Input WhatsApp */}
          <label className="block">
            <span className="text-[10px] font-bold tracking-[0.14em] text-[#8A8579] uppercase mb-1.5 block">
              WhatsApp
            </span>
            <div className="flex items-center gap-2 bg-[#2A2A33] border border-white/10 rounded-lg px-3 py-3 focus-within:border-[#FF6B5C]/40 transition-colors">
              <Phone size={14} className="text-[#FF6B5C] flex-shrink-0" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+54 11 5555-1234"
                className="flex-1 bg-transparent border-0 outline-none text-[14px] text-[#F5F0E8] placeholder:text-[#5A554A] font-num"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) enviarCodigo();
                }}
              />
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="mt-3 text-[11px] text-[#FF6B5C] bg-[#FF6B5C]/10 px-3 py-2 rounded-lg border border-[#FF6B5C]/20">
              {error}
            </p>
          )}

          {/* Botón */}
          <button
            onClick={enviarCodigo}
            disabled={loading || !whatsapp}
            className={cn(
              "mt-5 w-full py-3 rounded-lg font-bold text-[13px] transition-all flex items-center justify-center gap-2",
              loading || !whatsapp
                ? "bg-[#2A2A33] text-[#5A554A] cursor-not-allowed"
                : "bg-[#FF6B5C] text-[#14141A] active:scale-95"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando código...
              </>
            ) : (
              <>
                Enviar código
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Privacy note */}
          <p className="mt-4 text-[10px] text-[#5A554A] text-center leading-snug">
            Al continuar aceptás recibir mensajes por WhatsApp con tu código de
            verificación.
          </p>
        </div>
      </div>
    </div>
  );
}

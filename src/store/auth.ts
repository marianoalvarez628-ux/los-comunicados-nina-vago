"use client";

import { create } from "zustand";

export type UsuarioActual = {
  id: string;
  whatsapp: string;
  nombre?: string;
  rol: "VISITANTE" | "COMERCIANTE" | "ADMIN";
  comercianteId?: string;
  barrio?: string;
};

type AuthState = {
  usuario: UsuarioActual | null;
  loading: boolean;
  // Pantalla de auth activa: null (no mostrar), "login", "otp"
  authScreen: null | "login" | "otp";
  whatsappPendiente: string | null; // WhatsApp ingresado en login, pendiente de OTP
  setUsuario: (u: UsuarioActual | null) => void;
  setLoading: (l: boolean) => void;
  openLogin: () => void;
  openOtp: (whatsapp: string) => void;
  closeAuth: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  usuario: null,
  loading: true,
  authScreen: null,
  whatsappPendiente: null,

  setUsuario: (u) => set({ usuario: u }),
  setLoading: (l) => set({ loading: l }),

  openLogin: () => set({ authScreen: "login" }),
  openOtp: (whatsapp) =>
    set({ authScreen: "otp", whatsappPendiente: whatsapp }),
  closeAuth: () =>
    set({ authScreen: null, whatsappPendiente: null }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Error en logout:", e);
    }
    set({ usuario: null, authScreen: null, whatsappPendiente: null });
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ usuario: data.usuario ?? null });
      } else {
        set({ usuario: null });
      }
    } catch (e) {
      console.error("Error en refresh auth:", e);
      set({ usuario: null });
    } finally {
      set({ loading: false });
    }
  },
}));

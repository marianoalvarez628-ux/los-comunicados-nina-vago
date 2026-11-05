"use client";

import { useAuth } from "@/store/auth";
import { AuthLoginScreen } from "./auth-login";
import { AuthOtpScreen } from "./auth-otp";
import { useEffect } from "react";

export function AuthOverlay() {
  const { authScreen, refresh, loading } = useAuth();

  // Cargar usuario al montar el componente
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Si está cargando y no hay usuario, no mostrar nada
  if (loading && authScreen === null) return null;

  if (authScreen === "login") return <AuthLoginScreen />;
  if (authScreen === "otp") return <AuthOtpScreen />;
  return null;
}

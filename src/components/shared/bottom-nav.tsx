"use client";

import { Search, Bookmark, Home, Plus, LogIn } from "lucide-react";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

type Tab = "home" | "search" | "guardados" | "perfil";

export function BottomNav() {
  const { screen, navigate, resetHome } = useNav();
  const { usuario, openLogin } = useAuth();

  const activeTab: Tab =
    screen.name === "home"
      ? "home"
      : screen.name === "nuevo" || screen.name === "editor" || screen.name === "registro"
      ? "perfil"
      : screen.name === "categoria" || screen.name === "detalle"
      ? "search"
      : "home";

  function handlePublicarClick() {
    if (!usuario) {
      // No logueado → abrir modal de login
      openLogin();
    } else if (usuario.rol === "VISITANTE") {
      // Logueado como visitante → necesita registrarse como comerciante
      navigate({ name: "registro" });
    } else if (usuario.rol === "COMERCIANTE" || usuario.rol === "ADMIN") {
      // Ya es comerciante → ir al editor
      navigate({ name: "nuevo" });
    }
  }

  function handleGuardadosClick() {
    if (!usuario) {
      openLogin();
    }
  }

  const items: { id: Tab; label: string; icon: typeof Home; action: () => void }[] = [
    { id: "home", label: "Inicio", icon: Home, action: resetHome },
    {
      id: "search",
      label: "Buscar",
      icon: Search,
      action: () => {},
    },
    {
      id: "guardados",
      label: "Guardados",
      icon: Bookmark,
      action: handleGuardadosClick,
    },
    {
      id: "perfil",
      label: usuario ? "Publicar" : "Ingresar",
      icon: usuario ? Plus : LogIn,
      action: handlePublicarClick,
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            onClick={item.action}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
              isActive ? "text-[#FF6B5C]" : "text-[#8A8579] hover:text-[#F5F0E8]"
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

"use client";

import { Phone, Search, Bookmark, User, Home, Plus, LogIn } from "lucide-react";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

type Tab = "home" | "search" | "guardados" | "perfil";

export function BottomNav() {
  const { screen, navigate, resetHome } = useNav();
  const { usuario, openLogin, logout } = useAuth();

  const activeTab: Tab =
    screen.name === "home"
      ? "home"
      : screen.name === "nuevo" || screen.name === "editor"
      ? "perfil"
      : screen.name === "categoria" || screen.name === "detalle"
      ? "search"
      : "home";

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
      action: () => {
        if (!usuario) {
          openLogin();
        }
      },
    },
    {
      id: "perfil",
      label: usuario ? "Publicar" : "Ingresar",
      icon: usuario ? Plus : LogIn,
      action: () => {
        if (usuario) {
          navigate({ name: "nuevo" });
        } else {
          openLogin();
        }
      },
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

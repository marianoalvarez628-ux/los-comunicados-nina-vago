"use client";

import { useNav } from "@/store/nav";
import { HomeScreen } from "@/components/screens/home-screen";
import { CategoriaScreen } from "@/components/screens/categoria-screen";
import { DetalleScreen } from "@/components/screens/detalle-screen";
import { EditorScreen } from "@/components/screens/editor-screen";
import { StatusBar } from "@/components/shared/status-bar";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function Home() {
  const { screen } = useNav();

  let content: React.ReactNode;
  switch (screen.name) {
    case "home":
      content = <HomeScreen />;
      break;
    case "categoria":
      content = (
        <CategoriaScreen comercianteId={screen.comercianteId} />
      );
      break;
    case "detalle":
      content = <DetalleScreen anuncioId={screen.anuncioId} />;
      break;
    case "nuevo":
    case "editor":
      content = <EditorScreen editId={"editor" in screen ? screen.anuncioId : undefined} />;
      break;
    default:
      content = <HomeScreen />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-black">
      {/* Contenedor maestro: si hay espacio, centra el phone frame */}
      <div className="w-full flex justify-center py-4 md:py-8">
        {/* Marco de teléfono */}
        <div className="phone-frame flex flex-col">
          <StatusBar />
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">{content}</div>
          <BottomNav />
        </div>
      </div>
    </main>
  );
}

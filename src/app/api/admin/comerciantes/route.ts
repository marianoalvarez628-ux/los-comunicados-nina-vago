// API: GET /api/admin/comerciantes
// Lista todos los comerciantes con sus strikes, bans y conteo de anuncios
// Solo ADMIN puede acceder

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function getUserIdFromCookie(request: Request): string | null {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session_user_id="))
    ?.split("=")[1] ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromCookie(request);
    if (!userId) {
      return NextResponse.json(
        { error: "No estás logueado" },
        { status: 401 }
      );
    }

    const usuario = await db.usuario.findUnique({ where: { id: userId } });
    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Necesitás rol ADMIN" },
        { status: 403 }
      );
    }

    const comerciantes = await db.comerciante.findMany({
      orderBy: [{ strikes: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            anuncios: true,
          },
        },
      },
    });

    const ahora = new Date();
    const result = comerciantes.map((c) => {
      const banVencido = c.banHasta && c.banHasta < ahora;
      return {
        id: c.id,
        nombre: c.nombre,
        avatar: c.avatar,
        whatsapp: c.whatsapp,
        instagram: c.instagram,
        barrio: c.barrio,
        direccion: c.direccion,
        verificado: c.verificado,
        strikes: c.strikes,
        baneado: c.baneado,
        banHasta: c.banHasta,
        banVencido,
        banActivo: c.baneado && !banVencido,
        anunciosCount: c._count.anuncios,
        createdAt: c.createdAt,
      };
    });

    // Stats
    const stats = {
      total: result.length,
      conStrikes: result.filter((c) => c.strikes > 0).length,
      baneadosActivos: result.filter((c) => c.banActivo).length,
      verificados: result.filter((c) => c.verificado).length,
    };

    return NextResponse.json({
      comerciantes: result,
      stats,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/comerciantes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

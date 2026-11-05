// API: GET /api/anuncios/mine
// Devuelve los anuncios del comerciante logueado (con métricas, días restantes, etc.)

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

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      include: { comerciante: true },
    });

    if (!usuario?.comerciante) {
      return NextResponse.json({
        anuncios: [],
        comerciante: null,
        maxAnuncios: 5,
      });
    }

    const anuncios = await db.anuncio.findMany({
      where: { comercianteId: usuario.comerciante.id },
      orderBy: { publicadoEn: "desc" },
      include: {
        categoria: { select: { slug: true, short: true, nombre: true, duracionDias: true } },
        galeria: { orderBy: { orden: "asc" }, take: 4 },
        _count: { select: { reportes: true } },
      },
    });

    const ahora = new Date();

    const result = anuncios.map((a) => {
      const diasRestantes = Math.ceil(
        (a.venceEn.getTime() - ahora.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: a.id,
        titulo: a.titulo,
        imagen: a.imagen,
        estado: a.estado,
        descripcion: a.descripcion,
        precio: a.precio,
        publicadoEn: a.publicadoEn,
        venceEn: a.venceEn,
        diasRestantes,
        vencido: a.venceEn < ahora,
        pausado: a.pausado,
        oculto: a.oculto,
        reportes: a._count.reportes,
        metricas: {
          vistas: a.vistas,
          likes: a.likes,
          guardados: a.guardados,
          compartidos: a.compartidos,
        },
        categoria: a.categoria,
        galeria: a.galeria.map((g) => g.url),
      };
    });

    // Contar anuncios activos (no vencidos, no pausados, no ocultos)
    const activos = anuncios.filter(
      (a) => a.venceEn > ahora && !a.pausado && !a.oculto
    ).length;

    return NextResponse.json({
      anuncios: result,
      comerciante: {
        id: usuario.comerciante.id,
        nombre: usuario.comerciante.nombre,
        verificado: usuario.comerciante.verificado,
        strikes: usuario.comerciante.strikes,
        baneado: usuario.comerciante.baneado,
      },
      stats: {
        total: anuncios.length,
        activos,
        vencidos: anuncios.filter((a) => a.venceEn < ahora).length,
        pausados: anuncios.filter((a) => a.pausado).length,
        disponibles: Math.max(0, 5 - activos),
      },
    });
  } catch (error) {
    console.error("Error en GET /api/anuncios/mine:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

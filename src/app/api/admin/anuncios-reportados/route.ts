// API: GET /api/admin/anuncios-reportados
// Lista anuncios con reportes pendientes (resuelto: false)
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

    // Buscar anuncios con reportes no resueltos
    const anuncios = await db.anuncio.findMany({
      where: {
        reportes: {
          some: { resuelto: false },
        },
      },
      include: {
        comerciante: {
          select: {
            id: true,
            nombre: true,
            whatsapp: true,
            strikes: true,
            baneado: true,
            banHasta: true,
          },
        },
        categoria: {
          select: { slug: true, short: true, nombre: true },
        },
        reportes: {
          where: { resuelto: false },
          include: {
            reportante: {
              select: { id: true, whatsapp: true, nombre: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { reportesCount: "desc" },
    });

    const result = anuncios.map((a) => {
      const ahora = new Date();
      const diasRestantes = Math.ceil(
        (a.venceEn.getTime() - ahora.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: a.id,
        titulo: a.titulo,
        imagen: a.imagen,
        estado: a.estado,
        descripcion: a.descripcion,
        publicadoEn: a.publicadoEn,
        venceEn: a.venceEn,
        diasRestantes,
        vencido: a.venceEn < ahora,
        pausado: a.pausado,
        oculto: a.oculto,
        enRevision: a.enRevision,
        reportesCount: a.reportesCount,
        metricas: {
          vistas: a.vistas,
          likes: a.likes,
          guardados: a.guardados,
          compartidos: a.compartidos,
        },
        comerciante: a.comerciante,
        categoria: a.categoria,
        reportes: a.reportes.map((r) => ({
          id: r.id,
          motivo: r.motivo,
          comentario: r.comentario,
          createdAt: r.createdAt,
          resuelto: r.resuelto,
          reportante: r.reportante,
        })),
      };
    });

    return NextResponse.json({
      anuncios: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error en GET /api/admin/anuncios-reportados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

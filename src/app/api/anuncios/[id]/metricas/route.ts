// API: GET /api/anuncios/[id]/metricas
// Devuelve métricas por día de los últimos 14 días
// Solo el dueño del anuncio o el admin pueden ver esto

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const anuncio = await db.anuncio.findUnique({
      where: { id },
      select: { comercianteId: true, titulo: true, publicadoEn: true },
    });

    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar ownership
    const esOwner = anuncio.comercianteId === usuario.comerciante?.id;
    const esAdmin = usuario.rol === "ADMIN";
    if (!esOwner && !esAdmin) {
      return NextResponse.json(
        { error: "No tenés permiso para ver estas métricas" },
        { status: 403 }
      );
    }

    // Últimos 14 días (incluyendo hoy)
    const hoy = new Date();
    const fechaInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - 13));
    
    const metricas = await db.metricaDiaria.findMany({
      where: {
        anuncioId: id,
        fecha: { gte: fechaInicio },
      },
      orderBy: { fecha: "asc" },
    });

    // Construir array de 14 días con métricas (rellenando días sin datos con 0)
    const diasConDatos: Array<{
      fecha: string;
      dia: string;
      vistas: number;
      likes: number;
      compartidos: number;
      guardados: number;
      total: number;
    }> = [];

    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - i));
      const fechaStr = fecha.toISOString().slice(0, 10);
      
      const metrica = metricas.find((m) => {
        const mFecha = new Date(m.fecha);
        return mFecha.getUTCFullYear() === fecha.getUTCFullYear() &&
               mFecha.getUTCMonth() === fecha.getUTCMonth() &&
               mFecha.getUTCDate() === fecha.getUTCDate();
      });

      const vistas = metrica?.vistas ?? 0;
      const likes = metrica?.likes ?? 0;
      const compartidos = metrica?.compartidos ?? 0;
      const guardados = metrica?.guardados ?? 0;

      diasConDatos.push({
        fecha: fechaStr,
        dia: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][fecha.getUTCDay()],
        vistas,
        likes,
        compartidos,
        guardados,
        total: vistas + likes + compartidos + guardados,
      });
    }

    // Totales del período
    const totales = diasConDatos.reduce(
      (acc, d) => ({
        vistas: acc.vistas + d.vistas,
        likes: acc.likes + d.likes,
        compartidos: acc.compartidos + d.compartidos,
        guardados: acc.guardados + d.guardados,
      }),
      { vistas: 0, likes: 0, compartidos: 0, guardados: 0 }
    );

    // Promedios
    const promedios = {
      vistasPorDia: Math.round((totales.vistas / 14) * 10) / 10,
      likesPorDia: Math.round((totales.likes / 14) * 10) / 10,
    };

    // Día con más actividad
    const diaMasActivo = diasConDatos.reduce((max, d) => (d.total > max.total ? d : max), diasConDatos[0]);

    return NextResponse.json({
      anuncio: {
        id,
        titulo: anuncio.titulo,
        publicadoEn: anuncio.publicadoEn,
      },
      dias: diasConDatos,
      totales,
      promedios,
      diaMasActivo: diaMasActivo.fecha === diasConDatos[13].fecha && diaMasActivo.total === 0
        ? null
        : {
            fecha: diaMasActivo.fecha,
            dia: diaMasActivo.dia,
            total: diaMasActivo.total,
          },
    });
  } catch (error) {
    console.error("Error en GET /api/anuncios/[id]/metricas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

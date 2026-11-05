// API: POST /api/anuncios/[id]/republicar
// Renueva la fecha de vencimiento del anuncio según la duración de su categoría
// Solo el dueño o el admin pueden republicar

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

export async function POST(
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

    if (!usuario?.comerciante && usuario?.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Necesitás ser comerciante" },
        { status: 403 }
      );
    }

    const anuncio = await db.anuncio.findUnique({
      where: { id },
      include: { categoria: true },
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
        { error: "No tenés permiso para republicar este anuncio" },
        { status: 403 }
      );
    }

    // Verificar que esté vencido o por vencer (3 días o menos)
    const ahora = new Date();
    const diasRestantes = Math.ceil(
      (anuncio.venceEn.getTime() - ahora.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diasRestantes > 3 && !esAdmin) {
      return NextResponse.json(
        {
          error: `Podés republicar cuando falten 3 días o menos. Te quedan ${diasRestantes} días.`,
        },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de vencimiento
    const nuevaVenceEn = new Date(
      ahora.getTime() + anuncio.categoria.duracionDias * 24 * 60 * 60 * 1000
    );

    // Actualizar anuncio
    const actualizado = await db.anuncio.update({
      where: { id },
      data: {
        venceEn: nuevaVenceEn,
        republicado: true,
        republicadoEn: ahora,
        publicadoEn: ahora, // actualizar fecha de publicación también
        // Reset de estado de moderación si estaba pausado o marcado
        pausado: false,
        oculto: false,
        enRevision: false,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Anuncio republicado. Vence el ${nuevaVenceEn.toLocaleDateString("es-AR")}.`,
      anuncio: {
        id: actualizado.id,
        titulo: actualizado.titulo,
        venceEn: actualizado.venceEn,
        republicado: actualizado.republicado,
      },
    });
  } catch (error) {
    console.error("Error en /api/anuncios/[id]/republicar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

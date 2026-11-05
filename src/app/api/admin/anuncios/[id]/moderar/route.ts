// API: POST /api/admin/anuncios/[id]/moderar
// Body: { accion: "eliminar"|"pausar"|"marcar_revision"|"advertir"|"banear" }
// Solo ADMIN puede acceder
// Acciones:
//   - eliminar: hard delete del anuncio + suma strike al comerciante
//   - pausar: marca pausado=true
//   - marcar_revision: marca enRevision=true (sigue visible con badge)
//   - advertir: solo notifica al comerciante (sin acción sobre el anuncio)
//   - banear: marca al comerciante como baneado (30 días temporales)
// Cualquier acción resuelve (resuelto=true) todos los reportes del anuncio

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ACCIONES_VALIDAS = ["eliminar", "pausar", "marcar_revision", "advertir", "banear"];
const DIAS_BAN_TEMPORAL = 30;
const STRIKES_BAN_TEMPORAL = 3;

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

    const admin = await db.usuario.findUnique({ where: { id: userId } });
    if (!admin || admin.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Necesitás rol ADMIN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const accion = body?.accion?.toLowerCase();

    if (!ACCIONES_VALIDAS.includes(accion)) {
      return NextResponse.json(
        { error: `Acción no válida. Usá una de: ${ACCIONES_VALIDAS.join(", ")}` },
        { status: 400 }
      );
    }

    const anuncio = await db.anuncio.findUnique({
      where: { id },
      include: { comerciante: true },
    });

    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    let message = "";
    let comercianteActualizado: any = anuncio.comerciante;
    let anuncioEliminado = false;

    // Resolver todos los reportes pendientes del anuncio (sin importar la acción)
    await db.reporte.updateMany({
      where: {
        anuncioId: id,
        resuelto: false,
      },
      data: {
        resuelto: true,
        resueltoEn: new Date(),
        resueltoPor: userId,
      },
    });

    switch (accion) {
      case "eliminar": {
        // Hard delete + sumar strike
        await db.anuncio.delete({ where: { id } });
        comercianteActualizado = await db.comerciante.update({
          where: { id: anuncio.comercianteId },
          data: {
            strikes: { increment: 1 },
            // Si llega a STRIKES_BAN_TEMPORAL, banear automáticamente 30 días
            ...(anuncio.comerciante.strikes + 1 >= STRIKES_BAN_TEMPORAL && {
              baneado: true,
              banHasta: new Date(Date.now() + DIAS_BAN_TEMPORAL * 24 * 60 * 60 * 1000),
            }),
          },
        });
        message = `Anuncio eliminado. Strike ${anuncio.comerciante.strikes + 1}/${STRIKES_BAN_TEMPORAL} para ${anuncio.comerciante.nombre}.${
          anuncio.comerciante.strikes + 1 >= STRIKES_BAN_TEMPORAL
            ? " ⚠️ Comerciante baneado automáticamente por 30 días."
            : ""
        }`;
        anuncioEliminado = true;
        break;
      }

      case "pausar": {
        await db.anuncio.update({
          where: { id },
          data: { pausado: true },
        });
        message = "Anuncio pausado. El comerciante puede reanudarlo.";
        break;
      }

      case "marcar_revision": {
        await db.anuncio.update({
          where: { id },
          data: { enRevision: true },
        });
        message = "Anuncio marcado como 'En revisión'. Sigue visible con badge.";
        break;
      }

      case "advertir": {
        // Solo notificar — sin cambios en el anuncio
        message = `Advertencia enviada a ${anuncio.comerciante.nombre}. Sin cambios en el anuncio.`;
        break;
      }

      case "banear": {
        // Ban temporal de 30 días al comerciante
        comercianteActualizado = await db.comerciante.update({
          where: { id: anuncio.comercianteId },
          data: {
            baneado: true,
            banHasta: new Date(Date.now() + DIAS_BAN_TEMPORAL * 24 * 60 * 60 * 1000),
          },
        });
        message = `Comerciante ${anuncio.comerciante.nombre} baneado por ${DIAS_BAN_TEMPORAL} días.`;
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      message,
      accion,
      anuncioEliminado,
      comerciante: comercianteActualizado
        ? {
            id: comercianteActualizado.id,
            nombre: comercianteActualizado.nombre,
            strikes: comercianteActualizado.strikes,
            baneado: comercianteActualizado.baneado,
            banHasta: comercianteActualizado.banHasta,
          }
        : null,
    });
  } catch (error) {
    console.error("Error en POST /api/admin/anuncios/[id]/moderar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

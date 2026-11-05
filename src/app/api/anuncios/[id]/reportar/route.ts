// API: POST /api/anuncios/[id]/reportar
// Body: { motivo: "ENGAÑOSO"|"ILEGAL"|"SPAM"|"NO_RESPONDE"|"LENGUAJE", comentario?: string }
// Requiere login (cualquier usuario registrado puede reportar)
// Tras 3 reportes de usuarios distintos, el anuncio se oculta automáticamente

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MOTIVOS_VALIDOS = ["ENGAÑOSO", "ILEGAL", "SPAM", "NO_RESPONDE", "LENGUAJE"];
const UMBRAL_OCULTAMIENTO = 3;

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
        { error: "Necesitás estar logueado para reportar" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const motivo = body?.motivo?.trim()?.toUpperCase();
    const comentario = body?.comentario?.trim() || null;

    if (!MOTIVOS_VALIDOS.includes(motivo)) {
      return NextResponse.json(
        { error: `Motivo no válido. Usá uno de: ${MOTIVOS_VALIDOS.join(", ")}` },
        { status: 400 }
      );
    }

    const anuncio = await db.anuncio.findUnique({ where: { id } });
    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario no haya reportado ya este anuncio
    const reporteExistente = await db.reporte.findUnique({
      where: {
        anuncioId_reportanteId: {
          anuncioId: id,
          reportanteId: userId,
        },
      },
    });

    if (reporteExistente) {
      return NextResponse.json(
        { error: "Ya reportaste este anuncio" },
        { status: 400 }
      );
    }

    // Crear el reporte
    await db.reporte.create({
      data: {
        anuncioId: id,
        reportanteId: userId,
        motivo,
        comentario,
      },
    });

    // Incrementar contador en el anuncio
    const nuevosReportes = anuncio.reportesCount + 1;
    const debeOcultarse = nuevosReportes >= UMBRAL_OCULTAMIENTO && !anuncio.oculto;

    await db.anuncio.update({
      where: { id },
      data: {
        reportesCount: { increment: 1 },
        ...(debeOcultarse && { oculto: true }),
      },
    });

    return NextResponse.json({
      ok: true,
      message: debeOcultarse
        ? "Reporte registrado. El anuncio fue ocultado automáticamente por superar el umbral de reportes."
        : "Reporte registrado. Gracias por ayudarnos a mantener la calidad.",
      reportesCount: nuevosReportes,
      ocultado: debeOcultarse,
    });
  } catch (error) {
    console.error("Error en POST /api/anuncios/[id]/reportar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

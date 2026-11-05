// API: POST /api/anuncios/[id]/compartir
// Registra el compartido (incrementa contador)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrarCompartido } from "@/lib/metricas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const anuncio = await db.anuncio.findUnique({ where: { id } });
    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    await db.anuncio.update({
      where: { id },
      data: { compartidos: { increment: 1 } },
    });
    registrarCompartido(id).catch((e) => console.error("Error métrica:", e));

    return NextResponse.json({
      compartidos: anuncio.compartidos + 1,
      // URL de WhatsApp con mensaje prearmado
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(
        `Mirá este anuncio en Clasificados: ${anuncio.titulo}`
      )}`,
    });
  } catch (error) {
    console.error("Error en /api/anuncios/[id]/compartir:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// API: GET /api/categorias
// Devuelve las 6 categorías en orden, con conteo de anuncios visibles.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categorias = await db.categoria.findMany({
      orderBy: { orden: "asc" },
      include: {
        _count: {
          select: {
            anuncios: {
              where: {
                oculto: false,
                pausado: false,
                venceEn: { gt: new Date() },
              },
            },
          },
        },
      },
    });

    const result = categorias.map((c) => ({
      id: c.slug, // usamos slug como id público (más legible)
      dbId: c.id,
      nombre: c.nombre,
      short: c.short,
      descripcion: c.descripcion,
      imagen: c.imagen,
      duracionDias: c.duracionDias,
      orden: c.orden,
      anunciosCount: c._count.anuncios,
    }));

    return NextResponse.json({ categorias: result });
  } catch (error) {
    console.error("Error en /api/categorias:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

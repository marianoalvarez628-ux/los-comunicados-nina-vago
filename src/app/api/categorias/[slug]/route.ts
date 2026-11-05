// API: GET /api/categorias/[slug]
// Devuelve una categoría por su slug (ej: "restobares")

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const categoria = await db.categoria.findUnique({
      where: { slug },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      categoria: {
        id: categoria.slug,
        dbId: categoria.id,
        nombre: categoria.nombre,
        short: categoria.short,
        descripcion: categoria.descripcion,
        imagen: categoria.imagen,
        duracionDias: categoria.duracionDias,
        orden: categoria.orden,
      },
    });
  } catch (error) {
    console.error("Error en /api/categorias/[slug]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

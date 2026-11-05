// API: GET /api/comerciantes
// Lista todos los comerciantes (o filtra por ?categoria=slug)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaSlug = searchParams.get("categoria");

    const where = categoriaSlug
      ? { categoria: { slug: categoriaSlug } }
      : {};

    const comerciantes = await db.comerciante.findMany({
      where,
      orderBy: { nombre: "asc" },
      include: {
        categoria: { select: { slug: true, short: true, nombre: true } },
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

    const result = comerciantes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      avatar: c.avatar,
      categoria: c.categoria,
      barrio: c.barrio,
      direccion: c.direccion,
      instagram: c.instagram,
      whatsapp: c.whatsapp,
      telefono: c.telefono,
      abierto: c.abierto,
      verificado: c.verificado,
      metricas: {
        totalVistas: c.totalVistas,
        totalLikes: c.totalLikes,
        totalGuardados: c.totalGuardados,
      },
      anunciosCount: c._count.anuncios,
    }));

    return NextResponse.json({ comerciantes: result });
  } catch (error) {
    console.error("Error en /api/comerciantes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

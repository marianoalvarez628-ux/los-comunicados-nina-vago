// API: GET /api/anuncios/[id]
// Devuelve un anuncio por ID con todos sus datos (incluyendo galería completa)
// POST /api/anuncios/[id]/vista — registra una vista

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anuncio = await db.anuncio.findUnique({
      where: { id },
      include: {
        comerciante: true,
        categoria: true,
        galeria: {
          orderBy: { orden: "asc" },
        },
      },
    });

    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    // Si está oculto o pausado, devolver 404 (no visible)
    if (anuncio.oculto || anuncio.pausado) {
      return NextResponse.json(
        { error: "Anuncio no disponible" },
        { status: 404 }
      );
    }

    // Incrementar contador de vistas (de forma asíncrona, sin bloquear la respuesta)
    db.anuncio
      .update({
        where: { id },
        data: { vistas: { increment: 1 } },
      })
      .catch((e) => console.error("Error incrementando vistas:", e));

    return NextResponse.json({
      anuncio: {
        id: anuncio.id,
        titulo: anuncio.titulo,
        imagen: anuncio.imagen,
        estado: anuncio.estado,
        descripcion: anuncio.descripcion,
        precio: anuncio.precio,
        publicadoEn: anuncio.publicadoEn,
        venceEn: anuncio.venceEn,
        metricas: {
          vistas: anuncio.vistas,
          likes: anuncio.likes,
          guardados: anuncio.guardados,
          compartidos: anuncio.compartidos,
        },
        comerciante: {
          id: anuncio.comerciante.id,
          nombre: anuncio.comerciante.nombre,
          avatar: anuncio.comerciante.avatar,
          direccion: anuncio.comerciante.direccion,
          barrio: anuncio.comerciante.barrio,
          instagram: anuncio.comerciante.instagram,
          whatsapp: anuncio.comerciante.whatsapp,
          telefono: anuncio.comerciante.telefono,
          abierto: anuncio.comerciante.abierto,
          verificado: anuncio.comerciante.verificado,
          categoriaId: anuncio.comerciante.categoriaId,
        },
        categoria: {
          id: anuncio.categoria.slug,
          short: anuncio.categoria.short,
          nombre: anuncio.categoria.nombre,
        },
        galeria: anuncio.galeria.map((g) => g.url),
      },
    });
  } catch (error) {
    console.error("Error en /api/anuncios/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

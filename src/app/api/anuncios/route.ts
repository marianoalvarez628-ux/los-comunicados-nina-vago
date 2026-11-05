// API: GET /api/anuncios
// Query params:
//   ?categoria=restobares  → filtra por categoría (slug)
//   ?comerciante=la-esquina → filtra por comerciante (id)
//   ?estado=ABIERTO          → filtra por estado (ABIERTO/CERRADO/PROMO)
//   ?limit=20&offset=0       → paginación (default 20)
//   ?orderBy=recientes|cercanos|populares  → orden (default: recientes)

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriaSlug = searchParams.get("categoria");
    const comercianteId = searchParams.get("comerciante");
    const estado = searchParams.get("estado");
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const orderBy = searchParams.get("orderBy") ?? "recientes";

    // Construir el where
    const where: Prisma.AnuncioWhereInput = {
      // Solo anuncios visibles (no ocultos, no pausados, no vencidos)
      oculto: false,
      pausado: false,
      venceEn: { gt: new Date() },
    };

    if (categoriaSlug) {
      where.categoria = { slug: categoriaSlug };
    }
    if (comercianteId) {
      where.comercianteId = comercianteId;
    }
    if (estado) {
      where.estado = estado;
    }

    // Construir el orderBy
    let orderClause: Prisma.AnuncioOrderByWithRelationInput;
    switch (orderBy) {
      case "populares":
        orderClause = { vistas: "desc" };
        break;
      case "likes":
        orderClause = { likes: "desc" };
        break;
      case "recientes":
      default:
        orderClause = { publicadoEn: "desc" };
        break;
    }

    const anuncios = await db.anuncio.findMany({
      where,
      orderBy: orderClause,
      take: limit,
      skip: offset,
      include: {
        comerciante: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
            direccion: true,
            barrio: true,
            instagram: true,
            whatsapp: true,
            telefono: true,
            abierto: true,
            categoriaId: true,
          },
        },
        categoria: {
          select: {
            slug: true,
            short: true,
            nombre: true,
          },
        },
        galeria: {
          orderBy: { orden: "asc" },
          take: 4,
        },
      },
    });

    // Contar total para metadata
    const total = await db.anuncio.count({ where });

    const result = anuncios.map((a) => ({
      id: a.id,
      comerciante: a.comerciante,
      categoria: a.categoria,
      titulo: a.titulo,
      imagen: a.imagen,
      estado: a.estado,
      descripcion: a.descripcion,
      precio: a.precio,
      publicadoEn: a.publicadoEn,
      venceEn: a.venceEn,
      metricas: {
        vistas: a.vistas,
        likes: a.likes,
        guardados: a.guardados,
        compartidos: a.compartidos,
      },
      galeria: a.galeria.map((g) => g.url),
    }));

    return NextResponse.json({
      anuncios: result,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error en /api/anuncios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

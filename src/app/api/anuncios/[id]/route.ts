// API: GET /api/anuncios/[id] — devuelve un anuncio por ID con galería
// API: DELETE /api/anuncios/[id] — elimina un anuncio (dueño o admin)

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

// ============================================================
// GET — detalle público del anuncio
// ============================================================
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

    // Incrementar contador de vistas (de forma asíncrona)
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
    console.error("Error en GET /api/anuncios/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE — elimina un anuncio (dueño o admin)
// ============================================================
export async function DELETE(
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

    const anuncio = await db.anuncio.findUnique({ where: { id } });

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
        { error: "No tenés permiso para eliminar este anuncio" },
        { status: 403 }
      );
    }

    // Hard delete (las imágenes se borran en cascada)
    await db.anuncio.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Anuncio eliminado",
    });
  } catch (error) {
    console.error("Error en DELETE /api/anuncios/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — actualizar estado, pausar/reanudar
// Body: { accion: "pausar" | "reanudar" | "cambiar_estado", estado?: "ABIERTO"|"CERRADO"|"PROMO" }
// ============================================================
export async function PATCH(
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

    const anuncio = await db.anuncio.findUnique({ where: { id } });

    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    const esOwner = anuncio.comercianteId === usuario.comerciante?.id;
    const esAdmin = usuario.rol === "ADMIN";
    if (!esOwner && !esAdmin) {
      return NextResponse.json(
        { error: "No tenés permiso para modificar este anuncio" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const accion = body?.accion;
    const nuevoEstado = body?.estado;

    let updateData: any = {};

    if (accion === "pausar") {
      updateData.pausado = true;
    } else if (accion === "reanudar") {
      updateData.pausado = false;
    } else if (accion === "cambiar_estado") {
      const estadosValidos = ["ABIERTO", "CERRADO", "PROMO"];
      if (!estadosValidos.includes(nuevoEstado)) {
        return NextResponse.json(
          { error: "Estado no válido" },
          { status: 400 }
        );
      }
      updateData.estado = nuevoEstado;
    } else {
      return NextResponse.json(
        { error: "Acción no válida. Usá: pausar, reanudar, o cambiar_estado." },
        { status: 400 }
      );
    }

    const actualizado = await db.anuncio.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message: "Anuncio actualizado",
      anuncio: {
        id: actualizado.id,
        estado: actualizado.estado,
        pausado: actualizado.pausado,
      },
    });
  } catch (error) {
    console.error("Error en PATCH /api/anuncios/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

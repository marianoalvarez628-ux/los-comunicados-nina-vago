// API: POST /api/anuncios/[id]/like
// Body: { whatsapp: "+54911..." }
// Toggle: si ya existe el like, lo quita; si no, lo agrega.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const whatsapp = body?.whatsapp;

    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario por whatsapp
    const usuario = await db.usuario.findUnique({
      where: { whatsapp },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el anuncio exista
    const anuncio = await db.anuncio.findUnique({ where: { id } });
    if (!anuncio) {
      return NextResponse.json(
        { error: "Anuncio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene like
    const existingLike = await db.like.findUnique({
      where: {
        usuarioId_anuncioId: {
          usuarioId: usuario.id,
          anuncioId: id,
        },
      },
    });

    if (existingLike) {
      // Quitar like
      await db.like.delete({ where: { id: existingLike.id } });
      await db.anuncio.update({
        where: { id },
        data: { likes: { decrement: 1 } },
      });
      return NextResponse.json({ liked: false, likes: anuncio.likes - 1 });
    } else {
      // Agregar like
      await db.like.create({
        data: {
          usuarioId: usuario.id,
          anuncioId: id,
        },
      });
      await db.anuncio.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });
      return NextResponse.json({ liked: true, likes: anuncio.likes + 1 });
    }
  } catch (error) {
    console.error("Error en /api/anuncios/[id]/like:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

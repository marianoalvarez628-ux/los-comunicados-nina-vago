// API: POST /api/auth/registro-comerciante
// Convierte un usuario VISITANTE logueado en COMERCIANTE
// Crea el Comerciante en la DB con los datos del formulario
// Body: { nombre, categoriaSlug, direccion, barrio, instagram? }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // 1. Verificar sesión (cookie)
    const userId = request.headers
      .get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("session_user_id="))
      ?.split("=")[1];

    if (!userId) {
      return NextResponse.json(
        { error: "No estás logueado. Iniciá sesión primero." },
        { status: 401 }
      );
    }

    const usuario = await db.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si ya es COMERCIANTE, devolver su info
    if (usuario.rol === "COMERCIANTE" && usuario.comercianteId) {
      const comerciante = await db.comerciante.findUnique({
        where: { id: usuario.comercianteId },
      });
      return NextResponse.json({
        ok: true,
        message: "Ya eres comerciante",
        comerciante: comerciante
          ? {
              id: comerciante.id,
              nombre: comerciante.nombre,
              categoriaId: comerciante.categoriaId,
            }
          : null,
      });
    }

    // 2. Validar body
    const body = await request.json();
    const nombreRaw = body?.nombre?.trim();
    const categoriaSlug = body?.categoriaSlug?.trim();
    const direccionRaw = body?.direccion?.trim();
    const barrioRaw = body?.barrio?.trim();
    const instagramRaw = body?.instagram?.trim();

    if (!nombreRaw || nombreRaw.length < 3) {
      return NextResponse.json(
        { error: "Nombre del comercio debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    if (!categoriaSlug) {
      return NextResponse.json(
        { error: "Categoría es obligatoria" },
        { status: 400 }
      );
    }

    if (!direccionRaw || direccionRaw.length < 5) {
      return NextResponse.json(
        { error: "Dirección debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (!barrioRaw || barrioRaw.length < 3) {
      return NextResponse.json(
        { error: "Barrio debe tener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    // 3. Buscar la categoría por slug
    const categoria = await db.categoria.findUnique({
      where: { slug: categoriaSlug },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoría no válida" },
        { status: 400 }
      );
    }

    // 4. Validar palabras prohibidas en el nombre
    const nombreLower = nombreRaw.toLowerCase();
    const palabrasProhibidas = await db.palabraProhibida.findMany();
    const palabraEncontrada = palabrasProhibidas.find((p) =>
      nombreLower.includes(p.palabra.toLowerCase())
    );

    if (palabraEncontrada) {
      return NextResponse.json(
        {
          error: `El nombre contiene una palabra no permitida: "${palabraEncontrada.palabra}"`,
        },
        { status: 400 }
      );
    }

    // 5. Crear el Comerciante
    const nuevoComerciante = await db.comerciante.create({
      data: {
        // ID descriptivo basado en slug del nombre
        id: `c-${Date.now().toString(36)}`,
        nombre: nombreRaw,
        avatar:
          usuario.nombre?.slice(0, 1).toUpperCase() ?? "?",
        categoriaId: categoria.id,
        barrio: barrioRaw,
        direccion: direccionRaw,
        instagram: instagramRaw || null,
        whatsapp: usuario.whatsapp,
        telefono: usuario.whatsapp,
        abierto: true,
        verificado: false, // recién creado, no verificado hasta 3 anuncios sin reportes
        strikes: 0,
        baneado: false,
      },
    });

    // 6. Actualizar el usuario → rol COMERCIANTE + vincularlo
    await db.usuario.update({
      where: { id: userId },
      data: {
        rol: "COMERCIANTE",
        comercianteId: nuevoComerciante.id,
        nombre: nombreRaw,
        barrio: barrioRaw,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Registro exitoso. Ahora podés publicar anuncios.",
      comerciante: {
        id: nuevoComerciante.id,
        nombre: nuevoComerciante.nombre,
        categoriaId: nuevoComerciante.categoriaId,
      },
      usuario: {
        id: userId,
        rol: "COMERCIANTE",
        comercianteId: nuevoComerciante.id,
      },
    });
  } catch (error) {
    console.error("Error en /api/auth/registro-comerciante:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

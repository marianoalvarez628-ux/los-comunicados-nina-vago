// API: POST /api/anuncios
// Crea un anuncio nuevo en la DB
// Body: { titulo, descripcion, categoriaSlug, imagenes: string[], precio?, estado? }
// Requiere login COMERCIANTE

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_ANUNCIOS = 5;
const MAX_PALABRAS_DESC = 90;
const MAX_PALABRAS_TITULO = 3;
const MAX_IMAGENES = 4;

function getUserIdFromCookie(request: Request): string | null {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session_user_id="))
    ?.split("=")[1] ?? null;
}

function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  if (!limpio) return 0;
  return limpio.split(/\s+/).filter(Boolean).length;
}

export async function POST(request: Request) {
  try {
    // 1. Verificar sesión
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

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (usuario.rol !== "COMERCIANTE" && usuario.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Necesitás registrar tu comercio primero" },
        { status: 403 }
      );
    }

    if (!usuario.comerciante) {
      return NextResponse.json(
        { error: "No tenés un comercio asociado" },
        { status: 400 }
      );
    }

    if (usuario.comerciante.baneado) {
      const banHasta = usuario.comerciante.banHasta;
      if (!banHasta || banHasta > new Date()) {
        return NextResponse.json(
          {
            error: banHasta
              ? `Tu comercio está baneado hasta ${banHasta.toLocaleDateString("es-AR")}`
              : "Tu comercio está baneado permanentemente",
          },
          { status: 403 }
        );
      }
    }

    // 2. Validar body
    const body = await request.json();
    const tituloRaw = body?.titulo?.trim();
    const descripcionRaw = body?.descripcion?.trim();
    const categoriaSlug = body?.categoriaSlug?.trim();
    const imagenesRaw: string[] = Array.isArray(body?.imagenes) ? body.imagenes : [];
    const precioRaw = body?.precio?.trim();
    const estadoRaw = body?.estado?.trim();

    // Validaciones de campos obligatorios
    if (!tituloRaw) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    const palabrasTitulo = contarPalabras(tituloRaw);
    if (palabrasTitulo < 1) {
      return NextResponse.json(
        { error: "El título no puede estar vacío" },
        { status: 400 }
      );
    }
    if (palabrasTitulo > MAX_PALABRAS_TITULO) {
      return NextResponse.json(
        { error: `El título tiene ${palabrasTitulo} palabras. Máximo: ${MAX_PALABRAS_TITULO}` },
        { status: 400 }
      );
    }

    if (!descripcionRaw) {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 }
      );
    }

    const palabrasDesc = contarPalabras(descripcionRaw);
    if (palabrasDesc > MAX_PALABRAS_DESC) {
      return NextResponse.json(
        {
          error: `La descripción tiene ${palabrasDesc} palabras. Máximo: ${MAX_PALABRAS_DESC}`,
        },
        { status: 400 }
      );
    }

    if (!categoriaSlug) {
      return NextResponse.json(
        { error: "La categoría es obligatoria" },
        { status: 400 }
      );
    }

    // Validar categoría
    const categoria = await db.categoria.findUnique({
      where: { slug: categoriaSlug },
    });
    if (!categoria) {
      return NextResponse.json(
        { error: "Categoría no válida" },
        { status: 400 }
      );
    }

    // Validar imágenes
    if (imagenesRaw.length === 0) {
      return NextResponse.json(
        { error: "Tenés que subir al menos 1 imagen" },
        { status: 400 }
      );
    }
    if (imagenesRaw.length > MAX_IMAGENES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_IMAGENES} imágenes` },
        { status: 400 }
      );
    }

    // Validar estado
    const estadosValidos = ["ABIERTO", "CERRADO", "PROMO"];
    const estado = estadosValidos.includes(estadoRaw) ? estadoRaw : "ABIERTO";

    // 3. Verificar límite de 5 anuncios activos por comerciante
    const anunciosActivos = await db.anuncio.count({
      where: {
        comercianteId: usuario.comerciante.id,
        venceEn: { gt: new Date() },
        oculto: false,
        pausado: false,
      },
    });

    if (anunciosActivos >= MAX_ANUNCIOS) {
      return NextResponse.json(
        {
          error: `Ya tenés ${anunciosActivos} anuncios activos (máximo ${MAX_ANUNCIOS}). Eliminá o pausá uno para publicar uno nuevo.`,
          anunciosActivos,
          maxAnuncios: MAX_ANUNCIOS,
        },
        { status: 400 }
      );
    }

    // 4. Filtro de palabras prohibidas en título y descripción
    const palabrasProhibidas = await db.palabraProhibida.findMany();
    const textoCompleto = `${tituloRaw} ${descripcionRaw}`.toLowerCase();
    const palabraEncontrada = palabrasProhibidas.find((p) =>
      textoCompleto.includes(p.palabra.toLowerCase())
    );

    if (palabraEncontrada) {
      return NextResponse.json(
        {
          error: `Tu anuncio contiene una palabra no permitida: "${palabraEncontrada.palabra}". Revisá el texto.`,
        },
        { status: 400 }
      );
    }

    // 5. Detección de duplicados por comerciante (mismo título)
    // SQLite no soporta mode: insensitive, así que comparamos en minúsculas
    const duplicado = await db.anuncio.findFirst({
      where: {
        comercianteId: usuario.comerciante.id,
        titulo: tituloRaw, // case-sensitive en SQLite, aceptamos el tradeoff
        venceEn: { gt: new Date() },
      },
    });

    if (duplicado) {
      return NextResponse.json(
        {
          error: "Ya tenés un anuncio activo con ese título. Editá el existente o usá otro título.",
          duplicadoId: duplicado.id,
        },
        { status: 400 }
      );
    }

    // 6. Calcular fecha de vencimiento según categoría
    const ahora = new Date();
    const venceEn = new Date(
      ahora.getTime() + categoria.duracionDias * 24 * 60 * 60 * 1000
    );

    // 7. Crear el anuncio
    const nuevoAnuncio = await db.anuncio.create({
      data: {
        comercianteId: usuario.comerciante.id,
        categoriaId: categoria.id,
        titulo: tituloRaw,
        imagen: imagenesRaw[0], // primera imagen = portada
        estado,
        descripcion: descripcionRaw,
        precio: precioRaw || null,
        publicadoEn: ahora,
        venceEn,
        vistas: 0,
        likes: 0,
        guardados: 0,
        compartidos: 0,
        oculto: false,
        enRevision: false,
        pausado: false,
      },
    });

    // 8. Crear las imágenes de galería (hasta 4)
    const imagenesData = imagenesRaw.slice(0, MAX_IMAGENES).map((url, i) => ({
      id: `${nuevoAnuncio.id}-img-${i + 1}`,
      anuncioId: nuevoAnuncio.id,
      url,
      orden: i,
    }));
    await db.imagenAnuncio.createMany({ data: imagenesData });

    // 9. Respuesta exitosa
    return NextResponse.json({
      ok: true,
      message: `Anuncio publicado. Vence el ${venceEn.toLocaleDateString("es-AR")}.`,
      anuncio: {
        id: nuevoAnuncio.id,
        titulo: nuevoAnuncio.titulo,
        estado: nuevoAnuncio.estado,
        publicadoEn: nuevoAnuncio.publicadoEn,
        venceEn: nuevoAnuncio.venceEn,
        categoriaSlug: categoria.slug,
        duracionDias: categoria.duracionDias,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/anuncios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET /api/anuncios/mine — anuncios del comerciante logueado
export async function GET(request: Request) {
  try {
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

    if (!usuario?.comerciante) {
      return NextResponse.json({ anuncios: [] });
    }

    const anuncios = await db.anuncio.findMany({
      where: { comercianteId: usuario.comerciante.id },
      orderBy: { publicadoEn: "desc" },
      include: {
        categoria: { select: { slug: true, short: true, nombre: true } },
        galeria: { orderBy: { orden: "asc" }, take: 4 },
        _count: { select: { reportes: true } },
      },
    });

    const result = anuncios.map((a) => {
      const ahora = new Date();
      const diasRestantes = Math.ceil(
        (a.venceEn.getTime() - ahora.getTime()) / (24 * 60 * 60 * 1000)
      );
      return {
        id: a.id,
        titulo: a.titulo,
        imagen: a.imagen,
        estado: a.estado,
        descripcion: a.descripcion,
        precio: a.precio,
        publicadoEn: a.publicadoEn,
        venceEn: a.venceEn,
        diasRestantes,
        vencido: a.venceEn < ahora,
        pausado: a.pausado,
        oculto: a.oculto,
        reportes: a._count.reportes,
        metricas: {
          vistas: a.vistas,
          likes: a.likes,
          guardados: a.guardados,
          compartidos: a.compartidos,
        },
        categoria: a.categoria,
        galeria: a.galeria.map((g) => g.url),
      };
    });

    return NextResponse.json({
      anuncios: result,
      comerciante: {
        id: usuario.comerciante.id,
        nombre: usuario.comerciante.nombre,
        verificado: usuario.comerciante.verificado,
        strikes: usuario.comerciante.strikes,
        baneado: usuario.comerciante.baneado,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/anuncios (mine):", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

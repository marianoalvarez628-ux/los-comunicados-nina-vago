// Seed script — puebla la base de datos con las 6 categorías, 14 comerciantes y 24 anuncios
// del prototipo. Se ejecuta con: bun run db:seed
//
// IMPORTANTE: este script es IDEMPOTENTE — si lo corrés varias veces, no duplica datos.

import { PrismaClient } from "@prisma/client";
import { categorias as categoriasMock, comerciantes as comerciantesMock, anuncios as anunciosMock, galeriaImagenes } from "../src/lib/data-mock";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. CREAR CATEGORÍAS
  console.log("📂 Creando 6 categorías...");
  for (let i = 0; i < categoriasMock.length; i++) {
    const cat = categoriasMock[i];
    const duracionDias = cat.id === "compraventa" || cat.id === "anuncios" ? 5 : 30;
    await prisma.categoria.upsert({
      where: { slug: cat.id },
      update: {
        nombre: cat.nombre,
        short: cat.short,
        descripcion: cat.descripcion,
        imagen: cat.imagen,
        duracionDias,
        orden: i,
      },
      create: {
        slug: cat.id,
        nombre: cat.nombre,
        short: cat.short,
        descripcion: cat.descripcion,
        imagen: cat.imagen,
        duracionDias,
        orden: i,
      },
    });
    console.log(`   ✓ ${cat.short} (duración: ${duracionDias} días)`);
  }

  // 2. CREAR COMERCIANTES
  console.log("\n🏪 Creando comerciantes...");
  // Mapa para traducir categoriaId (string slug) → Categoria.id (cuid)
  const categoriaMap = new Map<string, string>();
  const allCategorias = await prisma.categoria.findMany();
  for (const c of allCategorias) {
    categoriaMap.set(c.slug, c.id);
  }

  for (const com of comerciantesMock) {
    const categoriaId = categoriaMap.get(com.categoriaId);
    if (!categoriaId) {
      console.warn(`   ⚠ Categoría no encontrada para ${com.nombre}: ${com.categoriaId}`);
      continue;
    }
    await prisma.comerciante.upsert({
      where: { id: com.id }, // usamos el id del mock como id en la DB
      update: {
        nombre: com.nombre,
        avatar: com.avatar,
        categoriaId,
        barrio: com.barrio,
        direccion: com.direccion,
        instagram: com.instagram,
        whatsapp: com.whatsapp,
        telefono: com.telefono,
        abierto: com.abierto,
        verificado: true, // los mocks están verificados
        strikes: 0,
        baneado: false,
      },
      create: {
        id: com.id, // usamos el id del mock directamente
        nombre: com.nombre,
        avatar: com.avatar,
        categoriaId,
        barrio: com.barrio,
        direccion: com.direccion,
        instagram: com.instagram,
        whatsapp: com.whatsapp,
        telefono: com.telefono,
        abierto: com.abierto,
        verificado: true,
      },
    });
    console.log(`   ✓ ${com.nombre}`);
  }

  // 3. CREAR ANUNCIOS
  console.log("\n📋 Creando anuncios...");
  // Mapa para traducir comercianteId (mock) → Comerciante.id (que es igual al mock)
  for (const an of anunciosMock) {
    const comerciante = await prisma.comerciante.findUnique({
      where: { id: an.comercianteId },
    });
    if (!comerciante) {
      console.warn(`   ⚠ Comerciante no encontrado para anuncio ${an.id}: ${an.comercianteId}`);
      continue;
    }
    const categoriaId = categoriaMap.get(comerciante.categoriaId) ?? comerciante.categoriaId;
    const duracionDias = (await prisma.categoria.findUnique({ where: { id: categoriaId } }))?.duracionDias ?? 30;

    const ahora = new Date();
    const venceEn = new Date(ahora.getTime() + duracionDias * 24 * 60 * 60 * 1000);

    // Datos del mock
    const vistas = (an as any).vistas ?? 0;
    const likes = (an as any).likes ?? 0;
    const guardados = (an as any).guardados ?? 0;

    await prisma.anuncio.upsert({
      where: { id: an.id },
      update: {
        comercianteId: an.comercianteId,
        categoriaId,
        titulo: an.titulo,
        imagen: an.imagen,
        estado: an.estado,
        descripcion: an.descripcion,
        precio: an.precio,
        publicadoEn: ahora,
        venceEn,
        vistas,
        likes,
        guardados,
        compartidos: 0,
        oculto: false,
        enRevision: false,
        pausado: false,
      },
      create: {
        id: an.id,
        comercianteId: an.comercianteId,
        categoriaId,
        titulo: an.titulo,
        imagen: an.imagen,
        estado: an.estado,
        descripcion: an.descripcion,
        precio: an.precio,
        publicadoEn: ahora,
        venceEn,
        vistas,
        likes,
        guardados,
        compartidos: 0,
      },
    });
    console.log(`   ✓ ${an.titulo} (vence: ${venceEn.toISOString().slice(0, 10)})`);

    // 4. CREAR IMÁGENES DE GALERÍA (hasta 4 por anuncio)
    const galeria = galeriaImagenes[an.comercianteId] ?? [an.imagen];
    for (let i = 0; i < galeria.length && i < 4; i++) {
      await prisma.imagenAnuncio.upsert({
        where: {
          // No hay unique constraint natural — usamos compound lookup
          id: `${an.id}-img-${i + 1}`,
        },
        update: {
          url: galeria[i],
          orden: i,
        },
        create: {
          id: `${an.id}-img-${i + 1}`,
          anuncioId: an.id,
          url: galeria[i],
          orden: i,
        },
      });
    }
  }

  // 5. PALABRAS PROHIBIDAS INICIALES
  console.log("\n🚫 Creando palabras prohibidas iniciales...");
  const palabrasProhibidas = [
    "estafa", "engaño", "falso", "trucho", "ilegal", "drogas", "cocaina",
    "marihuana", "venta", "robado", "hurto", "porno", "sexo",
  ];
  for (const palabra of palabrasProhibidas) {
    await prisma.palabraProhibida.upsert({
      where: { palabra },
      update: {},
      create: { palabra },
    });
  }
  console.log(`   ✓ ${palabrasProhibidas.length} palabras prohibidas`);

  // 6. USUARIO ADMIN POR DEFECTO
  console.log("\n👤 Creando usuario admin por defecto...");
  await prisma.usuario.upsert({
    where: { whatsapp: "+5491100000000" },
    update: {
      rol: "ADMIN",
      nombre: "Admin",
    },
    create: {
      whatsapp: "+5491100000000",
      rol: "ADMIN",
      nombre: "Admin",
    },
  });
  console.log("   ✓ Admin creado (WhatsApp: +5491100000000)");

  // RESUMEN FINAL
  const stats = {
    categorias: await prisma.categoria.count(),
    comerciantes: await prisma.comerciante.count(),
    anuncios: await prisma.anuncio.count(),
    imagenes: await prisma.imagenAnuncio.count(),
    palabras: await prisma.palabraProhibida.count(),
    usuarios: await prisma.usuario.count(),
  };
  console.log("\n📊 Resumen:");
  console.log(`   Categorías:    ${stats.categorias}`);
  console.log(`   Comerciantes:  ${stats.comerciantes}`);
  console.log(`   Anuncios:     ${stats.anuncios}`);
  console.log(`   Imágenes:     ${stats.imagenes}`);
  console.log(`   Palabras:     ${stats.palabras}`);
  console.log(`   Usuarios:     ${stats.usuarios}`);
  console.log("\n✅ Seed completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

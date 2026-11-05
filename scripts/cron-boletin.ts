// Cron job — Boletín diario por WhatsApp para comerciantes
// Se ejecuta a las 9:00 AM (hora local) todos los días.
// Para cada comerciante con boletinDiario=true:
//   - Calcula totales de actividad del día anterior (vistas, likes, compartidos, guardados)
//   - En modo desarrollo: loggea el boletín en consola
//   - En producción: enviaría por WhatsApp (Twilio)
//
// Para iniciar este cron job en background:
//   bun run scripts/cron-boletin.ts
//
// O incluirlo en el server de Next.js (no recomendado en producción,
// mejor usar un worker separado o un servicio como Vercel Cron).

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MODO_DESARROLLO = process.env.NODE_ENV !== "production";

interface BoletinComerciante {
  comercianteId: string;
  nombreComercio: string;
  whatsapp: string;
  totales: {
    vistas: number;
    likes: number;
    compartidos: number;
    guardados: number;
  };
  anuncioMasVisto: { titulo: string; vistas: number } | null;
  totalAnuncios: number;
}

async function generarBoletinDelDia(): Promise<BoletinComerciante[]> {
  // Calcular fecha del día anterior (00:00 UTC)
  const hoy = new Date();
  const ayerInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - 1));
  const hoyInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

  // Buscar comerciantes con boletinDiario=true
  const comerciantes = await prisma.comerciante.findMany({
    where: {
      preferencias: {
        boletinDiario: true,
      },
      // Solo los que NO recibieron boletín hoy todavía
      OR: [
        { preferencias: { ultimoBoletinEn: null } },
        { preferencias: { ultimoBoletinEn: { lt: hoyInicio } } },
      ],
    },
    include: {
      anuncios: {
        where: { venceEn: { gt: ayerInicio } }, // solo anuncios que estaban activos ayer
        select: { id: true, titulo: true, vistas: true },
      },
      preferencias: true,
    },
  });

  const boletines: BoletinComerciante[] = [];

  for (const com of comerciantes) {
    if (com.anuncios.length === 0) continue;

    // Buscar métricas del día anterior para todos los anuncios del comerciante
    const metricas = await prisma.metricaDiaria.findMany({
      where: {
        anuncioId: { in: com.anuncios.map((a) => a.id) },
        fecha: ayerInicio,
      },
    });

    // Totales
    const totales = metricas.reduce(
      (acc, m) => ({
        vistas: acc.vistas + m.vistas,
        likes: acc.likes + m.likes,
        compartidos: acc.compartidos + m.compartidos,
        guardados: acc.guardados + m.guardados,
      }),
      { vistas: 0, likes: 0, compartidos: 0, guardados: 0 }
    );

    // Si no hubo actividad, no enviar boletín
    const totalActividad = totales.vistas + totales.likes + totales.compartidos + totales.guardados;
    if (totalActividad === 0) continue;

    // Anuncio más visto
    const anuncioMasVisto = metricas
      .filter((m) => m.vistas > 0)
      .sort((a, b) => b.vistas - a.vistas)[0];

    const anuncioMasVistoInfo = anuncioMasVisto
      ? com.anuncios.find((a) => a.id === anuncioMasVisto.anuncioId)
      : null;

    boletines.push({
      comercianteId: com.id,
      nombreComercio: com.nombre,
      whatsapp: com.whatsapp,
      totales,
      anuncioMasVisto: anuncioMasVistoInfo
        ? { titulo: anuncioMasVistoInfo.titulo, vistas: anuncioMasVisto.vistas }
        : null,
      totalAnuncios: com.anuncios.length,
    });

    // Marcar último boletín enviado
    await prisma.preferenciaNotificaciones.update({
      where: { comercianteId: com.id },
      data: { ultimoBoletinEn: new Date() },
    });
  }

  return boletines;
}

function construirMensaje(b: BoletinComerciante): string {
  const lines = [
    `📊 *Boletín diario de Clasificados*`,
    ``,
    `Hola *${b.nombreComercio}*! Acá tu resumen de actividad de ayer:`,
    ``,
    `👁 Vistas: ${b.totales.vistas}`,
    `👍 Me gusta: ${b.totales.likes}`,
    `📤 Compartidos: ${b.totales.compartidos}`,
    `🔖 Guardados: ${b.totales.guardados}`,
  ];

  if (b.anuncioMasVisto) {
    lines.push(``, `⭐ Anuncio más visto: *${b.anuncioMasVisto.titulo}* (${b.anuncioMasVisto.vistas} vistas)`);
  }

  lines.push(
    ``,
    `Total anuncios activos: ${b.totalAnuncios}`,
    ``,
    `— Clasificados · Z.ai`
  );

  return lines.join("\n");
}

async function enviarBoletin(b: BoletinComerciante): Promise<void> {
  const mensaje = construirMensaje(b);

  if (MODO_DESARROLLO) {
    // Modo desarrollo: solo loggear
    console.log("\n" + "=".repeat(60));
    console.log(`📊 BOLETÍN DIARIO para ${b.nombreComercio} (${b.whatsapp})`);
    console.log("=".repeat(60));
    console.log(mensaje);
    console.log("=".repeat(60) + "\n");
    return;
  }

  // Producción: integrar Twilio o WhatsApp Business API
  // await twilioClient.messages.create({
  //   from: "whatsapp:+14155238886",
  //   to: `whatsapp:${b.whatsapp}`,
  //   body: mensaje,
  // });
}

async function ejecutarBoletin(): Promise<void> {
  console.log(`\n[${new Date().toISOString()}] 📬 Ejecutando boletín diario...`);
  try {
    const boletines = await generarBoletinDelDia();
    if (boletines.length === 0) {
      console.log("   No hay comerciantes con actividad para enviar boletín.");
      return;
    }
    console.log(`   Encontrados ${boletines.length} comerciantes con actividad:`);
    for (const b of boletines) {
      await enviarBoletin(b);
      console.log(`   ✓ ${b.nombreComercio}: ${b.totales.vistas}v, ${b.totales.likes}l, ${b.totales.compartidos}c`);
    }
  } catch (e) {
    console.error("Error ejecutando boletín:", e);
  }
}

// ============================================================
// PROGRAMAR CRON JOB
// ============================================================
// A las 9:00 AM todos los días (hora local del server)
cron.schedule("0 9 * * *", ejecutarBoletin, {
  timezone: "America/Argentina/Buenos_Aires",
});

// Para tests: también ejecutar al iniciar el script (esperando 3 segundos)
setTimeout(() => {
  ejecutarBoletin().then(() => {
    console.log("\n✅ Boletín inicial completado. Cron programado para 9:00 AM diario.");
    console.log("   (Mantené este proceso corriendo para que el cron se ejecute)");
  });
}, 3000);

// Manejar cierre
process.on("SIGINT", async () => {
  console.log("\n🛑 Cerrando cron job...");
  await prisma.$disconnect();
  process.exit(0);
});

// Mantener proceso vivo
console.log("🚀 Cron job iniciado — boletín diario programado para 9:00 AM (America/Argentina/Buenos_Aires)");
console.log("   Modo:", MODO_DESARROLLO ? "DESARROLLO (logs en consola)" : "PRODUCCIÓN (envío real)");

// Helper para registrar métricas diarias por anuncio.
// Se llama desde los endpoints que disparan eventos:
//   - GET /api/anuncios/[id] → registrarVista(anuncioId)
//   - POST /api/anuncios/[id]/like → registrarLike(anuncioId)
//   - POST /api/anuncios/[id]/compartir → registrarCompartido(anuncioId)
//   - POST /api/anuncios/[id]/guardar (cuando se implemente) → registrarGuardado

import { db } from "./db";

// Devuelve la fecha del día actual a las 00:00 UTC (sin hora)
function getDiaActual(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

// Upsert: si existe el registro del día para ese anuncio, incrementa; si no, lo crea
export async function registrarVista(anuncioId: string): Promise<void> {
  const fecha = getDiaActual();
  try {
    await db.metricaDiaria.upsert({
      where: {
        anuncioId_fecha: { anuncioId, fecha },
      },
      update: { vistas: { increment: 1 } },
      create: { anuncioId, fecha, vistas: 1 },
    });
  } catch (e) {
    console.error("Error registrando vista diaria:", e);
  }
}

export async function registrarLike(anuncioId: string): Promise<void> {
  const fecha = getDiaActual();
  try {
    await db.metricaDiaria.upsert({
      where: {
        anuncioId_fecha: { anuncioId, fecha },
      },
      update: { likes: { increment: 1 } },
      create: { anuncioId, fecha, likes: 1 },
    });
  } catch (e) {
    console.error("Error registrando like diario:", e);
  }
}

export async function registrarQuitaLike(anuncioId: string): Promise<void> {
  const fecha = getDiaActual();
  try {
    await db.metricaDiaria.update({
      where: {
        anuncioId_fecha: { anuncioId, fecha },
      },
      data: { likes: { decrement: 1 } },
    });
  } catch (e) {
    console.error("Error decrementando like diario:", e);
  }
}

export async function registrarCompartido(anuncioId: string): Promise<void> {
  const fecha = getDiaActual();
  try {
    await db.metricaDiaria.upsert({
      where: {
        anuncioId_fecha: { anuncioId, fecha },
      },
      update: { compartidos: { increment: 1 } },
      create: { anuncioId, fecha, compartidos: 1 },
    });
  } catch (e) {
    console.error("Error registrando compartido diario:", e);
  }
}

export async function registrarGuardado(anuncioId: string): Promise<void> {
  const fecha = getDiaActual();
  try {
    await db.metricaDiaria.upsert({
      where: {
        anuncioId_fecha: { anuncioId, fecha },
      },
      update: { guardados: { increment: 1 } },
      create: { anuncioId, fecha, guardados: 1 },
    });
  } catch (e) {
    console.error("Error registrando guardado diario:", e);
  }
}

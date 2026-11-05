// API: GET /api/comerciante/preferencias-notificaciones
// API: PATCH /api/comerciante/preferencias-notificaciones
// Body PATCH: { boletinDiario?: boolean, horaBoletin?: number (0-23) }

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
      return NextResponse.json(
        { error: "No tenés un comercio registrado" },
        { status: 400 }
      );
    }

    // Buscar o crear preferencias (default: boletinDiario=true, horaBoletin=9)
    let prefs = await db.preferenciaNotificaciones.findUnique({
      where: { comercianteId: usuario.comerciante.id },
    });

    if (!prefs) {
      prefs = await db.preferenciaNotificaciones.create({
        data: { comercianteId: usuario.comerciante.id },
      });
    }

    return NextResponse.json({
      preferencias: {
        boletinDiario: prefs.boletinDiario,
        horaBoletin: prefs.horaBoletin,
        ultimoBoletinEn: prefs.ultimoBoletinEn,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/comerciante/preferencias-notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
      return NextResponse.json(
        { error: "No tenés un comercio registrado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    if (typeof body?.boletinDiario === "boolean") {
      updateData.boletinDiario = body.boletinDiario;
    }

    if (typeof body?.horaBoletin === "number") {
      if (body.horaBoletin < 0 || body.horaBoletin > 23) {
        return NextResponse.json(
          { error: "horaBoletin debe estar entre 0 y 23" },
          { status: 400 }
        );
      }
      updateData.horaBoletin = body.horaBoletin;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 }
      );
    }

    // Upsert (si no existe, crear con los valores enviados)
    const prefs = await db.preferenciaNotificaciones.upsert({
      where: { comercianteId: usuario.comerciante.id },
      update: updateData,
      create: {
        comercianteId: usuario.comerciante.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Preferencias actualizadas",
      preferencias: {
        boletinDiario: prefs.boletinDiario,
        horaBoletin: prefs.horaBoletin,
        ultimoBoletinEn: prefs.ultimoBoletinEn,
      },
    });
  } catch (error) {
    console.error("Error en PATCH /api/comerciante/preferencias-notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

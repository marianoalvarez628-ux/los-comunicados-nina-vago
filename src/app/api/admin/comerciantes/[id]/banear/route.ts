// API: POST /api/admin/comerciantes/[id]/banear
// Body: { accion: "banear_temporal"|"banear_permanente"|"desbanear" }
// Solo ADMIN

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DIAS_BAN_TEMPORAL = 30;

function getUserIdFromCookie(request: Request): string | null {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("session_user_id="))
    ?.split("=")[1] ?? null;
}

export async function POST(
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

    const admin = await db.usuario.findUnique({ where: { id: userId } });
    if (!admin || admin.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Necesitás rol ADMIN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const accion = body?.accion;

    if (!["banear_temporal", "banear_permanente", "desbanear"].includes(accion)) {
      return NextResponse.json(
        { error: "Acción no válida. Usá: banear_temporal, banear_permanente, o desbanear" },
        { status: 400 }
      );
    }

    const comerciante = await db.comerciante.findUnique({ where: { id } });
    if (!comerciante) {
      return NextResponse.json(
        { error: "Comerciante no encontrado" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = "";

    switch (accion) {
      case "banear_temporal":
        updateData = {
          baneado: true,
          banHasta: new Date(Date.now() + DIAS_BAN_TEMPORAL * 24 * 60 * 60 * 1000),
        };
        message = `${comerciante.nombre} baneado por ${DIAS_BAN_TEMPORAL} días.`;
        break;
      case "banear_permanente":
        updateData = {
          baneado: true,
          banHasta: null, // null = permanente
        };
        message = `${comerciante.nombre} baneado permanentemente.`;
        break;
      case "desbanear":
        updateData = {
          baneado: false,
          banHasta: null,
          strikes: 0, // reset strikes al desbanear
        };
        message = `${comerciante.nombre} desbaneado. Strikes reseteados a 0.`;
        break;
    }

    const actualizado = await db.comerciante.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      message,
      comerciante: {
        id: actualizado.id,
        nombre: actualizado.nombre,
        strikes: actualizado.strikes,
        baneado: actualizado.baneado,
        banHasta: actualizado.banHasta,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/admin/comerciantes/[id]/banear:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

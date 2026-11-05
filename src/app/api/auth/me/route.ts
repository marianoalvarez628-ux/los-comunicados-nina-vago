// API: GET /api/auth/me
// Devuelve el usuario actual basado en la cookie de sesión

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("cookie")
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("session_user_id="))
      ?.split("=")[1];

    if (!userId) {
      return NextResponse.json({ usuario: null });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        whatsapp: true,
        nombre: true,
        rol: true,
        comercianteId: true,
        barrio: true,
      },
    });

    if (!usuario) {
      const response = NextResponse.json({ usuario: null });
      response.cookies.delete("session_user_id");
      return response;
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error en /api/auth/me:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

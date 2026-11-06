// API: POST /api/auth/otp/verify
// Body: { whatsapp: "+54911...", codigo: "123456" }
// Verifica el código, crea sesión (cookie HTTP-only) y devuelve el usuario.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_INTENTOS = 3;

// Normaliza el formato del WhatsApp (igual que en /otp/send)
// Si no empieza con +, asume Argentina (+54)
function normalizarWhatsapp(w: string): string {
  let limpio = w.replace(/[\s\-()]/g, "").trim();
  if (!limpio.startsWith("+")) {
    if (limpio.length === 10 && /^\d+$/.test(limpio)) {
      limpio = "+54" + limpio;
    } else if (limpio.length === 11 && /^\d+$/.test(limpio)) {
      limpio = "+54" + limpio;
    } else if (limpio.startsWith("54")) {
      limpio = "+" + limpio;
    }
  }
  return limpio;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const whatsappRaw = body?.whatsapp;
    const codigo = body?.codigo;

    if (!whatsappRaw || !codigo) {
      return NextResponse.json(
        { error: "WhatsApp y código son requeridos" },
        { status: 400 }
      );
    }

    const whatsapp = normalizarWhatsapp(whatsappRaw);

    if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
      return NextResponse.json(
        { error: "El código debe tener 6 dígitos" },
        { status: 400 }
      );
    }

    // Buscar el código OTP más reciente no usado para este WhatsApp
    const otpRecord = await db.otpCode.findFirst({
      where: {
        whatsapp,
        usado: false,
        expiraEn: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No hay código activo. Pedí uno nuevo." },
        { status: 400 }
      );
    }

    // Verificar intentos máximos
    if (otpRecord.intentos >= MAX_INTENTOS) {
      await db.otpCode.update({
        where: { id: otpRecord.id },
        data: { usado: true }, // marcar como usado para bloquear
      });
      return NextResponse.json(
        {
          error:
            "Demasiados intentos fallidos. Pedí un código nuevo.",
        },
        { status: 429 }
      );
    }

    // Verificar código
    if (otpRecord.codigo !== codigo) {
      // Incrementar intentos
      await db.otpCode.update({
        where: { id: otpRecord.id },
        data: { intentos: { increment: 1 } },
      });
      const intentosRestantes = MAX_INTENTOS - (otpRecord.intentos + 1);
      return NextResponse.json(
        {
          error: "Código incorrecto",
          intentosRestantes,
        },
        { status: 400 }
      );
    }

    // Código correcto: marcar como usado
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { usado: true },
    });

    // Buscar o crear usuario
    let usuario = await db.usuario.findUnique({
      where: { whatsapp },
    });

    if (!usuario) {
      // Crear usuario nuevo como VISITANTE
      usuario = await db.usuario.create({
        data: {
          whatsapp,
          rol: "VISITANTE",
        },
      });
    }

    // Crear sesión simple (cookie HTTP-only con el ID del usuario)
    // En producción esto debería ser un JWT firmado o sesión NextAuth
    const response = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        whatsapp: usuario.whatsapp,
        nombre: usuario.nombre,
        rol: usuario.rol,
        comercianteId: usuario.comercianteId,
        barrio: usuario.barrio,
      },
    });

    // Cookie HTTP-only, SameSite=Lax, Max-Age 30 días
    response.cookies.set("session_user_id", usuario.id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en /api/auth/otp/verify:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

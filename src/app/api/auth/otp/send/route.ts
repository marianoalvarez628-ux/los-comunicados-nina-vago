// API: POST /api/auth/otp/send
// Body: { whatsapp: "+54911..." }
// Genera un código OTP de 6 dígitos, lo guarda en DB con expiración de 5 min,
// y lo "envía" por WhatsApp. En desarrollo, devuelve el código en la response.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MODO_DESARROLLO = process.env.NODE_ENV !== "production";

// Genera código OTP de 6 dígitos
function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normaliza el formato del WhatsApp (quita espacios, guiones, etc.)
function normalizarWhatsapp(w: string): string {
  return w.replace(/[\s\-()]/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const whatsappRaw = body?.whatsapp;

    if (!whatsappRaw) {
      return NextResponse.json(
        { error: "WhatsApp requerido" },
        { status: 400 }
      );
    }

    const whatsapp = normalizarWhatsapp(whatsappRaw);

    // Validación mínima: al menos 10 dígitos
    if (whatsapp.length < 10 || !/^\+?\d+$/.test(whatsapp)) {
      return NextResponse.json(
        { error: "Número de WhatsApp inválido. Incluí código de país." },
        { status: 400 }
      );
    }

    // Bloquear si ya hay 3 intentos en los últimos 15 minutos (anti-spam)
    const hace15Min = new Date(Date.now() - 15 * 60 * 1000);
    const codigosRecientes = await db.otpCode.count({
      where: {
        whatsapp,
        createdAt: { gt: hace15Min },
      },
    });

    if (codigosRecientes >= 3) {
      return NextResponse.json(
        {
          error:
            "Demasiados intentos. Esperá 15 minutos antes de pedir otro código.",
        },
        { status: 429 }
      );
    }

    // Buscar usuario existente por WhatsApp
    const usuarioExistente = await db.usuario.findUnique({
      where: { whatsapp },
    });

    // Generar código
    const codigo = generarCodigo();
    const expiraEn = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    // Guardar en DB
    await db.otpCode.create({
      data: {
        whatsapp,
        codigo,
        expiraEn,
        usuarioId: usuarioExistente?.id,
        usado: false,
        intentos: 0,
      },
    });

    // ENVIAR POR WHATSAPP
    // En producción: integrar Twilio o WhatsApp Business API
    // En desarrollo: devolver el código en la response
    if (MODO_DESARROLLO) {
      console.log(`\n🔑 OTP para ${whatsapp}: ${codigo}\n`);
      return NextResponse.json({
        ok: true,
        message: "Código generado (modo desarrollo)",
        // ⚠️ Solo en desarrollo: devolvemos el código para poder probar
        codigoDesarrollo: codigo,
        expiraEn,
      });
    }

    // Producción: acá iría la integración con Twilio
    // await twilioClient.messages.create({
    //   from: "whatsapp:+14155238886",
    //   to: `whatsapp:${whatsapp}`,
    //   body: `Tu código de Clasificados es: ${codigo}`,
    // });

    return NextResponse.json({
      ok: true,
      message: "Código enviado por WhatsApp",
      expiraEn,
    });
  } catch (error) {
    console.error("Error en /api/auth/otp/send:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

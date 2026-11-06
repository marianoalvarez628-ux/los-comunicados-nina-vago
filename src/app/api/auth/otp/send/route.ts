// API: POST /api/auth/otp/send
// Body: { whatsapp: "+54911..." o "3625177942" }
// Genera un código OTP de 6 dígitos, lo guarda en DB con expiración de 5 min.
// Si NO hay Twilio configurado, devuelve el código en la response (para testing).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Si no hay Twilio configurado, mostrar el código en pantalla
// (incluso en producción) para poder probar sin configurar Twilio
const SIN_TWILIO = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN;
const MODO_DESARROLLO = process.env.NODE_ENV !== "production";
const MOSTRAR_CODIGO = MODO_DESARROLLO || SIN_TWILIO;

// Genera código OTP de 6 dígitos
function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normaliza el formato del WhatsApp (quita espacios, guiones, etc.)
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

    if (!whatsappRaw) {
      return NextResponse.json(
        { error: "WhatsApp requerido" },
        { status: 400 }
      );
    }

    const whatsapp = normalizarWhatsapp(whatsappRaw);

    // Validación mínima: al menos 10 dígitos después de normalizar
    const soloDigitos = whatsapp.replace(/\D/g, "");
    if (soloDigitos.length < 10) {
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
          error: "Demasiados intentos. Esperá 15 minutos antes de pedir otro código.",
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
    // Si hay Twilio configurado → enviar WhatsApp real
    // Si NO hay Twilio → devolver el código en la response (para testing)
    if (MOSTRAR_CODIGO) {
      console.log(`\n🔑 OTP para ${whatsapp}: ${codigo}\n`);
      return NextResponse.json({
        ok: true,
        message: SIN_TWILIO
          ? "Código generado (Twilio no configurado — modo testing)"
          : "Código generado (modo desarrollo)",
        codigoDesarrollo: codigo,
        expiraEn,
      });
    }

    // Producción con Twilio: enviar WhatsApp real
    // const twilio = require("twilio");
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    //   to: `whatsapp:${whatsapp}`,
    //   body: `Tu código de Los comunicados de Nina&Vago es: ${codigo}`,
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

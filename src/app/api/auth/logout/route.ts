// API: POST /api/auth/logout
// Borra la cookie de sesión

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session_user_id");
  return response;
}

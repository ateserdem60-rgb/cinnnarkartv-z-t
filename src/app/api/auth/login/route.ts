import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  checkCredentials,
  clearLoginFailures,
  createSessionToken,
  loginBlocked,
  recordLoginFailure,
  sameOrigin,
} from "@/lib/server/auth";
import { fail, json } from "@/lib/server/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("İstek reddedildi.", 403);
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Geçersiz istek.");
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return fail("E-posta ve şifre gerekli.");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${email.toLowerCase()}`;
  if (loginBlocked(key)) return fail("Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.", 429);

  let ok = false;
  try {
    ok = await checkCredentials(email, password);
  } catch (e) {
    console.error(e);
    return fail("Giriş yapılandırması eksik. Sunucu ortam değişkenlerini kontrol edin.", 500);
  }
  if (!ok) {
    recordLoginFailure(key);
    return fail("E-posta veya şifre hatalı.", 401);
  }
  clearLoginFailures(key);
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 3600,
  });
  return json({ ok: true });
}

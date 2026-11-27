import "server-only";
import { createHmac, scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "./store";

/**
 * Kimlik doğrulama
 *  - Supabase kuruluysa: e-posta/şifre Supabase Auth ile doğrulanır; e-posta ADMIN_EMAILS listesinde olmalıdır.
 *  - Değilse: ADMIN_EMAIL + ADMIN_PASSWORD_HASH (scrypt) ile yerel yönetici.
 * Başarılı girişte SESSION_SECRET ile imzalanmış, httpOnly bir oturum çerezi verilir.
 * Her yazma/yükleme isteği requireAdmin() ile sunucuda yeniden doğrulanır.
 */

export const SESSION_COOKIE = "cinar_admin";
const SESSION_HOURS = 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET en az 32 karakter olmalı (.env.example dosyasına bakın).");
  return s;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function adminEmails(): string[] {
  const list = supabaseConfigured() ? process.env.ADMIN_EMAILS : process.env.ADMIN_EMAIL;
  return (list || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function createSessionToken(email: string) {
  const payload = b64(JSON.stringify({ e: email.toLowerCase(), x: Date.now() + SESSION_HOURS * 3600_000, n: b64(randomBytes(9)) }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.e !== "string" || typeof data.x !== "number" || data.x < Date.now()) return null;
    // Yetki listesi değişirse eski oturumlar da geçersiz olur.
    if (!adminEmails().includes(data.e)) return null;
    return { email: data.e };
  } catch {
    return null;
  }
}

export async function getAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export class AuthError extends Error {}

/** Route handler'larda: yönetici değilse AuthError fırlatır. */
export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) throw new AuthError("Bu işlem için yönetici girişi gerekli.");
  return a;
}

/* ─────────────── Şifre doğrulama ─────────────── */

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  // ":" ayırıcı: .env dosyalarında "$" değişken genişletmesine takılır.
  return `scrypt:${b64(salt)}:${b64(hash)}`;
}

function verifyLocalPassword(password: string, stored: string) {
  const [alg, saltB64, hashB64] = stored.split(":");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64url"), expected.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(actual, expected);
}

export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!adminEmails().includes(e)) {
    // Zamanlama farkını azaltmak için yine de bir hash hesapla.
    scryptSync(password, "cinar-dummy-salt", 64);
    return false;
  }
  if (supabaseConfigured()) {
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil.");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anon, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: e, password });
    if (error || !data.user?.email) return false;
    await sb.auth.signOut();
    return data.user.email.toLowerCase() === e;
  }
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  return verifyLocalPassword(password, stored);
}

/* ─────────────── Kaba kuvvet koruması (bellek içi) ─────────────── */

const attempts = new Map<string, { n: number; until: number }>();
export function loginBlocked(key: string) {
  const a = attempts.get(key);
  return !!a && a.n >= 5 && a.until > Date.now();
}
export function recordLoginFailure(key: string) {
  const a = attempts.get(key);
  const n = a && a.until > Date.now() ? a.n + 1 : 1;
  attempts.set(key, { n, until: Date.now() + 15 * 60_000 });
}
export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

/** Durum değiştiren isteklerde aynı-köken kontrolü (CSRF'e karşı ek katman). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // aynı-köken form gönderimlerinde bazı tarayıcılar göndermez; çerez SameSite=Lax
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

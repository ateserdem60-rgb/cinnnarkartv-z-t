import "server-only";
import { NextResponse } from "next/server";
import { AuthError, requireAdmin, sameOrigin } from "./auth";
import { UploadError } from "./media";
import { ReadOnlyError } from "./store";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ ok: false, message, ...extra }, status);

/** Yönetici gerektiren route handler sarmalayıcısı. */
export function adminRoute(handler: (req: Request, admin: { email: string }) => Promise<Response>) {
  return async (req: Request) => {
    try {
      if (req.method !== "GET" && !sameOrigin(req)) return fail("İstek reddedildi (farklı köken).", 403);
      const admin = await requireAdmin();
      return await handler(req, admin);
    } catch (e) {
      if (e instanceof AuthError) return fail(e.message, 401);
      if (e instanceof UploadError) return fail(e.message, 400);
      if (e instanceof ReadOnlyError) return fail(e.message, 409);
      console.error(e);
      return fail("Sunucu hatası oluştu. Lütfen tekrar deneyin.", 500);
    }
  };
}

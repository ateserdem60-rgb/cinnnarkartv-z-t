import { adminRoute, fail, json } from "@/lib/server/api";
import { confirmSignedUpload, createSignedUpload, UPLOAD_RULES, type UploadKind } from "@/lib/server/media";
import { isReadOnly, ReadOnlyError, supabaseConfigured } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/**
 * POST { step: "start", kind, size, type } → { mode: "supabase", path, signedUrl } | { mode: "local" }
 * POST { step: "confirm", kind, path }     → { url }
 */
export const POST = adminRoute(async (req) => {
  let body: { step?: string; kind?: string; size?: number; type?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Geçersiz istek.");
  }
  const kind = String(body.kind || "") as UploadKind;
  if (!(kind in UPLOAD_RULES)) return fail("Geçersiz yükleme türü.");
  if (isReadOnly()) throw new ReadOnlyError();
  if (!supabaseConfigured()) return json({ ok: true, mode: "local" });

  if (body.step === "start") {
    const r = await createSignedUpload(kind, Number(body.size), String(body.type || ""));
    return json({
      ok: true,
      mode: "supabase",
      ...r,
      cacheControl: "31536000",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    });
  }
  if (body.step === "confirm") {
    const { url } = await confirmSignedUpload(kind, String(body.path || ""));
    return json({ ok: true, url });
  }
  return fail("Geçersiz adım.");
});

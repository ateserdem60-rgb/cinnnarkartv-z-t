import { adminRoute, fail, json } from "@/lib/server/api";
import { saveUpload, UPLOAD_RULES, type UploadKind } from "@/lib/server/media";

export const dynamic = "force-dynamic";

export const POST = adminRoute(async (req) => {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 52 * 1024 * 1024) return fail("Dosya çok büyük. En fazla 50 MB yükleyebilirsiniz.", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Dosya okunamadı. Lütfen tekrar deneyin.");
  }
  const kind = String(form.get("kind") || "") as UploadKind;
  if (!(kind in UPLOAD_RULES)) return fail("Geçersiz yükleme türü.");
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Dosya seçilmedi.");
  const { url } = await saveUpload(file, kind);
  return json({ ok: true, url });
});

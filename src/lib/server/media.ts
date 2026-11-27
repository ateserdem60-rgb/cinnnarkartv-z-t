import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDir, isReadOnly, ReadOnlyError, supabaseAdmin, supabaseConfigured } from "./store";

export const UPLOAD_RULES = {
  image: { maxMb: 8, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } },
  pdf: { maxMb: 15, types: { "application/pdf": "pdf" } },
  video: { maxMb: 50, types: { "video/mp4": "mp4" } },
} as const;
export type UploadKind = keyof typeof UPLOAD_RULES;

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
  mp4: "video/mp4",
};

/** Dosyanın gerçek türünü ilk baytlarından tespit eder (uzantıya/bildirilen türe güvenmeyiz). */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (/^(isom|iso2|iso4|iso5|iso6|mp41|mp42|avc1|M4V |dash|MSNV)$/.test(brand)) return "video/mp4";
  }
  return null;
}

export class UploadError extends Error {}

export async function saveUpload(file: File, kind: UploadKind): Promise<{ url: string }> {
  const rule = UPLOAD_RULES[kind];
  if (isReadOnly()) throw new ReadOnlyError();
  if (!file || typeof file.arrayBuffer !== "function") throw new UploadError("Dosya bulunamadı.");
  if (file.size === 0) throw new UploadError("Dosya boş.");
  if (file.size > rule.maxMb * 1024 * 1024) throw new UploadError(`Dosya çok büyük. En fazla ${rule.maxMb} MB yükleyebilirsiniz.`);

  const buf = Buffer.from(await file.arrayBuffer());
  const real = sniff(buf);
  const ext = real ? (rule.types as Record<string, string>)[real] : undefined;
  if (!ext) {
    const allowed = Object.values(rule.types).map((e) => e.toUpperCase()).join(", ");
    throw new UploadError(`Desteklenmeyen dosya türü. İzin verilen: ${allowed}.`);
  }
  const name = `${kind}-${randomUUID()}.${ext}`;

  if (supabaseConfigured()) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
    const sb = supabaseAdmin();
    const { error } = await sb.storage.from(bucket).upload(name, buf, {
      contentType: real!,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new UploadError(`Depolama hatası: ${error.message}`);
    return { url: sb.storage.from(bucket).getPublicUrl(name).data.publicUrl };
  }

  const dir = path.join(dataDir(), "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return { url: `/api/media/${name}` };
}

/* ─────────────── Supabase: tarayıcıdan doğrudan yükleme ───────────────
 * Vercel sunucu fonksiyonları istek gövdesini ~4,5 MB ile sınırlar. Bu yüzden Supabase kipinde
 * dosya tarayıcıdan imzalı bir adrese doğrudan yüklenir:
 *   1) sunucu yöneticiyi doğrular, tür/boyut beyanını kontrol eder ve tek kullanımlık imzalı adres üretir,
 *   2) tarayıcı dosyayı bu adrese yükler (depo da tür/boyut sınırı uygular),
 *   3) sunucu dosyanın ilk baytlarını okuyup gerçek türünü doğrular; uymazsa dosyayı siler.
 */
export async function createSignedUpload(kind: UploadKind, size: number, type: string) {
  const rule = UPLOAD_RULES[kind];
  if (!size || size <= 0) throw new UploadError("Dosya boş.");
  if (size > rule.maxMb * 1024 * 1024) throw new UploadError(`Dosya çok büyük. En fazla ${rule.maxMb} MB yükleyebilirsiniz.`);
  const ext = (rule.types as Record<string, string>)[type];
  if (!ext) {
    const allowed = Object.values(rule.types).map((e) => e.toUpperCase()).join(", ");
    throw new UploadError(`Desteklenmeyen dosya türü. İzin verilen: ${allowed}.`);
  }
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const name = `${kind}-${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUploadUrl(name);
  if (error || !data) throw new UploadError(`Depolama hatası: ${error?.message ?? "imzalı adres alınamadı"}`);
  return { path: name, signedUrl: data.signedUrl };
}

export async function confirmSignedUpload(kind: UploadKind, name: string) {
  if (!new RegExp(`^${kind}-[0-9a-f-]{36}\\.(jpg|png|webp|avif|pdf|mp4)$`).test(name)) throw new UploadError("Geçersiz dosya adı.");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const sb = supabaseAdmin();
  const url = sb.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  const res = await fetch(url, { headers: { Range: "bytes=0-31" }, cache: "no-store" });
  const head = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
  const real = sniff(head);
  const expectedExt = name.split(".").pop();
  const ok = real && (UPLOAD_RULES[kind].types as Record<string, string>)[real] === expectedExt;
  if (!ok) {
    await sb.storage.from(bucket).remove([name]);
    throw new UploadError("Dosyanın içeriği türüyle uyuşmuyor; yükleme reddedildi.");
  }
  return { url };
}

export function localUploadPath(name: string) {
  if (!/^(image|pdf|video)-[0-9a-f-]{36}\.(jpg|png|webp|avif|pdf|mp4)$/.test(name)) return null;
  return path.join(dataDir(), "uploads", name);
}

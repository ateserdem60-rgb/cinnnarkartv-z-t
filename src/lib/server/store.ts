import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createDefaultContent, normalizeContent, type SiteContent } from "../content";

/**
 * Kalıcı veri katmanı.
 *  - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY tanımlıysa: Supabase Postgres (site_content tablosu)
 *  - Değilse: yerel dosya (DATA_DIR/content.json) — geliştirme ve tek sunuculu kurulumlar için.
 */

export type Slot = "draft" | "published";
export interface StoredState {
  content: SiteContent;
  updatedAt: string | null;
}

export function supabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Dosyaya gömülü kip: Vercel gibi diski kalıcı olmayan bir ortamda Supabase tanımlı değilse
 * site içeriği doğrudan koddan (src/lib/content.ts) gelir; panelden kaydetme/yükleme kapalıdır.
 */
export function isReadOnly() {
  return !supabaseConfigured() && !!process.env.VERCEL;
}
export class ReadOnlyError extends Error {
  constructor() {
    super(
      "Bu kurulumda içerik site dosyalarına gömülüdür; panelden kaydetme kapalıdır. Değişiklik için içerik dosyası (src/lib/content.ts) güncellenip GitHub'a yeniden yüklenmelidir.",
    );
  }
}

let admin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export const dataDir = () =>
  path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));
const fileOf = (slot: Slot) => path.join(dataDir(), `content.${slot}.json`);

async function readLocal(slot: Slot): Promise<StoredState | null> {
  if (isReadOnly()) return null; // içerik koddan gelir
  try {
    const raw = JSON.parse(await fs.readFile(fileOf(slot), "utf8"));
    return { content: normalizeContent(raw.content), updatedAt: raw.updatedAt ?? null };
  } catch {
    return null;
  }
}

async function writeLocal(slot: Slot, content: SiteContent) {
  await fs.mkdir(dataDir(), { recursive: true });
  const updatedAt = new Date().toISOString();
  const tmp = `${fileOf(slot)}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ content, updatedAt }, null, 2), "utf8");
  await fs.rename(tmp, fileOf(slot)); // atomik değiştirme
  return updatedAt;
}

export async function readSlot(slot: Slot): Promise<StoredState | null> {
  if (!supabaseConfigured()) return readLocal(slot);
  const { data, error } = await supabaseAdmin()
    .from("site_content")
    .select("content, updated_at")
    .eq("id", slot)
    .maybeSingle();
  if (error) throw new Error(`Supabase okuma hatası: ${error.message}`);
  if (!data) return null;
  return { content: normalizeContent(data.content), updatedAt: data.updated_at };
}

export async function writeSlot(slot: Slot, content: SiteContent): Promise<string> {
  if (isReadOnly()) throw new ReadOnlyError();
  if (!supabaseConfigured()) return writeLocal(slot, content);
  const updatedAt = new Date().toISOString();
  const { error } = await supabaseAdmin()
    .from("site_content")
    .upsert({ id: slot, content, updated_at: updatedAt });
  if (error) throw new Error(`Supabase yazma hatası: ${error.message}`);
  return updatedAt;
}

/** Ziyaretçilerin gördüğü içerik: son yayımlanan sürüm (yoksa başlangıç içeriği). */
export async function getPublished(): Promise<SiteContent> {
  return (await readSlot("published"))?.content ?? createDefaultContent();
}

/** Panelde düzenlenen taslak (yoksa yayımlanan sürümden başlar). */
export async function getDraft(): Promise<StoredState> {
  const d = await readSlot("draft");
  if (d) return d;
  const p = await readSlot("published");
  return { content: p?.content ?? createDefaultContent(), updatedAt: null };
}

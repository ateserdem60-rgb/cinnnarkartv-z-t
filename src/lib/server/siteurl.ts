import "server-only";
import type { SiteContent } from "../content";

/**
 * QR'a yazılacak tek ve kalıcı adres.
 * Öncelik: paneldeki "Üretim adresi" → NEXT_PUBLIC_SITE_URL → isteğin geldiği adres (yalnızca taslak).
 * Adres https değilse veya localhost/önizleme alan adıysa çıktı "Taslak" sayılır.
 */
export function resolveSiteUrl(content: SiteContent, req: Request) {
  const configured = content.card.siteUrl.trim() || (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const fallback = new URL(req.url).origin;
  const raw = configured || fallback;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    url = new URL(fallback);
  }
  // Kalıcı kök adres: yol/sorgu eklenmez ki menü, tema vb. değiştiğinde QR aynı kalsın.
  const final = `${url.protocol}//${url.host}/`;
  const isLocal = /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(url.hostname) || url.hostname.endsWith(".local");
  const isDraft = !configured || url.protocol !== "https:" || isLocal;
  return { url: final, isDraft };
}

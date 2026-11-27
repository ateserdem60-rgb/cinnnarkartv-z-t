/* Bağlantı doğrulamaları: yalnızca https ve bilinen sağlayıcılar. */

function parse(u: string): URL | null {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

const hostIs = (host: string, list: string[]) =>
  list.some((d) => host === d || host.endsWith(`.${d}`));

export function isAllowedMapUrl(u: string, provider: "google" | "apple") {
  const url = parse(u);
  if (!url || url.protocol !== "https:") return false;
  const h = url.hostname.toLowerCase();
  if (provider === "apple") return h === "maps.apple.com" || h === "maps.apple";
  // google.com, google.com.tr, maps.app.goo.gl, goo.gl/maps, share.google, g.co/kgs
  if (h === "maps.app.goo.gl" || h === "goo.gl" || h === "share.google" || h === "g.co") return true;
  return /^(www\.|maps\.)?google\.(com|com\.tr)$/.test(h) && (h.startsWith("maps.") || url.pathname.startsWith("/maps") || url.pathname === "/search");
}

export function isAllowedVideoUrl(u: string, provider: "youtube" | "vimeo") {
  const url = parse(u);
  if (!url || url.protocol !== "https:") return false;
  const h = url.hostname.toLowerCase();
  if (provider === "youtube") return hostIs(h, ["youtube.com", "youtu.be", "youtube-nocookie.com"]) && !!youtubeId(u);
  return hostIs(h, ["vimeo.com"]) && !!vimeoId(u);
}

export function youtubeId(u: string): string | null {
  const url = parse(u);
  if (!url) return null;
  const h = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (h === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else {
    const m = url.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
    if (m) id = m[2];
  }
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

export function vimeoId(u: string): string | null {
  const url = parse(u);
  if (!url) return null;
  const m = url.pathname.match(/\/(?:video\/)?(\d{5,12})(?:\/|$)/);
  return m ? m[1] : null;
}

export function videoEmbedUrl(source: "youtube" | "vimeo", u: string) {
  if (source === "youtube") {
    const id = youtubeId(u);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1` : null;
  }
  const id = vimeoId(u);
  return id ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` : null;
}

export function youtubeThumb(u: string) {
  const id = youtubeId(u);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

/**
 * Yönetici tarafından yüklenen dosyaların adresi: yerel depolama (/api/media/…),
 * örnek dosyalar (/samples/…) veya yapılandırılmış Supabase Storage genel adresi.
 */
export function isSafeMediaUrl(u: string) {
  if (/^\/(api\/media|samples|themes|mekan)\/[A-Za-z0-9._-]+$/.test(u)) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const url = parse(u);
  const b = parse(base);
  return !!url && !!b && url.protocol === "https:" && url.host === b.host && url.pathname.startsWith("/storage/v1/object/public/");
}

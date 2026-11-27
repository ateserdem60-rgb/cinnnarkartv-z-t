import { promises as fs } from "node:fs";
import { localUploadPath, MIME_BY_EXT } from "@/lib/server/media";

/** Yerel depolama kipinde yüklenen dosyaları sunar (Supabase kipinde kullanılmaz). Video için Range desteği vardır. */
export async function GET(req: Request, ctx: RouteContext<"/api/media/[name]">) {
  const { name } = await ctx.params;
  const p = localUploadPath(name);
  if (!p) return new Response("Bulunamadı", { status: 404 });
  let stat;
  try {
    stat = await fs.stat(p);
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
  const type = MIME_BY_EXT[name.split(".").pop()!] || "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };
  if (type === "application/pdf") headers["Content-Disposition"] = `inline; filename="menu.pdf"`;

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : stat.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1, start + 4 * 1024 * 1024 - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    const fh = await fs.open(p, "r");
    const buf = Buffer.alloc(end - start + 1);
    await fh.read(buf, 0, buf.length, start);
    await fh.close();
    return new Response(buf, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(buf.length) },
    });
  }
  const data = await fs.readFile(p);
  return new Response(data, { headers: { ...headers, "Content-Length": String(stat.size) } });
}

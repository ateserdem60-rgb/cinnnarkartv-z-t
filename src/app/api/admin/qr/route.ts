import QRCode from "qrcode";
import { adminRoute } from "@/lib/server/api";
import { getDraft } from "@/lib/server/store";
import { resolveSiteUrl } from "@/lib/server/siteurl";

export const dynamic = "force-dynamic";

/** QR çıktısı: ?format=svg | png (yüksek çözünürlük) | json (bilgi). */
export const GET = adminRoute(async (req) => {
  const { content } = await getDraft();
  const { url, isDraft } = resolveSiteUrl(content, req);
  const format = new URL(req.url).searchParams.get("format") || "svg";
  const suffix = isDraft ? "-TASLAK" : "";
  const opts = { errorCorrectionLevel: "M" as const, margin: 4, color: { dark: "#0F1F16", light: "#FFFFFF" } };

  if (format === "json") {
    return Response.json({ ok: true, url, isDraft }, { headers: { "Cache-Control": "no-store" } });
  }
  if (format === "png") {
    const buf = await QRCode.toBuffer(url, { ...opts, type: "png", width: 2400 });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="cinar-qr${suffix}.png"`,
        "Cache-Control": "no-store",
      },
    });
  }
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  const download = new URL(req.url).searchParams.get("download") === "1";
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": `attachment; filename="cinar-qr${suffix}.svg"` } : {}),
    },
  });
});

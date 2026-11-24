import { adminRoute, fail } from "@/lib/server/api";
import { getDraft } from "@/lib/server/store";
import { resolveSiteUrl } from "@/lib/server/siteurl";
import { buildBack, buildFront, faceToSvg, facesToPdf } from "@/lib/server/card";

export const dynamic = "force-dynamic";

/**
 * Kartvizit çıktısı
 *  ?format=pdf               → 2 sayfalı baskı PDF'i (ön + arka, taşma paylı, TrimBox/BleedBox tanımlı)
 *  ?format=svg&face=front|back[&guides=1] → dijital önizleme
 */
export const GET = adminRoute(async (req) => {
  const sp = new URL(req.url).searchParams;
  const { content } = await getDraft();
  const { url, isDraft } = resolveSiteUrl(content, req);
  const input = { content, url, isDraft };

  if (sp.get("format") === "pdf") {
    const bytes = await facesToPdf([buildFront(input), buildBack(input)], { title: `${content.general.brandName} kartvizit`, isDraft });
    const name = `cinar-kartvizit-${content.card.widthMm}x${content.card.heightMm}mm-tasma${content.card.bleedMm}mm${isDraft ? "-TASLAK" : ""}.pdf`;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${sp.get("download") === "1" ? "attachment" : "inline"}; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  const face = sp.get("face");
  if (face !== "front" && face !== "back") return fail("face=front veya face=back olmalı.");
  const built = face === "front" ? buildFront(input) : buildBack(input);
  return new Response(faceToSvg(built, { showGuides: sp.get("guides") === "1" }), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
});

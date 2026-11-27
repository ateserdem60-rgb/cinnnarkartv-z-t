import { adminRoute, fail, json } from "@/lib/server/api";
import { getDraft, writeSlot } from "@/lib/server/store";
import { contentSchema, formatIssues } from "@/lib/content";

export const dynamic = "force-dynamic";

/** Kaydedilmiş taslağı doğrular ve ziyaretçilere açık sürüm olarak yayımlar. */
export const POST = adminRoute(async () => {
  const draft = await getDraft();
  const parsed = contentSchema.safeParse(draft.content);
  if (!parsed.success) {
    return fail("Taslakta hatalı alanlar var; yayımlanmadı.", 422, { issues: formatIssues(parsed.error) });
  }
  const publishedAt = await writeSlot("published", parsed.data);
  return json({ ok: true, publishedAt });
});

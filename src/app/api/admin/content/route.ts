import { adminRoute, fail, json } from "@/lib/server/api";
import { getDraft, readSlot, writeSlot } from "@/lib/server/store";
import { contentSchema, formatIssues } from "@/lib/content";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => {
  const draft = await getDraft();
  const published = await readSlot("published");
  return json({
    ok: true,
    content: draft.content,
    draftUpdatedAt: draft.updatedAt,
    publishedAt: published?.updatedAt ?? null,
  });
});

export const PUT = adminRoute(async (req) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Geçersiz istek gövdesi.");
  }
  const parsed = contentSchema.safeParse((body as { content?: unknown })?.content);
  if (!parsed.success) {
    return fail("Bazı alanlar hatalı. Lütfen işaretli alanları düzeltin.", 422, { issues: formatIssues(parsed.error) });
  }
  const updatedAt = await writeSlot("draft", parsed.data);
  return json({ ok: true, draftUpdatedAt: updatedAt });
});

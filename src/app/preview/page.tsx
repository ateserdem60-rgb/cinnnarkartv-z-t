import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteView } from "@/components/site/SiteView";
import { getAdmin } from "@/lib/server/auth";
import { getDraft } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Önizleme", robots: { index: false, follow: false } };

/** Kaydedilmiş taslağın önizlemesi — yalnızca yöneticiler. */
export default async function PreviewPage() {
  if (!(await getAdmin())) redirect("/admin/login");
  const { content } = await getDraft();
  return <SiteView content={content} preview />;
}

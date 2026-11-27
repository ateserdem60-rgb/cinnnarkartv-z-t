import type { Metadata } from "next";
import { SiteView } from "@/components/site/SiteView";
import { getPublished } from "@/lib/server/store";

// Ziyaretçi her zaman son yayımlanan içeriği görür (QR adresi sabit kalır).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getPublished();
  return {
    title: c.general.brandName,
    description: `${c.general.brandName} — menü, yol tarifi ve iletişim.`,
    openGraph: { title: c.general.brandName, locale: "tr_TR", type: "website" },
  };
}

export default async function Home() {
  const content = await getPublished();
  return <SiteView content={content} />;
}

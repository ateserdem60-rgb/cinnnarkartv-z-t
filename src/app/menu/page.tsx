import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site/SiteView";
import { MenuSection } from "@/components/site/MenuSection";
import { getPublished } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getPublished();
  return { title: `Menü — ${c.general.brandName}` };
}

export default async function MenuPage() {
  const content = await getPublished();
  return (
    <SiteShell content={content}>
      <main id="icerik" className="mx-auto w-full max-w-3xl px-4 pt-5 pb-16">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="btn btn-ghost acrylic">← Ana sayfa</Link>
          <p className="heading truncate text-xl font-semibold">{content.general.brandName}</p>
        </div>
        <MenuSection content={content} headingLevel={1} />
      </main>
    </SiteShell>
  );
}

import { formatTRY, type SiteContent } from "@/lib/content";
import { ExternalIcon, PdfIcon } from "./icons";

export function visibleMenu(c: SiteContent) {
  return c.menu.categories
    .filter((cat) => !cat.hidden)
    .map((cat) => ({ ...cat, items: cat.items.filter((i) => !i.hidden) }))
    .filter((cat) => cat.items.length > 0);
}

export function MenuSection({ content, headingLevel = 2 }: { content: SiteContent; headingLevel?: 1 | 2 }) {
  const cats = visibleMenu(content);
  const H = headingLevel === 1 ? "h1" : "h2";
  const { pdfUrl, externalUrl } = content.menu;
  return (
    <section id="menu" aria-labelledby="menu-baslik" className="scroll-mt-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
        <H id="menu-baslik" className="heading text-4xl font-semibold">Menü</H>
        {(pdfUrl || externalUrl) && (
          <div className="flex flex-wrap gap-2">
            {pdfUrl && (
              <a className="btn btn-ghost" href={pdfUrl} target="_blank" rel="noopener">
                <PdfIcon /> PDF Menüyü Aç
              </a>
            )}
            {externalUrl && (
              <a className="btn btn-ghost" href={externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalIcon /> Dijital Menü
              </a>
            )}
          </div>
        )}
      </div>

      {cats.length === 0 ? (
        <p className="acrylic rounded-2xl p-5">Menü yakında burada olacak.</p>
      ) : (
        <>
          <nav aria-label="Menü kategorileri" className="sticky top-0 z-20 -mx-4 mb-4 px-4 py-2">
            <div className="acrylic no-scrollbar flex gap-2 overflow-x-auto rounded-2xl p-2">
              {cats.map((cat) => (
                <a
                  key={cat.id}
                  href={`#kat-${cat.id}`}
                  className="shrink-0 rounded-xl px-4 py-2.5 text-[1.1rem] font-semibold whitespace-nowrap hover:bg-[rgb(var(--surface-rgb)/0.9)]"
                  style={{ minHeight: 44 }}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-4">
            {cats.map((cat) => (
              <section key={cat.id} id={`kat-${cat.id}`} aria-labelledby={`kat-${cat.id}-b`} className="acrylic scroll-mt-24 rounded-3xl p-4 sm:p-6">
                <h3 id={`kat-${cat.id}-b`} className="heading mb-2 flex items-center gap-3 text-[1.95rem] font-semibold">
                  {cat.name}
                  <span aria-hidden className="h-px flex-1 bg-[var(--gold)] opacity-50" />
                </h3>
                <ul className="divide-y divide-[var(--edge-dark)]">
                  {cat.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[1.2rem] font-semibold">
                          {item.name}
                          {item.note && <span className="ml-1.5 text-base font-normal text-[var(--muted)]">/ {item.note}</span>}
                        </p>
                        {item.description && <p className="mt-0.5 text-[1.05rem] text-[var(--muted)]">{item.description}</p>}
                      </div>
                      {item.price !== null && (
                        <p className="shrink-0 text-[1.2rem] font-semibold tabular-nums">{formatTRY(item.price)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

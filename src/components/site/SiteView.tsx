import Image from "next/image";
import Link from "next/link";
import { telHref, type SiteContent } from "@/lib/content";
import { videoEmbedUrl, youtubeThumb } from "@/lib/urls";
import { themeVars } from "./theme";
import { MenuSection } from "./MenuSection";
import { CopyButton, HeroActions, HeroSlideshow, VideoFacade } from "./client";
import { LeafIcon, MenuIcon, PhoneIcon, RouteIcon } from "./icons";

export function SiteShell({ content, children, preview = false }: { content: SiteContent; children: React.ReactNode; preview?: boolean }) {
  return (
    <div className="site" data-mode={content.appearance.mode} style={themeVars(content)}>
      <div className="site-bg" data-kind={content.appearance.background.kind} aria-hidden />
      <a href="#icerik" className="skip-link">İçeriğe geç</a>
      {preview && (
        <div role="status" className="relative z-50 bg-[#b8893b] px-4 py-2 text-center text-sm font-semibold text-[#1b1408]">
          Önizleme — bu taslak henüz yayımlanmadı
        </div>
      )}
      {children}
    </div>
  );
}

export function SiteView({ content, preview = false }: { content: SiteContent; preview?: boolean }) {
  const { general, contact } = content;
  const tel = telHref(contact.phone);
  const { googleMapsUrl: google, appleMapsUrl: apple } = contact;
  const videos = content.videos.filter((v) => !v.hidden);
  const hero = general.heroImage;

  return (
    <SiteShell content={content} preview={preview}>
      <header className="relative mx-auto w-full max-w-6xl sm:px-4 sm:pt-4">
        {/* Ana görsel: kafenin dış cephe fotoğrafı */}
        <div className="relative h-[58svh] min-h-[340px] max-h-[640px] w-full overflow-hidden sm:rounded-[28px]">
          {general.heroMode === "slideshow" && general.heroSlides.length > 0 ? (
            <HeroSlideshow slides={general.heroSlides} seconds={general.slideSeconds} />
          ) : hero.url ? (
            <Image
              src={hero.url}
              alt={hero.alt}
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              quality={75}
              className="object-cover"
              style={{ objectPosition: `${hero.focusX}% ${hero.focusY}%` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#3c5a3f] to-[#13241b]" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
          {hero.isSample && !(general.heroMode === "slideshow" && general.heroSlides.length > 0) && (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              Örnek görsel
            </span>
          )}
        </div>

        {/* Marka + üç ana işlem (görselin hemen altında, başparmak erişiminde) */}
        <div className="relative z-10 mx-3 -mt-24 sm:mx-auto sm:-mt-28 sm:max-w-2xl">
          <div className="acrylic acrylic-strong rounded-[26px] p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-[var(--gold)]">
              <LeafIcon width={22} height={22} />
              <span className="h-px flex-1 bg-current opacity-40" />
            </div>
            <h1 className="heading text-[2.35rem] leading-[1.05] font-semibold text-balance sm:text-5xl">{general.brandName}</h1>
            <HeroActions google={google} apple={apple} tel={tel} />
          </div>
        </div>
      </header>

      <main id="icerik" className="mx-auto w-full max-w-3xl px-4 pt-8 pb-32 sm:pb-16">
        <MenuSection content={content} />

        {videos.length > 0 && (
          <section aria-labelledby="video-baslik" className="mt-10">
            <h2 id="video-baslik" className="heading mb-4 px-1 text-4xl font-semibold">Tanıtım</h2>
            <div className="space-y-5">
              {videos.map((v) => {
                const src = v.source === "upload" ? v.url : videoEmbedUrl(v.source, v.url);
                if (!src) return null;
                const poster = v.posterUrl || (v.source === "youtube" ? youtubeThumb(v.url) : "");
                return (
                  <figure key={v.id} className="acrylic rounded-3xl p-3">
                    <VideoFacade title={v.title} poster={poster} kind={v.source === "upload" ? "upload" : "embed"} src={src} />
                    <figcaption className="px-2 pt-3 pb-1 font-semibold">{v.title}</figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        <section id="konum" aria-labelledby="konum-baslik" className="mt-10 scroll-mt-4">
          <h2 id="konum-baslik" className="heading mb-4 px-1 text-4xl font-semibold">Konum ve İletişim</h2>
          <div className="acrylic space-y-5 rounded-3xl p-5 sm:p-6">
            {contact.address && (
              <div>
                <p className="text-sm font-semibold tracking-wide text-[var(--muted)] uppercase">Adres</p>
                <address className="mt-1 not-italic select-all">{contact.address}</address>
                <div className="mt-3">
                  <CopyButton text={contact.address} />
                </div>
              </div>
            )}
            {tel && (
              <div>
                <p className="text-sm font-semibold tracking-wide text-[var(--muted)] uppercase">Telefon</p>
                <a href={tel} className="mt-1 inline-flex min-h-11 items-center text-xl font-semibold underline decoration-[var(--gold)] underline-offset-4">
                  {contact.phone}
                </a>
              </div>
            )}
            {(google || apple) && (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {google && (
                  <a className="btn btn-primary" href={google} target="_blank" rel="noopener noreferrer">
                    <RouteIcon /> Google Maps’te Yol Tarifi
                  </a>
                )}
                {apple && (
                  <a className="btn btn-ghost" href={apple} target="_blank" rel="noopener noreferrer">
                    <RouteIcon /> Apple Haritalar’da Yol Tarifi
                  </a>
                )}
              </div>
            )}
            {preview && contact.mapsAreDemo && (
              <p className="rounded-xl bg-[#b8893b]/20 p-3 text-sm">Harita bağlantıları örnek (demo) olarak işaretli. Panelden gerçek bağlantıları girin.</p>
            )}
          </div>
        </section>

        <footer className="mt-12 px-1 text-center text-sm text-[var(--muted)]">
          <p>
            © {new Date().getFullYear()} {general.brandName}
          </p>
          <p className="mt-1">
            <Link href="/menu" className="underline underline-offset-4">Yalnızca menüyü göster</Link>
          </p>
        </footer>
      </main>

      {/* Telefonda tek elle erişim için alt işlem çubuğu */}
      <nav aria-label="Hızlı işlemler" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="acrylic acrylic-strong grid grid-cols-3 gap-1.5 rounded-2xl p-1.5">
          <a href="#menu" className="btn btn-primary min-h-[52px] flex-col gap-0.5 px-1 text-[0.8rem]">
            <MenuIcon width={20} height={20} /> Menü
          </a>
          {google || apple ? (
            <a href="#konum" className="btn btn-ghost min-h-[52px] flex-col gap-0.5 px-1 text-[0.8rem]">
              <RouteIcon width={20} height={20} /> Yol Tarifi
            </a>
          ) : (
            <span />
          )}
          {tel ? (
            <a href={tel} className="btn btn-ghost min-h-[52px] flex-col gap-0.5 px-1 text-[0.8rem]">
              <PhoneIcon width={20} height={20} /> Ara
            </a>
          ) : (
            <span />
          )}
        </div>
      </nav>
    </SiteShell>
  );
}

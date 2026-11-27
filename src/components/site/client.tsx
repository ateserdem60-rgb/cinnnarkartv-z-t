"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Kapak slaytı: yemek görselleri yumuşak geçiş ve yavaş yakınlaşmayla (tanıtım filmi etkisi) sırayla geçer.
 * - Yalnızca ilk görsel öncelikli yüklenir; diğerleri tembel yüklenir.
 * - Duraklat/oynat düğmesi vardır (WCAG 2.2.2); "hareketi azalt" tercihinde yakınlaşma kapanır ve slayt otomatik ilerlemez.
 * - Sekme arka plandayken ilerlemez.
 */
export function HeroSlideshow({
  slides,
  seconds,
}: {
  slides: { id: string; url: string; caption: string; alt: string; focusY?: number }[];
  seconds: number;
}) {
  // i: görünen kare, prev: kararan kare (yakınlaşması sıfırlanıp zıplamasın), mounted: DOM'a eklenen kare sayısı
  // (görseller sırası geldikçe yüklenir; her zaman bir sonraki kare önceden hazırdır).
  const [pos, setPos] = useState({ i: 0, prev: -1, mounted: Math.min(2, slides.length) });
  const index = pos.i;
  const advance = () =>
    setPos((p) => ({ i: (p.i + 1) % slides.length, prev: p.i, mounted: Math.min(slides.length, Math.max(p.mounted, p.i + 3)) }));
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const fadeMs = seconds <= 3 ? 700 : 1400;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const running = !paused && !reduced && slides.length > 1;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") advance();
    }, seconds * 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seconds, slides.length]);

  const current = slides[index] ?? slides[0];
  return (
    <div className="absolute inset-0" role="region" aria-roledescription="slayt gösterisi" aria-label="Lezzetlerimiz">
      {slides.map((s, i) =>
        i < pos.mounted ? (
          <div
            key={s.id}
            aria-hidden={i !== index}
            className="absolute inset-0 ease-in-out"
            style={{ opacity: i === index ? 1 : 0, transition: `opacity ${fadeMs}ms ease-in-out`, zIndex: i === index ? 2 : i === pos.prev ? 1 : 0 }}
          >
            <Image
              src={s.url}
              alt={s.alt || s.caption}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "low"}
              sizes="(max-width: 1152px) 100vw, 1152px"
              quality={75}
              className={`object-cover ${(i === index || i === pos.prev) && !reduced ? "kenburns" : ""}`}
              style={{
                objectPosition: `50% ${s.focusY ?? 50}%`,
                animationDuration: `${seconds + 1.5}s`,
                transformOrigin: i % 2 ? "35% 45%" : "65% 55%",
              }}
            />
          </div>
        ) : null,
      )}

      {current?.caption && (
        <p key={current.id} className="slide-caption absolute left-4 top-4 z-10 max-w-[70%] rounded-full bg-black/55 px-4 py-1.5 text-sm font-semibold tracking-wide text-white backdrop-blur-sm sm:left-6 sm:top-6 sm:text-base" aria-live={running ? "off" : "polite"}>
          {current.caption}
        </p>
      )}

      {slides.length > 1 && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-5 sm:top-5">
          <div className="hidden items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-2 sm:flex" aria-hidden>
            {slides.map((s, i) => (
              <span key={s.id} className={`h-1.5 rounded-full bg-white transition-all ${i === index ? "w-5 opacity-100" : "w-1.5 opacity-50"}`} />
            ))}
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
              aria-label={paused ? "Slaytı oynat" : "Slaytı duraklat"}
            >
              {paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              )}
            </button>
          )}
          {reduced && (
            <button
              type="button"
              onClick={advance}
              className="flex h-11 items-center justify-center rounded-full bg-black/55 px-4 text-sm font-semibold text-white"
            >
              Sonraki
            </button>
          )}
        </div>
      )}
    </div>
  );
}
import { CopyIcon, MenuIcon, PhoneIcon, PlayIcon, RouteIcon } from "./icons";

/**
 * Görselin altındaki üç ana işlem. "Yol Tarifi Al", görseli kapatan bir pencere yerine
 * düğmelerin hemen altında Google Maps / Apple Haritalar seçeneklerini açar.
 */
export function HeroActions({ google, apple, tel }: { google: string; apple: string; tel: string }) {
  const [open, setOpen] = useState(false);
  const hasRoute = !!(google || apple);
  const both = !!(google && apple);
  const half = hasRoute && tel; // ikisi de varsa yan yana
  const cls = `btn btn-ghost ${half ? "" : "col-span-2 sm:col-span-1"}`;
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <a href="#menu" className="btn btn-primary col-span-2 sm:col-span-1">
          <MenuIcon /> Menüyü Gör
        </a>
        {hasRoute &&
          (both ? (
            <button type="button" className={cls} aria-expanded={open} aria-controls="yol-secenekleri" onClick={() => setOpen((v) => !v)}>
              <RouteIcon /> Yol Tarifi Al
            </button>
          ) : (
            <a className={cls} href={google || apple} target="_blank" rel="noopener noreferrer">
              <RouteIcon /> Yol Tarifi Al
            </a>
          ))}
        {tel && (
          <a href={tel} className={cls}>
            <PhoneIcon /> Şimdi Ara
          </a>
        )}
      </div>
      {both && (
        <div id="yol-secenekleri" hidden={!open} className="mt-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <a className="btn btn-ghost" href={google} target="_blank" rel="noopener noreferrer">Google Maps</a>
            <a className="btn btn-ghost" href={apple} target="_blank" rel="noopener noreferrer">Apple Haritalar</a>
          </div>
        </div>
      )}
    </>
  );
}

export function CopyButton({ text, label = "Adresi Kopyala" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setState("ok");
    } catch {
      setState("err");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <button type="button" onClick={copy} className="btn btn-ghost">
      <CopyIcon /> <span aria-live="polite">{state === "ok" ? "Kopyalandı" : state === "err" ? "Kopyalanamadı" : label}</span>
    </button>
  );
}

/** Video yalnızca ziyaretçi oynat'a bastığında yüklenir; sesli otomatik oynatma yoktur. */
export function VideoFacade({
  title,
  poster,
  kind,
  src,
}: {
  title: string;
  poster: string;
  kind: "upload" | "embed";
  src: string;
}) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/80">
      {play ? (
        kind === "upload" ? (
          <video className="h-full w-full" src={src} controls autoPlay playsInline preload="metadata" poster={poster || undefined}>
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        ) : (
          <iframe
            className="h-full w-full"
            src={src}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full text-left" aria-label={`Videoyu oynat: ${title}`}>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2b4a35] to-[#13241b]" />
          )}
          <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1e3a2a] shadow-lg">
            <PlayIcon width={30} height={30} />
          </span>
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
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

"use client";

import { useEffect, useState } from "react";
import {
  HEADING_FONTS,
  PRESETS,
  TREES,
  TREE_LABELS,
  VENUE_HERO,
  VERIFIED_MAPS,
  SEED_SLIDES,
  contrastRatio,
  seedMenuCategories,
  formatTRY,
  onColor,
  type HeadingFont,
  type MenuCategory,
  type PresetKey,
  type SiteContent,
  type Video,
} from "@/lib/content";
import { Card, Field, Range, TextInput, Toggle, UploadButton, move, uid, useIssue } from "./ui";

export type Setter = (fn: (c: SiteContent) => SiteContent) => void;
type TabProps = { c: SiteContent; set: Setter };

const pct = (v: number) => `%${Math.round(v * 100)}`;

/* ═════════════════════ Genel ═════════════════════ */
export function GeneralTab({ c, set }: TabProps) {
  const g = c.general;
  const hero = g.heroImage;
  const setHero = (patch: Partial<typeof hero>) => set((x) => ({ ...x, general: { ...x.general, heroImage: { ...x.general.heroImage, ...patch } } }));
  return (
    <div className="space-y-5">
      <Card title="Marka">
        <TextInput label="Marka adı" path="general.brandName" value={g.brandName} onChange={(v) => set((x) => ({ ...x, general: { ...x.general, brandName: v } }))} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Başlık fontu</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(HEADING_FONTS) as HeadingFont[]).map((f) => (
              <label key={f} className={`flex cursor-pointer flex-col rounded-xl border p-3 ${g.headingFont === f ? "border-[#1e3a2a] bg-[#eef2ea] ring-2 ring-[#1e3a2a]" : "border-[#e2dccd] bg-white"}`}>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input type="radio" name="font" className="accent-[#1e3a2a]" checked={g.headingFont === f} onChange={() => set((x) => ({ ...x, general: { ...x.general, headingFont: f } }))} />
                  {HEADING_FONTS[f].label}
                </span>
                <span className="mt-1 truncate text-2xl" style={{ fontFamily: HEADING_FONTS[f].cssVar }}>
                  {g.brandName || "Çınar Cafe & Restaurant"}
                </span>
                <span className="text-sm text-[#55604f]" style={{ fontFamily: HEADING_FONTS[f].cssVar }}>ÇĞİÖŞÜ çğıöşü — Işıklar, Midyat</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <SlidesCard c={c} set={set} />

      <Card title="Dış cephe fotoğrafı" desc="Slayt kapalıysa ya da hiç slayt yoksa sayfanın en üstünde ana görsel olarak gösterilir. Temanın duvar kâğıdından ayrı yönetilir.">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div>
            <FocusPicker url={hero.url} x={hero.focusX} y={hero.focusY} onChange={(fx, fy) => setHero({ focusX: fx, focusY: fy })} />
            {hero.isSample && <p className="mt-2 rounded-lg bg-[#fbe9c8] p-2 text-sm">Şu an <b>örnek görsel</b> kullanılıyor. Gerçek dış cephe fotoğrafını yükleyin.</p>}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <UploadButton kind="image" label="Fotoğraf yükle" onUploaded={(url) => setHero({ url, isSample: false })} />
              {hero.url !== VENUE_HERO.url && (
                <button type="button" className="abtn" onClick={() => setHero({ ...VENUE_HERO })}>
                  Mekân fotoğrafını kullan
                </button>
              )}
            </div>
            <TextInput
              label="Alternatif metin"
              path="general.heroImage.alt"
              value={hero.alt}
              hint="Görme engelli ziyaretçiler için fotoğrafı kısaca anlatın. Örn: “Ağaçlar arasında Çınar Cafe’nin taş cephesi ve bahçe masaları”."
              onChange={(v) => setHero({ alt: v })}
              multiline
            />
            <Range label="Odak noktası (yatay)" value={hero.focusX} min={0} max={100} step={1} onChange={(v) => setHero({ focusX: v })} format={(v) => `%${v}`} />
            <Range label="Odak noktası (dikey)" value={hero.focusY} min={0} max={100} step={1} onChange={(v) => setHero({ focusY: v })} format={(v) => `%${v}`} />
          </div>
        </div>
      </Card>
    </div>
  );
}

/** Kapak slaytı: yemek görselleri tanıtım filmi gibi sırayla geçer. */
function SlidesCard({ c, set }: TabProps) {
  const g = c.general;
  const slides = g.heroSlides;
  type Slide = (typeof slides)[number];
  const setG = (patch: Partial<typeof g>) => set((x) => ({ ...x, general: { ...x.general, ...patch } }));
  const setSlides = (fn: (s: Slide[]) => Slide[]) => set((x) => ({ ...x, general: { ...x.general, heroSlides: fn(x.general.heroSlides) } }));
  const setSlide = (i: number, patch: Partial<Slide>) => setSlides((s) => s.map((sl, j) => (j === i ? { ...sl, ...patch } : sl)));
  return (
    <Card
      title="Kapak slaytı (yemek görselleri)"
      desc="Sayfanın en üstünde görseller tanıtım filmi gibi yumuşak geçişle sırayla oynar. Yatay, en az 1600 piksel genişliğinde, gün ışığında çekilmiş fotoğraflar en iyi sonucu verir."
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Kapak türü">
        {([
          ["slideshow", "Yemek slaytı"],
          ["photo", "Tek fotoğraf (dış cephe)"],
        ] as const).map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={g.heroMode === k} className={`abtn ${g.heroMode === k ? "abtn-primary" : ""}`} onClick={() => setG({ heroMode: k })}>
            {l}
          </button>
        ))}
      </div>
      {g.heroMode === "slideshow" && (
        <>
          <Range label="Her görselin ekranda kalma süresi" value={g.slideSeconds} min={2} max={15} step={1} onChange={(v) => setG({ slideSeconds: v })} format={(v) => `${v} sn`} />
          <div className="rounded-lg bg-[#f6f4ee] p-3 text-sm">
            <p>Hazır slaytlar: önce mekânın girişi, ardından işletmenin 12 yemek fotoğrafı (her biri 2 sn). Mevcut slaytların yerine geçer.</p>
            <button
              type="button"
              className="abtn mt-2"
              onClick={() => {
                if (slides.length === 0 || confirm("Mevcut slaytlar hazır slaytlarla değiştirilsin mi?")) {
                  setG({ heroMode: "slideshow", slideSeconds: 2, heroSlides: SEED_SLIDES.map((s) => ({ ...s })) });
                }
              }}
            >
              Hazır slaytları yükle
            </button>
          </div>
          {slides.length === 0 && (
            <p className="rounded-lg bg-[#fbe9c8] p-2 text-sm">Henüz slayt yok; ziyaretçiler şimdilik dış cephe fotoğrafını görür. Yemek fotoğraflarını aşağıdan ekleyin.</p>
          )}
          <ul className="space-y-3">
            {slides.map((s, i) => (
              <li key={s.id} className="rounded-xl border border-[#e2dccd] bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" className="aspect-video w-full rounded-lg object-cover" />
                  <div className="space-y-2">
                    <TextInput label="Görsel üzerindeki yazı (örn. Adana Kebap)" path={`general.heroSlides.${i}.caption`} value={s.caption} onChange={(v) => setSlide(i, { caption: v })} />
                    <TextInput label="Alternatif metin" path={`general.heroSlides.${i}.alt`} value={s.alt} hint="Örn. “Közlenmiş biber ve domatesle servis edilen Adana kebap”." onChange={(v) => setSlide(i, { alt: v })} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="abtn" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => setSlides((x) => move(x, i, -1))}>↑</button>
                  <button type="button" className="abtn" aria-label="Aşağı taşı" disabled={i === slides.length - 1} onClick={() => setSlides((x) => move(x, i, 1))}>↓</button>
                  <button type="button" className="abtn abtn-danger ml-auto" onClick={() => setSlides((x) => x.filter((_, j) => j !== i))}>Kaldır</button>
                </div>
              </li>
            ))}
          </ul>
          {slides.length < 16 ? (
            <UploadButton kind="image" label="+ Slayt görseli ekle" onUploaded={(url) => setSlides((x) => [...x, { id: uid(), url, caption: "", alt: "", focusY: 50 }])} />
          ) : (
            <p className="text-sm text-[#55604f]">En fazla 16 slayt eklenebilir.</p>
          )}
        </>
      )}
    </Card>
  );
}

/** Fotoğrafa dokunarak mobilde öne çıkacak noktayı seçme + telefon kırpım önizlemesi */
function FocusPicker({ url, x, y, onChange }: { url: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="relative block w-full overflow-hidden rounded-xl border border-[#e2dccd] bg-[#ddd]"
        style={{ aspectRatio: "16/10" }}
        aria-label="Odak noktasını seçmek için fotoğrafa dokunun"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onChange(Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100));
        }}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_2px_#1e3a2a]" style={{ left: `${x}%`, top: `${y}%` }} />
      </button>
      <div className="flex items-end gap-3">
        <div className="relative h-36 w-20 overflow-hidden rounded-xl border-4 border-[#1b261e] bg-[#ddd]" aria-hidden>
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
          )}
        </div>
        <p className="text-xs text-[#55604f]">Telefonda görünecek kırpım. Fotoğrafa dokunarak odağı değiştirin.</p>
      </div>
    </div>
  );
}

/* ═════════════════════ Görünüm ═════════════════════ */
export function AppearanceTab({ c, set }: TabProps) {
  const a = c.appearance;
  const setA = (patch: Partial<typeof a>) => set((x) => ({ ...x, appearance: { ...x.appearance, ...patch } }));
  const setBg = (patch: Partial<typeof a.background>) => setA({ background: { ...a.background, ...patch } });
  const applyPreset = (k: PresetKey) => {
    const p = PRESETS[k];
    setA({ preset: k, mode: p.mode, bgColor: p.bgColor, accentColor: p.accentColor, cardOpacity: p.cardOpacity, overlay: p.overlay, background: { ...a.background, kind: p.background.kind, tree: p.background.tree } });
  };
  const accentContrast = contrastRatio(a.accentColor, onColor(a.accentColor));

  return (
    <div className="space-y-5">
      <Card title="Hazır temalar" desc="Bir tema seçin; ardından renkleri ve saydamlığı ayrıca ince ayarlayabilirsiniz.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
            const p = PRESETS[k];
            const active = a.preset === k;
            const dark = p.mode === "dark";
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(k)}
                className={`overflow-hidden rounded-xl border text-left ${active ? "border-[#1e3a2a] ring-2 ring-[#1e3a2a]" : "border-[#e2dccd]"}`}
              >
                <div
                  className="relative h-24"
                  style={{
                    backgroundColor: p.bgColor,
                    backgroundImage: p.background.kind === "wallpaper" ? `url(/themes/${p.background.tree}-wallpaper.svg)` : undefined,
                    backgroundSize: "cover",
                  }}
                >
                  {p.background.kind === "pattern" && (
                    <span className="absolute inset-0 opacity-20" style={{ background: p.accentColor, WebkitMaskImage: `url(/themes/${p.background.tree}-pattern.svg)`, maskImage: `url(/themes/${p.background.tree}-pattern.svg)`, WebkitMaskSize: "80px", maskSize: "80px" }} />
                  )}
                  <span className="absolute inset-0" style={{ background: `rgb(8 16 11 / ${p.overlay})` }} />
                  <span className={`absolute bottom-2 left-2 right-2 rounded-lg px-2 py-1.5 text-sm font-semibold backdrop-blur ${dark ? "bg-[#12241b]/70 text-[#f3eee2]" : "bg-[#fbf8f0]/75 text-[#1b261e]"}`}>
                    <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: p.accentColor }} />
                    {p.label}
                  </span>
                </div>
                <p className="bg-white p-2 text-xs text-[#55604f]">{p.note}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Renkler ve saydamlık">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Arka plan rengi" path="appearance.bgColor" value={a.bgColor} onChange={(v) => setA({ bgColor: v })} />
          <ColorField label="Vurgu rengi (düğmeler)" path="appearance.accentColor" value={a.accentColor} onChange={(v) => setA({ accentColor: v })} />
        </div>
        {accentContrast < 4.5 && (
          <p role="alert" className="rounded-lg bg-[#fbe9c8] p-2 text-sm">
            Uyarı: Vurgu rengi üzerindeki yazı kontrastı {accentContrast.toFixed(1)}:1. Okunurluk için en az 4.5:1 önerilir; daha koyu veya daha açık bir ton seçin.
          </p>
        )}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Yüzey tonu</legend>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={a.mode === m} className={`abtn ${a.mode === m ? "abtn-primary" : ""}`} onClick={() => setA({ mode: m })}>
                {m === "light" ? "Açık kartlar, koyu yazı" : "Koyu kartlar, açık yazı"}
              </button>
            ))}
          </div>
        </fieldset>
        <Range label="Kart saydamlığı (opaklık)" value={a.cardOpacity} min={0.35} max={0.98} step={0.01} onChange={(v) => setA({ cardOpacity: v })} format={pct} />
        <Range label="Arka plan karartması" value={a.overlay} min={0} max={0.8} step={0.01} onChange={(v) => setA({ overlay: v })} format={pct} />
      </Card>

      <Card title="Arka plan" desc="Duvar kâğıdı, sayfanın arkasındaki tema görselidir; dış cephe fotoğrafı “Genel” bölümünden yönetilir.">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Arka plan türü">
          {([
            ["solid", "Düz renk"],
            ["pattern", "Desen"],
            ["wallpaper", "Duvar kâğıdı"],
            ["custom", "Kendi görselim"],
          ] as const).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={a.background.kind === k} className={`abtn ${a.background.kind === k ? "abtn-primary" : ""}`} onClick={() => setBg({ kind: k })}>
              {l}
            </button>
          ))}
        </div>
        {(a.background.kind === "pattern" || a.background.kind === "wallpaper") && (
          <div className="grid grid-cols-3 gap-2">
            {TREES.map((t) => (
              <button key={t} type="button" aria-pressed={a.background.tree === t} onClick={() => setBg({ tree: t })} className={`overflow-hidden rounded-xl border text-left ${a.background.tree === t ? "border-[#1e3a2a] ring-2 ring-[#1e3a2a]" : "border-[#e2dccd]"}`}>
                <div className="relative h-20" style={{ backgroundColor: a.bgColor, backgroundImage: a.background.kind === "wallpaper" ? `url(/themes/${t}-wallpaper.svg)` : undefined, backgroundSize: "cover" }}>
                  {a.background.kind === "pattern" && (
                    <span className="absolute inset-0 opacity-30" style={{ background: a.accentColor, WebkitMaskImage: `url(/themes/${t}-pattern.svg)`, maskImage: `url(/themes/${t}-pattern.svg)`, WebkitMaskSize: "70px", maskSize: "70px" }} />
                  )}
                </div>
                <p className="bg-white p-2 text-sm font-semibold">{TREE_LABELS[t]}</p>
              </button>
            ))}
          </div>
        )}
        {a.background.kind === "custom" && (
          <div className="space-y-2">
            {a.background.customUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.background.customUrl} alt="Yüklenen arka plan" className="h-32 w-full rounded-xl object-cover" />
            ) : (
              <p className="text-sm text-[#55604f]">Henüz görsel yüklenmedi; yüklenene kadar düz renk gösterilir.</p>
            )}
            <UploadButton kind="image" label="Arka plan görseli yükle" onUploaded={(url) => setBg({ customUrl: url })} />
          </div>
        )}
      </Card>
    </div>
  );
}

function ColorField({ label, value, onChange, path }: { label: string; value: string; onChange: (v: string) => void; path: string }) {
  const [txt, setTxt] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    // Renk seçiciden/tema düğmesinden gelen değişikliği metin kutusuna yansıt
    setPrev(value);
    setTxt(value);
  }
  return (
    <Field label={label} path={path}>
      {(p) => (
        <div className="flex gap-2">
          <input type="color" aria-label={`${label} seçici`} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-[#cfc8b6]" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} />
          <input
            {...p}
            type="text"
            value={txt}
            onChange={(e) => {
              setTxt(e.target.value);
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toUpperCase());
            }}
          />
        </div>
      )}
    </Field>
  );
}

/* ═════════════════════ Menü ═════════════════════ */
export function MenuTab({ c, set }: TabProps) {
  const cats = c.menu.categories;
  const setCats = (fn: (cs: MenuCategory[]) => MenuCategory[]) => set((x) => ({ ...x, menu: { ...x.menu, categories: fn(x.menu.categories) } }));
  const setCat = (ci: number, patch: Partial<MenuCategory>) => setCats((cs) => cs.map((cat, i) => (i === ci ? { ...cat, ...patch } : cat)));
  const [open, setOpen] = useState<string | null>(cats[0]?.id ?? null);

  return (
    <div className="space-y-5">
      <Card title="Menü PDF’i ve bağlantı" desc="Hazır bir PDF menünüz varsa yükleyin; ziyaretçiye “PDF Menüyü Aç” düğmesi gösterilir.">
        <div className="flex flex-wrap items-center gap-3">
          <UploadButton kind="pdf" label={c.menu.pdfUrl ? "PDF’i değiştir" : "PDF yükle"} onUploaded={(url) => set((x) => ({ ...x, menu: { ...x.menu, pdfUrl: url } }))} />
          {c.menu.pdfUrl && (
            <>
              <a className="abtn" href={c.menu.pdfUrl} target="_blank" rel="noopener">PDF’i görüntüle</a>
              <button type="button" className="abtn abtn-danger" onClick={() => set((x) => ({ ...x, menu: { ...x.menu, pdfUrl: "" } }))}>PDF’i kaldır</button>
            </>
          )}
        </div>
        <TextInput
          label="Dijital menü bağlantısı (isteğe bağlı)"
          path="menu.externalUrl"
          value={c.menu.externalUrl}
          placeholder="https://"
          hint="Doluysa menünün yanında “Dijital Menü” düğmesi görünür. Masa numarası/garson çağırma içeren bağlantılar herkese açık sayfada önerilmez."
          onChange={(v) => set((x) => ({ ...x, menu: { ...x.menu, externalUrl: v } }))}
        />
      </Card>

      <Card title="Kategoriler ve ürünler" desc="Fiyat boş bırakılırsa gösterilmez. Gizlenen öğeler ziyaretçiye görünmez.">
        <div className="rounded-lg bg-[#f6f4ee] p-3 text-sm">
          <p>Basılı menüden aktarılan güncel menüyü (7 kategori) tek tıkla yükleyebilirsiniz. Mevcut menünün yerine geçer; ardından kaydedip yayınlayın.</p>
          <button
            type="button"
            className="abtn mt-2"
            onClick={() => {
              if (confirm("Mevcut menü silinip güncel menü yüklensin mi? (Kaydetmeden önce geri almak için sayfayı yenileyebilirsiniz.)")) {
                const fresh = seedMenuCategories();
                setCats(() => fresh);
                setOpen(fresh[0]?.id ?? null);
              }
            }}
          >
            Güncel menüyü yükle
          </button>
        </div>
        <div className="space-y-3">
          {cats.map((cat, ci) => (
            <CategoryEditor
              key={cat.id}
              cat={cat}
              index={ci}
              total={cats.length}
              open={open === cat.id}
              onToggle={() => setOpen(open === cat.id ? null : cat.id)}
              onChange={(patch) => setCat(ci, patch)}
              onMove={(d) => setCats((cs) => move(cs, ci, d))}
              onDelete={() => {
                if (confirm(`“${cat.name}” kategorisi ve içindeki ${cat.items.length} ürün silinsin mi?`)) setCats((cs) => cs.filter((_, i) => i !== ci));
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="abtn abtn-primary"
          onClick={() => {
            const id = uid();
            setCats((cs) => [...cs, { id, name: "Yeni kategori", hidden: false, items: [] }]);
            setOpen(id);
          }}
        >
          + Kategori ekle
        </button>
      </Card>
    </div>
  );
}

function CategoryEditor({
  cat,
  index,
  total,
  open,
  onToggle,
  onChange,
  onMove,
  onDelete,
}: {
  cat: MenuCategory;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onChange: (p: Partial<MenuCategory>) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  const base = `menu.categories.${index}`;
  const err = useIssue(base);
  const setItem = (ii: number, patch: Partial<MenuCategory["items"][number]>) => onChange({ items: cat.items.map((it, i) => (i === ii ? { ...it, ...patch } : it)) });
  return (
    <div className={`rounded-xl border ${err ? "border-[#b3261e]" : "border-[#e2dccd]"} bg-white`}>
      <div className="flex flex-wrap items-center gap-2 p-2">
        <button type="button" className="abtn min-w-0 flex-1 justify-start" aria-expanded={open} onClick={onToggle}>
          <span aria-hidden>{open ? "▾" : "▸"}</span>
          <span className="truncate">{cat.name || "(adsız)"}</span>
          <span className="text-xs font-normal text-[#55604f]">{cat.items.length} ürün</span>
          {cat.hidden && <span className="rounded bg-[#eee] px-1.5 text-xs">gizli</span>}
        </button>
        <button type="button" className="abtn" aria-label={`${cat.name} yukarı taşı`} disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
        <button type="button" className="abtn" aria-label={`${cat.name} aşağı taşı`} disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-[#e2dccd] p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <TextInput label="Kategori adı" path={`${base}.name`} value={cat.name} onChange={(v) => onChange({ name: v })} />
            <div className="flex gap-2">
              <Toggle label="Gizle" checked={cat.hidden} onChange={(v) => onChange({ hidden: v })} />
              <button type="button" className="abtn abtn-danger" onClick={onDelete}>Sil</button>
            </div>
          </div>
          <ul className="space-y-2">
            {cat.items.map((it, ii) => (
              <li key={it.id} className={`rounded-lg border p-3 ${it.hidden ? "border-dashed border-[#cfc8b6] bg-[#f6f4ee]" : "border-[#e2dccd]"}`}>
                <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                  <TextInput label="Ürün adı" path={`${base}.items.${ii}.name`} value={it.name} onChange={(v) => setItem(ii, { name: v })} />
                  <TextInput label="Not (örn. adet)" path={`${base}.items.${ii}.note`} value={it.note} onChange={(v) => setItem(ii, { note: v })} />
                  <PriceInput path={`${base}.items.${ii}.price`} value={it.price} onChange={(v) => setItem(ii, { price: v })} />
                </div>
                <div className="mt-2">
                  <TextInput label="Açıklama" path={`${base}.items.${ii}.description`} value={it.description} onChange={(v) => setItem(ii, { description: v })} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Toggle label="Gizle" checked={it.hidden} onChange={(v) => setItem(ii, { hidden: v })} />
                  <button type="button" className="abtn" aria-label={`${it.name} yukarı`} disabled={ii === 0} onClick={() => onChange({ items: move(cat.items, ii, -1) })}>↑</button>
                  <button type="button" className="abtn" aria-label={`${it.name} aşağı`} disabled={ii === cat.items.length - 1} onClick={() => onChange({ items: move(cat.items, ii, 1) })}>↓</button>
                  <button type="button" className="abtn abtn-danger ml-auto" onClick={() => confirm(`“${it.name}” silinsin mi?`) && onChange({ items: cat.items.filter((_, i) => i !== ii) })}>Sil</button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="abtn" onClick={() => onChange({ items: [...cat.items, { id: uid(), name: "Yeni ürün", description: "", note: "", price: null, hidden: false }] })}>
            + Ürün ekle
          </button>
        </div>
      )}
    </div>
  );
}

function PriceInput({ value, onChange, path }: { value: number | null; onChange: (v: number | null) => void; path: string }) {
  const [txt, setTxt] = useState(value === null ? "" : String(value).replace(".", ","));
  const [bad, setBad] = useState(false);
  return (
    <Field label="Fiyat (₺)" path={path} hint={bad ? undefined : value !== null ? formatTRY(value) : "Boş: gösterilmez"}>
      {(p) => (
        <>
          <input
            {...p}
            aria-invalid={bad || p["aria-invalid"] || undefined}
            type="text"
            inputMode="decimal"
            placeholder="—"
            value={txt}
            onChange={(e) => {
              const t = e.target.value;
              setTxt(t);
              if (t.trim() === "") {
                setBad(false);
                onChange(null);
                return;
              }
              const n = Number(t.replace(/\./g, "").replace(",", "."));
              if (Number.isFinite(n) && n >= 0) {
                setBad(false);
                onChange(Math.round(n * 100) / 100);
              } else setBad(true);
            }}
          />
          {bad && <p role="alert" className="mt-1 text-sm font-semibold text-[#b3261e]">Fiyatı yalnızca rakamla yazın (örn. 150 veya 42,50).</p>}
        </>
      )}
    </Field>
  );
}

/* ═════════════════════ Videolar ═════════════════════ */
export function VideosTab({ c, set }: TabProps) {
  const vids = c.videos;
  const setVids = (fn: (v: Video[]) => Video[]) => set((x) => ({ ...x, videos: fn(x.videos) }));
  const setVid = (i: number, patch: Partial<Video>) => setVids((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  return (
    <Card
      title="Tanıtım videoları"
      desc="Videolar yalnızca ziyaretçi oynat düğmesine bastığında yüklenir; sesli otomatik oynatma yapılmaz. Kaynak olarak MP4 yükleyebilir veya YouTube/Vimeo bağlantısı girebilirsiniz."
    >
      {vids.length === 0 && <p className="text-sm text-[#55604f]">Henüz video yok. İlk tanıtım videonuzu ekleyin.</p>}
      <ul className="space-y-3">
        {vids.map((v, i) => (
          <li key={v.id} className={`rounded-xl border p-3 ${v.hidden ? "border-dashed bg-[#f6f4ee]" : "border-[#e2dccd] bg-white"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Başlık" path={`videos.${i}.title`} value={v.title} onChange={(t) => setVid(i, { title: t })} />
              <Field label="Kaynak" path={`videos.${i}.source`}>
                {(p) => (
                  <select {...p} value={v.source} onChange={(e) => setVid(i, { source: e.target.value as Video["source"], url: "" })}>
                    <option value="upload">MP4 dosyası yükle</option>
                    <option value="youtube">YouTube bağlantısı</option>
                    <option value="vimeo">Vimeo bağlantısı</option>
                  </select>
                )}
              </Field>
            </div>
            <div className="mt-3">
              {v.source === "upload" ? (
                <div className="space-y-1">
                  <UploadButton kind="video" label={v.url ? "MP4’ü değiştir" : "MP4 yükle"} onUploaded={(url) => setVid(i, { url })} />
                  {v.url && <p className="text-sm text-[#2f6a45]">Video yüklendi.</p>}
                  <IssueLine path={`videos.${i}.url`} />
                </div>
              ) : (
                <TextInput
                  label={v.source === "youtube" ? "YouTube bağlantısı" : "Vimeo bağlantısı"}
                  path={`videos.${i}.url`}
                  type="url"
                  placeholder={v.source === "youtube" ? "https://www.youtube.com/watch?v=…" : "https://vimeo.com/…"}
                  value={v.url}
                  onChange={(t) => setVid(i, { url: t.trim() })}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {v.posterUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.posterUrl} alt="Kapak görseli" className="h-16 w-28 rounded-lg object-cover" />
              )}
              <UploadButton kind="image" label={v.posterUrl ? "Kapağı değiştir" : "Kapak görseli yükle"} onUploaded={(url) => setVid(i, { posterUrl: url })} />
              {v.posterUrl && <button type="button" className="abtn abtn-danger" onClick={() => setVid(i, { posterUrl: "" })}>Kapağı kaldır</button>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Toggle label="Gizle" checked={v.hidden} onChange={(h) => setVid(i, { hidden: h })} />
              <button type="button" className="abtn" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => setVids((vs) => move(vs, i, -1))}>↑</button>
              <button type="button" className="abtn" aria-label="Aşağı taşı" disabled={i === vids.length - 1} onClick={() => setVids((vs) => move(vs, i, 1))}>↓</button>
              <button type="button" className="abtn abtn-danger ml-auto" onClick={() => confirm(`“${v.title}” silinsin mi?`) && setVids((vs) => vs.filter((_, j) => j !== i))}>Sil</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="abtn abtn-primary" disabled={vids.length >= 20} onClick={() => setVids((vs) => [...vs, { id: uid(), title: "Tanıtım videosu", source: "youtube", url: "", posterUrl: "", hidden: false }])}>
        + Video ekle
      </button>
    </Card>
  );
}

function IssueLine({ path }: { path: string }) {
  const err = useIssue(path);
  return err ? <p role="alert" className="text-sm font-semibold text-[#b3261e]">{err}</p> : null;
}

/* ═════════════════════ İletişim ve Konum ═════════════════════ */
export function ContactTab({ c, set }: TabProps) {
  const k = c.contact;
  const setK = (patch: Partial<typeof k>) => set((x) => ({ ...x, contact: { ...x.contact, ...patch } }));
  return (
    <div className="space-y-5">
      <Card title="İrtibat">
        <TextInput label="Telefon numarası" path="contact.phone" type="tel" inputMode="tel" value={k.phone} placeholder="0xxx xxx xx xx" hint="Boş bırakılırsa “Şimdi Ara” düğmesi gizlenir." onChange={(v) => setK({ phone: v })} />
        <TextInput label="Açık adres" path="contact.address" value={k.address} multiline onChange={(v) => setK({ address: v })} />
      </Card>
      <Card title="Harita bağlantıları" desc="İki bağlantı ayrı düğmeler olarak gösterilir. Boş bırakılan bağlantının düğmesi gizlenir.">
        {(k.googleMapsUrl !== VERIFIED_MAPS.googleMapsUrl || k.appleMapsUrl !== VERIFIED_MAPS.appleMapsUrl) && (
          <div className="rounded-lg bg-[#fbe9c8] p-3 text-sm">
            <p>
              İşletmenin Google Haritalar kaydındaki konuma (37.4126147, 41.3757032) giden <b>doğrulanmış</b> yol tarifi bağlantıları hazır. Apple bağlantısı da aynı koordinatı kullanır.
            </p>
            <button type="button" className="abtn mt-2" onClick={() => setK({ ...VERIFIED_MAPS, mapsAreDemo: false })}>
              Doğru konum bağlantılarını kullan
            </button>
          </div>
        )}
        <TextInput label="Google Maps bağlantısı" path="contact.googleMapsUrl" type="url" placeholder="https://maps.app.goo.gl/…" value={k.googleMapsUrl} onChange={(v) => setK({ googleMapsUrl: v.trim(), mapsAreDemo: false })} />
        <TextInput label="Apple Haritalar bağlantısı" path="contact.appleMapsUrl" type="url" placeholder="https://maps.apple.com/…" value={k.appleMapsUrl} onChange={(v) => setK({ appleMapsUrl: v.trim(), mapsAreDemo: false })} />
        <div className="flex flex-wrap gap-2">
          {k.googleMapsUrl && <a className="abtn" href={k.googleMapsUrl} target="_blank" rel="noopener noreferrer">Google bağlantısını dene</a>}
          {k.appleMapsUrl && <a className="abtn" href={k.appleMapsUrl} target="_blank" rel="noopener noreferrer">Apple bağlantısını dene</a>}
        </div>
      </Card>
    </div>
  );
}

/* ═════════════════════ Kartvizit ve QR ═════════════════════ */
export function CardTab({ c, set, savedVersion, dirty }: TabProps & { savedVersion: number; dirty: boolean }) {
  const k = c.card;
  const setK = (patch: Partial<typeof k>) => set((x) => ({ ...x, card: { ...x.card, ...patch } }));
  const [info, setInfo] = useState<{ url: string; isDraft: boolean } | null>(null);
  const [guides, setGuides] = useState(true);
  useEffect(() => {
    fetch(`/api/admin/qr?format=json&v=${savedVersion}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.ok && setInfo({ url: d.url, isDraft: d.isDraft }))
      .catch(() => setInfo(null));
  }, [savedVersion]);
  const q = `v=${savedVersion}`;

  return (
    <div className="space-y-5">
      <Card title="Kalıcı site adresi (QR içeriği)" desc="QR kod yalnızca bu kök adresi içerir. Menü, video, konum veya tema değişse de aynı QR çalışmaya devam eder.">
        <TextInput label="Üretim adresi" path="card.siteUrl" type="url" placeholder="https://cinarcafe.com.tr" value={k.siteUrl} hint="Alan adınız kesinleştiğinde girin. Boşken çıktılar “Taslak” olarak işaretlenir." onChange={(v) => setK({ siteUrl: v.trim() })} />
        {dirty && <p className="rounded-lg bg-[#fbe9c8] p-2 text-sm">Değişiklikler kaydedilmedi. QR ve kartvizit çıktıları kaydedilmiş taslaktan üretilir — önce “Taslağı Kaydet”e basın.</p>}
        {info && (
          <div className={`rounded-xl p-3 text-sm ${info.isDraft ? "bg-[#fde3e1] text-[#7d1a14]" : "bg-[#e3efe5] text-[#1e3a2a]"}`}>
            <b>{info.isDraft ? "TASLAK" : "Baskıya hazır"}</b> — QR adresi: <code className="break-all">{info.url}</code>
            {info.isDraft && <p className="mt-1">Üretim adresi https ile tanımlanmadığı için çıktılar taslak olarak işaretlenir. Bu QR’ı basmayın.</p>}
          </div>
        )}
        <div className="flex flex-wrap items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/qr?format=svg&${q}`} alt="QR önizlemesi" width={160} height={160} className="rounded-lg border border-[#e2dccd] bg-white" />
          <div className="flex flex-col gap-2">
            <a className="abtn" href={`/api/admin/qr?format=svg&download=1&${q}`}>SVG indir (vektör)</a>
            <a className="abtn" href={`/api/admin/qr?format=png&${q}`}>PNG indir (2400 px)</a>
          </div>
        </div>
      </Card>

      <Card title="Kartvizit" desc="Çift yüzlü. Ölçü ve taşma payını matbaanın istediği değerlere göre değiştirin.">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Genişlik (mm)" path="card.widthMm" value={k.widthMm} onChange={(v) => setK({ widthMm: v })} />
          <NumberField label="Yükseklik (mm)" path="card.heightMm" value={k.heightMm} onChange={(v) => setK({ heightMm: v })} />
          <NumberField label="Taşma (mm)" path="card.bleedMm" value={k.bleedMm} onChange={(v) => setK({ bleedMm: v })} />
        </div>
        <Toggle label="Arka yüzde telefon numarasını göster (yer varsa)" checked={k.showPhone} onChange={(v) => setK({ showPhone: v })} />
        <Toggle label="Kesim çizgisini önizlemede göster" checked={guides} onChange={setGuides} />
        <div className="grid gap-4 sm:grid-cols-2">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/card?format=svg&face=front&guides=${guides ? 1 : 0}&${q}`} alt="Kartvizit ön yüz önizlemesi" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-1 text-sm text-[#55604f]">Ön yüz</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/card?format=svg&face=back&guides=${guides ? 1 : 0}&${q}`} alt="Kartvizit arka yüz önizlemesi" className="w-full rounded-lg shadow-md" />
            <figcaption className="mt-1 text-sm text-[#55604f]">Arka yüz</figcaption>
          </figure>
        </div>
        <p className="text-sm text-[#55604f]">Pembe kesikli çizgi kesim (trim) sınırıdır; dışındaki alan taşma payıdır. QR alanı düz beyazdır ve üzerine desen, logo, gölge veya saydamlık bindirilmez.</p>
        <div className="flex flex-wrap gap-2">
          <a className="abtn abtn-primary" href={`/api/admin/card?format=pdf&download=1&${q}`}>Baskı PDF’ini indir</a>
          <a className="abtn" href={`/api/admin/card?format=pdf&${q}`} target="_blank" rel="noopener">PDF’i tarayıcıda aç</a>
        </div>
        <div className="rounded-lg bg-[#f6f4ee] p-3 text-sm">
          <b>Baskı öncesi kontrol:</b> PDF’i %100 ölçekte yazdırıp kesin; iPhone (Kamera) ve Android (Kamera / Google Lens) ile 20–30 cm mesafeden okutun. Okutulan adresin üretim adresiniz olduğunu doğrulayın.
        </div>
      </Card>
    </div>
  );
}

function NumberField({ label, value, onChange, path }: { label: string; value: number; onChange: (v: number) => void; path: string }) {
  return (
    <Field label={label} path={path}>
      {(p) => <input {...p} type="number" inputMode="decimal" step="0.5" value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />}
    </Field>
  );
}

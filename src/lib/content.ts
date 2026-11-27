import { z } from "zod";
import { isAllowedMapUrl, isAllowedVideoUrl, isSafeMediaUrl } from "./urls";

/* ───────────────────────── Sabitler ───────────────────────── */

export const HEADING_FONTS = {
  cormorant: { label: "Cormorant Garamond", cssVar: "var(--font-cormorant)" },
  playfair: { label: "Playfair Display", cssVar: "var(--font-playfair)" },
  dmsans: { label: "DM Sans", cssVar: "var(--font-dmsans)" },
  inter: { label: "Inter", cssVar: "var(--font-inter)" },
} as const;
export type HeadingFont = keyof typeof HEADING_FONTS;

export const TREES = ["cinar", "cam", "mese"] as const;
export type Tree = (typeof TREES)[number];
export const TREE_LABELS: Record<Tree, string> = {
  cinar: "Çınar",
  cam: "Çam",
  mese: "Meşe",
};

export const PRESETS = {
  cinar: {
    label: "Çınar Gölgesi",
    note: "Zeytin yeşili, krem ve ince çınar yaprağı deseni",
    mode: "light",
    bgColor: "#F3EEE2",
    accentColor: "#566B34",
    cardOpacity: 0.72,
    overlay: 0.1,
    background: { kind: "pattern", tree: "cinar" },
  },
  cam: {
    label: "Çam Ormanı",
    note: "Koyu çam yeşili, açık taş tonları ve seyrek çam siluetleri",
    mode: "light",
    bgColor: "#E7E6DF",
    accentColor: "#1F4031",
    cardOpacity: 0.74,
    overlay: 0.12,
    background: { kind: "wallpaper", tree: "cam" },
  },
  mese: {
    label: "Meşe ve Toprak",
    note: "Toprak kahvesi, sıcak krem ve hafif meşe yaprağı dokusu",
    mode: "light",
    bgColor: "#F4EADA",
    accentColor: "#6E4A2C",
    cardOpacity: 0.74,
    overlay: 0.08,
    background: { kind: "pattern", tree: "mese" },
  },
  aksam: {
    label: "Orman Akşamı",
    note: "Koyu yeşil, karartılmış arka plan ve sıcak amber vurgular",
    mode: "dark",
    bgColor: "#12231A",
    accentColor: "#D6A24A",
    cardOpacity: 0.62,
    overlay: 0.45,
    background: { kind: "wallpaper", tree: "cinar" },
  },
} as const;
export type PresetKey = keyof typeof PRESETS;

/* ───────────────────────── Şema ───────────────────────── */

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Renk #RRGGBB biçiminde olmalı (örn. #2F4A2C).");

const mediaUrl = z
  .string()
  .max(1000)
  .refine((v) => v === "" || isSafeMediaUrl(v), "Medya adresi geçersiz. Dosyayı panelden yükleyin.");

const id = z.string().min(1).max(64);

const text = (label: string, max: number, required = false) => {
  const base = z.string().trim().max(max, `${label} en fazla ${max} karakter olabilir.`);
  return required ? base.min(1, `${label} boş bırakılamaz.`) : base;
};

export const menuItemSchema = z.object({
  id,
  name: text("Ürün adı", 80, true),
  description: text("Açıklama", 240),
  note: text("Not", 40), // örn. "adet"
  price: z
    .number({ message: "Fiyat sayı olmalı." })
    .min(0, "Fiyat negatif olamaz.")
    .max(100000, "Fiyat çok yüksek görünüyor.")
    .nullable(),
  hidden: z.boolean(),
});

export const menuCategorySchema = z.object({
  id,
  name: text("Kategori adı", 60, true),
  hidden: z.boolean(),
  items: z.array(menuItemSchema).max(200),
});

export const videoSchema = z
  .object({
    id,
    title: text("Video başlığı", 100, true),
    source: z.enum(["upload", "youtube", "vimeo"]),
    url: z.string().trim().max(1000),
    posterUrl: mediaUrl,
    hidden: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Video kaynağı boş bırakılamaz." });
      return;
    }
    if (v.source === "upload" && !isSafeMediaUrl(v.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "MP4 dosyasını panelden yükleyin." });
    }
    if (v.source !== "upload" && !isAllowedVideoUrl(v.url, v.source)) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message:
          v.source === "youtube"
            ? "Yalnızca https:// ile başlayan YouTube bağlantıları kabul edilir."
            : "Yalnızca https:// ile başlayan Vimeo bağlantıları kabul edilir.",
      });
    }
  });

export const contentSchema = z.object({
  version: z.literal(1),
  general: z.object({
    brandName: text("Marka adı", 60, true),
    headingFont: z.enum(["cormorant", "playfair", "dmsans", "inter"]),
    heroImage: z.object({
      url: mediaUrl,
      alt: text("Alternatif metin", 160),
      focusX: z.number().min(0).max(100),
      focusY: z.number().min(0).max(100),
      isSample: z.boolean(),
    }),
  }),
  appearance: z.object({
    preset: z.enum(["cinar", "cam", "mese", "aksam"]),
    mode: z.enum(["light", "dark"]),
    bgColor: hex,
    accentColor: hex,
    cardOpacity: z.number().min(0.35, "Saydamlık en az %35 olmalı.").max(0.98),
    overlay: z.number().min(0).max(0.8, "Karartma en fazla %80 olabilir."),
    background: z.object({
      kind: z.enum(["solid", "pattern", "wallpaper", "custom"]),
      tree: z.enum(TREES),
      customUrl: mediaUrl,
    }),
  }),
  menu: z.object({
    categories: z.array(menuCategorySchema).max(40),
    pdfUrl: mediaUrl,
    externalUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Dijital menü bağlantısı https:// ile başlamalı."),
  }),
  videos: z.array(videoSchema).max(20),
  contact: z.object({
    phone: z
      .string()
      .trim()
      .max(25)
      .refine((v) => v === "" || /^[+0-9 ()-]{7,25}$/.test(v), "Telefon yalnızca rakam, boşluk, +, ( ) ve - içerebilir."),
    address: text("Adres", 240),
    googleMapsUrl: z
      .string()
      .trim()
      .max(1000)
      .refine((v) => v === "" || isAllowedMapUrl(v, "google"), "Google Maps bağlantısı https:// ile başlamalı ve Google alan adına ait olmalı."),
    appleMapsUrl: z
      .string()
      .trim()
      .max(1000)
      .refine((v) => v === "" || isAllowedMapUrl(v, "apple"), "Apple Haritalar bağlantısı https://maps.apple.com ile başlamalı."),
    mapsAreDemo: z.boolean(),
  }),
  card: z.object({
    siteUrl: z
      .string()
      .trim()
      .max(300)
      .refine((v) => v === "" || /^https:\/\/[^\s/]+(\/[^\s]*)?$/i.test(v), "Site adresi https:// ile başlamalı."),
    widthMm: z.number().min(40, "Genişlik en az 40 mm.").max(120, "Genişlik en fazla 120 mm."),
    heightMm: z.number().min(30, "Yükseklik en az 30 mm.").max(120, "Yükseklik en fazla 120 mm."),
    bleedMm: z.number().min(0).max(6, "Taşma payı en fazla 6 mm."),
    showPhone: z.boolean(),
  }),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type Video = z.infer<typeof videoSchema>;

/** Zod hatalarını panelde gösterilecek okunaklı Türkçe listeye çevirir. */
export function formatIssues(err: z.ZodError): { path: string; message: string }[] {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

/* ───────────────────────── Başlangıç içeriği ───────────────────────── */

// Menü; işletmenin basılı menüsünden (Kasım 2026) fiyatsız aktarıldı.
// [ad, açıklama] biçimindeki öğelerde ikinci değer ürünün altında açıklama olarak gösterilir.
// Fiyatlar panelden isteğe bağlı eklenebilir.
const SEED_MENU: [string, (string | [string, string])[]][] = [
  ["Izgara Çeşitleri", ["Adana Kebap", "Kuşbaşı", "Pirzola", "Ciğer Şiş", "Tavuk Şiş", "Kanat", "Karışık Izgara", "Patlıcanlı Kebap", "Domatesli Kebap"]],
  ["Yöresel Yemekler", ["Günün Çorbası", "Irok", "Şenbusek", "Güveç", "Midyat Tabağı"]],
  ["Fırın Çeşitleri", ["Karışık Pizza", "Ton Balıklı Pizza", "Kavurmalı Pizza", "Margaritta", "Sade Kaşarlı Pide", "Kavurmalı Pide", "Karışık Sucuklu Pide", "Karışık Pide"]],
  ["Aperatifler", [["Tost Çeşitleri", "Kaşarlı, Yumurtalı, Karışık"], "Yoğurtlu Kızartma", "Sigara Böreği", "Soğan Halkası", "Nugget"]],
  [
    "Tatlı Çeşitleri",
    ["San Sebastian Cheesecake", "Fıstık Rüyası", "Waffle Çeşitleri", "Sufle", "Fırında Sütlaç", "Meyve Tabağı", "Kase Dondurma", "Çerez Tabağı", ["Şefin Tatlısı", "Güne özel"]],
  ],
  [
    "Sıcak İçecekler",
    ["Salep", "Nescafé", "Cappuccino", "Expresso", "Sıcak Çikolata", "Türk Kahvesi", ["Yöresel Kahve Çeşitleri", "Dibek, Kürt, Süryani, Mırra"], "Filtre Kahve", "Bitki Çayları", "Çay"],
  ],
  [
    "Soğuk İçecekler",
    ["Su", "Soda", "Meyveli Soda", "Kutu İçecekler", "Ayran", "Limonata", "Şalgam", "Soğuk Kahve Çeşitleri", "Ice Latte Çeşitleri", "Milkshake Çeşitleri", "Frozen Çeşitleri"],
  ],
];

/** Panelde "Güncel menüyü yükle" düğmesiyle de kullanılan başlangıç menüsü. */
export function seedMenuCategories() {
  return createDefaultContent().menu.categories;
}

/** İşletmenin gerçek dış cephe fotoğrafı (projeyle birlikte gelir). */
export const VENUE_HERO = {
  url: "/mekan/cinar-dis-cephe.png",
  alt: "Gece ışıklandırmasıyla Çınar Restaurant & Cafe girişi ve tabelası",
  focusX: 52,
  focusY: 62,
  isSample: false,
};

function slug(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[çc]/g, "c").replace(/ğ/g, "g").replace(/[ıi]/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function createDefaultContent(): SiteContent {
  const p = PRESETS.cinar;
  return {
    version: 1,
    general: {
      brandName: "Çınar Cafe & Restaurant",
      headingFont: "cormorant",
      heroImage: { ...VENUE_HERO },
    },
    appearance: {
      preset: "cinar",
      mode: p.mode,
      bgColor: p.bgColor,
      accentColor: p.accentColor,
      cardOpacity: p.cardOpacity,
      overlay: p.overlay,
      background: { kind: p.background.kind, tree: p.background.tree, customUrl: "" },
    },
    menu: {
      categories: SEED_MENU.map(([name, items]) => {
        const cid = slug(name);
        return {
          id: cid,
          name,
          hidden: false,
          items: items.map((it, i) => {
            const [n, description] = Array.isArray(it) ? it : [it, ""];
            return { id: `${cid}-${i + 1}-${slug(n)}`.slice(0, 64), name: n, description, note: "", price: null, hidden: false };
          }),
        };
      }),
      pdfUrl: "",
      externalUrl: "",
    },
    videos: [],
    contact: {
      phone: "0547 459 00 47",
      address: "Işıklar, Şelale Parkı içi yolu, Midyat Otogar yanı, 47510 Midyat/Mardin",
      // Demo bağlantılar: panelden "İletişim ve Konum" bölümünde güncelleyin.
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=%C3%87%C4%B1nar+Cafe+%26+Restaurant+Midyat+Otogar+Midyat+Mardin",
      appleMapsUrl: "https://maps.apple.com/?q=%C3%87%C4%B1nar+Cafe+%26+Restaurant&address=Midyat+Otogar,+47510+Midyat%2FMardin",
      mapsAreDemo: true,
    },
    card: {
      siteUrl: "",
      widthMm: 85,
      heightMm: 55,
      bleedMm: 3,
      showPhone: true,
    },
  };
}

/** Eski/eksik kayıtları güncel şemaya tamamlar. */
export function normalizeContent(raw: unknown): SiteContent {
  const def = createDefaultContent();
  if (!raw || typeof raw !== "object") return def;
  const r = raw as Partial<SiteContent>;
  const merged = {
    ...def,
    ...r,
    general: { ...def.general, ...(r.general ?? {}), heroImage: { ...def.general.heroImage, ...(r.general?.heroImage ?? {}) } },
    appearance: { ...def.appearance, ...(r.appearance ?? {}), background: { ...def.appearance.background, ...(r.appearance?.background ?? {}) } },
    menu: { ...def.menu, ...(r.menu ?? {}) },
    contact: { ...def.contact, ...(r.contact ?? {}) },
    card: { ...def.card, ...(r.card ?? {}) },
    videos: r.videos ?? def.videos,
  };
  const parsed = contentSchema.safeParse(merged);
  return parsed.success ? parsed.data : def;
}

/* ───────────────────────── Yardımcılar ───────────────────────── */

const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatTRY = (n: number) => tl.format(n);

export function telHref(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("0")) return `tel:+90${digits.slice(1)}`;
  return `tel:${digits}`;
}

function luminance(hexColor: string) {
  const n = parseInt(hexColor.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Vurgu renginin üzerine yazılacak metin rengi (WCAG kontrastına göre). */
export function onColor(bg: string) {
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#14201A") ? "#FFFFFF" : "#14201A";
}

import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import { LEAF } from "../leaves.mjs";
import type { SiteContent } from "../content";

/**
 * Kartvizit çizimi. Tüm ölçüler mm, eksen sol-üst köşeden (y aşağı).
 * Yazılar font dosyasından vektör yola çevrilir; böylece SVG önizleme ve baskı PDF'i birebir aynıdır
 * ve matbaada font eksikliği sorunu yaşanmaz.
 */

export interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}
export interface CardFace {
  width: number; // taşma dahil
  height: number;
  bleed: number;
  shapes: Shape[];
}

const COLORS = {
  forest: "#1E3A2A",
  forestDeep: "#152B1F",
  cream: "#F4EEDF",
  gold: "#C9A45C",
  paper: "#F7F3EA",
  qrDark: "#0F1F16",
  ink: "#1E2B22",
  muted: "#55604F",
  draft: "#B3261E",
};

/* ─────────────── Font → yol ─────────────── */

type FKFont = {
  unitsPerEm: number;
  layout: (t: string) => {
    glyphs: { path: FKPath; advanceWidth: number }[];
    positions: { xAdvance: number; xOffset: number; yOffset: number }[];
  };
};
type FKPath = { commands: { command: string; args: number[] }[] };

let fonts: { serif: FKFont; sans: FKFont } | null = null;
function loadFonts() {
  if (!fonts) {
    // Fontlar next.config.ts → outputFileTracingIncludes ile pakete eklenir.
    const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "assets", "fonts");
    fonts = {
      serif: fontkit.create(readFileSync(path.join(dir, "CormorantGaramond-SemiBold.ttf"))) as unknown as FKFont,
      sans: fontkit.create(readFileSync(path.join(dir, "DMSans-Medium.ttf"))) as unknown as FKFont,
    };
  }
  return fonts;
}

const r2 = (n: number) => Math.round(n * 1000) / 1000;

/** Metni mm cinsinden yol olarak döndürür. sizeMm = em boyutu. */
function textWidth(font: FKFont, text: string, sizeMm: number, tracking = 0) {
  const run = font.layout(text);
  const s = sizeMm / font.unitsPerEm;
  return run.positions.reduce((w, p) => w + p.xAdvance * s, 0) + tracking * sizeMm * Math.max(0, run.glyphs.length - 1);
}

function textPath(font: FKFont, text: string, x: number, baseline: number, sizeMm: number, align: "left" | "center" = "left", tracking = 0) {
  const run = font.layout(text);
  const s = sizeMm / font.unitsPerEm;
  let cx = align === "center" ? x - textWidth(font, text, sizeMm, tracking) / 2 : x;
  const out: string[] = [];
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const ox = cx + pos.xOffset * s;
    const oy = baseline - pos.yOffset * s;
    const P = (px: number, py: number) => `${r2(ox + px * s)} ${r2(oy - py * s)}`;
    for (const c of g.path.commands) {
      const a = c.args;
      switch (c.command) {
        case "moveTo": out.push(`M${P(a[0], a[1])}`); break;
        case "lineTo": out.push(`L${P(a[0], a[1])}`); break;
        case "quadraticCurveTo": out.push(`Q${P(a[0], a[1])} ${P(a[2], a[3])}`); break;
        case "bezierCurveTo": out.push(`C${P(a[0], a[1])} ${P(a[2], a[3])} ${P(a[4], a[5])}`); break;
        case "closePath": out.push("Z"); break;
      }
    }
    cx += pos.xAdvance * s + tracking * sizeMm;
  });
  return out.join("");
}

function wrap(font: FKFont, text: string, sizeMm: number, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (textWidth(font, t, sizeMm) <= maxW || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ─────────────── Basit geometri ─────────────── */

const rect = (x: number, y: number, w: number, h: number) => `M${r2(x)} ${r2(y)}H${r2(x + w)}V${r2(y + h)}H${r2(x)}Z`;

/** Yalnızca mutlak M/L/C/Z içeren 100×100 yaprak yolunu taşı/döndür/ölçekle. */
function placePath(d: string, cx: number, cy: number, size: number, rotDeg: number) {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const k = size / 100;
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, a, b) => {
    const x = (Number(a) - 50) * k;
    const y = (Number(b) - 50) * k;
    return `${r2(cx + x * cos - y * sin)} ${r2(cy + x * sin + y * cos)}`;
  });
}

/* ─────────────── Site adresi / QR ─────────────── */

export function qrMatrix(url: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data as unknown as ArrayLike<number | boolean>;
  return { n, dark: (r: number, c: number) => !!data[r * n + c] };
}

/** QR modüllerini satır bazında birleştirilmiş tek bir yol olarak üretir. */
function qrPath(url: string, x: number, y: number, size: number) {
  const { n, dark } = qrMatrix(url);
  const m = size / n;
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!dark(r, c)) { c++; continue; }
      const start = c;
      while (c < n && dark(r, c)) c++;
      parts.push(rect(x + start * m, y + r * m, (c - start) * m, m));
    }
  }
  return { d: parts.join(""), modules: n, moduleMm: m };
}

/* ─────────────── Yüzler ─────────────── */

function splitBrand(name: string) {
  const m = name.trim().match(/^(\S+)\s+(.+)$/);
  return m ? [m[1], m[2]] : [name.trim(), ""];
}

export interface CardInput {
  content: SiteContent;
  url: string;
  isDraft: boolean;
}

export function buildFront({ content, isDraft }: CardInput): CardFace {
  const { serif, sans } = loadFonts();
  const { widthMm: w, heightMm: h, bleedMm: b } = content.card;
  const W = w + 2 * b;
  const H = h + 2 * b;
  const shapes: Shape[] = [{ d: rect(0, 0, W, H), fill: COLORS.forest }];

  // Yumuşak koyu köşe
  shapes.push({ d: placePath(LEAF.cinar, W * 0.92, H * 0.95, h * 1.25, -30), fill: COLORS.forestDeep, opacity: 0.55 });
  // İncelikli çınar yaprakları (taşma alanına uzanır)
  const leaves: [number, number, number, number, number][] = [
    [W * 0.9, H * 0.2, h * 0.55, 18, 0.22],
    [W * 0.08, H * 0.88, h * 0.5, -32, 0.18],
    [W * 0.78, H * 0.9, h * 0.38, 40, 0.16],
    [W * 0.14, H * 0.12, h * 0.3, -12, 0.12],
  ];
  for (const [x, y, s, rot, op] of leaves) {
    shapes.push({ d: placePath(LEAF.cinar, x, y, s, rot), stroke: COLORS.gold, strokeWidth: 0.22, opacity: op });
    shapes.push({ d: placePath(LEAF.cinarVeins, x, y, s, rot), stroke: COLORS.gold, strokeWidth: 0.14, opacity: op * 0.8 });
  }

  const [main, rest] = splitBrand(content.general.brandName);
  const cx = W / 2;
  let mainSize = h * 0.3;
  while (textWidth(serif, main, mainSize) > w * 0.8 && mainSize > 4) mainSize -= 0.3;
  const mainBase = H / 2 + mainSize * 0.18;
  shapes.push({ d: textPath(serif, main, cx, mainBase, mainSize, "center"), fill: COLORS.cream });
  // Altın ince çizgi
  shapes.push({ d: rect(cx - 6, mainBase + h * 0.07, 12, 0.25), fill: COLORS.gold });
  if (rest) {
    let restSize = h * 0.068;
    while (textWidth(sans, rest.toLocaleUpperCase("tr"), restSize, 0.22) > w * 0.8 && restSize > 1.5) restSize -= 0.1;
    shapes.push({
      d: textPath(sans, rest.toLocaleUpperCase("tr"), cx, mainBase + h * 0.07 + restSize * 2.1, restSize, "center", 0.22),
      fill: COLORS.cream,
      opacity: 0.92,
    });
  }
  // Küçük yaprak işareti
  shapes.push({ d: placePath(LEAF.cinar, cx, mainBase - mainSize * 1.05, h * 0.11, 0), fill: COLORS.gold });

  if (isDraft) addDraftMark(shapes, sans, b, w);
  return { width: W, height: H, bleed: b, shapes };
}

export function buildBack({ content, url, isDraft }: CardInput): CardFace & { qr: { modules: number; moduleMm: number; sizeMm: number } } {
  const { serif, sans } = loadFonts();
  const { widthMm: w, heightMm: h, bleedMm: b, showPhone } = content.card;
  const W = w + 2 * b;
  const H = h + 2 * b;
  const shapes: Shape[] = [{ d: rect(0, 0, W, H), fill: COLORS.paper }];

  // QR: boş alanı (quiet zone) en az 4 modül; QR alanı düz beyaz, üzerine hiçbir şey binmez.
  const margin = Math.max(3.5, h * 0.07);
  const qrBox = Math.min(h - 2 * margin, w * 0.46);
  const { n } = qrMatrix(url);
  const moduleMm = qrBox / (n + 8);
  const qrSize = moduleMm * n;
  const boxX = b + margin;
  const boxY = b + (h - qrBox) / 2;
  shapes.push({ d: rect(boxX, boxY, qrBox, qrBox), fill: "#FFFFFF" });
  const qp = qrPath(url, boxX + moduleMm * 4, boxY + moduleMm * 4, qrSize);
  shapes.push({ d: qp.d, fill: COLORS.qrDark });

  // Sağ blok: marka, yönerge, telefon
  const tx = boxX + qrBox + Math.max(3, w * 0.04);
  const tw = b + w - margin - tx;
  const [main, rest] = splitBrand(content.general.brandName);
  let y = b + h * 0.3;
  let mainSize = h * 0.14;
  while (textWidth(serif, main, mainSize) > tw && mainSize > 3) mainSize -= 0.2;
  shapes.push({ d: textPath(serif, main, tx, y, mainSize), fill: COLORS.forest });
  if (rest) {
    y += mainSize * 0.62;
    let rs = h * 0.045;
    while (textWidth(sans, rest.toLocaleUpperCase("tr"), rs, 0.15) > tw && rs > 1.2) rs -= 0.05;
    shapes.push({ d: textPath(sans, rest.toLocaleUpperCase("tr"), tx, y, rs, "left", 0.15), fill: COLORS.forest });
  }
  y += h * 0.07;
  shapes.push({ d: rect(tx, y, 8, 0.25), fill: COLORS.gold });
  y += h * 0.1;
  const insSize = Math.min(2.6, h * 0.048);
  for (const line of wrap(sans, "Menü, yol tarifi ve iletişim için okutun", insSize, tw)) {
    shapes.push({ d: textPath(sans, line, tx, y, insSize), fill: COLORS.ink });
    y += insSize * 1.35;
  }
  const phone = content.contact.phone.trim();
  if (showPhone && phone) {
    y += insSize * 0.5;
    const ps = insSize * 1.1;
    if (y + ps < b + h - margin && textWidth(sans, phone, ps) <= tw) {
      shapes.push({ d: textPath(sans, phone, tx, y, ps), fill: COLORS.forest });
    }
  }
  if (isDraft) addDraftMark(shapes, sans, b, w, boxX + qrBox + 1);
  return { width: W, height: H, bleed: b, shapes, qr: { modules: n, moduleMm, sizeMm: qrBox } };
}

function addDraftMark(shapes: Shape[], sans: FKFont, b: number, w: number, minX = 0) {
  const label = "TASLAK · BASMAYIN";
  const s = 1.9;
  const tw = textWidth(sans, label, s, 0.12);
  const x = Math.max(minX, b + w - tw - 4);
  const y = b + 2.2;
  shapes.push({ d: rect(x - 1.2, y, tw + 2.4, s + 1.6), fill: COLORS.draft });
  shapes.push({ d: textPath(sans, label, x, y + s + 0.35, s, "left", 0.12), fill: "#FFFFFF" });
}

/* ─────────────── Çıktılar ─────────────── */

export function faceToSvg(face: CardFace, { showGuides = false } = {}) {
  const { width: W, height: H, bleed: b } = face;
  const body = face.shapes
    .map((s) => {
      const attrs = [
        `d="${s.d}"`,
        `fill="${s.fill ?? "none"}"`,
        s.stroke ? `stroke="${s.stroke}" stroke-width="${s.strokeWidth ?? 0.2}" stroke-linejoin="round"` : "",
        s.opacity !== undefined ? `opacity="${s.opacity}"` : "",
      ];
      return `<path ${attrs.filter(Boolean).join(" ")}/>`;
    })
    .join("");
  const guides = showGuides
    ? `<rect x="${b}" y="${b}" width="${r2(W - 2 * b)}" height="${r2(H - 2 * b)}" fill="none" stroke="#E0457B" stroke-width="0.15" stroke-dasharray="1 0.8"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(W)}mm" height="${r2(H)}mm" viewBox="0 0 ${r2(W)} ${r2(H)}">${body}${guides}</svg>`;
}

const MM = 72 / 25.4;
function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function facesToPdf(faces: CardFace[], meta: { title: string; isDraft: boolean }) {
  const doc = await PDFDocument.create();
  doc.setTitle(meta.title + (meta.isDraft ? " (TASLAK)" : ""));
  doc.setCreator("Çınar Cafe & Restaurant yönetim paneli");
  doc.setProducer("pdf-lib");
  for (const face of faces) {
    const page = doc.addPage([face.width * MM, face.height * MM]);
    const b = face.bleed * MM;
    page.setBleedBox(0, 0, face.width * MM, face.height * MM);
    page.setTrimBox(b, b, (face.width - 2 * face.bleed) * MM, (face.height - 2 * face.bleed) * MM);
    for (const s of face.shapes) {
      page.drawSvgPath(s.d, {
        x: 0,
        y: face.height * MM,
        scale: MM,
        color: s.fill ? hexToRgb(s.fill) : undefined,
        opacity: s.opacity,
        borderColor: s.stroke ? hexToRgb(s.stroke) : undefined,
        borderWidth: s.stroke ? (s.strokeWidth ?? 0.2) : undefined,
        borderOpacity: s.stroke ? s.opacity : undefined,
      });
    }
  }
  return doc.save();
}

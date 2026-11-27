// Tema desenleri, ağaç temalı duvar kâğıtları ve "örnek" dış cephe görselini üretir.
// Kullanım: node scripts/generate-theme-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { LEAF } from "../src/lib/leaves.mjs";

mkdirSync("public/themes", { recursive: true });
mkdirSync("public/samples", { recursive: true });

// Basit, tekrarlanabilir rastgele sayı üreteci
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/* ── Desenler (CSS mask olarak kullanılır; renk temadan gelir) ── */
const pattern = (shapes) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">${shapes}</svg>`;
const leafAt = (d, x, y, s, r, veins = "") =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -50)"><path d="${d}" fill="none" stroke="#000" stroke-width="${(1.6 / s).toFixed(2)}" stroke-linejoin="round"/>${veins ? `<path d="${veins}" fill="none" stroke="#000" stroke-width="${(1 / s).toFixed(2)}"/>` : ""}</g>`;

writeFileSync(
  "public/themes/cinar-pattern.svg",
  pattern(leafAt(LEAF.cinar, 44, 46, 0.42, -18, LEAF.cinarVeins) + leafAt(LEAF.cinar, 122, 120, 0.34, 24, LEAF.cinarVeins)),
);
writeFileSync(
  "public/themes/cam-pattern.svg",
  pattern(
    `<g fill="#000">` +
      [[40, 50, 0.32], [118, 112, 0.26], [130, 30, 0.18]]
        .map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s}) translate(-50 -50)" d="${LEAF.cam}"/>`)
        .join("") +
      `</g>`,
  ),
);
writeFileSync(
  "public/themes/mese-pattern.svg",
  pattern(leafAt(LEAF.mese, 46, 48, 0.42, -28, LEAF.meseVeins) + leafAt(LEAF.mese, 120, 118, 0.36, 32, LEAF.meseVeins)),
);

/* ── Duvar kâğıtları (katmanlı orman manzarası) ── */
function wallpaper(name, { sky, layers, shape, seed }) {
  const r = rng(seed);
  const W = 1600;
  const H = 1200;
  let g = "";
  layers.forEach((color, li) => {
    const base = 560 + li * 170;
    const count = 14 - li * 2;
    let trees = "";
    for (let i = 0; i < count; i++) {
      const x = (i / count) * W + r() * 90 - 20;
      const s = (1.6 + li * 0.9) * (0.8 + r() * 0.5);
      const y = base + r() * 40;
      if (shape === "cam") {
        trees += `<path transform="translate(${x.toFixed(0)} ${(y - 50 * s).toFixed(0)}) scale(${s.toFixed(2)}) translate(-50 -50)" d="${LEAF.cam}"/>`;
      } else {
        // geniş taçlı ağaç: gövde + yuvarlak taç kümeleri
        const cr = 34 * s;
        trees += `<rect x="${(x - 3 * s).toFixed(0)}" y="${(y - cr).toFixed(0)}" width="${(6 * s).toFixed(0)}" height="${(cr + 40).toFixed(0)}"/>`;
        trees += `<circle cx="${x.toFixed(0)}" cy="${(y - cr * 1.4).toFixed(0)}" r="${cr.toFixed(0)}"/>`;
        trees += `<circle cx="${(x - cr * 0.7).toFixed(0)}" cy="${(y - cr).toFixed(0)}" r="${(cr * 0.75).toFixed(0)}"/>`;
        trees += `<circle cx="${(x + cr * 0.75).toFixed(0)}" cy="${(y - cr * 1.05).toFixed(0)}" r="${(cr * 0.8).toFixed(0)}"/>`;
      }
    }
    g += `<g fill="${color}">${trees}<rect x="0" y="${base + 30}" width="${W}" height="${H - base}"/></g>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#s)"/>${g}</svg>`;
  writeFileSync(`public/themes/${name}-wallpaper.svg`, svg);
}

wallpaper("cinar", { sky: ["#DCE3CF", "#B9C6A2"], layers: ["#9DAF84", "#6F8A5A", "#47613B", "#2C4127"], shape: "round", seed: 7 });
wallpaper("cam", { sky: ["#E3E6E1", "#C3CCC4"], layers: ["#9FB0A4", "#6E8577", "#3E5A4A", "#1F3A2D"], shape: "cam", seed: 11 });
wallpaper("mese", { sky: ["#EFE3CC", "#D8C3A0"], layers: ["#B9A27C", "#8E7652", "#65553A", "#3E3524"], shape: "round", seed: 23 });

/* ── Örnek dış cephe görseli (gerçek fotoğraf yüklenene kadar) ── */
writeFileSync(
  "public/samples/ornek-dis-cephe.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D6C0"/><stop offset="1" stop-color="#8FA67F"/></linearGradient>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9DFC9"/><stop offset="1" stop-color="#CDBB98"/></linearGradient>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<g fill="#4D6B3E">${[...Array(12)].map((_, i) => `<circle cx="${i * 150 + 40}" cy="${330 + (i % 3) * 30}" r="${120 + (i % 4) * 20}"/>`).join("")}</g>
<g fill="#2F4A2C">${[...Array(9)].map((_, i) => `<circle cx="${i * 200 + 90}" cy="${430 + (i % 2) * 40}" r="${110 + (i % 3) * 25}"/>`).join("")}</g>
<rect x="430" y="470" width="740" height="340" rx="6" fill="url(#wall)"/>
<rect x="400" y="440" width="800" height="44" rx="4" fill="#6E4A2C"/>
${[0, 1, 2, 3].map((i) => `<rect x="${480 + i * 170}" y="540" width="120" height="150" rx="4" fill="#3B2A1A" opacity=".75"/>`).join("")}
<rect x="0" y="800" width="1600" height="200" fill="#5B6E45"/>
<rect x="0" y="0" width="1600" height="1000" fill="#000" opacity=".08"/>
<g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
<rect x="520" y="860" width="560" height="84" rx="42" fill="#111" opacity=".55"/>
<text x="800" y="913" font-size="34" font-weight="700" fill="#fff" letter-spacing="4">ÖRNEK GÖRSEL</text>
</g>
</svg>`,
);

console.log("Tema görselleri üretildi.");

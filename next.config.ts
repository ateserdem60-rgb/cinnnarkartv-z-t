import type { NextConfig } from "next";

// Supabase Storage'dan gelen görsellerin next/image ile optimize edilebilmesi için
// proje adresinin alan adını izinli uzak kaynaklara ekliyoruz.
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns.push({
      protocol: "https",
      hostname: u.hostname,
      pathname: "/storage/v1/object/public/**",
    });
  } catch {
    /* geçersiz adres: .env doğrulaması ayrıca uyarır */
  }
}

const nextConfig: NextConfig = {
  // Klasik dinamik işleme: ziyaretçi her istekte son yayımlanan içeriği görür.
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1440, 1920],
    qualities: [70, 75],
    remotePatterns,
    localPatterns: [
      { pathname: "/api/media/**" },
      { pathname: "/samples/**" },
      { pathname: "/themes/**" },
      { pathname: "/mekan/**" },
    ],
  },
  poweredByHeader: false,
  // Kartvizit PDF'i için font dosyaları sunucu paketine dahil edilsin.
  outputFileTracingIncludes: {
    "/api/admin/card": ["./assets/fonts/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

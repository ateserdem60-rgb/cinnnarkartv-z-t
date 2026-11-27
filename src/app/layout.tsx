import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// Türkçe karakterler (ç, ğ, ı, İ, ö, ş, ü) için latin-ext alt kümesi gerekli.
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "latin-ext"], weight: ["500", "600", "700"], display: "swap", preload: false });
const dmsans = DM_Sans({ variable: "--font-dmsans", subsets: ["latin", "latin-ext"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Çınar Cafe & Restaurant",
  description: "Menü, yol tarifi ve iletişim — Çınar Cafe & Restaurant, Midyat.",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E3A2A",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${playfair.variable} ${dmsans.variable} ${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

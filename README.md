# Çınar Cafe & Restaurant — QR sitesi

Kartvizitteki QR okutulunca açılan mobil öncelikli site (`/`), ayrı menü sayfası (`/menu`),
yönetim paneli (`/admin`), QR ve kartvizit çıktıları. Next.js 16 · TypeScript · Tailwind CSS 4.

## Yayınlama — Supabase gerekmez

Sitenin bütün içeriği **dosyaların içindedir**; veritabanı veya ek hesap gerekmez:

| İçerik | Dosya |
|---|---|
| Menü (kategoriler, ürünler) | `src/lib/content.ts` → `SEED_MENU` |
| Kapak slaytı (önce giriş, sonra yemekler, 2 sn) | `src/lib/content.ts` → `SEED_SLIDES`, görseller `public/slayt/` |
| Mekân fotoğrafı | `public/mekan/cinar-dis-cephe.png` |
| Telefon, adres, Google/Apple konum bağlantıları | `src/lib/content.ts` → `createDefaultContent()` ve `VERIFIED_MAPS` |
| Tema, renkler, yazı tipi | `src/lib/content.ts` → `PRESETS`, `createDefaultContent()` |

**Adımlar:**

1. GitHub'da yeni bir depo açın; zip'ten çıkan dosyaları **klasör yapısını bozmadan** yükleyin
   (en kolayı GitHub Desktop; web'de dosyaları *Drag files here* alanına sürükleyin, *choose your files* kullanmayın).
2. Vercel → *Add New → Project* → depoyu seçin → **Deploy**. Hiçbir ortam değişkeni girmeniz gerekmez.
3. Vercel *Settings → Build and Deployment* → **Framework Preset: Next.js** olmalı.

Site açıldığında menü, slayt, konum ve telefon hazır gelir.

> Vercel'de daha önce Supabase değişkenleri girdiyseniz (`NEXT_PUBLIC_SUPABASE_URL` vb.) **silin** ve Redeploy yapın;
> aksi halde site içeriği dosyadan değil Supabase'ten okunur.

### İçerik nasıl değişir?

Menü, slayt veya iletişim bilgisi değişecekse `src/lib/content.ts` (ve gerekirse `public/` altındaki görseller)
güncellenir, dosyalar GitHub'a yeniden yüklenir; Vercel otomatik olarak yeniden yayınlar. QR adresi değişmez.

### Yönetim paneli bu kurulumda

Supabase yokken panel **salt okunurdur**: içerik görüntülenir, QR ve kartvizit PDF'i indirilebilir, ama kaydetme kapalıdır.
Panele girmek isterseniz Vercel *Environment Variables*'a şu üç değeri ekleyin (bilgisayarda `npm run admin:create -- e-posta`
komutu `.env.local` dosyasına üretir; oradan kopyalayın): `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.

## Kartvizit ve QR

- QR yalnızca sitenin kök adresini içerir; içerik değişse de aynı QR çalışır.
- Kalıcı adres belli olunca `src/lib/content.ts` içinde `card.siteUrl` alanına (`https://…`) yazın
  ya da Vercel'de `NEXT_PUBLIC_SITE_URL` tanımlayın. Adres tanımlanmadan çıktılar “TASLAK · BASMAYIN” işaretlidir.
- Kartvizit: 85×55 mm, 3 mm taşma payı, iki sayfalı baskı PDF'i (yazılar vektör).
- Basmadan önce PDF'i %100 ölçekte yazdırıp iPhone ve Android kamerayla 20–30 cm'den okutun.

## Yerelde çalıştırma

```powershell
npm install
npm run admin:create -- yonetici@ornek.com   # isteğe bağlı: paneli yerelde kullanmak için
npm run dev                                   # http://localhost:3000  ·  panel: /admin
```

Yerelde panel tam çalışır (içerik `data/` klasörüne kaydedilir); bu klasör GitHub'a yüklenmez.

## İsteğe bağlı: panelden canlı düzenleme (Supabase)

Panelden kaydedip yayınlamak istenirse Supabase eklenebilir: `supabase/schema.sql` çalıştırılır,
`.env.example` içindeki Supabase değişkenleri Vercel'e girilir. Bu, yukarıdaki dosya tabanlı kurulum için gerekli değildir.

## Güvenlik

- Panel ve tüm yazma/yükleme uçları sunucuda yönetici oturumunu doğrular (HMAC imzalı, httpOnly çerez).
- Yüklemelerde dosya türü ilk baytlardan doğrulanır; bağlantılar yalnızca `https` ve izinli sağlayıcılar.
- Gizli değerler yalnızca sunucuda tutulur; `.env.local` GitHub'a yüklenmez.

## Komutlar

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck` · `npm run lint` ·
`npm run admin:create -- e-posta` · `npm run assets`

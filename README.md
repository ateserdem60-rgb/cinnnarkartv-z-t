# Çınar Cafe & Restaurant — QR sitesi, yönetim paneli ve kartvizit

Kartvizitteki QR okutulunca açılan mobil öncelikli site (`/`), ayrı menü sayfası (`/menu`) ve
güvenli yönetim paneli (`/admin`). Next.js 16 · TypeScript · Tailwind CSS 4 · Supabase (isteğe bağlı).

## Hızlı başlangıç (yerel)

```powershell
npm install
copy .env.example .env.local
npm run admin:create -- yonetici@alanadiniz.com   # şifre sorulur; .env.local'e özet + SESSION_SECRET yazılır
npm run dev                                        # http://localhost:3000  ·  panel: /admin
```

Yerel kipte içerik `data/content.*.json`, yüklemeler `data/uploads/` altında kalıcı tutulur
(`DATA_DIR` ile değiştirilebilir). Bu kip **kalıcı diskli** bir sunucu (VPS/Docker) içindir.

## Üretim: GitHub + Vercel + Supabase

> Vercel'de **Supabase zorunludur.** Vercel'in diski kalıcı değildir; yerel kipte kaydedilen içerik ve
> yüklemeler kaybolur. Supabase'in ücretsiz planı bu site için yeterlidir.

1. **GitHub:** Yeni bir depo (repository) açın, bu klasörün içeriğini yükleyin
   (GitHub Desktop ya da web'de *Add file → Upload files*). `.env.local`, `node_modules`, `.next`, `data` yüklenmez.
2. **Supabase:** [supabase.com](https://supabase.com) → *New project* (bölge: Frankfurt/eu-central önerilir).
   - *SQL Editor* → [`supabase/schema.sql`](supabase/schema.sql) içeriğini yapıştırıp **Run** (içerik tablosu + `media` deposu).
   - *Authentication → Users → Add user → Create new user*: e-posta + şifre, **Auto Confirm User** işaretli. Bu sizin yönetici hesabınızdır.
   - *Project Settings → API*: `Project URL`, `anon public` ve `service_role` anahtarlarını kopyalayın.
3. **Vercel:** [vercel.com](https://vercel.com) → *Add New → Project* → GitHub deposunu seçin (Framework: Next.js, ayar değiştirmeyin).
   *Environment Variables* bölümüne **deploy etmeden önce** şunları girin:

   | Değişken | Değer |
   |---|---|
   | `SESSION_SECRET` | En az 32 karakterlik rastgele metin (aşağıdaki komutla üretin) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase *Project URL* |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase *anon public* anahtarı |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase *service_role* anahtarı (**gizli**) |
   | `ADMIN_EMAILS` | 2. adımda oluşturduğunuz yönetici e-postası |
   | `NEXT_PUBLIC_SITE_URL` | Kalıcı adres, ör. `https://cinarcafe.com.tr` (yoksa şimdilik boş) |

   `SESSION_SECRET` üretmek için: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
4. **Deploy** → `https://<proje>.vercel.app/admin` adresinden Supabase'deki e-posta/şifre ile girin.
   İçeriği girip **Yayınla**'ya basın.
5. Alan adını Vercel → *Settings → Domains*'e ekleyin. Panel → **Kartvizit ve QR** → *Üretim adresi*'ne
   bu https adresini girin → *Taslağı Kaydet*. “Taslak” uyarısı kalkınca QR ve baskı PDF'ini indirin.

`NEXT_PUBLIC_…` değişkenlerini sonradan değiştirirseniz Vercel'de **Redeploy** yapın (derleme sırasında okunurlar).
Büyük dosyalar (fotoğraf, PDF, ≤ 50 MB video) tarayıcıdan doğrudan Supabase Storage'a yüklenir;
sunucu yetkiyi verir ve yüklenen dosyanın gerçek türünü doğrular.

> QR yalnızca kök adresi (`https://alanadiniz/`) içerir. Menü, video, konum veya tema değişse de aynı QR çalışır.
> Alan adını değiştirmeyin; değişirse eski adresi yenisine yönlendirin.

## İlk içerik girişi (panel)

| Bölüm | Yapılacak |
|---|---|
| Genel | Dış cephe fotoğrafını yükleyin, alternatif metni yazın, fotoğrafa dokunarak mobil odak noktasını seçin, başlık fontunu seçin. |
| Görünüm | Hazır tema (Çınar Gölgesi, Çam Ormanı, Meşe ve Toprak, Orman Akşamı) → renk, saydamlık, karartma, arka plan (düz/desen/duvar kâğıdı/kendi görseliniz). |
| Menü | Kategori/ürün ekle-düzenle-sırala-gizle. Fiyat boşsa gösterilmez. İsteğe bağlı PDF menü. |
| Videolar | MP4 yükleyin veya YouTube/Vimeo bağlantısı girin; kapak, sıra, görünürlük. |
| İletişim ve Konum | Telefon, adres, Google Maps ve Apple Haritalar bağlantıları (boş olanın düğmesi gizlenir). |
| Kartvizit ve QR | Üretim adresi, ölçü (varsayılan 85×55 mm) ve taşma payı (varsayılan 3 mm), QR ve PDF indirme. |

Akış: **Taslağı Kaydet** → **Önizle** (mobil/masaüstü) → **Yayınla**. Ziyaretçiler yalnızca son yayımlanan sürümü görür.

## Üretime geçmeden doldurulması gerekenler

- [ ] Gerçek dış cephe fotoğrafı + alternatif metin (şu an **“Örnek görsel”** etiketli yer tutucu var)
- [ ] Google Maps ve Apple Haritalar bağlantıları (şu an **demo**: adres araması açar)
- [ ] Adres ve telefonun doğruluğu (Google işletme kaydından alındı: 0547 459 00 47, Işıklar / Midyat Otogar yanı)
- [ ] Menü fiyatları isteniyorsa (menü fiyatsız aktarıldı) ve varsa PDF menü
- [ ] Tanıtım videosu (henüz yok)
- [ ] Üretim alan adı → panelde *Üretim adresi* (girilmeden kartvizit “TASLAK · BASMAYIN” basılır)
- [ ] Yerel test hesabını silin: `.env.local` içindeki `test-admin@cinar.test` satırları yalnızca geliştirme içindir

## Güvenlik notları

- Panel sayfaları ve tüm yazma/yükleme uçları sunucuda yönetici oturumunu doğrular (HMAC imzalı, httpOnly, SameSite=Lax çerez, 12 saat).
  Durum değiştiren isteklerde köken kontrolü ve girişte 5 hatalı deneme / 15 dk kilit vardır.
- Yüklemeler dosyanın ilk baytlarından tür tespitiyle doğrulanır: görsel (JPG/PNG/WEBP/AVIF ≤ 8 MB), PDF ≤ 15 MB, MP4 ≤ 50 MB.
- Bağlantılar yalnızca `https` ve izinli sağlayıcılar: Google Maps alan adları, `maps.apple.com`, YouTube, Vimeo.
- `SUPABASE_SERVICE_ROLE_KEY` ve `SESSION_SECRET` yalnızca sunucudadır; tarayıcı paketine girmez.

## Kartvizit

- Ön yüz: orman yeşili zemin, ince çınar yaprağı deseni, “Çınar / Cafe & Restaurant”.
- Arka yüz: açık zemin, düz beyaz sessiz alan içinde koyu QR (4 modül boşluk; üzerine logo/desen/gölge yok),
  “Menü, yol tarifi ve iletişim için okutun” ve telefon.
- PDF: iki sayfa, taşma dahil medya, `TrimBox`/`BleedBox` tanımlı, yazılar vektör yola çevrilmiş (font gömme sorunu yok).
- Baskı öncesi: PDF'i %100 ölçekte yazdırıp iPhone ve Android kamerayla 20–30 cm'den okutun.

## Komutlar

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck` · `npm run lint` ·
`npm run admin:create -- e-posta` · `npm run assets` (tema SVG'lerini yeniden üretir)

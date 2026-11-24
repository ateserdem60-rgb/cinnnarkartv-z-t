"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { IssuesCtx, type Issue } from "./ui";
import { AppearanceTab, CardTab, ContactTab, GeneralTab, MenuTab, VideosTab, type Setter } from "./tabs";

const TABS = [
  { key: "genel", label: "Genel", prefix: ["general"] },
  { key: "gorunum", label: "Görünüm", prefix: ["appearance"] },
  { key: "menu", label: "Menü", prefix: ["menu"] },
  { key: "videolar", label: "Videolar", prefix: ["videos"] },
  { key: "iletisim", label: "İletişim ve Konum", prefix: ["contact"] },
  { key: "kartvizit", label: "Kartvizit ve QR", prefix: ["card"] },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type Status = { kind: "idle" | "busy" | "ok" | "error"; text: string };

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";

export function AdminApp({ email }: { email: string }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [tab, setTab] = useState<TabKey>("genel");
  const [times, setTimes] = useState<{ draft: string | null; published: string | null }>({ draft: null, published: null });
  const [preview, setPreview] = useState<null | "mobile" | "desktop">(null);
  const [savedVersion, setSavedVersion] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/api/admin/content", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) return location.assign("/admin/login");
        const d = await r.json();
        if (!d.ok) throw new Error(d.message);
        setContent(d.content);
        setTimes({ draft: d.draftUpdatedAt, published: d.publishedAt });
      })
      .catch(() => setStatus({ kind: "error", text: "İçerik yüklenemedi. Sayfayı yenileyin." }));
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set: Setter = useCallback((fn) => {
    setContent((c) => (c ? fn(c) : c));
    setDirty(true);
  }, []);

  const handleIssues = (list: Issue[]) => {
    setIssues(list);
    const first = list[0]?.path.split(".")[0];
    const t = TABS.find((x) => (x.prefix as readonly string[]).includes(first));
    if (t) setTab(t.key);
  };

  async function save(): Promise<boolean> {
    if (!content) return false;
    setStatus({ kind: "busy", text: "Taslak kaydediliyor…" });
    try {
      const r = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await r.json();
      if (r.status === 401) {
        setStatus({ kind: "error", text: "Oturumunuz sona ermiş. Değişikliklerinizi kaybetmemek için yeni sekmede giriş yapıp tekrar kaydedin." });
        return false;
      }
      if (!d.ok) {
        handleIssues(d.issues ?? []);
        setStatus({ kind: "error", text: d.message });
        return false;
      }
      setIssues([]);
      setDirty(false);
      setTimes((t) => ({ ...t, draft: d.draftUpdatedAt }));
      setSavedVersion((v) => v + 1);
      setStatus({ kind: "ok", text: "Taslak kaydedildi." });
      return true;
    } catch {
      setStatus({ kind: "error", text: "Bağlantı hatası. Taslak kaydedilemedi." });
      return false;
    }
  }

  async function openPreview(mode: "mobile" | "desktop") {
    if (dirty && !(await save())) return;
    setPreview(mode);
    setTimeout(() => iframeRef.current?.contentWindow?.location.reload(), 0);
  }

  async function publish() {
    if (dirty && !(await save())) return;
    if (!confirm("Kaydedilmiş taslak yayımlansın mı? Ziyaretçiler hemen yeni içeriği görecek.")) return;
    setStatus({ kind: "busy", text: "Yayımlanıyor…" });
    try {
      const r = await fetch("/api/admin/publish", { method: "POST" });
      const d = await r.json();
      if (!d.ok) {
        handleIssues(d.issues ?? []);
        setStatus({ kind: "error", text: d.message });
        return;
      }
      setTimes((t) => ({ ...t, published: d.publishedAt }));
      setStatus({ kind: "ok", text: "Yayımlandı. Site ve QR adresi güncel içeriği gösteriyor." });
    } catch {
      setStatus({ kind: "error", text: "Bağlantı hatası. Yayımlanamadı." });
    }
  }

  async function logout() {
    if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    location.assign("/admin/login");
  }

  const busy = status.kind === "busy";

  return (
    <IssuesCtx.Provider value={issues}>
      <div className="admin pb-28 lg:pb-10">
        <header className="sticky top-0 z-30 border-b border-[#e2dccd] bg-[#f1eee6]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
            <div className="mr-auto min-w-0 flex-1">
              <p className="font-bold">Yönetim Paneli</p>
              <p className="truncate text-xs text-[#55604f]">
                {email} · Taslak: {fmtTime(times.draft)} · Yayın: {fmtTime(times.published)}
              </p>
            </div>
            <a className="abtn" href="/" target="_blank" rel="noopener">Siteyi aç</a>
            <button type="button" className="abtn" onClick={logout}>Çıkış</button>
          </div>
          <nav aria-label="Panel bölümleri" className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
            {TABS.map((t) => {
              const hasErr = issues.some((i) => (t.prefix as readonly string[]).includes(i.path.split(".")[0]));
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-current={tab === t.key ? "page" : undefined}
                  onClick={() => setTab(t.key)}
                  className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold whitespace-nowrap ${tab === t.key ? "bg-[#1e3a2a] text-white" : "bg-white text-[#1b261e]"}`}
                >
                  {t.label}
                  {hasErr && <span className="ml-1 text-[#ff8a80]" aria-label="hata var">●</span>}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-3 pt-4">
          {status.text && (
            <p
              role={status.kind === "error" ? "alert" : "status"}
              className={`mb-4 rounded-xl p-3 text-sm font-semibold ${status.kind === "error" ? "bg-[#fde3e1] text-[#7d1a14]" : status.kind === "ok" ? "bg-[#e3efe5] text-[#1e3a2a]" : "bg-white"}`}
            >
              {status.text}
            </p>
          )}
          {issues.length > 0 && (
            <div className="mb-4 rounded-xl border border-[#e3b7b3] bg-white p-3 text-sm">
              <p className="font-semibold">Düzeltilmesi gereken alanlar:</p>
              <ul className="mt-1 list-disc pl-5">
                {issues.slice(0, 8).map((i) => (
                  <li key={i.path + i.message}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}

          {!content ? (
            <p className="p-8 text-center" role="status">Yükleniyor…</p>
          ) : (
            <div className={preview ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}>
              <div className="min-w-0">
                {tab === "genel" && <GeneralTab c={content} set={set} />}
                {tab === "gorunum" && <AppearanceTab c={content} set={set} />}
                {tab === "menu" && <MenuTab c={content} set={set} />}
                {tab === "videolar" && <VideosTab c={content} set={set} />}
                {tab === "iletisim" && <ContactTab c={content} set={set} />}
                {tab === "kartvizit" && <CardTab c={content} set={set} savedVersion={savedVersion} dirty={dirty} />}
              </div>
              {preview && (
                <aside aria-label="Önizleme" className="min-w-0">
                  <div className="sticky top-28 rounded-2xl border border-[#e2dccd] bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="mr-auto font-bold">Önizleme (kaydedilmiş taslak)</p>
                      <button type="button" className={`abtn ${preview === "mobile" ? "abtn-primary" : ""}`} aria-pressed={preview === "mobile"} onClick={() => setPreview("mobile")}>Mobil</button>
                      <button type="button" className={`abtn ${preview === "desktop" ? "abtn-primary" : ""}`} aria-pressed={preview === "desktop"} onClick={() => setPreview("desktop")}>Masaüstü</button>
                      <button type="button" className="abtn" onClick={() => iframeRef.current?.contentWindow?.location.reload()}>Yenile</button>
                      <button type="button" className="abtn" onClick={() => setPreview(null)}>Kapat</button>
                    </div>
                    <div className="overflow-auto rounded-xl bg-[#d9d4c6] p-2">
                      <div
                        className="mx-auto origin-top overflow-hidden rounded-[18px] bg-white shadow-lg"
                        style={preview === "mobile" ? { width: 390, height: 760 } : { width: "100%", height: 760 }}
                      >
                        <iframe ref={iframeRef} src="/preview" title="Site önizlemesi" className="h-full w-full border-0" />
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>

        {/* İşlem çubuğu: mobilde altta, masaüstünde de sabit */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e2dccd] bg-[#f1eee6]/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
          <p className="mb-1.5 text-xs sm:hidden" aria-hidden>
            {dirty ? <span className="font-semibold text-[#8a5a00]">● Kaydedilmemiş değişiklikler</span> : <span className="text-[#55604f]">Tüm değişiklikler kaydedildi</span>}
          </p>
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <p className="mr-auto hidden text-sm sm:block" aria-live="polite">
              {dirty ? <span className="font-semibold text-[#8a5a00]">● Kaydedilmemiş değişiklikler</span> : <span className="text-[#55604f]">Tüm değişiklikler kaydedildi</span>}
            </p>
            <button type="button" className="abtn flex-1 px-2 sm:flex-none sm:px-4" disabled={busy || !content} onClick={save}>Taslağı Kaydet</button>
            <button type="button" className="abtn flex-1 px-2 sm:flex-none sm:px-4" disabled={busy || !content} onClick={() => openPreview(preview ?? "mobile")}>Önizle</button>
            <button type="button" className="abtn abtn-gold flex-1 px-2 sm:flex-none sm:px-4" disabled={busy || !content} onClick={publish}>Yayınla</button>
          </div>
        </div>
      </div>
    </IssuesCtx.Provider>
  );
}

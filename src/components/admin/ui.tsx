"use client";

import { createContext, useContext, useId, useRef, useState } from "react";

/* ─────────────── Doğrulama hataları bağlamı ─────────────── */
export type Issue = { path: string; message: string };
export const IssuesCtx = createContext<Issue[]>([]);
export function useIssue(path: string) {
  const issues = useContext(IssuesCtx);
  return issues.find((i) => i.path === path || i.path.startsWith(path + "."))?.message;
}

export function Card({ title, children, desc }: { title: string; desc?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e2dccd] bg-white/80 p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-[#55604f]">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  path,
  hint,
  children,
}: {
  label: string;
  path?: string;
  hint?: React.ReactNode;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const err = useIssue(path ?? "__none__");
  const describedBy = [hint ? `${id}-h` : "", err ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block">{label}</label>
      {children({ id, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy })}
      {hint && <p id={`${id}-h`} className="mt-1 text-sm text-[#55604f]">{hint}</p>}
      {err && <p id={`${id}-e`} role="alert" className="mt-1 text-sm font-semibold text-[#b3261e]">{err}</p>}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  path,
  hint,
  type = "text",
  placeholder,
  multiline,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  path?: string;
  hint?: React.ReactNode;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <Field label={label} path={path} hint={hint}>
      {(p) =>
        multiline ? (
          <textarea {...p} rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...p} type={type} value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
        )
      }
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
      <input type="checkbox" className="h-5 w-5 accent-[#1e3a2a]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <label htmlFor={id}>{label}</label>
        <span className="text-sm tabular-nums">{format(value)}</span>
      </div>
      <input id={id} type="range" className="h-11 w-full accent-[#1e3a2a]" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/* ─────────────── Dosya yükleme (ilerleme durumlu) ─────────────── */
type Kind = "image" | "pdf" | "video";
const ACCEPT: Record<Kind, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  pdf: "application/pdf",
  video: "video/mp4",
};
const LIMIT_MB: Record<Kind, number> = { image: 8, pdf: 15, video: 50 };
const LABEL: Record<Kind, string> = { image: "JPG, PNG, WEBP veya AVIF", pdf: "PDF", video: "MP4" };

export function UploadButton({ kind, onUploaded, label = "Dosya yükle" }: { kind: Kind; onUploaded: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  /** XHR ile gönderir (yükleme yüzdesi için). */
  function send(method: string, url: string, body: FormData, headers: Record<string, string> = {}) {
    return new Promise<{ status: number; text: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
      xhr.onerror = () => reject(new Error("Bağlantı hatası. Lütfen tekrar deneyin."));
      xhr.send(body);
    });
  }
  const api = async (body: object) => {
    const r = await fetch("/api/admin/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 401) throw new Error("Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.");
    const d = await r.json();
    if (!d.ok) throw new Error(d.message || "Yükleme başarısız.");
    return d;
  };

  async function upload(file: File) {
    setError("");
    if (file.size > LIMIT_MB[kind] * 1024 * 1024) {
      setError(`Dosya çok büyük. En fazla ${LIMIT_MB[kind]} MB yükleyebilirsiniz.`);
      return;
    }
    setProgress(0);
    try {
      const start = await api({ step: "start", kind, size: file.size, type: file.type });
      if (start.mode === "supabase") {
        // Dosya doğrudan Supabase Storage'a gider (Vercel'in istek boyutu sınırına takılmaz).
        const fd = new FormData();
        fd.append("cacheControl", start.cacheControl);
        fd.append("", file);
        const up = await send("PUT", start.signedUrl, fd, { "x-upsert": "false", ...(start.apikey ? { apikey: start.apikey } : {}) });
        if (up.status < 200 || up.status >= 300) throw new Error("Depolama yüklemeyi reddetti. Dosya türünü ve boyutunu kontrol edin.");
        const done = await api({ step: "confirm", kind, path: start.path });
        onUploaded(done.url);
      } else {
        // Yerel kip: sunucuya çok parçalı gönderim
        const fd = new FormData();
        fd.append("kind", kind);
        fd.append("file", file);
        const r = await send("POST", "/api/admin/upload", fd);
        const res = JSON.parse(r.text);
        if (r.status === 401) throw new Error("Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.");
        if (r.status !== 200 || !res.ok) throw new Error(res.message || "Yükleme başarısız.");
        onUploaded(res.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <button type="button" className="abtn" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
        {progress !== null ? `Yükleniyor… %${progress}` : label}
      </button>
      <p className="mt-1 text-xs text-[#55604f]">{LABEL[kind]}, en fazla {LIMIT_MB[kind]} MB</p>
      {progress !== null && (
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded bg-[#e2dccd]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[#1e3a2a] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p role="alert" className="mt-1 text-sm font-semibold text-[#b3261e]">{error}</p>}
    </div>
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

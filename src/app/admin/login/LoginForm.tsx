"use client";

import { useState } from "react";

export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || !password) {
      setError("E-posta ve şifre gerekli.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (d.ok) location.assign("/admin");
      else setError(d.message || "Giriş başarısız.");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1 block">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="username" required aria-invalid={!!error || undefined} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!error || undefined} />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-[#b3261e]">{error}</p>}
      <button type="submit" className="abtn abtn-primary w-full" disabled={busy}>
        {busy ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}

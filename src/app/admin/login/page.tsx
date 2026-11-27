import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Yönetici Girişi", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="admin flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e2dccd] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-cormorant)" }}>Çınar · Yönetici Girişi</h1>
        <p className="mt-1 text-sm text-[#55604f]">Devam etmek için yönetici hesabınızla giriş yapın.</p>
        <LoginForm />
      </div>
    </main>
  );
}

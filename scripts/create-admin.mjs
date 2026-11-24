// Yerel kipte ilk yönetici hesabını oluşturur / şifresini değiştirir.
// Kullanım: npm run admin:create -- yonetici@ornek.com
// Şifre terminalde sorulur (ekrana yazılmaz) ve .env.local dosyasına scrypt özeti olarak kaydedilir.
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Kullanım: npm run admin:create -- yonetici@ornek.com");
  process.exit(1);
}

async function askPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD; // otomasyon için
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => {
    if (s.includes("Şifre")) rl.output.write(s);
  };
  const ask = (q) => new Promise((res) => rl.question(q, res));
  const p1 = await ask("Şifre (en az 10 karakter): ");
  rl.output.write("\n");
  const p2 = await ask("Şifre (tekrar): ");
  rl.output.write("\n");
  rl.close();
  if (p1 !== p2) throw new Error("Şifreler eşleşmiyor.");
  return p1;
}

const password = await askPassword();
if (password.length < 10) {
  console.error("Şifre en az 10 karakter olmalı.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
const stored = `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;

const file = ".env.local";
let env = existsSync(file) ? readFileSync(file, "utf8") : "";
const setVar = (k, v) => {
  const line = `${k}=${v}`;
  const re = new RegExp(`^${k}=.*$`, "m");
  env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
};
setVar("ADMIN_EMAIL", email);
setVar("ADMIN_PASSWORD_HASH", stored);
if (!/^SESSION_SECRET=.{32,}$/m.test(env)) setVar("SESSION_SECRET", randomBytes(32).toString("base64url"));
writeFileSync(file, env.trimStart());
console.log(`Yönetici kaydedildi: ${email} (.env.local). Sunucuyu yeniden başlatın.`);

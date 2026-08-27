import { redirect } from "next/navigation";
import { LoginForm } from "@web/components/auth/login-form";
import { getSessionToken } from "@web/lib/auth";

export default async function LoginPage() {
  const token = await getSessionToken();
  if (token) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__hero">
          <span className="topbar__eyebrow">FTY Koçluk</span>
          <h1>Gelişimi görünür kılan çalışma alanı.</h1>
          <p>
            Öğrenciler, planlar, görevler ve ilerleme verileri; sakin ve anlaşılır tek bir panelde.
          </p>
          <div className="auth-card__promise">
            <span>Planla</span>
            <span>Takip et</span>
            <span>Geliştir</span>
          </div>
        </div>

        <LoginForm />

        <div className="auth-hint">
          Demo hesap: <strong>coach@kocluk.local</strong>
          <br />
          Demo sifre: <strong>Demo1234!</strong>
          <br />
          MFA profil ayarlarindan acilabilir.
          <br />
          Sifre sifirlama akisi login altindaki baglanti ile acilir.
        </div>
      </section>
    </main>
  );
}

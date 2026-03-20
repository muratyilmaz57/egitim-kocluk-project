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
          <span className="topbar__eyebrow">Koç paneli girisi</span>
          <h1>Kocluk Platformu</h1>
          <p>
            Dashboard, ogrenci listesi ve analiz ekranlarina erismek icin giris yapin.
          </p>
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

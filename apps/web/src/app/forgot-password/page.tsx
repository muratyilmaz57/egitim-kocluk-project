import { ForgotPasswordForm } from "@web/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__hero">
          <span className="topbar__eyebrow">Sifre sifirlama</span>
          <h1>Baglanti gonder</h1>
          <p>Kayitli e-posta adresini gir. Hesap varsa sifre sifirlama baglantisi gonderilir.</p>
        </div>

        <ForgotPasswordForm />

        <div className="auth-hint">
          SMTP tanimli degilse gelistirme baglantisi ekranda gosterilir.
        </div>
      </section>
    </main>
  );
}

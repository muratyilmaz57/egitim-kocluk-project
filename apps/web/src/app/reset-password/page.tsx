import { ResetPasswordForm } from "@web/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__hero">
          <span className="topbar__eyebrow">Yeni sifre</span>
          <h1>Sifreni yenile</h1>
          <p>Guclu bir sifre belirle ve hesabina yeni sifre ile giris yap.</p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="auth-form">
            <div className="auth-error">Reset baglantisi eksik veya gecersiz.</div>
          </div>
        )}

        <div className="auth-hint">
          Baglanti 30 dakika gecerli olacak sekilde tasarlandi.
        </div>
      </section>
    </main>
  );
}

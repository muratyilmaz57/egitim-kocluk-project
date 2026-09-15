"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Profile = { fullName: string; email: string; phone: string | null; avatarUrl: string | null };

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("avatar"); let nextAvatar = avatarUrl;
      if (file instanceof File && file.size) {
        const upload = new FormData(); upload.set("file", file);
        const uploadResponse = await fetch("/api/uploads/student-avatar", { method: "POST", body: upload });
        const uploaded = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) throw new Error(uploaded?.message ?? "Profil resmi yüklenemedi.");
        nextAvatar = String(uploaded.filePath);
      }
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: data.get("fullName"), email: data.get("email"), phone: data.get("phone"), avatarUrl: nextAvatar }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Profil güncellenemedi.");
      setAvatarUrl(payload.avatarUrl ?? ""); setMessage("Profil bilgileriniz güncellendi."); router.refresh();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Profil güncellenemedi."); }
    finally { setSaving(false); }
  }
  const initials = profile.fullName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <form className="profile-form" onSubmit={submit}>
    <div className="profile-form__avatar"><span>{avatarUrl ? <img src={avatarUrl} alt="Profil resmi" /> : initials}</span><label><strong>Profil resmi</strong><small>JPG, PNG veya WebP · en fazla 3 MB</small><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" /></label></div>
    <div className="profile-form__grid"><label><span>Ad soyad</span><input name="fullName" defaultValue={profile.fullName} required minLength={2} /></label><label><span>E-posta adresi</span><input name="email" type="email" defaultValue={profile.email} required /></label><label><span>Telefon numarası</span><input name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="05xx xxx xx xx" /></label></div>
    <div className="profile-form__footer"><div>{error ? <span className="inline-error" role="alert">{error}</span> : null}{message ? <span className="inline-success">{message}</span> : null}</div><button className="primary-button" disabled={saving} type="submit">{saving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}</button></div>
  </form>;
}

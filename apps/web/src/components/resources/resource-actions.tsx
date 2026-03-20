"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ResourceRecord } from "@web/lib/api";

type ResourceActionsProps = {
  resource: ResourceRecord;
};

export function ResourceActions({ resource }: ResourceActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitPatch(formData: FormData) {
    setError(null);
    const response = await fetch(`/api/resources/${resource.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        resourceType: String(formData.get("resourceType") ?? resource.resourceType),
        url: String(formData.get("url") ?? ""),
        filePath: String(formData.get("filePath") ?? ""),
        targetGradeLevel: String(formData.get("targetGradeLevel") ?? ""),
        isFeatured: formData.get("isFeatured") === "on",
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Kaynak guncellenemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function removeResource() {
    setError(null);
    const response = await fetch(`/api/resources/${resource.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Kaynak silinemedi.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <details className="inline-editor">
      <summary className="secondary-button inline-button">Duzenle</summary>
      <form
        className="inline-editor__form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitPatch(new FormData(event.currentTarget));
        }}
      >
        <input name="title" defaultValue={resource.title} required />
        <textarea name="description" defaultValue={resource.description ?? ""} rows={3} />
        <select name="resourceType" defaultValue={resource.resourceType}>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="note">Ders Notu</option>
          <option value="link">Link</option>
          <option value="book">Kitap</option>
        </select>
        <input name="url" defaultValue={resource.url ?? ""} placeholder="https://..." />
        <input name="filePath" defaultValue={resource.filePath ?? ""} placeholder="https://storage.example.com/resources/..." />
        <input
          name="targetGradeLevel"
          defaultValue={resource.targetGradeLevel ?? ""}
          placeholder="8. sinif"
        />
        <label className="checkbox-field">
          <input name="isFeatured" type="checkbox" defaultChecked={resource.isFeatured} />
          <span>One cikar</span>
        </label>
        <div className="inline-actions">
          <button className="primary-button inline-button" type="submit" disabled={isPending}>
            Kaydet
          </button>
          <button
            className="danger-button inline-button"
            type="button"
            disabled={isPending}
            onClick={() => void removeResource()}
          >
            Sil
          </button>
        </div>
        {error ? <span className="inline-error">{error}</span> : null}
      </form>
    </details>
  );
}

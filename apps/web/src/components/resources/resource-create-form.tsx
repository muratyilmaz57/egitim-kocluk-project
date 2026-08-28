"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LessonRecord } from "@web/lib/api";
import { GradeLevelSelect } from "@web/components/ui/grade-level-select";
import { lessonMatchesGrade } from "@web/lib/grade-levels";

type ResourceCreateFormProps = {
  lessons: LessonRecord[];
  onSuccessRedirectTo?: string;
  defaultGradeLevel?: string;
};

export function ResourceCreateForm({
  lessons,
  onSuccessRedirectTo,
  defaultGradeLevel = "8. sinif",
}: ResourceCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [gradeLevel, setGradeLevel] = useState(defaultGradeLevel);
  const [lessonId, setLessonId] = useState("");
  const filteredLessons = lessons.filter((lesson) => lessonMatchesGrade(lesson, gradeLevel));
  const topics = filteredLessons.find((lesson) => lesson.id === lessonId)?.topics
    .filter((topic) => topic.gradeLevel === gradeLevel) ?? [];

  async function submitForm(formData: FormData) {
    setError(null);
    setSuccess(null);
    let filePath: string | null = null;
    let storageProvider: string | null = null;
    const file = formData.get("file");

    if (file instanceof File && file.size > 0) {
      const uploadData = new FormData();
      uploadData.set("file", file);
      const uploadResponse = await fetch("/api/uploads/resources", {
        method: "POST",
        body: uploadData,
      });

      const uploadPayload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok) {
        setError(uploadPayload?.message ?? "Dosya yuklenemedi.");
        return;
      }

      filePath = uploadPayload?.filePath ?? null;
      storageProvider = uploadPayload?.provider ?? null;
    }

    const response = await fetch("/api/resources", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        lessonId: formData.get("lessonId") ? Number(formData.get("lessonId")) : undefined,
        topicId: formData.get("topicId") ? Number(formData.get("topicId")) : undefined,
        resourceType: String(formData.get("resourceType") ?? "pdf"),
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        url: String(formData.get("url") ?? ""),
        filePath,
        targetGradeLevel: String(formData.get("targetGradeLevel") ?? ""),
        isFeatured: formData.get("isFeatured") === "on",
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Kaynak eklenemedi.");
      return;
    }

    if (storageProvider === "s3") {
      setSuccess("Kaynak S3 uyumlu depolamaya yuklendi ve kaydedildi.");
    }

    startTransition(() => {
      if (onSuccessRedirectTo) {
        router.replace(onSuccessRedirectTo);
        return;
      }

      router.refresh();
    });
  }

  return (
    <form
      className="student-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm(new FormData(event.currentTarget));
      }}
    >
      <div className="student-form__grid">
        <label className="auth-field">
          <span>Kaynak Tipi</span>
          <select name="resourceType" defaultValue="pdf">
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="note">Ders Notu</option>
            <option value="link">Link</option>
            <option value="book">Kitap</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Hedef Sınıf</span>
          <GradeLevelSelect
            name="targetGradeLevel"
            value={gradeLevel}
            onChange={(value) => { setGradeLevel(value); setLessonId(""); }}
            required
          />
        </label>
        <label className="auth-field">
          <span>Ders</span>
          <select name="lessonId" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
            <option value="">Genel</option>
            {filteredLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Konu</span>
          <select name="topicId" disabled={!lessonId} defaultValue="">
            <option value="">Genel / konu seçilmedi</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </select>
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Baslik</span>
          <input name="title" required placeholder="Paragraf hiz PDF seti" />
        </label>
        <label className="auth-field">
          <span>URL</span>
          <input name="url" placeholder="https://..." />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Dosya</span>
          <input
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </label>
        <label className="auth-field" style={{ gridColumn: "1 / -1" }}>
          <span>Aciklama</span>
          <textarea name="description" rows={3} placeholder="Kaynak aciklamasi" />
        </label>
        <label className="checkbox-field" style={{ gridColumn: "1 / -1" }}>
          <input name="isFeatured" type="checkbox" />
          <span>One cikar</span>
        </label>
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      {success ? <div className="settings-success">{success}</div> : null}
      <button className="primary-button auth-submit" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaynak ekle"}
      </button>
    </form>
  );
}

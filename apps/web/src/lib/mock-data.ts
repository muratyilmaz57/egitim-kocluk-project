export const dashboardStats = [
  { label: "Toplam ogrenci", value: "48", meta: "+4 bu ay" },
  { label: "Aktif ders", value: "8", meta: "2 yeni konu eklendi" },
  { label: "Bugun tamamlanan gorev", value: "26", meta: "Gunluk hedefin %74'u" },
  { label: "Gunluk toplam calisma", value: "18s 50dk", meta: "Dune gore +12%" },
  { label: "Okunmamis mesaj", value: "7", meta: "3 ogrenci geri donus bekliyor" },
] as const;

export const todayTasks = [
  { title: "Ece | Matematik problemler", meta: "60 soru - 20:00 son teslim", badge: "Devam ediyor", tone: "warning" },
  { title: "Arda | Paragraf tekrar paketi", meta: "40 soru - tamamlandi", badge: "Tamamlandi", tone: "success" },
  { title: "Melis | Fen video ozet", meta: "35 dk video + not", badge: "Baslamadi", tone: "danger" },
] as const;

export const meetings = [
  { title: "Mehmet Demir", meta: "19:30 birebir gorusme", badge: "Bugun" },
  { title: "Zeynep Kaya", meta: "Yarin deneme analizi", badge: "Yarin" },
  { title: "Veli gorusmesi", meta: "Cuma 18:00", badge: "Planli" },
] as const;

export const riskStudents = [
  { title: "Mina A.", meta: "Son 7 gunde hedefin %42'si", badge: "Yuksek risk" },
  { title: "Ege T.", meta: "3 denemede matematik dusus trendi", badge: "Takip" },
  { title: "Sena C.", meta: "Mesajlara geri donus gecikiyor", badge: "Iletisim" },
] as const;

export const studentMetrics = [
  { label: "Haftalik hedef tamamlama", value: "%78", detail: "14 gorevin 11'i kapandi" },
  { label: "Toplam odak suresi", value: "6s 45dk", detail: "Bu hafta 14 oturum" },
  { label: "Son deneme neti", value: "56.0", detail: "Gecen haftaya gore +4.0" },
  { label: "Eksik konu", value: "9", detail: "Matematik ve Fen agirlikli" },
] as const;

export const studentTasks = [
  { title: "Problemler 60 soru", meta: "Matematik | 90 dk hedef", progress: 70 },
  { title: "Paragraf hiz calismasi", meta: "Turkce | 40 soru", progress: 100 },
  { title: "Fen tekrar videosu", meta: "Fen | 35 dk", progress: 20 },
] as const;

export const studentNotes = [
  "Matematikte hiz artiyor ama dikkat dagilmasi son 15 dakikada belirgin.",
  "Paragraf tarafinda disiplin korunuyor, sabah blogu iyi calisiyor.",
  "Fen icin kisa video + mini test kombinasyonu daha etkili.",
] as const;


# Ogrenci Takip ve Egitim Koclugu Platformu

## 1. Urun Ozeti

Platform, bireysel calisan bir rehber ogretmen veya egitim kocunun ogrencilerini tek panelden yonetmesini saglar. Sistem; gorev atama, deneme analizi, mesajlasma, pomodoro takibi, raporlama ve kaynak paylasimi uzerine kuruludur.

Temel hedefler:
- Gunluk operasyonlari tek panelde toplamak
- Ogrenci ilerlemesini sayisal olarak izlemek
- Koc ile ogrenci arasindaki iletisimi hizlandirmak
- Mobilde de rahat kullanilan hizli bir arayuz sunmak

## 2. Sistem Mimarisi

### Mimari yaklasim
- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Database: MySQL 8
- Cache/Queue: Redis + BullMQ
- Realtime: Socket.IO
- Storage: S3 uyumlu dosya depolama

### Moduler backend alanlari
- auth
- users
- students
- lessons
- topics
- study-plans
- tasks
- exam-results
- pomodoro
- messages
- notes
- resources
- dashboard

### Yurutme modeli
- Ilk surum: moduler monolith
- Buyume asamasi: analytics, notifications, messaging servis ayrisma adayi

## 3. Roller ve Yetkiler

### admin
- Tum kullanicilari yonetir
- Tum ogrencileri ve raporlari gorur
- Ders ve sistem sabitlerini tanimlar

### coach
- Ogrenci ekler, duzenler, arsivler
- Plan ve gorev olusturur
- Deneme sonuclari girer
- Mesajlasir
- Haftalik degerlendirme yazar
- Kaynak ve video atar

### student
- Kendi gorevlerini gorur
- Calisma planini takip eder
- Pomodoro baslatir
- Deneme sonuclarini inceler
- Kaynaklara erisir
- Koc ile mesajlasir

## 4. Bilgi Mimarisi

### Koç paneli navigasyonu
1. Dashboard
2. Ogrenciler
3. Dersler ve Konular
4. Calisma Planlari
5. Gorevler
6. Soru Takibi
7. Deneme Sinavlari
8. Pomodoro Takibi
9. Mesajlar
10. Ajanda
11. Degerlendirmeler
12. Kutuphane
13. Ayarlar

### Ogrenci paneli navigasyonu
1. Ana Sayfa
2. Bugunku Planim
3. Gorevlerim
4. Deneme Sonuclarim
5. Pomodoro
6. Mesajlar
7. Kaynaklar
8. Profilim

## 5. Sayfa Yapisi

### 5.1 Dashboard
Amac: kocun gune tek ekrandan baslayabilmesi

Icerik bloklari:
- KPI kartlari
- Bugunku gorev akisi
- Yaklasan gorusmeler
- Yeni mesajlar
- Haftalik calisma grafigi
- Deneme performans trendi
- Riskli ogrenciler

KPI alanlari:
- Toplam ogrenci sayisi
- Toplam ders sayisi
- Bugun tamamlanan gorev sayisi
- Gunluk toplam calisma suresi
- Okunmamis mesaj sayisi
- Genel tamamlama yuzdesi

### 5.2 Ogrenciler Listesi
- Arama
- Sinif filtresi
- Durum filtresi
- Kart veya tablo gorunumu
- Hizli aksiyonlar: Profil, gorev ata, mesaj gonder, deneme ekle

### 5.3 Ogrenci Detay
Sekmeler:
- Genel Bakis
- Program ve Gorevler
- Konu Ilerlemesi
- Soru Performansi
- Deneme Sonuclari
- Pomodoro
- Mesajlar
- Koc Notlari
- Kaynaklar

### 5.4 Dersler ve Konular
- Ders listesi
- Ders icinde konu agaci
- Konu bazli ilerleme
- Konuya bagli video ve kaynaklar

### 5.5 Calisma Plani ve Gorevler
- Gunluk plan olusturma
- Haftalik plan olusturma
- Surukle-birak zaman bloklari
- Tamamlandi / gecikti / devam ediyor durumlari

### 5.6 Soru Takibi
- Gunluk hedef soru
- Gerceklesen soru sayisi
- Ders bazli dagilim
- Yanlis konu analizi

### 5.7 Deneme Sinavlari
- Sonuc ekleme formu
- Net hesaplama
- Ders bazli karsilastirma
- Tarihsel trend

### 5.8 Pomodoro
- Canli sayac
- Bugun toplam odak suresi
- Haftalik odak raporu

### 5.9 Mesajlar
- Sol panel: konusmalar
- Sag panel: aktif sohbet
- Dosya/link paylasimi

### 5.10 Ajanda
- Haftalik takvim
- Ogrenci gorusmeleri
- Hatirlaticilar

### 5.11 Degerlendirme
- Haftalik rapor kartlari
- Motivasyon notu
- Koc yorumu
- Aksiyon maddeleri

### 5.12 Kutuphane
- PDF
- Video
- Ders notlari
- Kaynak onerileri

## 6. Dashboard Wireframe

```text
+----------------------------------------------------------------------------------+
| LOGO | Dashboard | Ogrenciler | Gorevler | Mesajlar              Profil / Cikis |
+----------------------------------------------------------------------------------+
| Sidebar          | Gradient Top Bar: "Bugun genel durum"                         |
|------------------+---------------------------------------------------------------|
| Dashboard        | [Ogrenci] [Ders] [Gunluk Gorev] [Mesaj] [Tamamlama %]         |
| Ogrenciler       |                                                               |
| Dersler          | [Haftalik Calisma Grafigi]     [Yaklasan Gorusmeler]          |
| Planlar          |                                                               |
| Gorevler         | [Deneme Trend Grafigi]          [Riskli Ogrenciler]           |
| Denemeler        |                                                               |
| Pomodoro         | [Bugunku Gorevler Listesi]      [Son Mesajlar]                |
| Mesajlar         |                                                               |
| Ajanda           |                                                               |
| Raporlar         |                                                               |
| Kutuphane        |                                                               |
+----------------------------------------------------------------------------------+
```

## 7. Ogrenci Detay Wireframe

```text
+----------------------------------------------------------------------------------+
| Ogrenci Profil Kartı: Foto | Ad Soyad | Sinif | Hedef Sinav | Veli | Durum      |
+----------------------------------------------------------------------------------+
| Sekmeler: Genel | Gorevler | Konular | Sorular | Denemeler | Pomodoro | Mesajlar |
+----------------------------------------------------------------------------------+
| Sol Alan: Ozet KPI'lar           | Sag Alan: Son notlar ve hizli islem butonlari |
| - Haftalik hedef tamamlama       | - Gorev ata                                      |
| - Toplam odak suresi             | - Mesaj gonder                                   |
| - Son deneme neti                | - Rapor yaz                                      |
| - Eksik konu sayisi              | - Kaynak ekle                                     |
+----------------------------------------------------------------------------------+
| Alt Alan: aktif sekmeye gore icerik                                               |
+----------------------------------------------------------------------------------+
```

## 8. Ogrenci Paneli Wireframe

```text
+----------------------------------------------------------------------------------+
| Ust bar: Bugunluk hedef, bildirim, mesaj                                         |
+----------------------------------------------------------------------------------+
| [Bugunku Planim] [Pomodoro Baslat] [Yeni Mesaj] [Kaynaklar]                      |
+----------------------------------------------------------------------------------+
| Gorevlerim                                                                        |
| - 09:00 Matematik problemler                                                     |
| - 11:00 Paragraf 40 soru                                                         |
| - 14:00 Fen video + not                                                          |
+----------------------------------------------------------------------------------+
| Alt bolum: Deneme ozeti | Haftalik odak suresi | Eksik konular                   |
+----------------------------------------------------------------------------------+
| Mobilde alt sekme: Ana Sayfa | Gorevler | Pomodoro | Mesajlar | Profil           |
+----------------------------------------------------------------------------------+
```

## 9. Kullanici Akislari

### Koc: yeni ogrenci ekleme ve ilk plan olusturma
1. Ogrenciler ekraninda "Yeni Ogrenci" aksiyonu
2. Temel profil ve veli bilgileri girisi
3. Ders ve hedef sinav secimi
4. Haftalik plan olusturma
5. Ilk gorevleri atama
6. Hos geldin mesaji ve kaynak paylasimi

### Ogrenci: gunluk gorev tamamlama
1. Giris yapar
2. Bugunku planini gorur
3. Gorev baslatir
4. Gerekirse pomodoro oturumu acilir
5. Gorev tamamlanir
6. Ilerleme dashboard'a yansir

### Koc: deneme analizi
1. Ogrenci detay > Denemeler
2. Sonuc ekle
3. Dogru/yanlis/bos gir
4. Sistem neti hesaplar
5. Grafik ve eksik konu analizi gosterilir
6. Koc notu eklenir

## 10. KPI Hesaplama Mantigi

### Genel tamamlama yuzdesi
- Tamamlanan gorev sayisi / aktif gorev sayisi

### Gunluk toplam calisma
- O gun icindeki pomodoro `duration_minutes` toplami

### Eksik konu sayisi
- Durumu `baslanmadi` veya `tekrar gerekli` olan konu sayisi

### Haftalik verimlilik puani
- Gorev tamamlama orani + hedef soru orani + odak suresi sapmasi

## 11. UI Ilkeleri

- Sol sidebar masaustunde sabit, mobilde drawer
- Top bar gradient ve yuksek kontrastli
- Kart tabanli bilgi gosterimi
- Tek ekranda en fazla birincil 5 KPI
- Formlarda adimlama kullanimi
- Grafikler sade, renk kodlu, tooltip destekli

## 12. Fazlandirma

### MVP
- Auth
- Dashboard
- Ogrenci yonetimi
- Ders/konu
- Calisma plani
- Gorevler
- Deneme sonuclari
- Pomodoro
- Mesajlar
- Notlar
- Kaynaklar

### Faz 2
- Bildirim motoru
- Ajanda icin ayri event modeli
- Ogrenci konu ilerleme tablosu
- Gelismis analytics
- Veli paneli

# Plesk Yayin Akisi

Bu dokuman Plesk uzerinde hem `production` hem `staging` ortamlarini yayinlamak icin hazirlandi.

## Ortamlar

- `production web`: `ftykocluk.fatmatekyilmaz.com`
- `production api`: `api-ftykocluk.fatmatekyilmaz.com`
- `staging web`: `staging-ftykocluk.fatmatekyilmaz.com`
- `staging api`: `api-staging-ftykocluk.fatmatekyilmaz.com`

## Hedef mimari

- `apps/web`: Node.js uygulamasi, `3001` benzeri ic portta calisir
- `apps/api`: Node.js uygulamasi, `4001` benzeri ic portta calisir
- `Plesk proxy`: alan adini web uygulamasina yonlendirir
- `MySQL`: sunucuda yeni veritabani

## Sunucuda gerekenler

- Node.js `20+`
- npm
- MySQL veya MariaDB
- Plesk Node.js extension

## Veritabani tasima

1. QNAP NAS uzerinden dump alin:

```bash
mysqldump -h 192.168.1.170 -P 3307 -u fty_mfzea -p --single-transaction --routines --triggers ftykocluk > ftykocluk.sql
```

2. Plesk uzerinde yeni veritabani olusturun.
3. SQL dump'i yeni veritabanina import edin.
4. Uretim `.env` dosyasindaki `DATABASE_URL` degerini yeni sunucu veritabanina cevirin.
5. Veritabani sifresinde `!`, `#`, `@`, `:` gibi karakterler varsa URL-encode edin.

Ornek:

```env
DATABASE_URL=mysql://koclukapp:T6%21KoclukDb%232026@localhost:3306/ftykocluk_mfzea
```

## Kod yayini

Bundle uretmek icin:

```bash
npm run prisma:generate
npm run build
```

## Tek komut deploy

1. Ornek dosyayi kopyalayin:

```bash
cp .env.deploy.example .env.deploy.staging
cp .env.deploy.example .env.deploy.production
```

2. Her dosyadaki domain, FTP, DB ve secret degerlerini doldurun.
3. Deploy komutunu env dosyasi ile calistirin:

Staging:

```bash
DEPLOY_ENV_FILE=.env.deploy.staging npm run deploy:staging
```

Production:

```bash
DEPLOY_ENV_FILE=.env.deploy.production npm run deploy:prod
```

Bu komut zinciri su adimlari otomatik yapar:

- `prisma generate`
- `web/api build`
- Plesk bundle hazirlama
- staging/prod API icin production dependency kurulumu
- zip olusturma
- istege bagli SQL import
- FTP upload
- extractor ile server-side acma
- Node.js enable
- gecici deploy dosyalarini temizleme
- temel smoke test

Production bundle:

```bash
DEPLOY_ENV_NAME=production \
DEPLOY_APP_NAME="Kocluk Platformu" \
DEPLOY_WEB_BASE_URL=https://ftykocluk.fatmatekyilmaz.com \
DEPLOY_API_BASE_URL=https://api-ftykocluk.fatmatekyilmaz.com/api/v1 \
DEPLOY_INTERNAL_API_BASE_URL=http://api-ftykocluk.fatmatekyilmaz.com/api/v1 \
DEPLOY_DATABASE_URL='mysql://USER:ENCODED_PASSWORD@localhost:3306/DB_NAME' \
DEPLOY_JWT_ACCESS_SECRET=... \
DEPLOY_JWT_REFRESH_SECRET=... \
DEPLOY_JWT_CAPTCHA_SECRET=... \
DEPLOY_APP_ENCRYPTION_SECRET=... \
node scripts/prepare-plesk-deploy.mjs
```

Staging bundle:

```bash
DEPLOY_ENV_NAME=staging \
DEPLOY_APP_NAME="Kocluk Platformu Staging" \
DEPLOY_WEB_BASE_URL=https://staging-ftykocluk.fatmatekyilmaz.com \
DEPLOY_API_BASE_URL=https://api-staging-ftykocluk.fatmatekyilmaz.com/api/v1 \
DEPLOY_INTERNAL_API_BASE_URL=http://api-staging-ftykocluk.fatmatekyilmaz.com/api/v1 \
DEPLOY_DATABASE_URL='mysql://USER:ENCODED_PASSWORD@localhost:3306/DB_NAME' \
DEPLOY_JWT_ACCESS_SECRET=... \
DEPLOY_JWT_REFRESH_SECRET=... \
DEPLOY_JWT_CAPTCHA_SECRET=... \
DEPLOY_APP_ENCRYPTION_SECRET=... \
node scripts/prepare-plesk-deploy.mjs
```

## API uygulamasi

- Uygulama kok dizini: repo root
- Startup file:

```bash
apps/api/dist/main.js
```

- Environment:

```env
PORT=4001
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_CAPTCHA_SECRET=...
APP_ENCRYPTION_SECRET=...
WEB_BASE_URL=https://ftykocluk.fatmatekyilmaz.com
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

## Web uygulamasi

Plesk tarafinda ikinci Node.js uygulamasi veya reverse proxy ile ayri process calistirin.

- Uygulama kok dizini: repo root
- Startup command:

```bash
npm run start:prod:web
```

- Environment:

```env
PORT=3001
NODE_ENV=production
API_BASE_URL=http://127.0.0.1:4001/api/v1
NEXT_PUBLIC_APP_NAME=Kocluk Platformu
WEB_BASE_URL=https://ftykocluk.fatmatekyilmaz.com
S3_ENDPOINT=
S3_REGION=eu-central-1
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=
```

## Proxy

- Ana alan adi `ftykocluk.fatmatekyilmaz.com` web uygulamasina gitmeli
- API icin iki secenek var:
  - ayni sunucuda yalnizca internal `127.0.0.1:4001`
  - veya `/api/v1` reverse proxy ile API process'ine yonlendirme

En temiz yol, web uygulamasinin `API_BASE_URL=http://127.0.0.1:4001/api/v1` ile internal API'ye gitmesidir.

## Ayni sunucuda web-api iletisim notu

- Browser tarafinda `NEXT_PUBLIC_API_BASE_URL` her zaman `https://...` public API alani olabilir.
- Server-side Next.js fetch'leri icin `DEPLOY_INTERNAL_API_BASE_URL=http://api-...` kullanmak daha guvenlidir.
- Bu sayede SSL sertifikasi, DNS propagation veya self-call TLS zinciri staging asamasinda akisi bozmaz.

## Ilk canli kontrol

1. Login ekrani aciliyor mu
2. Dashboard veri cekiyor mu
3. Mesaj websocket baglaniyor mu
4. `/settings/security`, `/settings/activity`, `/settings/notifications` aciliyor mu
5. Kaynak upload local veya S3 ile calisiyor mu

## Bu yayin icin canli alanlar

- `https://ftykocluk.fatmatekyilmaz.com`
- `https://api-ftykocluk.fatmatekyilmaz.com/api/v1`

## Staging alanlari

- `https://staging-ftykocluk.fatmatekyilmaz.com`
- `https://api-staging-ftykocluk.fatmatekyilmaz.com/api/v1`

## Geri donus noktasi

- Koddan once SQL dump alin
- Mevcut `.env` yedegi alin
- Yayin oncesi `npm run build` ve `npm run prisma:deploy` loglarini saklayin

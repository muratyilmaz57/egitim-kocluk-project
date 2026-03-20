# Kocluk Platformu

Bu workspace, ogrenci takip ve egitim koclugu platformunun baslangic iskeletini icerir.

## Dizin yapisi

- `apps/web`: Next.js tabanli yonetim paneli ve ogrenci arayuzu
- `apps/api`: NestJS tabanli backend API
- `prisma`: Prisma veri modeli
- `database/schema.sql`: Ham MySQL tablo script'i
- `docs`: Mimari ve API dokumantasyonu

## Baslangic adimlari

1. `.env.example` dosyasini `.env` olarak kopyalayin.
2. `docker-compose up -d` ile MySQL ve Redis'i kaldirin.
3. Root dizinde `npm install` calistirin.
4. `npm run prisma:generate`
5. Ilk kurulumda migration SQL'ini uygulayin veya Prisma migrate akisina gecin.
6. `npm run dev:web` ve `npm run dev:api`

## Uretim komutlari

- `npm run build`
- `npm run prisma:deploy`
- `npm run start:prod:api`
- `npm run start:prod:web`

## Plesk yayini

Plesk uzerinden Linux sunucuya yayin akisi icin ayrintili adimlar:

- [docs/plesk-deploy.md](/Users/fatmatekyilmaz/Desktop/kocluk-proje/docs/plesk-deploy.md)
- [docs/git-workflow.md](/Users/fatmatekyilmaz/Desktop/kocluk-proje/docs/git-workflow.md)

## Git ve coklu cihaz calisma

Bu proje artik `local -> staging -> production` akisiyla ilerlemeli. Canli sunucuda dosya duzenlemek yerine:

1. Kodu Git reposunda tutun.
2. Her bilgisayarda repoyu klonlayin.
3. Gelistirmeyi lokal veya gerekiyorsa ayri bir dev ortaminda yapin.
4. Once `staging`e deploy edin.
5. Onaydan sonra `production`a gecin.

Onerilen branch yapisi:

- `main`: production ile bire bir
- `develop`: staging ile bire bir
- `feature/...`: yeni isler
- `hotfix/...`: acil canli duzeltmeleri

Windows PC'de de ayni repo yapisiyla sorunsuz calisabilirsiniz. Bu repo icin satir sonlari [/.gitattributes](/Users/fatmatekyilmaz/Desktop/kocluk-proje/.gitattributes) ile normalize edildi.

## Not

Bu repo su an canli deployment hazirligina sahip. Son kalan operasyon isi Plesk/SSH erisimi ile dosyalarin ve yeni veritabaninin sunucuya alinmasidir.

# Deploy Secrets

Bu proje icin staging ve production deploy secret'lari repoya girmez. Her bilgisayar kendi lokal secret dosyalarini repo disinda tutar.

## Onerilen konum

- macOS/Linux: `~/.config/kocluk-proje/.env.deploy.staging`
- macOS/Linux: `~/.config/kocluk-proje/.env.deploy.production`
- Windows: `%APPDATA%/kocluk-proje/.env.deploy.staging`
- Windows: `%APPDATA%/kocluk-proje/.env.deploy.production`

## Ilk kurulum

```bash
npm run setup:deploy-secrets
```

Bu komut ornek dosyayi kullanarak yukaridaki iki dosyayi olusturur.

## Doldurulmasi gereken alanlar

- `PLESK_BASE_URL`
- `PLESK_API_KEY`
- `DEPLOY_PARENT_DOMAIN`
- `DEPLOY_FTP_HOST`
- `DEPLOY_NODE_VERSION`
- `DEPLOY_ENV_NAME`
- `DEPLOY_APP_NAME`
- `DEPLOY_WEB_DOMAIN`
- `DEPLOY_API_DOMAIN`
- `DEPLOY_WEB_BASE_URL`
- `DEPLOY_API_BASE_URL`
- `DEPLOY_INTERNAL_API_BASE_URL`
- `DEPLOY_DATABASE_URL`
- `DEPLOY_JWT_ACCESS_SECRET`
- `DEPLOY_JWT_REFRESH_SECRET`
- `DEPLOY_JWT_CAPTCHA_SECRET`
- `DEPLOY_APP_ENCRYPTION_SECRET`
- `DEPLOY_WEB_FTP_USER`
- `DEPLOY_WEB_FTP_PASS`
- `DEPLOY_API_FTP_USER`
- `DEPLOY_API_FTP_PASS`

## Kullanim

Varsayilan konum kullaniliyorsa:

```bash
npm run deploy:staging
npm run deploy:prod
```

Farkli konum kullanilacaksa:

```bash
DEPLOY_ENV_FILE=/absolute/path/to/.env.deploy.staging npm run deploy:staging
DEPLOY_ENV_FILE=/absolute/path/to/.env.deploy.production npm run deploy:prod
```

## Guvenlik kurallari

- Bu dosyalari Git'e eklemeyin.
- OneDrive, Dropbox veya genel sync klasorlerinde tutmayin.
- Secret'lari chat veya issue icine kopyalamayin.
- Bilgisayar degistiginde dosyalari elle yeniden olusturun veya sifre yoneticisi ile aktarin.

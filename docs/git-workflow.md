# Git Workflow

Bu proje icin dogru gelistirme akisi `Git + staging + production` modelidir. Sunucuyu kod editoru gibi kullanmayin. Sunucu sadece deploy edilen ortam olsun.

## Onerilen branch modeli

- `main`: production ile bire bir
- `develop`: staging ile bire bir
- `feature/<is-adi>`: yeni gelistirme
- `hotfix/<is-adi>`: production acil duzeltmesi

## Onerilen akis

1. Yeni is icin `develop` uzerinden `feature/...` branch acin.
2. Degisiklikleri lokalde gelistirin.
3. Lokal testleri alin.
4. `feature/...` branch'ini `develop`a merge edin.
5. `develop` branch'ini staging'e deploy edin.
6. Staging onayi sonrasi `develop -> main` merge edin.
7. `main` branch'ini production'a deploy edin.

## Ilk kurulum

Mac/Linux:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initial platform baseline"
```

Windows PowerShell:

```powershell
git init
git branch -M main
git add .
git commit -m "chore: initial platform baseline"
```

Uzak repo ekleme:

```bash
git remote add origin <REPO_URL>
git push -u origin main
```

`develop` branch olusturma:

```bash
git checkout -b develop
git push -u origin develop
```

## Gunluk kullanim

Yeni is:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<is-adi>
```

Is bitince:

```bash
git add .
git commit -m "feat: <kisa-aciklama>"
git push -u origin feature/<is-adi>
```

## Deploy esleme

- `develop` -> staging
- `main` -> production

## Deploy secret duzeni

Gercek deploy secret'larini repo icinde tutmayin. Her bilgisayarda repo disi dosya kullanin:

- `~/.config/kocluk-proje/.env.deploy.staging`
- `~/.config/kocluk-proje/.env.deploy.production`

Ilk kurulum:

```bash
npm run setup:deploy-secrets
```

Deploy komutlari:

```bash
npm run deploy:staging
npm run deploy:prod
```

Istersen farkli bir dosya da kullanabilirsin:

```bash
DEPLOY_ENV_FILE=/absolute/path/to/.env.deploy.staging npm run deploy:staging
```

## Reboya girmemesi gerekenler

Asagidaki dosyalar Git'e eklenmemeli:

- `.env`
- `.env.deploy.*`
- `deploy/plesk` altindaki zip ve build ciktilari
- runtime upload dosyalari
- SQL dump dosyalari

Bu kurallar [/.gitignore](/Users/fatmatekyilmaz/Desktop/kocluk-proje/.gitignore) icinde tanimlandi.

## Windows notlari

- `Node.js 20 LTS` kullanin.
- `Git for Windows` kurun.
- Terminal olarak `PowerShell` veya `Git Bash` kullanabilirsiniz.
- Satir sonlari repo tarafinda normalize edildigi icin `CRLF/LF` sorunu beklenmez.
- Gercek secret dosyalarini OneDrive veya benzeri genel klasorlerde tutmayin.

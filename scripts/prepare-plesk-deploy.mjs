import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const deployEnvName = process.env.DEPLOY_ENV_NAME || "production";
const deployRoot = resolve(projectRoot, "deploy", "plesk", deployEnvName);
const webRoot = resolve(deployRoot, "web");
const apiRoot = resolve(deployRoot, "api");
const appDisplayName = process.env.DEPLOY_APP_NAME || "Kocluk Platformu";
const publicApiBaseUrl = process.env.DEPLOY_API_BASE_URL;
const internalApiBaseUrl =
  process.env.DEPLOY_INTERNAL_API_BASE_URL || process.env.DEPLOY_API_BASE_URL;

const requiredEnv = [
  "DEPLOY_WEB_BASE_URL",
  "DEPLOY_API_BASE_URL",
  "DEPLOY_DATABASE_URL",
  "DEPLOY_JWT_ACCESS_SECRET",
  "DEPLOY_JWT_REFRESH_SECRET",
  "DEPLOY_JWT_CAPTCHA_SECRET",
  "DEPLOY_APP_ENCRYPTION_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

rmSync(deployRoot, { recursive: true, force: true });
mkdirSync(webRoot, { recursive: true });
mkdirSync(apiRoot, { recursive: true });

cpSync(resolve(projectRoot, "apps", "web", ".next", "standalone"), webRoot, {
  recursive: true,
});
cpSync(
  resolve(projectRoot, "apps", "web", ".next", "static"),
  resolve(webRoot, "apps", "web", ".next", "static"),
  { recursive: true },
);
cpSync(resolve(projectRoot, "apps", "web", "public"), resolve(webRoot, "apps", "web", "public"), {
  recursive: true,
  force: true,
});

const webApp = `process.env.NODE_ENV ||= "production";
process.env.PORT ||= "3000";
process.env.API_BASE_URL ||= ${JSON.stringify(internalApiBaseUrl)};
process.env.NEXT_PUBLIC_API_BASE_URL ||= ${JSON.stringify(publicApiBaseUrl)};
process.env.WEB_BASE_URL ||= ${JSON.stringify(process.env.DEPLOY_WEB_BASE_URL)};
process.env.NEXT_PUBLIC_APP_NAME ||= ${JSON.stringify(appDisplayName)};
require("./apps/web/server.js");
`;

writeFileSync(resolve(webRoot, "app.js"), webApp, "utf8");

cpSync(resolve(projectRoot, "apps", "api", "dist"), resolve(apiRoot, "dist"), {
  recursive: true,
});

const apiPackage = JSON.stringify(
  {
    name: "kocluk-api-deploy",
    private: true,
    version: "0.1.0",
    main: "app.js",
    dependencies: {
      "@nestjs/common": "^11.0.11",
      "@nestjs/config": "^4.0.2",
      "@nestjs/core": "^11.0.11",
      "@nestjs/platform-express": "^11.0.11",
      "@nestjs/platform-socket.io": "^11.1.17",
      "@nestjs/websockets": "^11.1.17",
      "@prisma/client": "^6.5.0",
      "@types/nodemailer": "^7.0.11",
      "@types/qrcode": "^1.5.6",
      "bcryptjs": "^3.0.3",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.1",
      "jsonwebtoken": "^9.0.3",
      "nodemailer": "^8.0.2",
      "qrcode": "^1.5.4",
      "reflect-metadata": "^0.2.2",
      "rxjs": "^7.8.2",
      "socket.io": "^4.8.3",
    },
  },
  null,
  2,
);

writeFileSync(resolve(apiRoot, "package.json"), `${apiPackage}\n`, "utf8");

const apiApp = `process.env.NODE_ENV ||= "production";
process.env.PORT ||= "4000";
process.env.DATABASE_URL ||= ${JSON.stringify(process.env.DEPLOY_DATABASE_URL)};
process.env.JWT_ACCESS_SECRET ||= ${JSON.stringify(process.env.DEPLOY_JWT_ACCESS_SECRET)};
process.env.JWT_REFRESH_SECRET ||= ${JSON.stringify(process.env.DEPLOY_JWT_REFRESH_SECRET)};
process.env.JWT_CAPTCHA_SECRET ||= ${JSON.stringify(process.env.DEPLOY_JWT_CAPTCHA_SECRET)};
process.env.APP_ENCRYPTION_SECRET ||= ${JSON.stringify(process.env.DEPLOY_APP_ENCRYPTION_SECRET)};
process.env.WEB_BASE_URL ||= ${JSON.stringify(process.env.DEPLOY_WEB_BASE_URL)};
process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ||= "900";
process.env.JWT_REFRESH_EXPIRES_IN_SECONDS ||= "2592000";
require("./dist/main.js");
`;

writeFileSync(resolve(apiRoot, "app.js"), apiApp, "utf8");

if (existsSync(resolve(projectRoot, "prisma"))) {
  cpSync(resolve(projectRoot, "prisma"), resolve(apiRoot, "prisma"), {
    recursive: true,
  });
}

console.log(JSON.stringify({ deployEnvName, webRoot, apiRoot }, null, 2));

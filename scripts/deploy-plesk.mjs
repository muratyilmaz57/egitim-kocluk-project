import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const projectRoot = resolve(process.cwd());
const target = process.argv[2] || process.env.DEPLOY_ENV_NAME || "staging";
const isProduction = target === "production";

function loadEnvFile() {
  const requestedEnvFile = process.env.DEPLOY_ENV_FILE;
  const defaultCandidates = [
    resolve(homedir(), ".config", "kocluk-proje", `.env.deploy.${target}`),
    resolve(homedir(), ".kocluk-proje", `.env.deploy.${target}`),
  ];
  const fullPath = requestedEnvFile
    ? resolve(projectRoot, requestedEnvFile)
    : defaultCandidates.find((candidate) => existsSync(candidate));

  if (!fullPath) {
    return;
  }

  if (!existsSync(fullPath)) {
    throw new Error(`Deploy env file not found: ${fullPath}`);
  }

  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function run(cmd, args, options = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  return execFileSync(cmd, args, {
    cwd: options.cwd || projectRoot,
    stdio: options.stdio || "inherit",
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
}

function runJsonCurl(args) {
  const output = execFileSync("curl", args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  }).toString("utf8");

  return output;
}

function resolveConfig() {
  const webDomain = getEnv(
    "DEPLOY_WEB_DOMAIN",
    isProduction
      ? "ftykocluk.fatmatekyilmaz.com"
      : "staging-ftykocluk.fatmatekyilmaz.com",
  );
  const apiDomain = getEnv(
    "DEPLOY_API_DOMAIN",
    isProduction
      ? "api-ftykocluk.fatmatekyilmaz.com"
      : "api-staging-ftykocluk.fatmatekyilmaz.com",
  );

  return {
    target,
    parentDomain: getEnv("DEPLOY_PARENT_DOMAIN", "fatmatekyilmaz.com"),
    ftpHost: getEnv("DEPLOY_FTP_HOST", "5.250.255.202"),
    appName: getEnv(
      "DEPLOY_APP_NAME",
      isProduction ? "Kocluk Platformu" : "Kocluk Platformu Staging",
    ),
    panelBaseUrl: getEnv("PLESK_BASE_URL"),
    pleskApiKey: getEnv("PLESK_API_KEY"),
    webDomain,
    apiDomain,
    webBaseUrl: getEnv("DEPLOY_WEB_BASE_URL", `https://${webDomain}`),
    apiBaseUrl: getEnv("DEPLOY_API_BASE_URL", `https://${apiDomain}/api/v1`),
    internalApiBaseUrl: getEnv(
      "DEPLOY_INTERNAL_API_BASE_URL",
      `http://${apiDomain}/api/v1`,
    ),
    databaseUrl: getEnv("DEPLOY_DATABASE_URL"),
    jwtAccessSecret: getEnv("DEPLOY_JWT_ACCESS_SECRET"),
    jwtRefreshSecret: getEnv("DEPLOY_JWT_REFRESH_SECRET"),
    jwtCaptchaSecret: getEnv("DEPLOY_JWT_CAPTCHA_SECRET"),
    appEncryptionSecret: getEnv("DEPLOY_APP_ENCRYPTION_SECRET"),
    webFtpUser: getEnv("DEPLOY_WEB_FTP_USER"),
    webFtpPass: getEnv("DEPLOY_WEB_FTP_PASS"),
    apiFtpUser: getEnv("DEPLOY_API_FTP_USER"),
    apiFtpPass: getEnv("DEPLOY_API_FTP_PASS"),
    nodeVersion: getEnv("DEPLOY_NODE_VERSION", "24.14.0"),
    skipBuild: process.env.DEPLOY_SKIP_BUILD === "1",
    sqlDumpPath: process.env.DEPLOY_SQL_DUMP_PATH || "",
    sqlDumpRemoteName:
      process.env.DEPLOY_SQL_DUMP_REMOTE_NAME || `deploy-${target}.sql`,
    importDbName: process.env.DEPLOY_IMPORT_DB_NAME || "",
    importDbDomain: process.env.DEPLOY_IMPORT_DB_DOMAIN || "",
  };
}

function prepareBundle(config) {
  if (!config.skipBuild) {
    run("npm", ["run", "prisma:generate"]);
    run("npm", ["run", "build"]);
  }

  run(
    "node",
    ["scripts/prepare-plesk-deploy.mjs"],
    {
      env: {
        DEPLOY_ENV_NAME: config.target,
        DEPLOY_APP_NAME: config.appName,
        DEPLOY_WEB_BASE_URL: config.webBaseUrl,
        DEPLOY_API_BASE_URL: config.apiBaseUrl,
        DEPLOY_INTERNAL_API_BASE_URL: config.internalApiBaseUrl,
        DEPLOY_DATABASE_URL: config.databaseUrl,
        DEPLOY_JWT_ACCESS_SECRET: config.jwtAccessSecret,
        DEPLOY_JWT_REFRESH_SECRET: config.jwtRefreshSecret,
        DEPLOY_JWT_CAPTCHA_SECRET: config.jwtCaptchaSecret,
        DEPLOY_APP_ENCRYPTION_SECRET: config.appEncryptionSecret,
      },
    },
  );

  const apiRoot = resolve(projectRoot, "deploy", "plesk", config.target, "api");
  run("npm", ["install", "--omit=dev"], { cwd: apiRoot });

  const prismaSource = resolve(projectRoot, "node_modules", ".prisma");
  const prismaTarget = resolve(apiRoot, "node_modules", ".prisma");
  rmSync(prismaTarget, { recursive: true, force: true });
  mkdirSync(resolve(apiRoot, "node_modules"), { recursive: true });
  cpSync(prismaSource, prismaTarget, { recursive: true });

  const deployRoot = resolve(projectRoot, "deploy", "plesk", config.target);
  const webZip = resolve(deployRoot, "web-deploy.zip");
  const apiZip = resolve(deployRoot, "api-deploy.zip");

  rmSync(webZip, { force: true });
  rmSync(apiZip, { force: true });

  run("zip", ["-qr", "../web-deploy.zip", "."], {
    cwd: resolve(deployRoot, "web"),
  });
  run("zip", ["-qr", "../api-deploy.zip", "."], {
    cwd: resolve(deployRoot, "api"),
  });

  return { deployRoot, webZip, apiZip };
}

function curlPlesk(config, endpoint, payload) {
  return runJsonCurl([
    "-sk",
    "-H",
    `X-API-Key: ${config.pleskApiKey}`,
    "-X",
    "POST",
    `${config.panelBaseUrl}${endpoint}`,
    "-H",
    "Content-Type: application/json",
    "-d",
    JSON.stringify(payload),
  ]);
}

function ftpUpload(host, user, pass, localFile, remoteName) {
  run("curl", [
    "--ftp-method",
    "nocwd",
    "--user",
    `${user}:${pass}`,
    "-T",
    localFile,
    `ftp://${host}/${remoteName}`,
  ]);
}

function ftpDelete(host, user, pass, remoteName) {
  run("curl", [
    "--ftp-method",
    "nocwd",
    "--user",
    `${user}:${pass}`,
    "-Q",
    `DELE ${remoteName}`,
    `ftp://${host}/`,
  ]);
}

function enablePhpExtractor(config) {
  curlPlesk(config, "/api/v2/cli/subdomain/call", {
    params: [
      "--update",
      config.webDomain.split(".")[0],
      "-domain",
      config.parentDomain,
      "-php",
      "true",
      "-php_handler_id",
      "plesk-php83-fpm",
      "-fastcgi",
      "true",
    ],
  });
  curlPlesk(config, "/api/v2/cli/subdomain/call", {
    params: [
      "--update",
      config.apiDomain.split(".")[0],
      "-domain",
      config.parentDomain,
      "-php",
      "true",
      "-php_handler_id",
      "plesk-php83-fpm",
      "-fastcgi",
      "true",
    ],
  });
}

function disablePhpExtractor(config) {
  curlPlesk(config, "/api/v2/cli/subdomain/call", {
    params: [
      "--update",
      config.webDomain.split(".")[0],
      "-domain",
      config.parentDomain,
      "-php",
      "false",
    ],
  });
  curlPlesk(config, "/api/v2/cli/subdomain/call", {
    params: [
      "--update",
      config.apiDomain.split(".")[0],
      "-domain",
      config.parentDomain,
      "-php",
      "false",
    ],
  });
}

function extractRemote(domain, archiveName) {
  run("curl", ["-sk", `https://${domain}/extract.php?file=${archiveName}`]);
}

function enableNode(config) {
  curlPlesk(config, "/api/v2/cli/extension/call", {
    params: [
      "--call",
      "nodejs",
      "--enable",
      "-domain",
      config.webDomain,
      "-version",
      config.nodeVersion,
    ],
  });
  curlPlesk(config, "/api/v2/cli/extension/call", {
    params: [
      "--call",
      "nodejs",
      "--enable",
      "-domain",
      config.apiDomain,
      "-version",
      config.nodeVersion,
    ],
  });
}

function importDatabase(config) {
  if (!config.sqlDumpPath || !config.importDbName || !config.importDbDomain) {
    return;
  }

  if (!existsSync(config.sqlDumpPath)) {
    throw new Error(`SQL dump file not found: ${config.sqlDumpPath}`);
  }

  ftpUpload(
    config.ftpHost,
    config.webFtpUser,
    config.webFtpPass,
    config.sqlDumpPath,
    config.sqlDumpRemoteName,
  );

  curlPlesk(config, "/api/v2/cli/database/call", {
    params: [
      "--upload",
      config.importDbName,
      "-domain",
      config.importDbDomain,
      "-server",
      "localhost",
      "-dump-file",
      `/var/www/vhosts/${config.parentDomain}/${config.webDomain.split(".")[0]}/${config.sqlDumpRemoteName}`,
      "-recreate",
    ],
  });
}

function solveCaptcha(question) {
  const match = String(question).match(/(\d+)\s*([+\-])\s*(\d+)/);
  if (!match) {
    throw new Error(`Unable to parse captcha question: ${question}`);
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);
  return String(operator === "+" ? left + right : left - right);
}

async function smokeTest(config) {
  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const apiCaptchaResponse = await fetch(`${config.apiBaseUrl}/auth/captcha`);
    if (!apiCaptchaResponse.ok) {
      throw new Error(`API smoke failed with ${apiCaptchaResponse.status}`);
    }

    const sessionCaptchaResponse = await fetch(`${config.webBaseUrl}/api/session/captcha`);
    if (!sessionCaptchaResponse.ok) {
      throw new Error(`Web captcha smoke failed with ${sessionCaptchaResponse.status}`);
    }

    const sessionCaptcha = await sessionCaptchaResponse.json();
    const loginResponse = await fetch(`${config.webBaseUrl}/api/session/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "coach@kocluk.local",
        password: "Demo1234!",
        captchaToken: sessionCaptcha.captchaToken,
        captchaAnswer: solveCaptcha(sessionCaptcha.question),
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login smoke failed with ${loginResponse.status}`);
    }

    const cookie = loginResponse.headers.get("set-cookie");
    if (!cookie) {
      throw new Error("Login smoke failed: missing session cookie");
    }

    const dashboardResponse = await fetch(`${config.webBaseUrl}/dashboard`, {
      headers: {
        cookie,
      },
    });
    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard smoke failed with ${dashboardResponse.status}`);
    }

    const plansResponse = await fetch(`${config.webBaseUrl}/plans`, {
      headers: {
        cookie,
      },
    });
    if (!plansResponse.ok) {
      throw new Error(`Plans smoke failed with ${plansResponse.status}`);
    }
  } finally {
    if (previousTlsSetting === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
  }
}

function cleanupRemote(config) {
  const webFiles = ["extract.php", "web-deploy.zip"];
  if (config.sqlDumpPath) {
    webFiles.push(config.sqlDumpRemoteName);
  }
  const apiFiles = ["extract.php", "api-deploy.zip"];

  for (const file of webFiles) {
    try {
      ftpDelete(config.ftpHost, config.webFtpUser, config.webFtpPass, file);
    } catch {}
  }

  for (const file of apiFiles) {
    try {
      ftpDelete(config.ftpHost, config.apiFtpUser, config.apiFtpPass, file);
    } catch {}
  }
}

async function main() {
  loadEnvFile();
  const config = resolveConfig();
  const { webZip, apiZip } = prepareBundle(config);

  importDatabase(config);
  enablePhpExtractor(config);

  ftpUpload(config.ftpHost, config.webFtpUser, config.webFtpPass, webZip, "web-deploy.zip");
  ftpUpload(
    config.ftpHost,
    config.webFtpUser,
    config.webFtpPass,
    resolve(projectRoot, "scripts", "plesk-unpack.php"),
    "extract.php",
  );
  ftpUpload(config.ftpHost, config.apiFtpUser, config.apiFtpPass, apiZip, "api-deploy.zip");
  ftpUpload(
    config.ftpHost,
    config.apiFtpUser,
    config.apiFtpPass,
    resolve(projectRoot, "scripts", "plesk-unpack.php"),
    "extract.php",
  );

  extractRemote(config.webDomain, "web-deploy.zip");
  extractRemote(config.apiDomain, "api-deploy.zip");
  enableNode(config);
  disablePhpExtractor(config);
  cleanupRemote(config);
  await smokeTest(config);
}

await main();

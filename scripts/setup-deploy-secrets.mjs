import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const projectRoot = resolve(process.cwd());
const templatePath = resolve(projectRoot, ".env.deploy.example");
const targetDir = resolve(homedir(), ".config", "kocluk-proje");

mkdirSync(targetDir, { recursive: true });

for (const envName of ["staging", "production"]) {
  const targetPath = resolve(targetDir, `.env.deploy.${envName}`);
  if (!existsSync(targetPath)) {
    copyFileSync(templatePath, targetPath);
    console.log(`created ${targetPath}`);
  } else {
    console.log(`exists ${targetPath}`);
  }
}

console.log("");
console.log("Fill the generated files, then run:");
console.log("npm run deploy:staging");
console.log("npm run deploy:prod");

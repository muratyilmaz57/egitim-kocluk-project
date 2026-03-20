import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

type StoredFile = {
  filePath: string;
  fileName: string;
  size: number;
  provider: "local" | "s3";
};

function sanitizeFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function ensureSupportedFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large.");
  }
}

function getSafeFileParts(file: File) {
  const safeBaseName =
    sanitizeFileName(basename(file.name, extname(file.name)) || "resource") || "resource";
  const safeExtension = sanitizeFileName(extname(file.name)) || ".bin";
  const objectName = `${Date.now()}-${randomUUID()}-${safeBaseName}${safeExtension}`;

  return {
    originalName: file.name,
    objectName,
  };
}

function isS3Configured() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_REGION &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

function buildS3PublicUrl(key: string) {
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET;
  if (endpoint && bucket) {
    return `${endpoint}/${bucket}/${key}`;
  }

  throw new Error("S3 public URL is not configured.");
}

function createS3Client() {
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}

async function storeLocally(file: File, objectName: string): Promise<StoredFile> {
  const relativePath = `/uploads/resources/${objectName}`;
  const outputPath = join(process.cwd(), "public", "uploads", "resources", objectName);

  await mkdir(join(process.cwd(), "public", "uploads", "resources"), { recursive: true });
  await writeFile(outputPath, Buffer.from(await file.arrayBuffer()));

  return {
    filePath: relativePath,
    fileName: file.name,
    size: file.size,
    provider: "local",
  };
}

async function storeOnS3(file: File, objectName: string): Promise<StoredFile> {
  const client = createS3Client();
  const key = `resources/${objectName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ContentDisposition: `inline; filename="${objectName}"`,
    }),
  );

  return {
    filePath: buildS3PublicUrl(key),
    fileName: file.name,
    size: file.size,
    provider: "s3",
  };
}

export async function storeResourceFile(file: File): Promise<StoredFile> {
  ensureSupportedFile(file);
  const { objectName } = getSafeFileParts(file);

  if (isS3Configured()) {
    try {
      return await storeOnS3(file, objectName);
    } catch (error) {
      console.warn("S3 upload failed, falling back to local storage.", error);
    }
  }

  return storeLocally(file, objectName);
}

import "server-only";

import { consultationUpload } from "@/config/site-config";

import { fileSchema } from "./schema";
import type { StoredReference } from "./delivery";

/**
 * Reference-file handling.
 *
 * Files are validated on the server regardless of what the browser allowed:
 * count, size, declared MIME type and magic-number signature are all checked.
 * Nothing is written to disk or executed, and original filenames are never
 * trusted — they are sanitized before being passed on.
 */

export type StorageOutcome =
  | { ok: true; references: StoredReference[] }
  | { ok: false; message: string };

/** Leading bytes for the accepted formats. */
const SIGNATURES: Array<{ mime: string; test: (bytes: Uint8Array) => boolean }> = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a,
  },
  {
    mime: "image/webp",
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "riferimento";
  return base
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

async function verifySignature(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return SIGNATURES.some((s) => s.mime === file.type && s.test(head));
}

/**
 * Validates the uploaded references and, when object storage is configured,
 * uploads them. Without storage the request still goes through — the metadata
 * travels with the payload and the artist can ask for the images directly.
 */
export async function processReferences(files: File[]): Promise<StorageOutcome> {
  if (files.length === 0) return { ok: true, references: [] };

  if (files.length > consultationUpload.maxFiles) {
    return { ok: false, message: `Puoi allegare al massimo ${consultationUpload.maxFiles} file.` };
  }

  const references: StoredReference[] = [];

  for (const file of files) {
    const parsed = fileSchema.safeParse(file);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "File non valido." };
    }

    if (!(await verifySignature(file))) {
      return {
        ok: false,
        message: "Il contenuto del file non corrisponde al formato dichiarato.",
      };
    }

    const filename = sanitizeFilename(file.name);
    const uploaded = await uploadToStorage(file, filename);

    references.push({
      filename,
      size: file.size,
      contentType: file.type,
      ...(uploaded ? { url: uploaded } : {}),
    });
  }

  return { ok: true, references };
}

/**
 * Uploads to the configured S3-compatible bucket via a pre-signed PUT endpoint.
 * Returns `null` when storage is not configured — a documented, non-fatal state.
 */
async function uploadToStorage(file: File, filename: string): Promise<string | null> {
  const bucket = process.env.UPLOAD_STORAGE_BUCKET?.trim();
  const endpoint = process.env.UPLOAD_STORAGE_ENDPOINT?.trim();
  const token = process.env.UPLOAD_STORAGE_TOKEN?.trim();

  if (!bucket || !endpoint || !token) return null;

  const key = `consultation/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const url = `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      Authorization: `Bearer ${token}`,
    },
    body: file,
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Upload storage responded ${response.status}`);
  }

  return url;
}

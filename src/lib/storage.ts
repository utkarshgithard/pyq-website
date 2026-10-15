import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseClient, isSupabaseConfigured, BUCKET_NAME } from "./supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

let bucketChecked = false;

async function ensureBucket(supabase: ReturnType<typeof getSupabaseClient>) {
  if (!supabase || bucketChecked) return;
  try {
    const { data } = await supabase.storage.getBucket(BUCKET_NAME);
    if (!data) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ["application/pdf"],
      });
    }
    bucketChecked = true;
  } catch {
    // If bucket check or create is not permitted by key permissions, mark checked and let upload proceed
    bucketChecked = true;
  }
}

function getUploadDirectory() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./data/papers");
}

export async function storePdf(file: File): Promise<{ storageName: string; fileSize: number }> {
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("PDF files must be smaller than 20 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The uploaded file is not a valid PDF.");
  }

  const storageName = `${randomUUID()}.pdf`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not properly configured.");

    await ensureBucket(supabase);

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(storageName, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (error) {
      if (error.message.toLowerCase().includes("bucket not found")) {
        throw new Error(
          `Supabase Storage bucket "${BUCKET_NAME}" was not found. Please create a bucket named "${BUCKET_NAME}" in your Supabase dashboard.`
        );
      }
      throw new Error(`Failed to upload PDF to Supabase Storage: ${error.message}`);
    }

    return { storageName, fileSize: bytes.byteLength };
  }

  // Fallback to local filesystem storage if Supabase credentials are not provided
  const directory = getUploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storageName), bytes, { flag: "wx" });

  return { storageName, fileSize: bytes.byteLength };
}

export async function readPdf(storageName: string): Promise<Buffer> {
  if (!/^[\da-f-]+\.pdf$/i.test(storageName)) {
    throw new Error("Invalid stored file name.");
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not properly configured.");

    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(storageName);
    if (error || !data) {
      throw new Error(`Failed to download PDF from Supabase Storage: ${error?.message || "File not found"}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Fallback to local filesystem
  return readFile(path.join(/*turbopackIgnore: true*/ getUploadDirectory(), storageName));
}

export async function deletePdf(storageName: string): Promise<void> {
  if (!/^[\da-f-]+\.pdf$/i.test(storageName)) {
    throw new Error("Invalid stored file name.");
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not properly configured.");

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storageName]);
    if (error) {
      throw new Error(`Failed to delete PDF from Supabase Storage: ${error.message}`);
    }
    return;
  }

  // Fallback to local filesystem
  await unlink(path.join(/*turbopackIgnore: true*/ getUploadDirectory(), storageName));
}

import { put } from '@vercel/blob';
import path from 'path';

// Load root .env if available, regardless of where this script is executed from
try {
  process.loadEnvFile();
} catch {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {}
}


export interface BlobBufferResult {
  buffer: Buffer;
  contentType: string;
}

export async function uploadFileToBlob(
  fileBuffer: Buffer,
  fileName: string,
  token?: string,
): Promise<string> {
  const { url } = await put(fileName, fileBuffer, {
    access: 'public',
    token: token || process.env.BLOB_READ_WRITE_TOKEN,
  });
  return url;
}

export async function fetchBlobBuffer(
  url: string,
  token?: string,
): Promise<BlobBufferResult> {
  const authToken = token || process.env.BLOB_READ_WRITE_TOKEN;
  const res = await fetch(url, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch blob: ${res.status} ${res.statusText}`);
  }
  const contentType =
    res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}


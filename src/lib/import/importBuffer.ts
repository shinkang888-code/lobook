import { readImportBuffer } from "@/lib/import/storage";

export async function readImportBufferAsArrayBuffer(storagePath: string): Promise<ArrayBuffer> {
  const buf = await readImportBuffer(storagePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

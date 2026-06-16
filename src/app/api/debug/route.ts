// src/app/api/debug/route.ts
// Returns live memory-store stats — useful for diagnosing chat issues.
import { NextResponse } from "next/server";
import { getStats, getChunks, getDocuments } from "@/lib/memory";

export async function GET() {
  const stats = getStats();
  const documents = getDocuments().map((d) => ({
    id: d.id,
    filename: d.filename,
    pageCount: d.pageCount,
    charCount: d.charCount,
    uploadedAt: d.uploadedAt,
  }));
  const sampleChunks = getChunks()
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      filename: c.filename,
      index: c.index,
      wordCount: c.wordCount,
      preview: c.text.slice(0, 120) + "…",
    }));

  return NextResponse.json({
    stats,
    documents,
    sampleChunks,
    globalStorePresent: !!globalThis.__documindStore,
    timestamp: new Date().toISOString(),
  });
}

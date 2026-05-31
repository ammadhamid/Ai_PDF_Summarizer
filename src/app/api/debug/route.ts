import { NextResponse } from "next/server";
import {
  getDocuments,
  getChunks,
  getSummaries,
  getChatHistory,
} from "@/lib/memory";

export async function GET() {
  const documents = getDocuments();
  const chunks = getChunks();
  const summaries = getSummaries();
  const chatHistory = getChatHistory();

  return NextResponse.json({
    ram_status: {
      documents: documents.length,
      chunks: chunks.length,
      summaries: summaries.length,
      chatMessages: chatHistory.length,
    },
    documents: documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      pages: d.pageCount,
      chars: d.charCount,
    })),
    chunks_preview: chunks.map((c) => ({
      filename: c.filename,
      index: c.index,
      wordCount: c.wordCount,
      preview: c.text.slice(0, 120) + "...",
    })),
    chatHistory,
  });
}

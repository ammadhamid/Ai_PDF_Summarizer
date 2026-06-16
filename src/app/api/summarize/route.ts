// src/app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentById,
  getChunksByDocumentId,
  addSummary,
  getSummaries,
} from "@/lib/memory";
import { summarizeDocument } from "@/lib/grok";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, customPrompt } = body as {
      documentId?: string;
      customPrompt?: string;
    };

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required." },
        { status: 400 },
      );
    }

    const doc = getDocumentById(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found in memory." },
        { status: 404 },
      );
    }

    const chunks = getChunksByDocumentId(documentId);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No text chunks found for this document." },
        { status: 404 },
      );
    }

    // Reconstruct document text from chunks (unique, ordered)
    const fullText = chunks
      .sort((a, b) => a.index - b.index)
      .map((c) => c.text)
      .join("\n\n");

    const summary = await summarizeDocument(
      fullText,
      doc.filename,
      customPrompt,
    );

    const cleanSummary = summary
      .replace(/---DOCUMENT START---[\s\S]*?---DOCUMENT END---/g, "")
      .trim();
    addSummary({
      documentId,
      filename: doc.filename,
      summary: cleanSummary,
      prompt: customPrompt,
      generatedAt: new Date().toISOString(),
    });
    console.log("SUMMARY RESPONSE:")
    console.log(summary);


    return NextResponse.json({ documentId, filename: doc.filename, summary });
  } catch (err) {
    console.error("[summarize] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const summaries = getSummaries();
    return NextResponse.json({ summaries });
  } catch (err) {
    console.error("[summarize GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve summaries." },
      { status: 500 },
    );
  }
}

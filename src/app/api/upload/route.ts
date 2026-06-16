// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { addDocument, addChunks } from "@/lib/memory";
import { extractTextFromPDF } from "@/lib/pdf";
import { chunkText  } from "@/lib/chunker";
import { getChunks } from "@/lib/memory";
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded." },
        { status: 400 },
      );
    }

    const results = [];

    for (const file of files) {
      if (!file.name.endsWith(".pdf")) {
        results.push({ filename: file.name, error: "Not a PDF file." });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractTextFromPDF(buffer, file.name);

      if (!extracted.text || extracted.text.trim().length < 50) {
        results.push({
          filename: file.name,
          error:
            "Could not extract text from PDF (possibly scanned/image-only).",
        });
        continue;
      }

      const documentId = uuidv4();

      addDocument({
        id: documentId,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        pageCount: extracted.pageCount,
        charCount: extracted.charCount,
      });

      const chunks = chunkText(extracted.text, documentId, file.name);

      console.log("NEW CHUNKS:", chunks.length);

      addChunks(chunks);

      console.log("TOTAL CHUNKS:", getChunks().length);

      results.push({
        documentId,
        filename: file.name,
        pageCount: extracted.pageCount,
        charCount: extracted.charCount,
        chunkCount: chunks.length,
        success: true,
      });
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      message: `${successCount} of ${files.length} file(s) processed successfully.`,
      results,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to process upload." },
      { status: 500 },
    );
  }
}

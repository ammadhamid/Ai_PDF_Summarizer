import pdfParse from "pdf-parse";

export interface ExtractedPDF {
  text: string;
  pageCount: number;
  charCount: number;
  filename: string;
}

export async function extractTextFromPDF(
  buffer: Buffer,
  filename: string,
): Promise<ExtractedPDF> {
  const data = await pdfParse(buffer);

  const cleanedText = cleanText(data.text);

  return {
    text: cleanedText,
    pageCount: data.numpages,
    charCount: cleanedText.length,
    filename,
  };
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();
}

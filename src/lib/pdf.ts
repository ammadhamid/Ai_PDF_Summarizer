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
  return (
    raw
      // normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")

      // remove page numbers on separate lines
      .replace(/^\s*\d+\s*$/gm, "")

      // remove repeated slide numbers before headings
      .replace(/\n\s*\d+\s+(?=[A-Z])/g, "\n")

      // collapse multiple spaces
      .replace(/[ \t]+/g, " ")

      // collapse excessive newlines
      .replace(/\n{3,}/g, "\n\n")

      // remove weird bullet characters
      .replace(/[❑□▪■◦•]+/g, "\n• ")

      // clean spacing around bullets
      .replace(/\n\s*•\s*/g, "\n• ")

      .trim()
  );
}

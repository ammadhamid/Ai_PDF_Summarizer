import { ChunkRecord } from "./memory";
import { v4 as uuidv4 } from "uuid";

const CHUNK_SIZE = 1000;
const OVERLAP = 100;

export function chunkText(
  text: string,
  documentId: string,
  filename: string,
): ChunkRecord[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: ChunkRecord[] = [];

  if (words.length === 0) return chunks;

  let start = 0;
  let index = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(" ");

    chunks.push({
      id: uuidv4(),
      documentId,
      filename,
      index,
      text: chunkText,
      wordCount: chunkWords.length,
    });

    index++;

    start += CHUNK_SIZE - OVERLAP;

    if (start < words.length && words.length - start < OVERLAP) {
      break;
    }
  }

  return chunks;
}

export function describeChunk(chunk: ChunkRecord): string {
  return `[${chunk.filename} | Chunk ${chunk.index + 1} | ${chunk.wordCount} words]`;
}

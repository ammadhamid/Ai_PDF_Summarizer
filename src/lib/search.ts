import { ChunkRecord } from "./memory";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "what",
  "which",
  "who",
  "how",
  "when",
  "where",
  "why",
  "not",
  "no",
  "so",
  "as",
  "up",
  "if",
  "than",
  "then",
  "also",
  "any",
  "all",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "about",
  "against",
  "can",
  "just",
  "like",
  "over",
  "under",
  "tell",
  "me",
  "please",
  "give",
  "show",
  "explain",
  "describe",
  "list",
  "find",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function scoreChunk(chunk: ChunkRecord, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;
  const chunkLower = chunk.text.toLowerCase();
  const chunkTokens = tokenize(chunk.text);
  const chunkFreq: Record<string, number> = {};
  for (const token of chunkTokens) {
    chunkFreq[token] = (chunkFreq[token] || 0) + 1;
  }
  let score = 0;
  for (const term of queryTerms) {
    if (chunkFreq[term]) score += chunkFreq[term] * 2;
    if (chunkLower.includes(term)) score += 1;
  }
  return score / Math.sqrt(chunk.wordCount);
}

export interface ScoredChunk {
  chunk: ChunkRecord;
  score: number;
}

export function searchChunks(
  query: string,
  chunks: ChunkRecord[],
  topK = 5,
): ScoredChunk[] {
  if (chunks.length === 0) return [];
  const queryTerms = tokenize(query);
  const scored: ScoredChunk[] = chunks
    .map((chunk) => ({
      chunk,
      score: queryTerms.length > 0 ? scoreChunk(chunk, queryTerms) : 0,
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function formatContext(scoredChunks: ScoredChunk[]): string {
  if (scoredChunks.length === 0) return "";
  return scoredChunks
    .map(
      ({ chunk }, i) =>
        `--- Context Passage ${i + 1} (from: ${chunk.filename}, chunk #${chunk.index + 1}) ---\n${chunk.text}`,
    )
    .join("\n\n");
}

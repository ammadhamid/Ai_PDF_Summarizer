// ─── In-Memory Store ──────────────────────────────────────────────────────────
// All data lives in RAM for the current server session only.
// No database, no persistence — server restart clears everything.
//
// Next.js 15 App Router note:
// Each API route is a separate module instance. Attaching to `globalThis`
// via a declared global var ensures ONE store is shared across all routes
// within the same Node.js process, surviving Hot Module Replacement.

export interface DocumentRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  pageCount: number;
  charCount: number;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  filename: string;
  index: number;
  text: string;
  wordCount: number;
}

export interface SummaryRecord {
  documentId: string;
  filename: string;
  summary: string;
  prompt?: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MemoryStore {
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
  summaries: SummaryRecord[];
  chatHistory: ChatMessage[];
}

// ─── Process-level singleton ───────────────────────────────────────────────────
// `declare global` lets TypeScript know about our custom global.
// This works reliably in Next.js dev mode (HMR-safe) and production.
declare global {
  // eslint-disable-next-line no-var
  var __documindStore: MemoryStore | undefined;
}

if (!globalThis.__documindStore) {
  globalThis.__documindStore = {
    documents: [],
    chunks: [],
    summaries: [],
    chatHistory: [],
  };
}

/** Always access through this getter — never cache the reference */
function store(): MemoryStore {
  // Re-initialize if somehow wiped (extra safety)
  if (!globalThis.__documindStore) {
    globalThis.__documindStore = {
      documents: [],
      chunks: [],
      summaries: [],
      chatHistory: [],
    };
  }
  return globalThis.__documindStore;
}

// ─── Document helpers ──────────────────────────────────────────────────────────
export function addDocument(doc: DocumentRecord): void {
  store().documents.push(doc);
}

export function getDocuments(): DocumentRecord[] {
  return store().documents;
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  return store().documents.find((d) => d.id === id);
}

// ─── Chunk helpers ─────────────────────────────────────────────────────────────
export function addChunks(chunks: ChunkRecord[]): void {
  store().chunks.push(...chunks);
}

export function getChunks(): ChunkRecord[] {
  return store().chunks;
}

export function getChunksByDocumentId(documentId: string): ChunkRecord[] {
  return store().chunks.filter((c) => c.documentId === documentId);
}

// ─── Summary helpers ───────────────────────────────────────────────────────────
export function addSummary(summary: SummaryRecord): void {
  const s = store();
  const idx = s.summaries.findIndex(
    (item) => item.documentId === summary.documentId,
  );
  if (idx !== -1) {
    s.summaries[idx] = summary;
  } else {
    s.summaries.push(summary);
  }
}

export function getSummaries(): SummaryRecord[] {
  return store().summaries;
}

export function getSummaryByDocumentId(
  documentId: string,
): SummaryRecord | undefined {
  return store().summaries.find((s) => s.documentId === documentId);
}

// ─── Chat history helpers ──────────────────────────────────────────────────────
export function addChatMessage(message: ChatMessage): void {
  store().chatHistory.push(message);
}

export function getChatHistory(): ChatMessage[] {
  return store().chatHistory;
}

export function clearChatHistory(): void {
  store().chatHistory = [];
}

// ─── Reset & stats ─────────────────────────────────────────────────────────────
export function clearAll(): void {
  const s = store();
  s.documents = [];
  s.chunks = [];
  s.summaries = [];
  s.chatHistory = [];
}

export function getStats() {
  const s = store();
  return {
    documentCount: s.documents.length,
    chunkCount: s.chunks.length,
    summaryCount: s.summaries.length,
    chatMessageCount: s.chatHistory.length,
  };
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// All data lives in RAM for the current server session only.
// No database, no persistence — refreshing the server clears everything.

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

// Singleton in-memory store
declare global {
  var __documindStore: MemoryStore | undefined;
}

if (!global.__documindStore) {
  global.__documindStore = {
    documents: [],
    chunks: [],
    summaries: [],
    chatHistory: [],
  };
}

const memoryStore: MemoryStore = global.__documindStore;

// ─── Document helpers ──────────────────────────────────────────────────────────
export function addDocument(doc: DocumentRecord): void {
  memoryStore.documents.push(doc);
}

export function getDocuments(): DocumentRecord[] {
  return memoryStore.documents;
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  return memoryStore.documents.find((d) => d.id === id);
}

// ─── Chunk helpers ─────────────────────────────────────────────────────────────
export function addChunks(chunks: ChunkRecord[]): void {
  memoryStore.chunks.push(...chunks);
}

export function getChunks(): ChunkRecord[] {
  return memoryStore.chunks;
}

export function getChunksByDocumentId(documentId: string): ChunkRecord[] {
  return memoryStore.chunks.filter((c) => c.documentId === documentId);
}

// ─── Summary helpers ───────────────────────────────────────────────────────────
export function addSummary(summary: SummaryRecord): void {
  // Replace if already exists for same document
  const idx = memoryStore.summaries.findIndex(
    (s) => s.documentId === summary.documentId,
  );
  if (idx !== -1) {
    memoryStore.summaries[idx] = summary;
  } else {
    memoryStore.summaries.push(summary);
  }
}

export function getSummaries(): SummaryRecord[] {
  return memoryStore.summaries;
}

export function getSummaryByDocumentId(
  documentId: string,
): SummaryRecord | undefined {
  return memoryStore.summaries.find((s) => s.documentId === documentId);
}

// ─── Chat history helpers ──────────────────────────────────────────────────────
export function addChatMessage(message: ChatMessage): void {
  memoryStore.chatHistory.push(message);
}

export function getChatHistory(): ChatMessage[] {
  return memoryStore.chatHistory;
}

export function clearChatHistory(): void {
  memoryStore.chatHistory = [];
}

// ─── Reset helpers ─────────────────────────────────────────────────────────────
export function clearAll(): void {
  memoryStore.documents = [];
  memoryStore.chunks = [];
  memoryStore.summaries = [];
  memoryStore.chatHistory = [];
}

export function getStats() {
  return {
    documentCount: memoryStore.documents.length,
    chunkCount: memoryStore.chunks.length,
    summaryCount: memoryStore.summaries.length,
    chatMessageCount: memoryStore.chatHistory.length,
  };
}

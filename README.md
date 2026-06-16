# DocuMind — RAG-based PDF Summarizer & Document Q&A System

**An AI-powered document summarizer and Q&A assistant.** Upload one or more PDFs, generate structured summaries on demand, and chat with your documents in natural language — all grounded strictly in the content you upload.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq%20%7C%20Llama%203.3%2070B-F55036)
![License](https://img.shields.io/badge/License-Academic%20Project-lightgrey)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Limitations](#limitations)
- [Possible Improvements](#possible-improvements)
- [Team & Acknowledgments](#team--acknowledgments)
- [License](#license)

## Overview

DocuMind is a full-stack Next.js application that turns static PDFs into something you can actually interrogate. Drop in a document, and it's parsed, cleaned, and chunked on the server; from there you can request a structured AI-generated summary or ask free-form questions and get answers sourced directly from the text — with no external database, no vector store, and no persistence layer. Everything lives in server memory for the lifetime of the process, which keeps the architecture intentionally minimal while still supporting multi-document workflows.

## Features

- **Multi-PDF upload** via drag-and-drop or file picker, with per-file validation and progress feedback.
- **Server-side text extraction and cleanup** — strips page numbers, normalizes whitespace, and fixes inconsistent bullet characters before anything reaches the model.
- **Structured summarization** with a fixed six-part format (Overview, Key Points, Details, Technologies/Tools, Timeline/Milestones, Conclusion), plus an optional custom-instructions field and a "Summarize All" bulk action.
- **Document-grounded Q&A** — the assistant answers only from retrieved excerpts and explicitly refuses to use outside knowledge when the answer isn't in the document.
- **Lightweight keyword retrieval** — a TF-weighted, stopword-filtered scoring function ranks chunks by relevance with no embeddings or vector database required.
- **Source attribution** — every chat response returns the filename, chunk index, and relevance score behind the answer.
- **Persistent-per-session chat history** with a one-click clear option and automatic follow-up context (last 8 messages).
- **Custom dark UI** built on a hand-rolled `dm-*` component system, with Montserrat for UI text and JetBrains Mono for technical detail.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3 + custom CSS design tokens |
| LLM Provider | Groq Cloud — `llama-3.3-70b-versatile` |
| PDF Parsing | `pdf-parse` |
| Markdown Rendering | `react-markdown` |
| State | In-memory store (`globalThis`), no database |

## How It Works

**Ingestion pipeline**

```
PDF Upload → Text Extraction (pdf-parse) → Cleanup → Word-based Chunking (1000 words, 100-word overlap) → In-Memory Store
```

**Summarization**

```
Stored Chunks → Reassembled Document Text → Groq (temp 0.2, 3000 max tokens) → Structured Markdown Summary
```

**Chat / Q&A**

```
Question → Keyword Search (top 5 chunks) → Context Block + Last 8 Messages → Groq (temp 0.15, 2000 max tokens) → Grounded Answer + Sources
```

Retrieval is intentionally simple: queries and chunks are tokenized, stopwords are removed, and chunks are scored by a combination of exact term frequency and substring matches, normalized by chunk length. This avoids the cost and complexity of embeddings while still surfacing reasonably relevant passages for a single-session, moderate-document-count use case.

## Project Structure

```
documind/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts        # Q&A endpoint (POST / GET / DELETE)
│   │   │   ├── debug/route.ts       # Live in-memory store diagnostics
│   │   │   ├── summarize/route.ts   # Summary generation (POST) & retrieval (GET)
│   │   │   └── upload/route.ts      # PDF upload & ingestion
│   │   ├── globals.css              # Design tokens + dm-* component styles
│   │   ├── layout.tsx                # Root layout & page metadata
│   │   └── page.tsx                  # Main UI — sidebar, upload, chat/summaries tabs
│   ├── components/
│   │   ├── ChatBox.tsx               # Chat interface, message state, auto-scroll
│   │   ├── FileUploader.tsx          # Drag-and-drop multi-file uploader
│   │   └── MessageBubble.tsx         # Individual chat message + source rendering
│   └── lib/
│       ├── chunker.ts                # Word-based chunking with overlap
│       ├── grok.ts                   # Groq API integration (summarize & answer)
│       ├── memory.ts                 # Process-level in-memory data store
│       ├── pdf.ts                    # PDF text extraction & cleanup
│       └── search.ts                 # TF-based keyword relevance search
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A free [Groq Cloud](https://console.groq.com) API key

### Installation

```bash
git clone https://github.com/ammadhamid/Ai_PDF_Summarizer.git
cd Ai_PDF_Summarizer
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Used by `src/lib/grok.ts` to call Groq's `llama-3.3-70b-versatile` model for both summarization and Q&A. |

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Upload a text-based PDF, then switch between the **Chat** and **Summaries** tabs to interact with it.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Accepts one or more `.pdf` files (`multipart/form-data`, field name `files`), extracts and chunks their text, and stores them in memory. |
| `POST` | `/api/summarize` | Generates a structured summary for a given `documentId`, with an optional `customPrompt`. |
| `GET` | `/api/summarize` | Returns all summaries generated in the current session. |
| `POST` | `/api/chat` | Accepts a `question`, retrieves the top 5 relevant chunks across all uploaded documents, and returns a grounded `answer` with `sources`. |
| `GET` | `/api/chat` | Returns the full chat history for the current session. |
| `DELETE` | `/api/chat` | Clears the chat history. |
| `GET` | `/api/debug` | Returns live store stats (document/chunk/summary counts) and sample chunk previews — useful for diagnosing ingestion issues. |

## Limitations

- **No persistence** — all documents, chunks, summaries, and chat history live in server RAM and are wiped on restart.
- **Single-process state** — the store is attached to `globalThis`, so it does not synchronize across multiple server instances; this rules out serverless or horizontally-scaled deployments without adding a backing store.
- **Text-layer PDFs only** — scanned or image-only PDFs without an embedded text layer are rejected at upload (no OCR step).
- **Keyword, not semantic, retrieval** — chunk ranking is term-frequency based, so conceptually related passages that don't share vocabulary with the query may be missed.
- **Per-document context cap** — summarization truncates each document to roughly the first 28,000 characters before sending it to the model.

## Possible Improvements

- Swap keyword search for embedding-based vector retrieval for better recall on paraphrased questions.
- Add a persistence layer (e.g. SQLite or Postgres) so sessions survive a server restart.
- Add OCR support for scanned/image-based PDFs.
- Stream chat and summary responses token-by-token instead of waiting for the full completion.
- Let users click a source citation to jump to the originating chunk/page.

## Team & Acknowledgments

Built as a semester project for the AI Lab course at Hamdard University.

- Ammad Hamid
- Ali Nasir
- Abdullah Babar

## License

No license is currently attached to this repository. It was built for academic and portfolio purposes — if you intend to make it publicly reusable, consider adding an [MIT License](https://choosealicense.com/licenses/mit/).

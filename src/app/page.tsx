"use client";

import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import ChatBox from "@/components/ChatBox";
import ReactMarkdown from "react-markdown";

interface UploadResult {
  documentId?: string;
  filename: string;
  pageCount?: number;
  chunkCount?: number;
  success?: boolean;
  error?: string;
}

interface SummaryState {
  [documentId: string]: {
    text: string;
    loading: boolean;
    error?: string;
  };
}

export default function Home() {
  const [documents, setDocuments] = useState<UploadResult[]>([]);
  const [summaries, setSummaries] = useState<SummaryState>({});
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "summaries">("chat");

  const handleUploadSuccess = (results: UploadResult[]) => {
    const successful = results.filter((r) => r.success);
    setDocuments((prev) => {
      const existingIds = new Set(prev.map((d) => d.documentId));
      const newDocs = successful.filter((d) => !existingIds.has(d.documentId));
      return [...prev, ...newDocs];
    });
  };

  const handleSummarize = async (doc: UploadResult) => {
    if (!doc.documentId) return;
    const id = doc.documentId;
    setSummaries((prev) => ({ ...prev, [id]: { text: "", loading: true } }));
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: id,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      setSummaries((prev) => ({
        ...prev,
        [id]: {
          text: data.summary || data.error || "No summary generated.",
          loading: false,
          error: !data.summary ? data.error : undefined,
        },
      }));
    } catch {
      setSummaries((prev) => ({
        ...prev,
        [id]: {
          text: "",
          loading: false,
          error: "Failed to generate summary.",
        },
      }));
    }
  };

  const handleSummarizeAll = async () => {
    for (const doc of documents) {
      if (doc.documentId && !summaries[doc.documentId]?.text) {
        await handleSummarize(doc);
      }
    }
  };

  const hasDocuments = documents.length > 0;

  return (
    <div className="dm-root">
      <div className="dm-layout">
        {/* Sidebar */}
        <aside className="dm-sidebar">
          {/* Logo */}
          <div className="dm-logo">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>DocuMind</span>
          </div>

          <div className="dm-divider" />

          {/* Upload */}
          <div className="dm-section">
            <p className="dm-section-label">Upload</p>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Documents */}
          {hasDocuments && (
            <>
              <div className="dm-divider" />
              <div className="dm-section">
                <p className="dm-section-label">
                  Documents ({documents.length})
                </p>
                <div className="dm-doc-list">
                  {documents.map((doc) => (
                    <div key={doc.documentId} className="dm-doc-item">
                      <div className="dm-doc-icon">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="dm-doc-info">
                        <p className="dm-doc-name">{doc.filename}</p>
                        <p className="dm-doc-meta">
                          {doc.pageCount}p · {doc.chunkCount} chunks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dm-divider" />

              {/* Summarize */}
              <div className="dm-section">
                <p className="dm-section-label">Summarize</p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Custom instructions (optional)"
                  rows={2}
                  className="dm-textarea"
                />
                <div className="dm-sum-actions">
                  <button
                    onClick={handleSummarizeAll}
                    className="dm-btn-secondary"
                  >
                    All
                  </button>
                  {documents.map((doc) => (
                    <button
                      key={doc.documentId}
                      onClick={() => {
                        setActiveTab("summaries");
                        handleSummarize(doc);
                      }}
                      title={doc.filename}
                      className="dm-btn-icon"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="dm-sidebar-footer">
            <span className={`dm-status-dot ${hasDocuments ? "active" : ""}`} />
            <span>
              {hasDocuments ? `${documents.length} loaded` : "No docs"}
            </span>
          </div>
        </aside>

        {/* Main */}
        <main className="dm-main">
          {/* Tabs */}
          <div className="dm-tabs">
            {(["chat", "summaries"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`dm-tab ${activeTab === tab ? "active" : ""}`}
              >
                {tab === "chat" ? "Chat" : "Summaries"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="dm-content" style={{minHeight: 0}}>
            {activeTab === "chat" && <ChatBox hasDocuments={hasDocuments} />}

            {activeTab === "summaries" && (
              <div className="dm-summaries">
                {!hasDocuments ? (
                  <div className="dm-empty">
                    <p>Upload documents to generate summaries</p>
                  </div>
                ) : Object.keys(summaries).length === 0 ? (
                  <div className="dm-empty">
                    <p>No summaries yet — use the controls in the sidebar</p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    if (!doc.documentId) return null;
                    const state = summaries[doc.documentId];
                    if (!state) return null;
                    return (
                      <div key={doc.documentId} className="dm-summary-card">
                        <div className="dm-summary-header">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>{doc.filename}</span>
                        </div>
                        <div className="dm-summary-body">
                          {state.loading ? (
                            <div className="dm-loading">
                              <div className="dm-spinner" />
                              <span>Generating…</span>
                            </div>
                          ) : state.error ? (
                            <p className="dm-error">{state.error}</p>
                          ) : (
                            <div className="dm-prose">
                              <ReactMarkdown>{state.text}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

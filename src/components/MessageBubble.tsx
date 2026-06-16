"use client";

import ReactMarkdown from "react-markdown";

interface Source {
  filename: string;
  chunkIndex: number;
  score: number;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp?: string;
  isError?: boolean;
}

export default function MessageBubble({
  role,
  content,
  sources,
  timestamp,
  isError,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`mb-row ${isUser ? "user" : "assistant"}`}>
      <div
        className={`mb-bubble ${isUser ? "user" : isError ? "error" : "assistant"}`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="mb-prose">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {!isUser && sources && sources.length > 0 && (
        <div className="mb-sources">
          <span className="mb-sources-label">Sources:</span>
          {sources.map((src, i) => (
            <span key={i} className="mb-source" title={`Relevance: ${src.score}`}>
              {src.filename} §{src.chunkIndex + 1}
            </span>
          ))}
        </div>
      )}

      {timestamp && (
        <p className="mb-time">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

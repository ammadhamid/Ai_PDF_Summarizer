"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

interface Source {
  filename: string;
  chunkIndex: number;
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
  isError?: boolean;
}

interface ChatBoxProps {
  hasDocuments: boolean;
}

export default function ChatBox({ hasDocuments }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        // Show server error as a red assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${data.error || "Server returned an error."}`,
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No response received.",
          sources: data.sources,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Could not reach the server: ${message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([]);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="cb-root">
      {/* Header — only visible when there are messages */}
      {messages.length > 0 && (
        <div className="cb-header">
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="cb-clear"
          >
            {isClearing ? "Clearing…" : "Clear chat"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="cb-messages">
        {messages.length === 0 && (
          <div className="cb-empty">
            <div className="cb-empty-inner">
              {hasDocuments ? (
                <>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--accent)", marginBottom: 10 }}
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p style={{ color: "var(--text-2)", marginBottom: 4 }}>
                    Documents loaded — start asking!
                  </p>
                  <p style={{ color: "var(--text-3)", fontSize: 11 }}>
                    Ask anything about your PDFs
                  </p>
                </>
              ) : (
                <>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-3)", marginBottom: 10 }}
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p style={{ color: "var(--text-3)" }}>
                    Upload PDFs to start chatting
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
            timestamp={msg.timestamp}
            isError={msg.isError}
          />
        ))}

        {isLoading && (
          <div className="cb-typing">
            <div className="cb-typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`cb-input-wrap ${!hasDocuments ? "disabled" : ""}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!hasDocuments || isLoading}
          placeholder={
            hasDocuments
              ? "Ask a question about your documents… (Enter to send)"
              : "Upload documents first to start chatting"
          }
          rows={1}
          className="cb-input"
        />
        <button
          onClick={handleSend}
          disabled={!hasDocuments || isLoading || !input.trim()}
          className="cb-send"
          title="Send message"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

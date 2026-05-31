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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error || "No response received.",
          sources: data.sources,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred while contacting the server.",
          timestamp: new Date().toISOString(),
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
      {/* Header */}
      {messages.length > 0 && (
        <div className="cb-header">
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="cb-clear"
          >
            {isClearing ? "Clearing…" : "Clear"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="cb-messages">
        {messages.length === 0 && (
          <div className="cb-empty">
            <p>
              {hasDocuments
                ? "Ask anything about your documents"
                : "Upload PDFs to start chatting"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            sources={msg.sources}
            timestamp={msg.timestamp}
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
              ? "Ask a question… (Enter to send)"
              : "Upload documents first"
          }
          rows={1}
          className="cb-input"
        />
        <button
          onClick={handleSend}
          disabled={!hasDocuments || isLoading || !input.trim()}
          className="cb-send"
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

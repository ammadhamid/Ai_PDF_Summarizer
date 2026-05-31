// ─── Gemini API Integration ────────────────────────────────────────────────────
// Handles summarization and document-grounded Q&A via Google Gemini.

import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "./memory";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-3.5-flash";

// ─── Summarization ─────────────────────────────────────────────────────────────

/**
 * Generates a summary for a document's text using Gemini.
 * Accepts an optional custom prompt to guide the summary style.
 */
export async function summarizeDocument(
  documentText: string,
  filename: string,
  customPrompt?: string,
): Promise<string> {
  const instructions = customPrompt
    ? `Additional instructions: ${customPrompt}`
    : "Provide a comprehensive, well-structured summary with key points, main arguments, and important details.";

  const prompt = `You are an expert document analyst. Your task is to summarize the following document.

Document filename: ${filename}

${instructions}

Structure your summary with:
1. **Overview** – What the document is about (2-3 sentences)
2. **Key Points** – The most important information (bullet points)
3. **Details** – Supporting details and context
4. **Conclusion** – Main takeaways

Only use information from the document. Do not add external knowledge.

---DOCUMENT START---
${documentText.slice(0, 30000)}
---DOCUMENT END---

Summary:`;

  const response = await genAI.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  return response.text ?? "Summary could not be generated.";
}

// ─── Chat / Q&A ───────────────────────────────────────────────────────────────

/**
 * Answers a user question using only the provided document context.
 * Includes recent chat history for follow-up question support.
 */
export async function answerQuestion(
  question: string,
  context: string,
  chatHistory: ChatMessage[],
): Promise<string> {
  if (!context || context.trim().length === 0) {
    return "The uploaded documents do not contain enough information to answer this question.";
  }

  // Build conversation history for follow-up support
  const historyText = chatHistory
    .slice(-10) // last 10 messages to avoid token overflow
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are DocuMind, an AI assistant built into the DocuMind platform — an AI-powered Document Summarizer and Q&A tool. You help users understand their uploaded documents.

If the user asks who you are, what you are, or anything about your identity (e.g. "who are you", "what are you", "are you ChatGPT", "are you Gemini"), respond with:
"I'm DocuMind AI, your intelligent document assistant! I'm here to help you summarize and chat with your uploaded PDF documents. Ask me anything about your documents!"

For all other questions, answer STRICTLY based on the provided document context below.

RULES:
1. Only use information from the DOCUMENT CONTEXT section.
2. Do NOT use any external knowledge or make assumptions beyond what is written.
3. If the context does not contain enough information to answer, respond EXACTLY with: "The uploaded documents do not contain enough information to answer this question."
4. Be precise, clear, and cite which document/passage your answer comes from when possible.
5. For follow-up questions, use the conversation history to understand context.
6. ALWAYS write your COMPLETE answer — never cut off mid-sentence or mid-list. Finish every point fully.

DOCUMENT CONTEXT:
${context}`;

  const fullPrompt = historyText
    ? `${historyText}\nUser: ${question}`
    : question;

  const response = await genAI.models.generateContent({
    model: MODEL,
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I will only answer based on the provided document context. What would you like to know?",
          },
        ],
      },
      { role: "user", parts: [{ text: fullPrompt }] },
    ],
    config: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  return (
    response.text ??
    "The uploaded documents do not contain enough information to answer this question."
  );
}

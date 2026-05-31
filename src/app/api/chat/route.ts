// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getChunks,
  getChatHistory,
  addChatMessage,
  clearChatHistory,
} from "@/lib/memory";
import { searchChunks, formatContext } from "@/lib/search";
import { answerQuestion } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body as { question?: string };

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const allChunks = getChunks();
    if (allChunks.length === 0) {
      return NextResponse.json({
        answer: "No documents have been uploaded yet. Please upload PDFs first.",
        sources: [],
      });
    }

    // Search for relevant chunks
    const scoredChunks = searchChunks(question, allChunks, 5);
    const context = formatContext(scoredChunks);
    const chatHistory = getChatHistory();

    const answer = await answerQuestion(question, context, chatHistory);

    // Persist to chat history
    addChatMessage({
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    });
    addChatMessage({
      role: "assistant",
      content: answer,
      timestamp: new Date().toISOString(),
    });

    const sources = scoredChunks.map(({ chunk, score }) => ({
      filename: chunk.filename,
      chunkIndex: chunk.index,
      score: Math.round(score * 100) / 100,
    }));

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("[chat] Error:", err);
    return NextResponse.json({ error: "Failed to generate answer." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearChatHistory();
    return NextResponse.json({ message: "Chat history cleared." });
  } catch (err) {
    console.error("[chat DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to clear chat history." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const history = getChatHistory();
    return NextResponse.json({ history });
  } catch (err) {
    console.error("[chat GET] Error:", err);
    return NextResponse.json({ error: "Failed to get chat history." }, { status: 500 });
  }
}

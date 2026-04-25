"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../components/ui/button";
import { ResearchService } from "../lib/utils/researchService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ResearchChatSidebarProps {
  papers: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function ResearchChatSidebar({
  papers,
  isOpen,
  onClose,
}: ResearchChatSidebarProps) {
  const selectedPaperCount = papers.length;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        selectedPaperCount > 0
          ? `I'm ready to answer questions about the ${selectedPaperCount} selected paper${selectedPaperCount > 1 ? "s" : ""}. Ask me to summarize common themes, compare methodologies, or checking for specific findings.`
          : "Select papers from the matrix to ask specific questions, or ask me general research questions.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Prepare history for backend (limit to last 10 messages)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Check if this is a PDF Chat session
      const isPdfChat = papers.some((p) => p.source === "pdf_upload");
      let responseText = "";

      if (isPdfChat) {
        const pdfPaper = papers.find((p) => p.source === "pdf_upload");
        if (!pdfPaper || !pdfPaper.externalId) {
          throw new Error("Invalid PDF context.");
        }
        responseText = await ResearchService.chatWithPdf(
          userMsg.content,
          pdfPaper.externalId,
          history,
        );
      } else {
        // Get IDs for standard papers
        const paperIds = papers
          .map((p) => p.externalId || p.paperId)
          .filter(Boolean); // Ensure valid IDs

        if (paperIds.length === 0) {
          throw new Error("No papers provided context.");
        }

        const chatResponse = await ResearchService.chatWithPapers(
          userMsg.content,
          paperIds,
          history,
        );

        // Standardize response: backend returns { data: string } for ChatWithPapers
        responseText =
          typeof chatResponse === "string"
            ? chatResponse
            : chatResponse.data ||
              chatResponse.answer ||
              "I apologize, I couldn't generate a response.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error while analyzing the papers. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-white flex flex-col h-full shadow-xl relative">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              Research Assistant
            </h3>
            <p className="text-xs text-gray-500">
              {selectedPaperCount} source{selectedPaperCount !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8">
          <X className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-blue-100" : "bg-purple-100"
              }`}>
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-purple-600" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}>
              <div className="markdown-content prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
              <span className="text-xs text-gray-400">Analyzing papers...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100 bg-white z-10 transition-all">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              selectedPaperCount > 0
                ? "Ask about selected papers..."
                : "Ask a research question..."
            }
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none max-h-[120px] min-h-[50px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-1.5 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-center text-gray-400 mt-2">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
}

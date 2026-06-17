"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import MarkdownContent from "./MarkdownContent";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

const AIResearch: React.FC = () => {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "model", content: t("ai.welcome") },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur de l'assistant");

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: data.reply || t("ai.errorGeneric"),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content:
            error instanceof Error
              ? t("ai.errorPrefix", { msg: error.message })
              : t("ai.errorGeneric"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] bg-circle-card border border-circle-border rounded-[2.5rem] overflow-hidden">
      <div className="p-6 border-b border-circle-border bg-circle-bg/50">
        <h2 className="text-2xl font-black text-circle-amber uppercase tracking-widest flex items-center gap-3">
          <Bot size={28} />
          {t("ai.title")}
        </h2>
        <p className="text-circle-frost/60 text-xs font-bold uppercase tracking-widest mt-2">
          {t("ai.subtitle")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-circle-amber text-[#081c1b]"
                  : "bg-circle-teal/20 text-circle-teal"
              }`}
            >
              {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user"
                  ? "bg-circle-amber/10 border border-circle-amber/20 text-circle-text rounded-tr-none"
                  : "bg-circle-border/50 border border-circle-border text-circle-frost rounded-tl-none"
              }`}
            >
              {msg.role === "model" ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-circle-teal/20 text-circle-teal flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <div className="bg-circle-border/50 border border-circle-border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-circle-teal" />
              <span className="text-xs text-circle-frost/60 uppercase tracking-widest font-bold">
                {t("ai.thinking")}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-circle-border bg-circle-bg/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.placeholder")}
            className="w-full bg-circle-card border border-circle-border rounded-full py-4 pl-6 pr-14 text-sm text-circle-text placeholder-circle-frost/30 focus:outline-none focus:border-circle-teal transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 bg-circle-amber text-[#081c1b] rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          >
            <Send size={18} className="ml-[-2px]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIResearch;

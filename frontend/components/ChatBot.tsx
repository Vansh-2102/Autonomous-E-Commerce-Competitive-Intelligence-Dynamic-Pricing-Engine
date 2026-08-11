"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Bot,
  User,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ── Types ──────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "fallback" | "client-fallback";
  timestamp: Date;
}

/* ── Client-side fallback (when backend is completely unreachable) */

const CLIENT_FALLBACK_RULES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["price", "pricing", "cost", "expensive", "cheap", "discount"],
    response:
      "Our platform uses an **Autonomous Dynamic Pricing Engine** that optimizes prices in real-time based on competitor analysis, market demand, and margin guardrails. 📊\n\nFor specific pricing questions, please ensure the backend server is running.",
  },
  {
    keywords: ["order", "track", "tracking", "status", "delivery"],
    response:
      "To check your order status, please provide your **Order ID**! 📦\n\nNote: The backend server appears to be offline — please try again shortly.",
  },
  {
    keywords: ["return", "refund", "exchange", "cancel"],
    response:
      "We accept returns within 30 days of delivery. Refunds are processed in 5-7 business days. 🔄\n\nFor specific return requests, please try again when the server is online.",
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    response:
      "Hello! 👋 Welcome to PriceBot! I'm currently running in offline mode, but I can still help with basic questions about pricing, orders, returns, and shipping.",
  },
  {
    keywords: ["shipping", "ship", "deliver"],
    response:
      "Shipping options:\n• Standard: 5-7 business days\n• Express: 2-3 business days\n• Same-Day: Select cities\n\nFree shipping on orders above ₹999! 🚚",
  },
  {
    keywords: ["thank", "thanks"],
    response: "You're welcome! 😊 Happy to help!",
  },
];

function getClientFallback(message: string): string {
  const lower = message.toLowerCase();
  for (const rule of CLIENT_FALLBACK_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response;
    }
  }
  return "I'm currently running in offline mode. Please ensure the backend server is running for full AI-powered assistance. In the meantime, I can help with basic questions about pricing, orders, returns, and shipping! 💡";
}

/* ── Quick-action chips ─────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: "💰 Pricing help", message: "How does dynamic pricing work?" },
  { label: "📦 Track order", message: "I want to track my order" },
  { label: "🔄 Return policy", message: "What is your return policy?" },
  { label: "🚚 Shipping info", message: "What are the shipping options?" },
  { label: "💡 Dashboard guide", message: "How do I use the dashboard?" },
];

/* ── Typing indicator ───────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400/70"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1.5">PriceBot is typing…</span>
    </div>
  );
}

/* ── Markdown-lite renderer (bold only) ─────────────────────────── */

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Main ChatBot Component ─────────────────────────────────────── */

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! 👋 I'm **PriceBot**, your customer care assistant.\n\nHow can I help you today? Choose a topic below or type your question!",
      source: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* Focus input when chat opens */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /* Detect if user has scrolled up */
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── Send message ──────────────────────────────────────────── */

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Build conversation history for context
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_URL}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversation_history: history,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        source: data.source,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Complete network failure → client-side fallback
      const fallbackReply = getClientFallback(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: fallbackReply,
        source: "client-fallback",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  /* ── Keyboard shortcut to toggle chat ──────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C to toggle chatbot
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Floating Chat Bubble ─────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-2xl shadow-emerald-500/30 flex items-center justify-center cursor-pointer group"
            aria-label="Open customer support chat"
          >
            <Headphones className="w-7 h-7 text-white group-hover:hidden transition-all" />
            <MessageCircle className="w-7 h-7 text-white hidden group-hover:block transition-all" />

            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-[9999] w-[400px] h-[560px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, rgba(15, 22, 41, 0.97), rgba(11, 15, 25, 0.99))",
              border: "1px solid rgba(16, 185, 129, 0.15)",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* ── Header ───────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.06))",
                borderBottom: "1px solid rgba(16,185,129,0.1)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f1629]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    PriceBot
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </h3>
                  <p className="text-[11px] text-emerald-400/80 font-medium">
                    AI Customer Support • Online
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* ── Messages ─────────────────────────────────── */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(16,185,129,0.2) transparent",
              }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[85%] ${
                      msg.role === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                        msg.role === "user"
                          ? "bg-indigo-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 text-white rounded-br-md"
                          : "bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/50"
                      }`}
                    >
                      {msg.content.split("\n").map((line, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <br />}
                          {renderMarkdown(line)}
                        </React.Fragment>
                      ))}

                      {/* Source badge for bot messages */}
                      {msg.role === "assistant" && msg.source && msg.id !== "welcome" && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              msg.source === "ai"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {msg.source === "ai" ? (
                              <>
                                <Sparkles className="w-2.5 h-2.5" />
                                AI Powered
                              </>
                            ) : (
                              <>⚡ Quick Response</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-500/20">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="bg-gray-800/80 rounded-2xl rounded-bl-md border border-gray-700/50">
                      <TypingIndicator />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-[140px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-500/30 transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── Quick Actions ─────────────────────────────── */}
            {messages.length <= 1 && !isLoading && (
              <div className="px-4 pb-2 shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.message)}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 transition-all"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input Bar ────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 shrink-0"
              style={{
                borderTop: "1px solid rgba(16,185,129,0.1)",
                background: "rgba(15, 22, 41, 0.6)",
              }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-900/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                Powered by PriceBot AI • Ctrl+Shift+C to toggle
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

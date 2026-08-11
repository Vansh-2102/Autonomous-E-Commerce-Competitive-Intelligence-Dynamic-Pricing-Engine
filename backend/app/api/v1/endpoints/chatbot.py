"""
Customer Care Chatbot API Endpoint
-----------------------------------
AI-powered chatbot using Groq LLM with automatic rule-based fallback.
This is an additive module — no existing code is modified.
"""

import logging
import os
import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chatbot"])


# ── Request / Response Models ──────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    source: str  # "ai" or "fallback"


# ── System Prompt ──────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a friendly and professional customer care assistant for an Autonomous E-Commerce Dynamic Pricing Engine platform. Your name is PriceBot.

You help customers with:
- Understanding how dynamic pricing works on the platform
- Product pricing inquiries and price change explanations
- Order status and tracking questions
- Return and refund policies
- Shipping information and delivery estimates
- Account and payment issues
- General product recommendations
- Technical support for the platform dashboard

Guidelines:
- Be concise, helpful, and empathetic
- If you don't know a specific order/account detail, politely explain that you'd need them to contact the dedicated support team with their order ID
- For pricing questions, explain that prices are dynamically optimized based on market competition, demand trends, and margin guardrails
- Always maintain a professional yet warm tone
- Use emojis sparingly for friendliness (1-2 per response max)
- Keep responses under 150 words unless more detail is specifically requested
"""


# ── Rule-Based Fallback Engine ─────────────────────────────────────────

FALLBACK_RULES = [
    {
        "keywords": ["price", "pricing", "cost", "expensive", "cheap", "discount"],
        "response": (
            "Our platform uses an **Autonomous Dynamic Pricing Engine** that optimizes "
            "prices in real-time based on competitor analysis, market demand, and margin "
            "guardrails. 📊\n\n"
            "Prices are updated automatically to ensure you always get competitive rates "
            "while maintaining fair margins. If you have questions about a specific product's "
            "price, feel free to ask!"
        ),
    },
    {
        "keywords": ["order", "track", "tracking", "status", "where", "delivery"],
        "response": (
            "To check your order status, please provide your **Order ID** and I'll help "
            "you track it! 📦\n\n"
            "If you don't have your Order ID handy, you can find it in your confirmation "
            "email or your account's order history section."
        ),
    },
    {
        "keywords": ["return", "refund", "exchange", "money back", "cancel"],
        "response": (
            "Our return & refund policy:\n\n"
            "• **Returns**: Accepted within 30 days of delivery for most items\n"
            "• **Refunds**: Processed within 5-7 business days after we receive the item\n"
            "• **Exchanges**: Available for size/color changes at no extra cost\n\n"
            "To initiate a return, please go to your order history and select "
            "'Request Return' or provide your Order ID here! 🔄"
        ),
    },
    {
        "keywords": ["shipping", "ship", "deliver", "arrival", "when will"],
        "response": (
            "Here's our shipping information:\n\n"
            "• **Standard Shipping**: 5-7 business days\n"
            "• **Express Shipping**: 2-3 business days\n"
            "• **Same-Day Delivery**: Available in select cities\n\n"
            "Shipping is free on orders above ₹999! 🚚"
        ),
    },
    {
        "keywords": ["payment", "pay", "card", "upi", "wallet", "emi"],
        "response": (
            "We accept the following payment methods:\n\n"
            "• Credit/Debit Cards (Visa, Mastercard, RuPay)\n"
            "• UPI (Google Pay, PhonePe, Paytm)\n"
            "• Net Banking\n"
            "• EMI options on select cards\n"
            "• Wallets (Paytm, Amazon Pay)\n\n"
            "All transactions are secured with 256-bit encryption. 🔒"
        ),
    },
    {
        "keywords": ["dashboard", "how to use", "help", "guide", "tutorial"],
        "response": (
            "Here's a quick guide to the Dynamic Pricing Dashboard:\n\n"
            "1. **Upload CSV Catalog** — Import your product catalog with COGS data\n"
            "2. **Scan & Analyze SKU** — Enter any product name or SKU to trigger a live competitive scan\n"
            "3. **Quick Triggers** — Use preset catalog buttons for instant analysis\n"
            "4. **Pricing Cards** — Review AI-generated pricing recommendations with competitor data\n"
            "5. **Approve Changes** — One-click approval to update live prices\n\n"
            "Need help with a specific feature? Just ask! 💡"
        ),
    },
    {
        "keywords": ["hello", "hi", "hey", "good morning", "good evening", "howdy"],
        "response": (
            "Hello! 👋 Welcome to PriceBot — your customer care assistant for the "
            "Dynamic Pricing Engine platform.\n\n"
            "How can I help you today? I can assist with:\n"
            "• Pricing questions\n"
            "• Order tracking\n"
            "• Returns & refunds\n"
            "• Shipping info\n"
            "• Dashboard help"
        ),
    },
    {
        "keywords": ["thank", "thanks", "appreciate", "helpful"],
        "response": (
            "You're welcome! 😊 I'm glad I could help. If you have any more questions, "
            "don't hesitate to ask. Have a great day!"
        ),
    },
    {
        "keywords": ["bye", "goodbye", "see you", "close"],
        "response": (
            "Goodbye! 👋 Thanks for chatting with PriceBot. Feel free to reach out "
            "anytime you need assistance. Have a wonderful day!"
        ),
    },
]

DEFAULT_FALLBACK = (
    "Thank you for reaching out! I'm here to help with:\n\n"
    "• 📊 **Pricing** — How dynamic pricing works\n"
    "• 📦 **Orders** — Tracking and status updates\n"
    "• 🔄 **Returns** — Refund and exchange policies\n"
    "• 🚚 **Shipping** — Delivery times and options\n"
    "• 💡 **Dashboard** — Using the pricing engine\n\n"
    "Could you provide more details about what you need help with?"
)


def get_fallback_response(message: str) -> str:
    """Match user message against keyword rules and return the best response."""
    message_lower = message.lower()
    for rule in FALLBACK_RULES:
        if any(kw in message_lower for kw in rule["keywords"]):
            return rule["response"]
    return DEFAULT_FALLBACK


# ── AI Chat via Groq ───────────────────────────────────────────────────

async def get_ai_response(message: str, history: List[ChatMessage]) -> str:
    """Call Groq API for an AI-generated response."""
    try:
        from groq import Groq
    except ImportError:
        raise RuntimeError("groq package not installed")

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Include recent conversation history (last 10 exchanges)
    for msg in (history or [])[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": message})

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=300,
    )

    return chat_completion.choices[0].message.content


# ── API Endpoint ───────────────────────────────────────────────────────

@router.post("/chatbot", response_model=ChatResponse)
async def chatbot_endpoint(request: ChatRequest):
    """
    Customer care chatbot endpoint.
    Tries AI (Groq) first, falls back to rule-based responses on failure.
    """
    try:
        reply = await get_ai_response(request.message, request.conversation_history or [])
        return ChatResponse(reply=reply, source="ai")
    except Exception as e:
        logger.warning(f"AI chatbot unavailable, using fallback: {e}")
        reply = get_fallback_response(request.message)
        return ChatResponse(reply=reply, source="fallback")

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PricingRecommendationCard } from "@/types/pricing";

export type ConnectionStatus = "live" | "reconnecting" | "offline";

const getApprovedMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("approved_pricing_map");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const mergeApprovedProps = (card: PricingRecommendationCard): PricingRecommendationCard => {
  const approvedMap = getApprovedMap();
  const entry = approvedMap[card.props.sku];
  if (entry && entry.isApproved) {
    return {
      ...card,
      props: {
        ...card.props,
        isApproved: true,
        currentPrice: entry.approvedPrice || card.props.recommendedPrice,
        expectedMarginDelta: "+0.0%",
      },
    };
  }
  return card;
};

export function useLivePricingFeed(wsUrl: string) {
  const [cards, setCards] = useState<PricingRecommendationCard[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("offline");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!wsUrl) return () => {};

    let isUnmounted = false;
    setConnectionStatus("reconnecting");
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (isUnmounted) {
        ws.close();
        return;
      }
      setConnectionStatus("live");
      reconnectAttempts.current = 0;
      console.log("[WebSocket] Connected to pricing feed:", wsUrl);
    };

    ws.onmessage = (event) => {
      if (isUnmounted) return;
      try {
        const data = JSON.parse(event.data);
        if (data.component === "PricingRecommendationCard") {
          const cardWithApproval = mergeApprovedProps(data);
          setCards((prev) => {
            const existingIndex = prev.findIndex(
              (c) => c.props.sku === cardWithApproval.props.sku
            );
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = cardWithApproval;
              return next;
            }
            return [cardWithApproval, ...prev];
          });
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      if (isUnmounted) return;
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) return;
      console.error("[WebSocket] Error:", err);
    };

    ws.onclose = () => {
      if (isUnmounted) return;
      setConnectionStatus("offline");
      socketRef.current = null;

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 16000);
        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
        reconnectAttempts.current += 1;
        setTimeout(connect, delay);
      } else {
        console.log("[WebSocket] Max reconnect attempts reached.");
      }
    };

    return () => {
      isUnmounted = true;
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [wsUrl]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  // Fallback demo cards when initial stream is connecting
  useEffect(() => {
    if (cards.length === 0) {
      setCards([
        {
          component: "PricingRecommendationCard",
          props: {
            sku: "SONY-WH1000XM5",
            currentPrice: 29990.00,
            recommendedPrice: 28499.00,
            expectedMarginDelta: "+5.2%",
            competitorPrices: [
              { name: "Amazon India", price: 28990.00, inStock: true },
              { name: "Flipkart", price: 29490.00, inStock: true },
              { name: "Reliance Digital", price: 29990.00, inStock: false },
            ],
            chartData: [
              { day: "Mon", ourPrice: 29990.00, marketAvg: 29800.00 },
              { day: "Tue", ourPrice: 29990.00, marketAvg: 29500.00 },
              { day: "Wed", ourPrice: 29490.00, marketAvg: 29200.00 },
              { day: "Thu", ourPrice: 28990.00, marketAvg: 28900.00 },
              { day: "Fri", ourPrice: 28499.00, marketAvg: 28650.00 },
            ],
          },
        },
        {
          component: "PricingRecommendationCard",
          props: {
            sku: "DELL-XPS15",
            currentPrice: 145000.00,
            recommendedPrice: 139990.00,
            expectedMarginDelta: "+3.8%",
            competitorPrices: [
              { name: "Amazon India", price: 142990.00, inStock: true },
              { name: "Croma", price: 144990.00, inStock: true },
            ],
            chartData: [
              { day: "Mon", ourPrice: 145000.00, marketAvg: 146000.00 },
              { day: "Tue", ourPrice: 144000.00, marketAvg: 145000.00 },
              { day: "Wed", ourPrice: 143000.00, marketAvg: 143800.00 },
              { day: "Thu", ourPrice: 141500.00, marketAvg: 142000.00 },
              { day: "Fri", ourPrice: 139990.00, marketAvg: 141000.00 },
            ],
          },
        },
        {
          component: "PricingRecommendationCard",
          props: {
            sku: "MACBOOK-AIR-M3",
            currentPrice: 114900.00,
            recommendedPrice: 111990.00,
            expectedMarginDelta: "+4.1%",
            competitorPrices: [
              { name: "Amazon India", price: 114900.00, inStock: true },
              { name: "Flipkart", price: 112990.00, inStock: true },
            ],
            chartData: [
              { day: "Mon", ourPrice: 114900.00, marketAvg: 115000.00 },
              { day: "Tue", ourPrice: 114900.00, marketAvg: 114500.00 },
              { day: "Wed", ourPrice: 113900.00, marketAvg: 113800.00 },
              { day: "Thu", ourPrice: 112990.00, marketAvg: 113200.00 },
              { day: "Fri", ourPrice: 111990.00, marketAvg: 112500.00 },
            ],
          },
        },
        {
          component: "PricingRecommendationCard",
          props: {
            sku: "LOGI-MXMASTER3S",
            currentPrice: 8995.00,
            recommendedPrice: 8250.00,
            expectedMarginDelta: "+6.5%",
            competitorPrices: [
              { name: "Amazon India", price: 8495.00, inStock: true },
              { name: "Croma", price: 8990.00, inStock: true },
            ],
            chartData: [
              { day: "Mon", ourPrice: 8995.00, marketAvg: 8900.00 },
              { day: "Tue", ourPrice: 8995.00, marketAvg: 8850.00 },
              { day: "Wed", ourPrice: 8690.00, marketAvg: 8600.00 },
              { day: "Thu", ourPrice: 8495.00, marketAvg: 8500.00 },
              { day: "Fri", ourPrice: 8250.00, marketAvg: 8400.00 },
            ],
          },
        },
        {
          component: "PricingRecommendationCard",
          props: {
            sku: "SAMSUNG-ODYSSEY-G9",
            currentPrice: 109900.00,
            recommendedPrice: 102990.00,
            expectedMarginDelta: "+4.9%",
            competitorPrices: [
              { name: "Amazon India", price: 104990.00, inStock: true },
              { name: "Reliance Digital", price: 109900.00, inStock: false },
            ],
            chartData: [
              { day: "Mon", ourPrice: 109900.00, marketAvg: 109000.00 },
              { day: "Tue", ourPrice: 108900.00, marketAvg: 108500.00 },
              { day: "Wed", ourPrice: 106900.00, marketAvg: 107000.00 },
              { day: "Thu", ourPrice: 104990.00, marketAvg: 105500.00 },
              { day: "Fri", ourPrice: 102990.00, marketAvg: 104000.00 },
            ],
          },
        },
      ].map(mergeApprovedProps));
    }
  }, [cards.length]);

  return { cards, setCards, connectionStatus, reconnect: connect };
}

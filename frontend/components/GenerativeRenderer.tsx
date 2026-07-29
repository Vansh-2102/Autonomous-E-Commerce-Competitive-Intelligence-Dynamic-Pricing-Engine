"use client";

import React from "react";
import { COMPONENT_REGISTRY } from "@/lib/registry";
import { PricingEvent } from "@/types/pricing";

interface GenerativeRendererProps {
  card: PricingEvent;
  onApprove?: (sku: string) => void;
}

export const GenerativeRenderer: React.FC<GenerativeRendererProps> = ({ card, onApprove }) => {
  const Component = COMPONENT_REGISTRY[card.component];

  if (!Component) {
    console.warn(`[Generative UI] Unrecognized component name: ${card.component}`);
    return (
      <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-rose-300 text-sm">
        Unrecognized Generative UI Component: <code className="font-mono">{card.component}</code>
      </div>
    );
  }

  return <Component {...card.props} onApprove={onApprove} />;
};

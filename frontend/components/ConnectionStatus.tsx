"use client";

import React from "react";
import { ConnectionStatus } from "@/hooks/useLivePricingFeed";
import { Radio, RefreshCw, WifiOff } from "lucide-react";

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  status,
  onReconnect,
}) => {
  if (status === "live") {
    return (
      <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Radio className="w-3.5 h-3.5" />
        Live Feed Connected
      </div>
    );
  }

  if (status === "reconnecting") {
    return (
      <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-800 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Reconnecting Feed...
      </div>
    );
  }

  return (
    <button
      suppressHydrationWarning
      onClick={onReconnect}
      className="flex items-center gap-2 bg-rose-950/80 border border-rose-800 text-rose-400 hover:text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-all"
    >
      <WifiOff className="w-3.5 h-3.5" />
      Offline (Click to Reconnect)
    </button>
  );
};

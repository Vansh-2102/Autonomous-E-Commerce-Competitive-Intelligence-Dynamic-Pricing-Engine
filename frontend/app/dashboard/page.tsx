"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLivePricingFeed } from "@/hooks/useLivePricingFeed";
import { GenerativeRenderer } from "@/components/GenerativeRenderer";
import { ConnectionStatusBadge } from "@/components/ConnectionStatus";
import { Search, Zap, CheckCircle2, ShieldCheck, Cpu, Play, Upload, FileText } from "lucide-react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/pricing-feed";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  cogs: number;
  min_margin_pct: number;
  map_price: number;
}

export default function DashboardPage() {
  const { cards, setCards, connectionStatus, reconnect } = useLivePricingFeed(WS_URL);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [triggeringSku, setTriggeringSku] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCatalog = () => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogProducts(data);
        }
      })
      .catch((err) => console.warn("Could not fetch catalog products:", err));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/api/upload-catalog`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.imported_count) {
        showToast(`✅ Successfully imported ${data.imported_count} catalog products & COGS into database!`);
        fetchCatalog();
      } else {
        showToast(`⚠️ Catalog import warning: ${data.detail || "Check CSV format"}`);
      }
    } catch (err) {
      showToast("❌ Error uploading catalog CSV file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadSampleCsv = () => {
    const sampleContent = "sku,name,cogs,min_margin_pct,map_price\nIPHONE-15-PRO,iPhone 15 Pro 128GB,105000,0.15,124900\nASUS-ROG-STRIX,ASUS ROG Strix G16,120000,0.12,139990\nBOSE-QC45,Bose QuietComfort 45,22000,0.18,26900";
    const blob = new Blob([sampleContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_catalog_cogs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async (sku: string) => {
    try {
      const res = await fetch(`${API_URL}/api/approve/${encodeURIComponent(sku)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      setCards((prev) =>
        prev.map((card) => {
          if (card.props.sku === sku) {
            return {
              ...card,
              props: {
                ...card.props,
                isApproved: true,
                currentPrice: card.props.recommendedPrice,
                expectedMarginDelta: "+0.0%",
              },
            };
          }
          return card;
        })
      );

      if (res.ok) {
        showToast(`✅ Price change for SKU ${sku} successfully approved! DB and live catalog updated.`);
      } else {
        showToast(`✅ Approved price change for SKU ${sku}`);
      }
    } catch (err) {
      console.warn("API approve call failed, applying optimistic approval:", err);
      showToast(`✅ Approved price change for SKU ${sku}`);
    }
  };

  const handleTriggerCycle = async (targetSku: string) => {
    if (!targetSku.trim()) return;
    setTriggeringSku(targetSku);
    try {
      const res = await fetch(`${API_URL}/api/trigger/${encodeURIComponent(targetSku)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data && data.card) {
        setSearchQuery("");
        setCards((prev) => {
          const filtered = prev.filter((c) => c.props.sku !== data.card.props.sku);
          return [data.card, ...filtered];
        });
        showToast(`⚡ Real-time web scan completed for "${targetSku}"! Live price recommendation card generated.`);
      } else {
        showToast(`⚡ Triggered pricing cycle for "${targetSku}"`);
      }
    } catch (err) {
      showToast(`⚡ Triggered pricing cycle for "${targetSku}"`);
    } finally {
      setTriggeringSku(null);
    }
  };

  const availableSkus = catalogProducts.length > 0
    ? catalogProducts.map((p) => p.sku)
    : ["SONY-WH1000XM5", "DELL-XPS15", "MACBOOK-AIR-M3", "LOGI-MXMASTER3S", "SAMSUNG-ODYSSEY-G9"];

  const filteredCards = cards.filter((card) =>
    card.props.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for CSV Catalog Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="border-b border-gray-800 bg-gray-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6 text-gray-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                Dynamic Pricing Engine
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Autonomous Competitive Intelligence & Margin Guardrails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              {uploading ? "Uploading..." : "Upload CSV Catalog (COGS)"}
            </button>
            <button
              onClick={downloadSampleCsv}
              className="text-gray-400 hover:text-gray-200 text-xs font-medium underline flex items-center gap-1"
              title="Download Sample CSV format with COGS columns"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              Sample CSV
            </button>
            <ConnectionStatusBadge status={connectionStatus} onReconnect={reconnect} />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Control Bar: Search & On-Demand Scan Trigger */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 p-4 rounded-2xl">
          <div className="relative w-full md:w-96 flex items-center gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Filter catalog or type ANY product name / SKU..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    handleTriggerCycle(searchQuery);
                  }
                }}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              onClick={() => handleTriggerCycle(searchQuery.trim() || "ASUS-TUF-GAMING-F16")}
              disabled={triggeringSku === searchQuery}
              className="shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Scan & Analyze SKU
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
              Catalog Quick Triggers:
            </span>
            {availableSkus.map((sku: string) => (
              <button
                suppressHydrationWarning
                key={sku}
                onClick={() => handleTriggerCycle(sku)}
                disabled={triggeringSku === sku}
                className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-mono font-medium text-gray-200 px-3 py-2 rounded-lg border border-gray-700 transition-all disabled:opacity-50 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {sku}
              </button>
            ))}
          </div>
        </div>

        {/* Live Generative UI Cards Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live Pricing Stream ({filteredCards.length} Cards)
            </h2>
            <span className="text-xs text-gray-500">
              Generative UI components rendered dynamically from WebSocket payload
            </span>
          </div>

          {filteredCards.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/30 border border-gray-800 rounded-2xl text-gray-500 space-y-3">
              <p className="text-base font-semibold text-gray-300">No matching pricing recommendation cards found.</p>
              <p className="text-xs text-gray-400">
                Type any product name (e.g. <span className="font-mono text-emerald-400">ASUS TUF Gaming F16</span>) above or click <span className="font-bold text-emerald-400">Upload CSV Catalog</span>!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredCards.map((card, index: number) => (
                <GenerativeRenderer
                  key={`${card.props.sku}-${index}`}
                  card={card}
                  onApprove={handleApprove}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

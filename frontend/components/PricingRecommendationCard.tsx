"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, CheckCircle, PackageCheck, AlertCircle, ShieldCheck } from "lucide-react";
import { PricingRecommendationCardProps } from "@/types/pricing";

export const PricingRecommendationCardComponent: React.FC<PricingRecommendationCardProps> = ({
  sku,
  currentPrice,
  recommendedPrice,
  expectedMarginDelta,
  competitorPrices,
  chartData,
  isApproved,
  onApprove,
}) => {
  const displayCurrentPrice = isApproved ? recommendedPrice : currentPrice;
  const displayMarginDelta = isApproved ? "+0.0%" : expectedMarginDelta;
  const isPositiveDelta = !displayMarginDelta.startsWith("-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-gray-900/80 backdrop-blur-xl border rounded-2xl p-6 shadow-2xl transition-all ${
        isApproved ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : "border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase bg-emerald-950 border border-emerald-500 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-950">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Approved & Applied Live
              </span>
            ) : (
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                AI Recommendation
              </span>
            )}
            <span className="text-xs font-mono text-gray-400">SKU: {sku}</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {isApproved ? "Approved Dynamic Price" : "Price Recommendation"}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">Current Price</div>
            <div className={`text-lg font-semibold ${isApproved ? "text-emerald-400" : "text-gray-300 line-through"}`}>
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(displayCurrentPrice)}
            </div>
          </div>
          <div className="text-right bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
            <div className="text-xs font-medium text-emerald-400">Recommended</div>
            <div className="text-2xl font-black text-emerald-400">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(recommendedPrice)}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
              isPositiveDelta
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            {isPositiveDelta ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>Margin {displayMarginDelta}</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Price History vs Market Average
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Our Price
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
              Market Avg
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  borderColor: "#374151",
                  borderRadius: "0.75rem",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="ourPrice"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="marketAvg"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competitor Price Comparison List */}
      <div className="mt-5 border-t border-gray-800/80 pt-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Competitor Benchmark Data
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {competitorPrices.map((comp, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 border border-gray-800 rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-200">{comp.name}</div>
                <div className="text-base font-bold text-gray-100">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(comp.price)}
                </div>
              </div>
              <div>
                {comp.inStock ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/50">
                    <PackageCheck className="w-3 h-3" /> In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/50">
                    <AlertCircle className="w-3 h-3" /> Out of Stock
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approve CTA Button */}
      <div className="mt-6 flex justify-end">
        {isApproved ? (
          <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Price Approved & Live in Store Catalog
          </div>
        ) : (
          <button
            onClick={() => onApprove && onApprove(sku)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.98] transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Approve Price Change
          </button>
        )}
      </div>
    </motion.div>
  );
};

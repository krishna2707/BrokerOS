"use client";

import React from "react";
import { Zap, DollarSign, Brain } from "lucide-react";
import { VAPI_LLM_PROVIDERS } from "@brokeros/constants";

export interface VapiIntelligenceTabProps {
  llmProvider: string;
  llmModel: string;
  temperature: number;
  maxTokens: number;
  onChange: (fields: any) => void;
}

export function VapiIntelligenceTab({
  llmProvider,
  llmModel,
  temperature,
  maxTokens,
  onChange,
}: VapiIntelligenceTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">LLM Engine Provider</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.values(VAPI_LLM_PROVIDERS).map((prov) => {
            const isSelected = llmProvider === prov.provider;
            return (
              <button
                key={prov.provider}
                type="button"
                onClick={() => {
                  const firstModel = prov.models[0]?.id || "gpt-4o-mini";
                  onChange({
                    modelProvider: prov.provider,
                    llmModel: firstModel,
                  });
                }}
                className={`p-3 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs font-bold leading-tight">{prov.name}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{prov.badge}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection for Active Provider */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">
          Select {VAPI_LLM_PROVIDERS[llmProvider]?.name || "LLM"} Model
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(VAPI_LLM_PROVIDERS[llmProvider]?.models || []).map((m) => {
            const isSelected = llmModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange({ llmModel: m.id });
                }}
                className={`p-3.5 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/40 text-slate-700 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {m.intelligenceTier}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>~{m.latencyMs}ms</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    <span>In: ${m.inputCostPer1M}/1M</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    <span>Out: ${m.outputCostPer1M}/1M</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-indigo-500" />
                    <span>{m.contextWindow}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameters: Temperature & Max Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Temperature (Creativity vs Determinism)</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.5"
            step="0.05"
            value={temperature}
            onChange={(e) => {
              onChange({ temperature: parseFloat(e.target.value) });
            }}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>0.0 (Strict & Precise)</span>
            <span>0.7 (Standard Sales)</span>
            <span>1.5 (Expressive)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Max Tokens per Turn</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">{maxTokens} tokens</span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={maxTokens}
            onChange={(e) => {
              onChange({ maxTokens: parseInt(e.target.value) });
            }}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>100 (Rapid turns)</span>
            <span>500 (Standard)</span>
            <span>2000 (Detailed)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

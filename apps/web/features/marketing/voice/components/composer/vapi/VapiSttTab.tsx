"use client";

import React from "react";
import { VAPI_TRANSCRIBERS } from "@brokeros/constants";

export interface VapiSttTabProps {
  transcriberProvider: string;
  transcriberModel: string;
  transcriberLanguage: string;
  onChange: (fields: any) => void;
}

export function VapiSttTab({
  transcriberProvider,
  transcriberModel,
  transcriberLanguage,
  onChange,
}: VapiSttTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">Speech-to-Text Engine (STT)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.values(VAPI_TRANSCRIBERS).map((prov) => {
            const isSelected = transcriberProvider === prov.provider;
            return (
              <button
                key={prov.provider}
                type="button"
                onClick={() => {
                  const firstModel = prov.models[0]?.id || "nova-3";
                  onChange({
                    transcriberProvider: prov.provider,
                    transcriberModel: firstModel,
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

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">
          Select {VAPI_TRANSCRIBERS[transcriberProvider]?.name || "STT"} Model
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(VAPI_TRANSCRIBERS[transcriberProvider]?.models || []).map((m) => {
            const isSelected = transcriberModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange({ transcriberModel: m.id });
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{m.name}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{m.accuracyRating}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Latency: ~{m.latencyMs}ms • ${m.costPerMinute.toFixed(4)}/min
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Primary Transcriber Language</label>
        <select
          value={transcriberLanguage}
          onChange={(e) => {
            onChange({ transcriberLanguage: e.target.value });
          }}
          className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900"
        >
          <option value="en">English (US / India Global)</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="es">Spanish (Español)</option>
          <option value="fr">French (Français)</option>
          <option value="de">German (Deutsch)</option>
          <option value="multi">Multilingual Auto-Detection</option>
        </select>
      </div>
    </div>
  );
}

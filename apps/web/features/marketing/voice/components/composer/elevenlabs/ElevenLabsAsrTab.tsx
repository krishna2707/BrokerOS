"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ElevenLabsAsrTabProps {
  turnEagerness: string;
  turnTimeout: number;
  speculativeTurn: boolean;
  newKeyword: string;
  asrKeywords: string[];
  onNewKeywordChange: (kw: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (kw: string) => void;
  onChange: (fields: any) => void;
}

export function ElevenLabsAsrTab({
  turnEagerness,
  turnTimeout,
  speculativeTurn,
  newKeyword,
  asrKeywords,
  onNewKeywordChange,
  onAddKeyword,
  onRemoveKeyword,
  onChange,
}: ElevenLabsAsrTabProps) {
  return (
    <div className="p-6 rounded-b-2xl bg-white border border-t-0 border-slate-200/80 shadow-xs space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Turn Eagerness */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Turn Eagerness (Interruption Sensitivity)</label>
          <select
            value={turnEagerness}
            onChange={(e) => onChange({ turnEagerness: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="patient">Patient — Allows customer long pauses without interrupting</option>
            <option value="normal">Normal (Recommended ★) — Balanced conversational rhythm</option>
            <option value="eager">Eager — Snappy fast-turn responses</option>
          </select>
        </div>

        {/* Turn Timeout */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Turn Timeout (Seconds)</label>
          <input
            type="number"
            min="3"
            max="20"
            value={turnTimeout}
            onChange={(e) => onChange({ turnTimeout: parseInt(e.target.value, 10) || 7 })}
            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Speculative Turn Toggle */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-extrabold text-slate-900">Speculative Turn Execution</p>
          <p className="text-[11px] text-slate-500">
            Pre-computes next sentence before customer completes utterance for sub-100ms conversational replies.
          </p>
        </div>
        <input
          type="checkbox"
          checked={speculativeTurn}
          onChange={(e) => onChange({ speculativeTurn: e.target.checked })}
          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
        />
      </div>

      {/* ASR Vocabulary & Keywords */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold text-slate-900">Real Estate Vocabulary & Keyword Boosts</label>
        <p className="text-[11px] text-slate-500">
          Boost recognition of Indian real estate terminology, local builder brands, and unit configurations.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => onNewKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddKeyword();
              }
            }}
            placeholder="e.g. DLF Privana, Godrej, RERA, 3BHK, Penthouse, Gurugram"
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
          <Button
            type="button"
            onClick={onAddKeyword}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 cursor-pointer"
          >
            Add Keyword
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {asrKeywords.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">No custom keyword boosts configured.</span>
          ) : (
            asrKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(kw)}
                  className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

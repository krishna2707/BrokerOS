"use client";

import React from "react";
import { ELEVENLABS_BACKGROUND_SOUNDS } from "./constants";

export interface ElevenLabsAmbientTabProps {
  backgroundSound: string;
  backgroundVolume: number;
  maxDurationSeconds: number;
  onChange: (fields: any) => void;
}

export function ElevenLabsAmbientTab({
  backgroundSound,
  backgroundVolume,
  maxDurationSeconds,
  onChange,
}: ElevenLabsAmbientTabProps) {
  return (
    <div className="p-6 rounded-b-2xl bg-white border border-t-0 border-slate-200/80 shadow-xs space-y-6">
      {/* Ambient Sound presets */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Preset Ambient Sound Layer
          </h3>
          <p className="text-[11px] font-medium text-slate-500">
            Adds realistic background room tone so the AI doesn&apos;t sound like a sterile soundproof studio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ELEVENLABS_BACKGROUND_SOUNDS.map((snd) => {
            const isSelected = backgroundSound === snd.id;
            const Icon = snd.icon;
            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => onChange({ backgroundSound: snd.id })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-900 font-bold"
                    : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-100 text-slate-700 font-semibold"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="text-xs leading-tight">{snd.label}</span>
              </button>
            );
          })}
        </div>

        {backgroundSound !== "none" && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Background Sound Volume</span>
              <span className="font-mono text-emerald-700">{Math.round(backgroundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={backgroundVolume}
              onChange={(e) => onChange({ backgroundVolume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600"
            />
            <p className="text-[10px] text-slate-400">Recommended for office ambience: 15%</p>
          </div>
        )}
      </div>

      {/* Max Duration Guardrail */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-800">Maximum Call Duration (Guardrail)</label>
            <p className="text-[10px] text-slate-500">
              Automatically ends call if duration exceeds limit to prevent runaway telephony spend.
            </p>
          </div>
          <span className="text-xs font-black text-slate-900 font-mono">
            {Math.round(maxDurationSeconds / 60)} mins ({maxDurationSeconds}s)
          </span>
        </div>
        <input
          type="range"
          min="120"
          max="1800"
          step="60"
          value={maxDurationSeconds}
          onChange={(e) => onChange({ maxDurationSeconds: parseInt(e.target.value, 10) })}
          className="w-full accent-emerald-600"
        />
      </div>
    </div>
  );
}

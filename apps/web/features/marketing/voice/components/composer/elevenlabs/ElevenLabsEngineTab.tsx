"use client";

import React from "react";
import { ELEVENLABS_LLM_MODELS } from "./constants";

export interface ElevenLabsEngineTabProps {
  llmModel: string;
  temperature: number;
  onChange: (fields: any) => void;
}

export function ElevenLabsEngineTab({
  llmModel,
  temperature,
  onChange,
}: ElevenLabsEngineTabProps) {
  return (
    <div className="p-6 rounded-b-2xl bg-white border border-t-0 border-slate-200/80 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Frontier LLM Reasoning Models
          </h3>
          <p className="text-[11px] font-medium text-slate-500">
            Select the conversational intelligence engine backing your ElevenLabs agent.
          </p>
        </div>
        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          Active: {llmModel}
        </div>
      </div>

      {/* Grouped Models Grid */}
      <div className="space-y-4">
        {(["GPT-5", "GPT-4.1", "Claude", "Gemini"] as const).map((group) => {
          const groupModels = ELEVENLABS_LLM_MODELS.filter((m) => m.group === group);
          if (groupModels.length === 0) return null;
          return (
            <div key={group} className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {groupModels.map((m) => {
                  const isSelected = llmModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChange({ llmModel: m.id })}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                          : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-slate-900">{m.label}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 truncate">{m.id}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Temperature & Creativity Slider */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-800">
              Sampling Temperature (Creativity vs Determinism)
            </label>
            <p className="text-[10px] text-slate-500">
              Lower values (0.0) ensure strict adherence to price guardrails; higher values increase variety.
            </p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
            {temperature.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1.0"
          step="0.05"
          value={temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-emerald-600"
        />
      </div>
    </div>
  );
}

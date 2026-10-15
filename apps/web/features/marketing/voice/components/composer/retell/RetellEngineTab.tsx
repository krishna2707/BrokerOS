"use client";

import React from "react";
import { Brain, CheckCircle2 } from "lucide-react";
import { RETELL_S2S_MODELS, RETELL_LLM_MODELS } from "./constants";

export interface RetellEngineTabProps {
  useS2sMode: boolean;
  s2sModel: string;
  llmModel: string;
  modelTemperature: number;
  modelHighPriority: boolean;
  onChange: (fields: any) => void;
}

export function RetellEngineTab({
  useS2sMode,
  s2sModel,
  llmModel,
  modelTemperature,
  modelHighPriority,
  onChange,
}: RetellEngineTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div>
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-emerald-600" />
          <span>LLM Model</span>
          <span className="text-slate-400 font-medium">(Retell /create-retell-llm)</span>
        </h4>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          Retell auto-provisions a Retell LLM with your system prompt on agent creation. Default:{" "}
          <code className="text-emerald-700 font-mono">gpt-5.6-terra</code>.
        </p>
      </div>

      {/* S2S mode toggle */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800">Speech-to-Speech Mode (S2S)</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Uses GPT Realtime — bypasses TTS entirely for ultra-low latency. When ON, voice model is ignored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange({ useS2sMode: !useS2sMode });
          }}
          className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            useS2sMode
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {useS2sMode ? "S2S On" : "S2S Off"}
        </button>
      </div>

      {/* S2S model picker */}
      {useS2sMode && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800">GPT Realtime Model (s2s_model)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RETELL_S2S_MODELS.map((m) => {
              const isSel = s2sModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange({ s2sModel: m.id })}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    isSel
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{m.label}</span>
                    {isSel && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">{m.badge}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard LLM picker — grouped by provider */}
      {!useS2sMode && (
        <div className="space-y-4">
          {(["GPT-4.1", "GPT-5", "Claude", "Gemini"] as const).map((group) => {
            const groupModels = RETELL_LLM_MODELS.filter((m) => m.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{group}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {groupModels.map((m) => {
                    const isSel = llmModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onChange({ llmModel: m.id, modelProvider: m.provider });
                        }}
                        className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-900 truncate">{m.label}</span>
                          {isSel && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600">{m.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Temperature */}
      {!useS2sMode && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">
              Model Temperature <span className="text-slate-400 font-normal">(model_temperature)</span>
            </label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">
              {modelTemperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={modelTemperature}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ modelTemperature: val, temperature: val });
            }}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0 Deterministic (Recommended for tools)</span>
            <span>1 Creative</span>
          </div>
        </div>
      )}

      {/* High Priority toggle */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800">
            High Priority Pool <span className="text-slate-400 font-normal">(model_high_priority)</span>
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Dedicated resource for lower & more consistent latency. Comes at higher cost.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange({ modelHighPriority: !modelHighPriority });
          }}
          className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            modelHighPriority ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {modelHighPriority ? "Enabled" : "Disabled"}
        </button>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-[11px] font-bold text-blue-900">How Retell Response Engines work</p>
        <ul className="mt-1.5 space-y-1 text-[10px] text-blue-700 font-medium list-disc list-inside">
          <li><strong>Retell LLM</strong> — Prompt-driven agent. Auto-provisioned with your system prompt on Create Agent.</li>
          <li><strong>S2S (Speech-to-Speech)</strong> — GPT Realtime API. Ultra-low latency, no TTS step. Use for fastest response.</li>
          <li><strong>Custom LLM</strong> — Your own LLM via WebSocket URL (configure in Retell dashboard).</li>
        </ul>
      </div>
    </div>
  );
}

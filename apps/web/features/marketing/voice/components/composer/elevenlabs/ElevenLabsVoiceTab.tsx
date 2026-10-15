"use client";

import React from "react";
import { ELEVENLABS_TTS_MODELS } from "./constants";

export interface ElevenLabsVoiceTabProps {
  ttsModel: string;
  voiceId: string;
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceSpeed: number;
  voices: any[];
  isLoadingVoices: boolean;
  voiceSearchQuery: string;
  onVoiceSearchChange: (q: string) => void;
  onChange: (fields: any) => void;
}

export function ElevenLabsVoiceTab({
  ttsModel,
  voiceId,
  voiceStability,
  voiceSimilarityBoost,
  voiceSpeed,
  voices,
  isLoadingVoices,
  voiceSearchQuery,
  onVoiceSearchChange,
  onChange,
}: ElevenLabsVoiceTabProps) {
  const filteredVoices = voices.filter(
    (v) =>
      v.name?.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
      v.id?.toLowerCase().includes(voiceSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 rounded-b-2xl bg-white border border-t-0 border-slate-200/80 shadow-xs space-y-6">
      {/* TTS Models */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            ElevenLabs Neural Speech Synthesis Model
          </h3>
          <p className="text-[11px] font-medium text-slate-500">
            Choose the streaming TTS architecture driving vocal generation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ELEVENLABS_TTS_MODELS.map((model) => {
            const isSelected = ttsModel === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onChange({ ttsModel: model.id })}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50/50 border-slate-200/80 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900">{model.label}</span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {model.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{model.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Picker / Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-800">Voice Persona Identifier</label>
            <p className="text-[10px] text-slate-500">
              Select a pre-made or cloned voice from your ElevenLabs voice library.
            </p>
          </div>
          <div className="w-48">
            <input
              type="text"
              placeholder="Search voice library..."
              value={voiceSearchQuery}
              onChange={(e) => onVoiceSearchChange(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
          {filteredVoices.length === 0 ? (
            <div className="col-span-full p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              {isLoadingVoices
                ? "Loading ElevenLabs Voices..."
                : "Using Default Voice ID: cjVigY5qzO86Huf0OWal (Rachel)"}
            </div>
          ) : (
            filteredVoices.map((v) => {
              const isSelected = voiceId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange({ voiceId: v.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-black text-slate-900 truncate">{v.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">{v.id}</p>
                  {v.accent && (
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {v.accent}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-600 shrink-0">Custom Voice ID:</label>
          <input
            type="text"
            value={voiceId}
            onChange={(e) => onChange({ voiceId: e.target.value })}
            placeholder="e.g. cjVigY5qzO86Huf0OWal"
            className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>
      </div>

      {/* Voice Inflection Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>Stability</span>
            <span className="font-mono text-emerald-700">{voiceStability.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={voiceStability}
            onChange={(e) => onChange({ voiceStability: parseFloat(e.target.value) })}
            className="w-full accent-emerald-600"
          />
          <p className="text-[10px] text-slate-400">Higher = more consistent tone</p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>Similarity Boost</span>
            <span className="font-mono text-emerald-700">{voiceSimilarityBoost.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={voiceSimilarityBoost}
            onChange={(e) => onChange({ voiceSimilarityBoost: parseFloat(e.target.value) })}
            className="w-full accent-emerald-600"
          />
          <p className="text-[10px] text-slate-400">Higher = closer to reference voice</p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span>Speaking Pace</span>
            <span className="font-mono text-emerald-700">{voiceSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={voiceSpeed}
            onChange={(e) => onChange({ voiceSpeed: parseFloat(e.target.value) })}
            className="w-full accent-emerald-600"
          />
          <p className="text-[10px] text-slate-400">Optimal pace for cold sales: 1.0x</p>
        </div>
      </div>
    </div>
  );
}

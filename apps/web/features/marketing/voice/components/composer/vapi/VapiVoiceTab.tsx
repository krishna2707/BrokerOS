"use client";

import React from "react";
import { Volume2, Search, Pause, Play, CheckCircle2 } from "lucide-react";
import { VAPI_VOICE_PROVIDERS, VOICE_TTS_CATALOG } from "@brokeros/constants";

export interface VapiVoiceTabProps {
  voiceProvider: string;
  voiceId: string;
  voiceName: string;
  voiceSpeed: number;
  backgroundSound: "off" | "office";
  playingVoiceId: string | null;
  voiceSearchQuery: string;
  onVoiceSearchChange: (query: string) => void;
  onPlayPreview: (voice: any, e: React.MouseEvent) => void;
  onChange: (fields: any) => void;
}

export function VapiVoiceTab({
  voiceProvider,
  voiceId,
  voiceName,
  voiceSpeed,
  backgroundSound,
  playingVoiceId,
  voiceSearchQuery,
  onVoiceSearchChange,
  onPlayPreview,
  onChange,
}: VapiVoiceTabProps) {
  // Filter voices for active provider
  const providerVoices = (VOICE_TTS_CATALOG as any[]).filter(
    (v) => (v.provider || "").toLowerCase() === voiceProvider.toLowerCase()
  );

  const filteredVoices = providerVoices.filter((v: any) => {
    if (!voiceSearchQuery.trim()) return true;
    const q = voiceSearchQuery.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.accent && v.accent.toLowerCase().includes(q)) ||
      (v.language && v.language.toLowerCase().includes(q)) ||
      (v.gender && v.gender.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">Voice Synthesis Engine (TTS)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Object.values(VAPI_VOICE_PROVIDERS).map((prov) => {
            const isSelected = voiceProvider === prov.provider;
            return (
              <button
                key={prov.provider}
                type="button"
                onClick={() => {
                  const matching = VOICE_TTS_CATALOG.filter(
                    (v) => v.provider.toLowerCase() === prov.provider.toLowerCase()
                  );
                  const defaultVoice = matching[0];
                  onChange({
                    voiceProvider: prov.provider,
                    ...(defaultVoice ? { voiceId: defaultVoice.id, voiceName: defaultVoice.name } : {}),
                  });
                }}
                className={`p-3 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs font-bold leading-tight">{prov.name}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">${prov.costPerMinute.toFixed(3)}/min</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Voice Persona Selection with Search & Inline Preview */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Personas for {VAPI_VOICE_PROVIDERS[voiceProvider]?.name || voiceProvider}</span>
            </label>
            <p className="text-[11px] text-slate-500 font-medium">
              Showing {filteredVoices.length} of {providerVoices.length} available voices
            </p>
          </div>

          {/* Inline Voice Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={voiceSearchQuery}
              onChange={(e) => onVoiceSearchChange(e.target.value)}
              placeholder="Search voice, accent, gender..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Scrollable Voice Cards Grid */}
        <div className="max-h-[500px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 custom-scrollbar">
          {filteredVoices.map((v) => {
            const isVoiceSelected = voiceId === v.id;
            const isPlaying = playingVoiceId === v.id;

            return (
              <div
                key={`${v.provider}-${v.id}-${v.languageCode || ""}`}
                onClick={() => {
                  onChange({ voiceId: v.id, voiceName: v.name, voiceProvider: v.provider });
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isVoiceSelected
                    ? "border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-snug">{v.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                          {v.gender}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100/80 text-purple-800 font-semibold truncate max-w-[120px]">
                          {v.accent || v.language}
                        </span>
                      </div>
                    </div>

                    {/* Inline Audio Preview Play/Pause Button */}
                    <button
                      type="button"
                      onClick={(e) => onPlayPreview(v, e)}
                      className={`p-2 rounded-xl transition-all shrink-0 ${
                        isPlaying
                          ? "bg-purple-600 text-white shadow-xs animate-pulse"
                          : "bg-white border border-slate-200 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                      title={isPlaying ? "Stop audio preview" : "Listen to voice preview"}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-normal line-clamp-2 mt-2 leading-snug">
                    {v.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono truncate max-w-[140px]">ID: {v.id}</span>
                  {isVoiceSelected && (
                    <span className="text-purple-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredVoices.length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No voices found matching &quot;{voiceSearchQuery}&quot; for {voiceProvider}.
            </div>
          )}
        </div>
      </div>

      {/* Active Voice Summary Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{voiceName}</p>
            <p className="text-[11px] text-slate-500">
              Engine: <span className="font-semibold text-slate-700">{voiceProvider}</span> • ID:{" "}
              <span className="font-mono text-slate-700">{voiceId}</span> • Speed: {voiceSpeed}x
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800">
          Active Voice
        </span>
      </div>

      {/* Voice Speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Voice Speed Cadence</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">{voiceSpeed.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.05"
          value={voiceSpeed}
          onChange={(e) => {
            onChange({ voiceSpeed: parseFloat(e.target.value) });
          }}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
          <span>0.7x (Calm / Deliberate)</span>
          <span>1.0x (Natural Conversational)</span>
          <span>1.4x (High Velocity)</span>
        </div>
      </div>

      {/* Background Audio Ambience */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Office Ambient Sound Atmosphere</label>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "off", label: "Off (Crystal Clean Audio)", desc: "Zero background sound" },
            { id: "office", label: "Realistic Sales Floor", desc: "Subtle brokerage office hum" },
          ].map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => {
                onChange({ backgroundSound: bg.id as "off" | "office" });
              }}
              className={`p-3 text-left rounded-xl border transition-all ${
                backgroundSound === bg.id
                  ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <p className="text-xs font-bold">{bg.label}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{bg.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

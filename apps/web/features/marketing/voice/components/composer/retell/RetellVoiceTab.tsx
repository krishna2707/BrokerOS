"use client";

import React from "react";
import { Volume2, Search, RefreshCw, Pause, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RETELL_EMOTIONS } from "./constants";

export interface RetellVoiceTabProps {
  availableVoices: any[];
  voiceId: string;
  voiceName: string;
  voiceSpeed: number;
  voiceTemperature: number;
  retellEmotion: string;
  enableExpressiveMode: boolean;
  playingVoiceId: string | null;
  voiceSearchQuery: string;
  isLoadingVoices: boolean;
  onVoiceSearchChange: (q: string) => void;
  onFetchVoices: () => void;
  onPlayPreview: (voice: any, e: React.MouseEvent) => void;
  onChange: (fields: any) => void;
}

export function RetellVoiceTab({
  availableVoices,
  voiceId,
  voiceName,
  voiceSpeed,
  voiceTemperature,
  retellEmotion,
  enableExpressiveMode,
  playingVoiceId,
  voiceSearchQuery,
  isLoadingVoices,
  onVoiceSearchChange,
  onFetchVoices,
  onPlayPreview,
  onChange,
}: RetellVoiceTabProps) {
  const filteredVoices = availableVoices.filter((v: any) => {
    if (!voiceSearchQuery.trim()) return true;
    const q = voiceSearchQuery.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.accent && v.accent.toLowerCase().includes(q)) ||
      (v.gender && v.gender.toLowerCase().includes(q)) ||
      (v.provider && v.provider.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q)) ||
      (v.id && v.id.toLowerCase().includes(q)) ||
      (Array.isArray(v.tags) && v.tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  });

  const activeVoice =
    availableVoices.find((v: any) => v.id === voiceId) || {
      id: voiceId,
      name: voiceName || voiceId,
      gender: "Voice",
      accent: "Natural",
      provider: "Retell",
    };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Voice Personas with Search, Refresh & Inline Audio Preview */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Retell AI Voice Personas</span>
            </label>
            <p className="text-[11px] text-slate-500 font-medium">
              Showing {filteredVoices.length} of {availableVoices.length} available voices in your account
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={voiceSearchQuery}
                onChange={(e) => onVoiceSearchChange(e.target.value)}
                placeholder="Search voice, accent, gender..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <Button
              type="button"
              onClick={onFetchVoices}
              disabled={isLoadingVoices}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-xl border-slate-200 cursor-pointer"
              title="Refresh voice list from Retell"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVoices ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Scrollable Voice Cards Grid */}
        <div className="max-h-[500px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 custom-scrollbar">
          {filteredVoices.map((v) => {
            const isVoiceSelected = voiceId === v.id;
            const isPlaying = playingVoiceId === v.id;

            return (
              <div
                key={`${v.provider || "retell"}-${v.id}`}
                onClick={() => {
                  onChange({ voiceId: v.id, voiceName: v.name });
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isVoiceSelected
                    ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-snug">{v.name}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {v.gender && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                            {v.gender}
                          </span>
                        )}
                        {v.accent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 font-semibold truncate max-w-[120px]">
                            {v.accent}
                          </span>
                        )}
                        {v.provider && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                            {v.provider}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline Audio Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => onPlayPreview(v, e)}
                      className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                        isPlaying
                          ? "bg-emerald-600 text-white shadow-xs animate-pulse"
                          : "bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                      }`}
                      title={isPlaying ? "Stop audio preview" : "Listen to voice preview"}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-normal line-clamp-2 mt-2 leading-snug">
                    {v.description || "High-fidelity conversational voice for real estate inquiries."}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono truncate max-w-[140px]">ID: {v.id}</span>
                  {isVoiceSelected && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredVoices.length === 0 && (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No voices found matching &quot;{voiceSearchQuery}&quot;.
            </div>
          )}
        </div>
      </div>

      {/* Active Voice Summary Bar */}
      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900">{activeVoice.name}</p>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                Active Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {activeVoice.gender} &middot; {activeVoice.accent} &middot;{" "}
              <span className="font-mono text-slate-400">{activeVoice.id}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => onPlayPreview(activeVoice, e)}
          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          {playingVoiceId === activeVoice.id ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Play Sample</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Fine-Tuning Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">Voice Speed</label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{voiceSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={voiceSpeed}
            onChange={(e) => onChange({ voiceSpeed: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0.5x Slow</span>
            <span>1.0x Default</span>
            <span>2.0x Fast</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">Voice Temperature</label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{voiceTemperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={voiceTemperature}
            onChange={(e) => onChange({ voiceTemperature: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0 Stable</span>
            <span>1 Balanced</span>
            <span>2 Expressive</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Voice Emotion</label>
          <select
            value={retellEmotion}
            onChange={(e) => onChange({ retellEmotion: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            {RETELL_EMOTIONS.map((em) => (
              <option key={em.id} value={em.id}>
                {em.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-800">Expressive Mode</p>
            <p className="text-[10px] text-slate-400">Dynamic [excited],[sigh] tags</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ enableExpressiveMode: !enableExpressiveMode })}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              enableExpressiveMode
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {enableExpressiveMode ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}

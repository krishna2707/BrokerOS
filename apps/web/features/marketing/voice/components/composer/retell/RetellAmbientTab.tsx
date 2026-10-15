"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { RETELL_AMBIENT } from "./constants";

export interface RetellAmbientTabProps {
  retellAmbientSound: string;
  ambientVolume: number;
  denoisingMode: string;
  voicemailAction: string;
  voicemailMessage: string;
  enableDynamicVoiceSpeed: boolean;
  onChange: (fields: any) => void;
}

export function RetellAmbientTab({
  retellAmbientSound,
  ambientVolume,
  denoisingMode,
  voicemailAction,
  voicemailMessage,
  enableDynamicVoiceSpeed,
  onChange,
}: RetellAmbientTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">Ambient Background Sound</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[...RETELL_AMBIENT, { id: "", label: "Off (Clean Studio)" }].map((s) => {
            const isSel = (retellAmbientSound || "") === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ retellAmbientSound: s.id })}
                className={`p-3 text-left rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                  isSel
                    ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{s.label}</span>
                  {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {retellAmbientSound && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">Ambient Volume</label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{ambientVolume.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={ambientVolume}
            onChange={(e) => onChange({ ambientSoundVolume: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0 Silent</span>
            <span>1 Normal</span>
            <span>2 Loud</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">Denoising Mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: "no-denoise", label: "No Denoising", desc: "Bypass all audio processing" },
            { id: "noise-cancellation", label: "Noise Cancellation", desc: "Remove background noise (Default)" },
            {
              id: "noise-and-background-speech-cancellation",
              label: "Full Cancellation",
              desc: "Remove noise + speech",
            },
          ].map((d) => {
            const isSel = denoisingMode === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onChange({ denoisingMode: d.id })}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{d.label}</span>
                  {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{d.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Voicemail Action</label>
          <select
            value={voicemailAction}
            onChange={(e) => onChange({ voicemailAction: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="hangup">Hang Up</option>
            <option value="static_text">Leave a Voicemail Message</option>
          </select>
        </div>
        {voicemailAction === "static_text" && (
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-700">Voicemail Message</label>
            <input
              type="text"
              value={voicemailMessage}
              onChange={(e) => onChange({ voicemailMessage: e.target.value })}
              placeholder="Please call us back at your convenience."
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-800">Dynamic Voice Speed</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Retell adjusts speaking speed based on user speech patterns and conversation context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ enableDynamicVoiceSpeed: !enableDynamicVoiceSpeed })}
          className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            enableDynamicVoiceSpeed
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {enableDynamicVoiceSpeed ? "Enabled" : "Disabled"}
        </button>
      </div>
    </div>
  );
}

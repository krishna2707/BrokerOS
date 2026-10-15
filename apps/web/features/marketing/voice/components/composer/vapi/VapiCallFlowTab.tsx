"use client";

import React from "react";

export interface VapiCallFlowTabProps {
  silenceTimeoutSeconds: number;
  maxDurationSeconds: number;
  backchannelingEnabled: boolean;
  backgroundDenoisingEnabled: boolean;
  voicemailMessage: string;
  onChange: (fields: any) => void;
}

export function VapiCallFlowTab({
  silenceTimeoutSeconds,
  maxDurationSeconds,
  backchannelingEnabled,
  backgroundDenoisingEnabled,
  voicemailMessage,
  onChange,
}: VapiCallFlowTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Silence Timeout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Silence Timeout Before Nudge / Hangup</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">{silenceTimeoutSeconds}s</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={silenceTimeoutSeconds}
            onChange={(e) => {
              onChange({ silenceTimeoutSeconds: parseInt(e.target.value) });
            }}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>10s (Snappy)</span>
            <span>30s (Default)</span>
            <span>120s (Patient)</span>
          </div>
        </div>

        {/* Max Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Max Call Duration Safety Ceiling</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
              {Math.round(maxDurationSeconds / 60)} min
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="1800"
            step="60"
            value={maxDurationSeconds}
            onChange={(e) => {
              onChange({ maxDurationSeconds: parseInt(e.target.value) });
            }}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>1 min (Brief)</span>
            <span>10 min (Standard)</span>
            <span>30 min (Long Consult)</span>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-xs font-bold text-slate-900">Conversational Backchanneling</p>
            <p className="text-[11px] text-slate-500">Emits subtle nods (&quot;uh-huh&quot;, &quot;got it&quot;) during client pauses.</p>
          </div>
          <input
            type="checkbox"
            checked={backchannelingEnabled}
            onChange={(e) => {
              onChange({ backchannelingEnabled: e.target.checked });
            }}
            className="w-5 h-5 accent-purple-600 rounded"
          />
        </label>

        <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-xs font-bold text-slate-900">Background Denoising</p>
            <p className="text-[11px] text-slate-500">Filters ambient microphone noise from lead&apos;s environment.</p>
          </div>
          <input
            type="checkbox"
            checked={backgroundDenoisingEnabled}
            onChange={(e) => {
              onChange({ backgroundDenoisingEnabled: e.target.checked });
            }}
            className="w-5 h-5 accent-purple-600 rounded"
          />
        </label>
      </div>

      {/* Voicemail Message */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800">Voicemail Drop Message</label>
        <textarea
          value={voicemailMessage}
          onChange={(e) => {
            onChange({ voicemailMessage: e.target.value });
          }}
          rows={2}
          placeholder="Hi! I called regarding your luxury property interest. Please call us back at your convenience..."
          className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed text-slate-900"
        />
      </div>
    </div>
  );
}

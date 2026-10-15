"use client";

import React from "react";
import { ELEVENLABS_LANGUAGES, CRM_TAGS } from "./constants";

export interface ElevenLabsDialogueTabProps {
  assistantName: string;
  elevenLanguage: string;
  firstMessage: string;
  scriptPrompt: string;
  onChange: (fields: any) => void;
  onInsertTag: (tag: string, field: "scriptPrompt" | "firstMessage") => void;
}

export function ElevenLabsDialogueTab({
  assistantName,
  elevenLanguage,
  firstMessage,
  scriptPrompt,
  onChange,
  onInsertTag,
}: ElevenLabsDialogueTabProps) {
  return (
    <div className="p-6 rounded-b-2xl bg-white border border-t-0 border-slate-200/80 shadow-xs space-y-6">
      {/* Agent Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Agent Display Name</label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => onChange({ assistantName: e.target.value })}
            placeholder="e.g. Signature Towers Luxury Concierge"
            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Spoken Language</label>
          <select
            value={elevenLanguage}
            onChange={(e) => onChange({ elevenLanguage: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {ELEVENLABS_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* First Spoken Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-extrabold text-slate-900">First Spoken Greeting (Opening Line)</label>
            <p className="text-[11px] font-medium text-slate-500">
              The exact words the ElevenLabs agent utters as soon as the lead answers the call.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Insert:</span>
            {CRM_TAGS.slice(0, 3).map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => onInsertTag(t.tag, "firstMessage")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
              >
                +{t.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          rows={3}
          value={firstMessage}
          onChange={(e) => onChange({ firstMessage: e.target.value })}
          placeholder="Hello! I am calling from BrokerOS regarding your inquiry for luxury 3BHK residences at Skyline Vista. Am I speaking with {{lead.firstName}}?"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-extrabold text-slate-900">System Persona & Conversational Directives</label>
            <p className="text-[11px] font-medium text-slate-500">
              Defines the persona, sales objectives, objection handling, pricing guardrails, and closing strategy.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Tags:</span>
            {CRM_TAGS.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => onInsertTag(t.tag, "scriptPrompt")}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
              >
                +{t.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          rows={12}
          value={scriptPrompt}
          onChange={(e) => onChange({ scriptPrompt: e.target.value })}
          placeholder="You are an intelligent real estate sales advisor for {{project.name}} in {{project.city}}..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>
    </div>
  );
}

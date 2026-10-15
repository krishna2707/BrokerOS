"use client";

import React from "react";
import { Volume2, Brain } from "lucide-react";

export interface VapiDialogueTabProps {
  assistantName: string;
  firstMessage: string;
  firstMessageMode: string;
  scriptPrompt: string;
  onChange: (fields: any) => void;
  onInsertTag: (tag: string, targetField: "scriptPrompt" | "firstMessage") => void;
}

export function VapiDialogueTab({
  assistantName,
  firstMessage,
  firstMessageMode,
  scriptPrompt,
  onChange,
  onInsertTag,
}: VapiDialogueTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Assistant Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Assistant Name</label>
        <input
          type="text"
          value={assistantName}
          onChange={(e) => onChange({ assistantName: e.target.value })}
          placeholder="e.g. Signature Towers Luxury Concierge"
          className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all text-slate-900"
        />
      </div>

      {/* First Message (Opening Line) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-purple-600" />
            <span>First Message (Opening Line Spoken by Assistant)</span>
          </label>
          <span className="text-[11px] text-slate-400">{firstMessage.length} chars</span>
        </div>

        <textarea
          value={firstMessage}
          onChange={(e) => onChange({ firstMessage: e.target.value })}
          rows={2}
          placeholder="Hello! Thank you for inquiring about our luxury residences..."
          className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white leading-relaxed text-slate-900"
        />

        {/* Variable Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Insert Lead Tag:</span>
          {["leadName", "projectName", "budget", "city", "assignedAgent"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onInsertTag(tag, "firstMessage")}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-slate-200 hover:border-purple-300 transition-colors"
            >
              +{`{{${tag}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* First Message Mode */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Opening Cadence Behavior</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {[
            {
              id: "assistant-speaks-first",
              label: "Assistant Speaks First",
              desc: "Speaks the opening message immediately on answer",
            },
            {
              id: "assistant-speaks-first-with-model-generated-message",
              label: "Dynamic AI Opening",
              desc: "LLM synthesizes greeting dynamically from context",
            },
            {
              id: "assistant-waits-for-user",
              label: "Wait for User",
              desc: "Silent until customer speaks first ('Hello?')",
            },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ firstMessageMode: m.id })}
              className={`p-3 text-left rounded-xl border transition-all ${
                firstMessageMode === m.id
                  ? "border-purple-600 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <p className="text-xs font-bold">{m.label}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>System Prompt & Core Persona Instructions</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">~{Math.round(scriptPrompt.length / 4)} tokens</span>
          </div>
        </div>

        <textarea
          value={scriptPrompt}
          onChange={(e) => onChange({ scriptPrompt: e.target.value })}
          rows={8}
          placeholder="Define identity, conversational rules, luxury value propositions, and objection responses..."
          className="w-full px-4 py-3 text-xs font-mono font-medium bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white leading-relaxed shadow-xs"
        />

        {/* Variable Pills for System Prompt */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic CRM Tokens:</span>
          {["leadName", "projectName", "budget", "unitType", "city", "assignedAgent", "siteVisitDate"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onInsertTag(tag, "scriptPrompt")}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-slate-200 hover:border-purple-300 transition-colors"
            >
              +{`{{${tag}}}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

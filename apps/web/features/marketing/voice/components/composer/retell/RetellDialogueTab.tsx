"use client";

import React from "react";
import { CRM_TAGS } from "./constants";

export interface RetellDialogueTabProps {
  agentName: string;
  scriptPrompt: string;
  firstMessage: string;
  beginMessageDelayMs: number;
  onChange: (fields: any) => void;
  onInsertTag: (tag: string, field: "scriptPrompt" | "firstMessage") => void;
}

export function RetellDialogueTab({
  agentName,
  scriptPrompt,
  firstMessage,
  beginMessageDelayMs,
  onChange,
  onInsertTag,
}: RetellDialogueTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Agent Name</label>
        <input
          type="text"
          value={agentName}
          onChange={(e) => onChange({ assistantName: e.target.value })}
          placeholder="e.g. Luxury Sales Concierge – Retell"
          className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            System Prompt <span className="text-slate-400 font-medium">(general_prompt)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">{scriptPrompt.length} chars</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {CRM_TAGS.map((t) => (
            <button
              key={t.tag}
              type="button"
              onClick={() => onInsertTag(t.tag, "scriptPrompt")}
              className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              + {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={scriptPrompt}
          onChange={(e) => onChange({ scriptPrompt: e.target.value })}
          rows={8}
          placeholder="You are a luxury real estate advisor representing {{project.name}} in {{project.city}}..."
          className="w-full px-3.5 py-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-900 resize-none leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Begin Message <span className="text-slate-400 font-medium">(agent speaks first)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">{firstMessage.length} chars</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {CRM_TAGS.slice(0, 3).map((t) => (
            <button
              key={t.tag}
              type="button"
              onClick={() => onInsertTag(t.tag, "firstMessage")}
              className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              + {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={firstMessage}
          onChange={(e) => onChange({ firstMessage: e.target.value })}
          rows={3}
          placeholder="Hello! Calling from BrokerOS regarding {{project.name}}. Am I speaking with {{lead.firstName}}?"
          className="w-full px-3.5 py-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-900 resize-none"
        />
        <p className="text-[10px] text-slate-400 font-medium">
          Leave empty for agent to wait for user to speak first.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-800">Begin Message Delay</label>
        <select
          value={beginMessageDelayMs}
          onChange={(e) => onChange({ beginMessageDelayMs: parseInt(e.target.value) })}
          className="w-full sm:w-48 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value={0}>Immediate (0ms)</option>
          <option value={500}>0.5 seconds</option>
          <option value={1000}>1 second (Default)</option>
          <option value={2000}>2 seconds</option>
          <option value={3000}>3 seconds</option>
          <option value={5000}>5 seconds (Max)</option>
        </select>
      </div>
    </div>
  );
}

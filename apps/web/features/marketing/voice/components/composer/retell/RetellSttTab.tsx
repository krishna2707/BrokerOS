"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { STT_MODES, RETELL_LANGUAGES } from "./constants";

export interface RetellSttTabProps {
  sttMode: string;
  retellLanguage: string;
  vocabSpecialization: string;
  responsiveness: number;
  interruptionSensitivity: number;
  retellBackchannel: boolean;
  enableDynamicResponsiveness: boolean;
  retellReminderMs: number;
  maxDurationSeconds: number;
  endCallAfterSilenceMs: number;
  onChange: (fields: any) => void;
}

export function RetellSttTab({
  sttMode,
  retellLanguage,
  vocabSpecialization,
  responsiveness,
  interruptionSensitivity,
  retellBackchannel,
  enableDynamicResponsiveness,
  retellReminderMs,
  maxDurationSeconds,
  endCallAfterSilenceMs,
  onChange,
}: RetellSttTabProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">Speech-to-Text Mode</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STT_MODES.map((m) => {
            const isSel = sttMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ sttMode: m.id })}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.label}</span>
                  {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Agent Language</label>
          <select
            value={retellLanguage}
            onChange={(e) => onChange({ retellLanguage: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {RETELL_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Vocab Specialization</label>
          <select
            value={vocabSpecialization}
            onChange={(e) => onChange({ vocabSpecialization: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="general">General (Default)</option>
            <option value="medical">Medical Terminology</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">Responsiveness</label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{responsiveness.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={responsiveness}
            onChange={(e) => onChange({ responsiveness: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0 Slow</span>
            <span>1 Fast (Default)</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-slate-700">Interruption Sensitivity</label>
            <span className="text-[10px] font-mono font-bold text-emerald-600">
              {interruptionSensitivity.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={interruptionSensitivity}
            onChange={(e) => onChange({ interruptionSensitivity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-100 rounded-lg accent-emerald-600 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold">
            <span>0 Never interrupt</span>
            <span>1 Easy</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-800">Backchanneling</p>
            <p className="text-[10px] text-slate-400">&quot;yeah&quot;, &quot;uh-huh&quot; nods</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ retellBackchannel: !retellBackchannel })}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              retellBackchannel ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {retellBackchannel ? "Active" : "Off"}
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-800">Dynamic Responsiveness</p>
            <p className="text-[10px] text-slate-400">Adapts to user speech rate</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ enableDynamicResponsiveness: !enableDynamicResponsiveness })}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              enableDynamicResponsiveness
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {enableDynamicResponsiveness ? "On" : "Off"}
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Silence Reminder</label>
          <select
            value={retellReminderMs}
            onChange={(e) => onChange({ retellReminderMs: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value={5000}>After 5s</option>
            <option value={10000}>After 10s (Default)</option>
            <option value={15000}>After 15s</option>
            <option value={20000}>After 20s</option>
            <option value={0}>Disabled</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-slate-700">Max Call Duration</label>
          <select
            value={maxDurationSeconds}
            onChange={(e) => onChange({ maxDurationSeconds: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value={300}>5 mins</option>
            <option value={600}>10 mins</option>
            <option value={900}>15 mins</option>
            <option value={1800}>30 mins</option>
            <option value={3600}>60 mins</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-extrabold text-slate-700">End Call After User Silence</label>
        <select
          value={endCallAfterSilenceMs}
          onChange={(e) => onChange({ endCallAfterSilenceMs: parseInt(e.target.value) })}
          className="w-full sm:w-56 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
        >
          <option value={15000}>15 seconds</option>
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
          <option value={300000}>5 minutes</option>
          <option value={600000}>10 minutes (Default)</option>
        </select>
        <p className="text-[10px] text-slate-400 font-medium">Minimum 10s enforced by Retell.</p>
      </div>
    </div>
  );
}

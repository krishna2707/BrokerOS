"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Zap,
  DollarSign,
  Save,
  PhoneCall,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ElevenLabsStudioHeaderProps {
  agents: any[];
  selectedAgentId: string;
  isLoadingAgents: boolean;
  isSaving: boolean;
  syncStatus: "synced" | "dirty" | "saving" | "error";
  statusMessage: string | null;
  showTestCall: boolean;
  testPhone: string;
  selectedFromNumber: string;
  isDialing: boolean;
  callStatus: "idle" | "ringing" | "connected" | "failed";
  callMessage: string | null;
  telephonyIntegrations: any[];
  onSelectAgent: (agent: any) => void;
  onRefreshAgents: () => void;
  onOpenCreateModal: () => void;
  onToggleTestCall: () => void;
  onCloseTestCall: () => void;
  onTestPhoneChange: (phone: string) => void;
  onSelectedFromNumberChange: (num: string) => void;
  onSubmitTestCall: (e: React.FormEvent) => void;
  onSaveAndSync: () => void;
}

export function ElevenLabsStudioHeader({
  agents,
  selectedAgentId,
  isLoadingAgents,
  isSaving,
  syncStatus,
  statusMessage,
  showTestCall,
  testPhone,
  selectedFromNumber,
  isDialing,
  callStatus,
  callMessage,
  telephonyIntegrations,
  onSelectAgent,
  onRefreshAgents,
  onOpenCreateModal,
  onToggleTestCall,
  onCloseTestCall,
  onTestPhoneChange,
  onSelectedFromNumberChange,
  onSubmitTestCall,
  onSaveAndSync,
}: ElevenLabsStudioHeaderProps) {
  return (
    <div className="space-y-4">
      {/* ── TOP HUD ── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
              ElevenLabs ConvAI Agent
            </span>
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synced
              </span>
            )}
            {syncStatus === "dirty" && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved Changes
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5" /> Sync Failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => {
                const found = agents.find((a) => (a.id || a.agent_id) === e.target.value);
                if (found) onSelectAgent(found);
              }}
              disabled={isLoadingAgents || agents.length === 0}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 max-w-sm flex-1 shadow-xs"
            >
              {agents.length === 0 ? (
                <option value="">{isLoadingAgents ? "Loading ElevenLabs Agents..." : "No Agents — Create One Below"}</option>
              ) : (
                agents.map((a) => {
                  const id = a.id || a.agent_id;
                  return (
                    <option key={id} value={id}>
                      {a.name || a.agent_name || "Agent"} ({id.slice(0, 10)}…)
                    </option>
                  );
                })
              )}
            </select>
            <Button
              type="button"
              onClick={onRefreshAgents}
              disabled={isLoadingAgents}
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 rounded-xl border-slate-200 cursor-pointer"
              title="Refresh Agents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAgents ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              onClick={onOpenCreateModal}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Agent</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Est. Cost</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              $0.040<span className="text-[10px] text-slate-400 font-medium">/min</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium">Flash v2.5 + LLM + Bridge</p>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl min-w-[120px]">
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-extrabold uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Streaming Turn</span>
            </div>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ~75<span className="text-[10px] text-slate-400 font-medium">ms</span>
            </p>
            <p className="text-[9px] text-slate-400 font-medium">Flash Voice Pipeline</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              type="button"
              onClick={onSaveAndSync}
              disabled={isSaving || !selectedAgentId}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-8.5 shadow-xs cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save &amp; Sync</span>
            </Button>
            <Button
              type="button"
              onClick={onToggleTestCall}
              size="sm"
              variant="outline"
              className="text-xs font-bold gap-1.5 rounded-xl h-8.5 border-slate-200 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showTestCall ? "Hide Dialer" : "Test Call"}</span>
            </Button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
            syncStatus === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {syncStatus === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ── TEST CALL DRAWER ── */}
      {showTestCall && (
        <div className="p-5 rounded-2xl bg-emerald-950 text-white border border-emerald-800 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                PSTN Outbound Test Call Dialer
              </h4>
            </div>
            <button
              type="button"
              onClick={onCloseTestCall}
              className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmitTestCall} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-emerald-300">Your Phone Number (E.164 format)</label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => onTestPhoneChange(e.target.value)}
                placeholder="+91 98765 43210 or +1 234 567 8900"
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700/80 rounded-xl text-xs font-mono font-bold text-white placeholder:text-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-emerald-300">Caller ID (Telephony Carrier)</label>
              <select
                value={selectedFromNumber}
                onChange={(e) => onSelectedFromNumberChange(e.target.value)}
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700/80 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Default PSTN Outbound Route</option>
                {telephonyIntegrations.map((t) =>
                  (t.fromNumbers || []).map((num: string) => (
                    <option key={num} value={num}>
                      {num} ({t.provider})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <Button
                type="submit"
                disabled={isDialing || !testPhone.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs gap-2 rounded-xl h-9 shadow-md cursor-pointer"
              >
                {isDialing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                <span>{isDialing ? "Dialing PSTN Bridge..." : "Dial My Phone Now"}</span>
              </Button>
            </div>
          </form>

          {callMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                callStatus === "failed"
                  ? "bg-rose-900/60 text-rose-200 border border-rose-700"
                  : "bg-emerald-900/80 text-emerald-200 border border-emerald-700"
              }`}
            >
              {callStatus === "failed" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{callMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
